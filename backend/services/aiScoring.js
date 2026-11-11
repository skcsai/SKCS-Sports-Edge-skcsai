'use strict';

const { analyzeWithDolphin, isDolphinAvailable } = require('./aiProvider');

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function normalizeWinnerFromPrediction(prediction) {
    const key = String(prediction || '').trim().toLowerCase();
    if (!key) return null;
    if (key === 'home' || key === 'home_win' || key === 'home win') return 'home';
    if (key === 'draw' || key === 'tie') return 'draw';
    if (key === 'away' || key === 'away_win' || key === 'away win') return 'away';
    return null;
}

function deriveVolatilityFromConfidence(confidence) {
    if (confidence >= 78) return 'low';
    if (confidence >= 66) return 'medium';
    return 'high';
}

function extractImpliedSignalFromOddsEvent(match, homeTeam, awayTeam) {
    const sharpOdds = match?.sharp_odds;
    const sharpHome = Number(sharpOdds?.home);
    const sharpAway = Number(sharpOdds?.away);
    if (Number.isFinite(sharpHome) && sharpHome > 1 && Number.isFinite(sharpAway) && sharpAway > 1) {
        const homeProb = 1 / sharpHome;
        const awayProb = 1 / sharpAway;
        const total = homeProb + awayProb;
        const normHome = homeProb / total;
        const normAway = awayProb / total;
        const edge = Math.abs(normHome - normAway);
        const winner = normHome >= normAway ? 'home' : 'away';
        const confidence = clamp(Math.round((56 + edge * 44) * 100) / 100, 50, 96);
        return { winner, confidence, volatility: deriveVolatilityFromConfidence(confidence), source: 'odds' };
    }

    const raw = match?.raw_provider_data || match?.metadata?.raw_provider_data || null;
    const bookmakers = Array.isArray(raw?.bookmakers) ? raw.bookmakers : [];
    if (!bookmakers.length || !homeTeam || !awayTeam) return null;

    for (const bookmaker of bookmakers) {
        const markets = Array.isArray(bookmaker?.markets) ? bookmaker.markets : [];
        const h2h = markets.find((market) => String(market?.key || '').toLowerCase() === 'h2h');
        const outcomes = Array.isArray(h2h?.outcomes) ? h2h.outcomes : [];
        if (!outcomes.length) continue;

        let homeProb = null;
        let awayProb = null;

        for (const outcome of outcomes) {
            const price = Number(outcome?.price);
            if (!Number.isFinite(price) || price <= 1) continue;
            const implied = 1 / price;
            const name = String(outcome?.name || '').trim();
            if (name === homeTeam) homeProb = implied;
            if (name === awayTeam) awayProb = implied;
        }

        if (!Number.isFinite(homeProb) || !Number.isFinite(awayProb)) continue;

        const total = homeProb + awayProb;
        if (!Number.isFinite(total) || total <= 0) continue;

        const normHome = homeProb / total;
        const normAway = awayProb / total;
        const edge = Math.abs(normHome - normAway);
        const winner = normHome >= normAway ? 'home' : 'away';
        const confidence = clamp(Math.round((56 + edge * 44) * 100) / 100, 50, 96);

        return {
            winner,
            confidence,
            volatility: deriveVolatilityFromConfidence(confidence),
            source: 'odds'
        };
    }

    return null;
}

/**
 * Extract form data from provider data for AI analysis context.
 */
function extractFormContext(match) {
    const raw = match?.raw_provider_data || {};
    const teams = raw?.teams || {};
    const league = raw?.league || {};

    return {
        home_form: teams?.home?.form || raw?.home_form || null,
        away_form: teams?.away?.form || raw?.away_form || null,
        h2h: raw?.h2h || null,
        home_injuries: raw?.injuries?.home || raw?.home_injuries || null,
        away_injuries: raw?.injuries?.away || raw?.away_injuries || null,
        home_stats: teams?.home?.stats ? JSON.stringify(teams.home.stats) : null,
        away_stats: teams?.away?.stats ? JSON.stringify(teams.away.stats) : null,
        weather: raw?.weather || null,
        odds: raw?.odds ? JSON.stringify(raw.odds) : null,
        league_name: league?.name || match?.league || null,
    };
}

let dolphinAvailable = null;
let lastDolphinCheck = 0;

async function checkDolphinAvailability() {
    // Cache availability check for 60 seconds
    const now = Date.now();
    if (dolphinAvailable === null || now - lastDolphinCheck > 60000) {
        dolphinAvailable = await isDolphinAvailable();
        lastDolphinCheck = now;
    }
    return dolphinAvailable;
}

async function scoreMatch(match) {
    if (!match || typeof match !== 'object') {
        throw new Error('aiScoring.scoreMatch requires a match object');
    }

    const home = String(match.home_team || match.homeTeam || '').trim();
    const away = String(match.away_team || match.awayTeam || '').trim();

    // 1. Check for explicit model prediction (from previous AI run)
    const modelWinner = normalizeWinnerFromPrediction(
        match.model_prediction || match.model_pick || match?.metadata?.model_prediction || null
    );
    const modelConfidence = Number(match.model_confidence ?? match?.metadata?.model_confidence);

    if (modelWinner && Number.isFinite(modelConfidence) && modelConfidence > 0) {
        const confidence = clamp(Math.round(modelConfidence * 100) / 100, 0, 100);
        const volatility = deriveVolatilityFromConfidence(confidence);
        return {
            confidence,
            volatility,
            winner: modelWinner,
            source: 'model'
        };
    }

    // 2. Check for provider prediction with confidence (from FootballData.org, Odds API, etc.)
    const baseWinner = normalizeWinnerFromPrediction(
        match.base_prediction || match.prediction || match.pick || null
    );
    const baseConfidence = Number(match.base_confidence ?? match.confidence);

    if (baseWinner && Number.isFinite(baseConfidence) && baseConfidence > 0) {
        const confidence = clamp(Math.round(baseConfidence * 100) / 100, 0, 100);
        const volatility = deriveVolatilityFromConfidence(confidence);
        return {
            confidence,
            volatility,
            winner: baseWinner,
            source: 'provider_prediction'
        };
    }

    // 3. Try odds-implied probability
    const impliedSignal = extractImpliedSignalFromOddsEvent(match, home, away);
    if (impliedSignal) {
        return impliedSignal;
    }

    // 4. Use Dolphin (local Llama) for AI analysis
    const dolphinReady = await checkDolphinAvailability();
    if (dolphinReady) {
        try {
            const formContext = extractFormContext(match);
            const dolphinInput = {
                home_team: home,
                away_team: away,
                league: match.league || formContext.league_name,
                date: match.date || match.match_time || null,
                ...formContext
            };

            console.log(`[aiScoring] Calling Dolphin AI for ${home} vs ${away}`);
            const dolphinResult = await analyzeWithDolphin(dolphinInput);

            if (dolphinResult) {
                console.log(`[aiScoring] Dolphin prediction: ${dolphinResult.prediction} (${dolphinResult.confidence}%)`);
                const winner = normalizeWinnerFromPrediction(dolphinResult.prediction);
                if (winner) {
                    return {
                        winner,
                        confidence: dolphinResult.confidence,
                        volatility: deriveVolatilityFromConfidence(dolphinResult.confidence),
                        reasoning: dolphinResult.reasoning,
                        source: 'dolphin'
                    };
                }
            }
        } catch (error) {
            console.error(`[aiScoring] Dolphin analysis failed:`, error.message);
        }
    }

    // 5. Conservative fallback: home advantage when no evidence available
    const winner = 'home';
    const confidence = 58;
    const volatility = 'high';

    if (String(process.env.DEBUG_AI_SCORING || '').trim().toLowerCase() === 'true') {
        console.log('[aiScoring] match_id=%s home=%s away=%s winner=%s confidence=%.2f volatility=%s',
            match.match_id,
            home || 'N/A',
            away || 'N/A',
            winner,
            confidence,
            volatility
        );
    }

    return {
        confidence,
        volatility,
        winner,
        source: 'fallback'
    };
}

module.exports = {
    scoreMatch
};
