/**
 * TheSportsDB Data Pipeline Service
 * 
 * This service handles the three-stage data lifecycle:
 * 1. syncDailyFixtures(date) - Discovery layer: populate raw_fixtures table
 * 2. enrichMatchContext(idEvent) - Deep insight layer: fetch lineups, stats, timeline
 * 3. generateEdgeMindInsight(idEvent) - AI prediction layer: generate insights
 * 
 * All API calls to TheSportsDB pass through the ApiQueue rate limiter (25 calls/min).
 */

const { apiQueue } = require('../utils/apiQueue');
const db = require('../db'); // PostgreSQL pool
const { createClient } = require('@supabase/supabase-js');
const verificationController = require('../core/verificationController');

// TheSportsDB API configuration
const config = require('../config');
const THESPORTSDB_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${config.theSportsDbKey || '3'}`;

// Supabase client for Universal Intake Valve
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function isCanonicalIngestUnavailable(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('canonical_events')
    || message.includes('does not exist')
    || message.includes('schema cache')
    || message.includes('upsert_canonical_event');
}

function isSoccerFixtureEvent(event) {
  const sport = String(event?.strSport || '').trim().toLowerCase();
  return sport === 'soccer' || sport === 'football';
}

async function upsertRawFixtureRow(event) {
  const idEvent = event.idEvent;
  if (!idEvent) return false;

  await db.query(`
    INSERT INTO raw_fixtures (id_event, sport, league_id, home_team_id, away_team_id, start_time, raw_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id_event) DO UPDATE SET
      sport = EXCLUDED.sport,
      league_id = EXCLUDED.league_id,
      home_team_id = EXCLUDED.home_team_id,
      away_team_id = EXCLUDED.away_team_id,
      start_time = EXCLUDED.start_time,
      raw_json = EXCLUDED.raw_json,
      updated_at = NOW()
  `, [
    idEvent,
    event.strSport || 'Unknown',
    event.idLeague,
    event.idHomeTeam,
    event.idAwayTeam,
    event.dateEvent ? new Date(`${event.dateEvent} ${event.strTime || '00:00'}Z`) : null,
    JSON.stringify(event)
  ]);
  return true;
}

/**
 * syncDailyFixtures(date)
 * Uses the undocumented searchevents.php?d= endpoint to populate raw_fixtures.
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<number>} - Number of fixtures synced
 */
async function syncDailyFixtures(date) {
  const url = `${THESPORTSDB_BASE_URL}/eventsday.php?d=${encodeURIComponent(date)}&s=Soccer`;

  const response = await apiQueue.add(async () => {
    const fetch = require('node-fetch');
    const res = await fetch(url);
    const rawText = await res.text();

    if (!res.ok) {
      console.error(`[syncDailyFixtures] TheSportsDB API error: ${res.status}`, rawText);
      return null;
    }

    if (!rawText || rawText.trim() === '') {
      console.error(`[syncDailyFixtures] TheSportsDB returned empty response`);
      return null;
    }

    try {
      return JSON.parse(rawText);
    } catch (err) {
      console.error(`[syncDailyFixtures] TheSportsDB returned invalid JSON:`, rawText);
      return null;
    }
  });

  if (!response) {
    console.error(`[syncDailyFixtures] Failed to fetch data for ${date}`);
    return 0;
  }

  const events = response.events || response.event || [];
  let syncedCount = 0;

  for (const event of events) {
    const idEvent = event.idEvent;
    if (!idEvent) continue;
    if (!isSoccerFixtureEvent(event)) continue;

    // ══════════════════════════════════════════════════════════════════════
    // KILL SWITCH: Old raw_fixtures pipe disabled. Now using Universal Intake Valve.
    // ══════════════════════════════════════════════════════════════════════
    // const query = `
    //   INSERT INTO raw_fixtures (id_event, sport, league_id, home_team_id, away_team_id, start_time, raw_json)
    //   VALUES ($1, $2, $3, $4, $5, $6, $7)
    //   ON CONFLICT (id_event) DO UPDATE SET
    //     raw_json = EXCLUDED.raw_json,
    //     updated_at = NOW()
    // `;
    // const values = [
    //   idEvent,
    //   event.strSport || 'Unknown',
    //   event.idLeague,
    //   event.idHomeTeam,
    //   event.idAwayTeam,
    //   event.dateEvent ? new Date(`${event.dateEvent} ${event.strTime || '00:00'}Z`) : null,
    //   JSON.stringify(event)
    // ];
    // try {
    //   await db.query(query, values);
    //   syncedCount++;
    // } catch (err) {
    //   console.error(`[syncDailyFixtures] Failed to upsert event ${idEvent}:`, err.message);
    // }

    let ingested = false;

    if (supabase) {
      const cleanData = {
        p_provider_name: 'thesportsdb',
        p_provider_event_id: idEvent.toString(),
        p_sport: event.strSport || 'Unknown',
        p_competition_name: event.strLeague || 'Unknown',
        p_season: event.strSeason || new Date().getFullYear().toString(),
        p_start_time_utc: event.dateEvent ? new Date(`${event.dateEvent} ${event.strTime || '00:00'}Z`).toISOString() : new Date().toISOString(),
        p_status: event.strStatus || 'NS',
        p_raw_payload: event
      };

      const { error } = await supabase.rpc('upsert_canonical_event', cleanData);

      if (!error) {
        console.log(`✅ Match ${cleanData.p_provider_event_id} safely landed in canonical_events.`);
        ingested = true;
      } else if (isCanonicalIngestUnavailable(error)) {
        console.warn(`[syncDailyFixtures] Supabase canonical ingest unavailable for ${idEvent}; using raw_fixtures (${error.message})`);
      } else {
        console.error(`❌ Failed to ingest match ${cleanData.p_provider_event_id}:`, error.message);
      }
    }

    if (!ingested) {
      try {
        await upsertRawFixtureRow(event);
        ingested = true;
      } catch (err) {
        console.error(`[syncDailyFixtures] raw_fixtures upsert failed for ${idEvent}:`, err.message);
      }
    }

    if (ingested) {
      syncedCount++;
    }
  }

  console.log(`[syncDailyFixtures] Synced ${syncedCount} fixtures for ${date}`);
  return syncedCount;
}

/**
 * enrichMatchContext(idEvent)
 * Checks if the match starts within 6 hours.
 * Calls lookupevent.php, lookupeventlineup.php, lookupeventstats.php, and lookuptimeline.php via apiQueue.
 * Upserts the combined data into match_context_data.
 * 
 * @param {string} idEvent - TheSportsDB event ID
 * @returns {Promise<boolean>} - True if enrichment successful
 */
async function enrichMatchContext(idEvent) {
  // First, check if match is within 6 hours
  const fixtureQuery = 'SELECT start_time FROM raw_fixtures WHERE id_event = $1';
  const fixtureResult = await db.query(fixtureQuery, [idEvent]);
  
  if (fixtureResult.rows.length === 0) {
    console.error(`[enrichMatchContext] Fixture ${idEvent} not found in raw_fixtures`);
    return false;
  }

  const startTime = new Date(fixtureResult.rows[0].start_time);
  const now = new Date();
  const hoursUntilMatch = (startTime - now) / (1000 * 60 * 60);

  // Only enrich if match is within 72 hours (extended from 24 hours)
  if (hoursUntilMatch > 72) {
    console.log(`[enrichMatchContext] Event ${idEvent} is ${hoursUntilMatch.toFixed(1)}h away. Skipping enrichment.`);
    return false;
  }

  console.log(`[enrichMatchContext] Enriching event ${idEvent} (${hoursUntilMatch.toFixed(1)}h until match)`);

  // Fetch all required data via API queue
  const [eventData, lineupData, statsData, timelineData] = await Promise.all([
    apiQueue.add(() => fetchTheSportsDB(`lookupevent.php?id=${idEvent}`)),
    apiQueue.add(() => fetchTheSportsDB(`lookuplineup.php?id=${idEvent}`)),
    apiQueue.add(() => fetchTheSportsDB(`lookupeventstats.php?id=${idEvent}`)),
    apiQueue.add(() => fetchTheSportsDB(`lookuptimeline.php?id=${idEvent}`))
  ]);

  // Extract home and away team IDs from event data
  const event = eventData.events?.[0] || {};
  const homeTeamId = event.idHomeTeam;
  const awayTeamId = event.idAwayTeam;
  const leagueId = event.idLeague;
  const season = event.strSeason || new Date().getFullYear().toString();

  // Fetch last 5 results for both teams (using eventslast.php which exists)
  const [homeLast5, awayLast5] = await Promise.all([
    apiQueue.add(() => fetchTheSportsDB(`eventslast.php?id=${homeTeamId}`)),
    apiQueue.add(() => fetchTheSportsDB(`eventslast.php?id=${awayTeamId}`))
  ]);

  // Fetch deep context: Standings and H2H data
  let standingsData = null;
  let h2hData = null;

  try {
    // Fetch league standings
    if (leagueId) {
      standingsData = await apiQueue.add(() => fetchTheSportsDB(`lookuptable.php?l=${leagueId}&s=${season}`));
      if (!standingsData) {
        console.warn(`[enrichMatchContext] No standings data available for league ${leagueId}, season ${season}`);
      }
    }

    // Fetch H2H results using eventslast.php for both teams (lookupeventresults.php doesn't exist)
    const [homeTeamLastEvents, awayTeamLastEvents] = await Promise.all([
      apiQueue.add(() => fetchTheSportsDB(`eventslast.php?id=${homeTeamId}`)),
      apiQueue.add(() => fetchTheSportsDB(`eventslast.php?id=${awayTeamId}`))
    ]);
    
    // Combine both teams' recent events to simulate H2H context
    h2hData = {
      results: [
        ...(homeTeamLastEvents.results || []),
        ...(awayTeamLastEvents.results || [])
      ].slice(0, 10) // Limit to 10 most recent matches
    };
    
    if (h2hData.results.length === 0) {
      console.warn(`[enrichMatchContext] No H2H data available for teams ${homeTeamId} and ${awayTeamId}`);
    }
  } catch (err) {
    console.warn(`[enrichMatchContext] Failed to fetch deep context for ${idEvent}:`, err.message);
    // Continue without deep context - don't fail the entire enrichment
  }

  // Build deep_context object
  const deepContext = {
    standings: null,
    h2h: null
  };

  if (standingsData && standingsData.table) {
    const table = standingsData.table;
    const homeTeamStanding = table.find(t => t.team_id === homeTeamId);
    const awayTeamStanding = table.find(t => t.team_id === awayTeamId);

    if (homeTeamStanding || awayTeamStanding) {
      deepContext.standings = {
        home: homeTeamStanding ? {
          rank: homeTeamStanding.intRank,
          points: homeTeamStanding.intPoints,
          played: homeTeamStanding.intPlayed,
          won: homeTeamStanding.intWin,
          drawn: homeTeamStanding.intDraw,
          lost: homeTeamStanding.intLoss,
          goals_for: homeTeamStanding.intGoalsFor,
          goals_against: homeTeamStanding.intGoalsAgainst,
          goal_difference: homeTeamStanding.intGoalDifference
        } : null,
        away: awayTeamStanding ? {
          rank: awayTeamStanding.intRank,
          points: awayTeamStanding.intPoints,
          played: awayTeamStanding.intPlayed,
          won: awayTeamStanding.intWin,
          drawn: awayTeamStanding.intDraw,
          lost: awayTeamStanding.intLoss,
          goals_for: awayTeamStanding.intGoalsFor,
          goals_against: awayTeamStanding.intGoalsAgainst,
          goal_difference: awayTeamStanding.intGoalDifference
        } : null
      };
    }
  }

  // Normalize H2H event scores to handle multiple API field names
  function normalizeEvent(event) {
    const homeScore = event.intHomeScore ?? event.homeScore ?? event.score?.home ?? event.event?.homeScore ?? -1;
    const awayScore = event.intAwayScore ?? event.awayScore ?? event.score?.away ?? event.event?.awayScore ?? -1;
    return {
      homeScore: Number.isFinite(homeScore) ? homeScore : -1,
      awayScore: Number.isFinite(awayScore) ? awayScore : -1
    };
  }

  if (h2hData && h2hData.results) {
    const results = h2hData.results;
    console.log("H2H raw events sample:", JSON.stringify(results.slice(0, 3)));
    // Take last 5 H2H matches
    const recentH2H = results.slice(0, 5);

    deepContext.h2h = {
      total_matches: results.length,
      recent_matches: recentH2H.map(match => {
        const normalizedScores = normalizeEvent(match);
        return {
          id_event: match.idEvent,
          date_event: match.dateEvent,
          home_team: match.strHomeTeam,
          away_team: match.strAwayTeam,
          home_score: normalizedScores.homeScore,
          away_score: normalizedScores.awayScore,
          winner: match.strWinner
        };
      })
    };
  }

  verificationController.enforce(
    verificationController.evaluateEnrichmentState({
      source: 'thesportsdbPipeline',
      results: deepContext?.h2h?.recent_matches || h2hData?.results || null,
      deep_context: deepContext,
      updated_at: new Date().toISOString()
    })
  );

  const query = `
    INSERT INTO match_context_data (id_event, lineups, stats, timeline, home_last_5, away_last_5, deep_context)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id_event) DO UPDATE SET
      lineups = EXCLUDED.lineups,
      stats = EXCLUDED.stats,
      timeline = EXCLUDED.timeline,
      home_last_5 = EXCLUDED.home_last_5,
      away_last_5 = EXCLUDED.away_last_5,
      deep_context = EXCLUDED.deep_context,
      updated_at = NOW()
  `;

  const values = [
    idEvent,
    JSON.stringify(lineupData),
    JSON.stringify(statsData),
    JSON.stringify(timelineData),
    JSON.stringify(homeLast5),
    JSON.stringify(awayLast5),
    JSON.stringify(deepContext)
  ];

  try {
    await db.query(query, values);
    console.log(`[enrichMatchContext] Successfully enriched event ${idEvent}`);
    return true;
  } catch (err) {
    console.error(`[enrichMatchContext] Failed to upsert context for ${idEvent}:`, err.message);
    return false;
  }
}

/**
 * generateEdgeMindInsight(idEvent)
 * Reads from match_context_data.
 * Logic: If stats.possession > 60% AND last_5_results are mostly losses, set edgemind_feedback.
 * Upserts final payload into ai_predictions.
 * 
 * @param {string} idEvent - TheSportsDB event ID
 * @returns {Promise<boolean>} - True if insight generated successfully
 */
async function generateEdgeMindInsight(idEvent) {
  // Fetch match context data
  const contextQuery = 'SELECT * FROM match_context_data WHERE id_event = $1';
  const contextResult = await db.query(contextQuery, [idEvent]);

  if (contextResult.rows.length === 0) {
    console.error(`[generateEdgeMindInsight] No context data for event ${idEvent}`);
    return false;
  }

  const context = contextResult.rows[0];
  const stats = context.stats || {};
  const homeLast5 = context.home_last_5 || {};
  const awayLast5 = context.away_last_5 || {};
  const deepContext = context.deep_context || {};

  // Calculate possession from stats (TheSportsDB returns stats as array)
  const homePossession = extractPossession(stats, 'Home');
  const awayPossession = extractPossession(stats, 'Away');

  // Calculate recent form (wins/losses in last 5)
  const homeForm = calculateForm(homeLast5);
  const awayForm = calculateForm(awayLast5);

  // Extract standings data from deep_context
  const standings = deepContext.standings || {};
  const homeStanding = standings.home || {};
  const awayStanding = standings.away || {};

  // Extract H2H data from deep_context
  const h2h = deepContext.h2h || {};
  const h2hMatches = h2h.recent_matches || [];

  // Build AI prompt with deep context
  const homeRank = homeStanding.rank || 'N/A';
  const homePoints = homeStanding.points || 0;
  const awayRank = awayStanding.rank || 'N/A';
  const awayPoints = awayStanding.points || 0;

  const homeFormStr = `${homeForm.wins}W-${homeForm.draws}D-${homeForm.losses}L`;
  const awayFormStr = `${awayForm.wins}W-${awayForm.draws}D-${awayForm.losses}L`;

  // Build H2H summary
  let h2hSummary = 'No recent H2H data available';
  if (h2hMatches.length > 0) {
    const homeWins = h2hMatches.filter(m => m.winner === 'Home').length;
    const awayWins = h2hMatches.filter(m => m.winner === 'Away').length;
    const draws = h2hMatches.filter(m => m.winner === 'Draw').length;
    h2hSummary = `Last ${h2hMatches.length}: Home ${homeWins}, Away ${awayWins}, Draw ${draws}`;
  }

  // Enhanced EdgeMind logic using standings and H2H
  let edgemindFeedback = 'Standard match probability.';
  let confidenceScore = 50;

  // Use standings gap to inform confidence
  const rankGap = (homeStanding.rank || 0) - (awayStanding.rank || 0);
  const pointsGap = (homeStanding.points || 0) - (awayStanding.points || 0);

  if (homePossession > 60 && homeForm.losses >= 3) {
    edgemindFeedback = `Home team (${homeRank}, ${homePoints}pts) has possession dominance but poor recent form (${homeFormStr}). H2H: ${h2hSummary}. Potential Under/Draw value.`;
    confidenceScore = 65;
  } else if (awayPossession > 60 && awayForm.losses >= 3) {
    edgemindFeedback = `Away team (${awayRank}, ${awayPoints}pts) has possession dominance but poor recent form (${awayFormStr}). H2H: ${h2hSummary}. Potential Under/Draw value.`;
    confidenceScore = 65;
  } else if (homePossession > 55 && homeForm.wins >= 3 && pointsGap > 5) {
    edgemindFeedback = `Home team (${homeRank}, ${homePoints}pts) in strong form (${homeFormStr}) with significant table advantage over away team (${awayRank}, ${awayPoints}pts). H2H: ${h2hSummary}. Solid home win probability.`;
    confidenceScore = 78;
  } else if (awayPossession > 55 && awayForm.wins >= 3 && pointsGap < -5) {
    edgemindFeedback = `Away team (${awayRank}, ${awayPoints}pts) in strong form (${awayFormStr}) with significant table advantage over home team (${homeRank}, ${homePoints}pts). H2H: ${h2hSummary}. Solid away win probability.`;
    confidenceScore = 73;
  } else if (rankGap > 3 && homeForm.wins >= 2) {
    edgemindFeedback = `Home team (${homeRank}, ${homePoints}pts) significantly higher in table than away team (${awayRank}, ${awayPoints}pts). Recent form: ${homeFormStr} vs ${awayFormStr}. H2H: ${h2hSummary}. Home win favored.`;
    confidenceScore = 70;
  } else if (rankGap < -3 && awayForm.wins >= 2) {
    edgemindFeedback = `Away team (${awayRank}, ${awayPoints}pts) significantly higher in table than home team (${homeRank}, ${homePoints}pts). Recent form: ${awayFormStr} vs ${homeFormStr}. H2H: ${h2hSummary}. Away win favored.`;
    confidenceScore = 68;
  } else {
    edgemindFeedback = `Closely matched teams. Home (${homeRank}, ${homePoints}pts, ${homeFormStr}) vs Away (${awayRank}, ${awayPoints}pts, ${awayFormStr}). H2H: ${h2hSummary}. Balanced match.`;
    confidenceScore = 52;
  }

  // Generate placeholder value combos and same match builder (can be enhanced later)
  const valueCombos = {
    under_over: confidenceScore > 65 ? 'Under 2.5 Goals' : null,
    double_chance: confidenceScore < 75 ? 'Double Chance (1X or X2)' : null
  };

  const sameMatchBuilder = {
    legs: [
      { market: 'Match Winner', prediction: confidenceScore > 75 ? 'Home' : 'Draw', confidence: confidenceScore },
      { market: 'Over/Under 2.5', prediction: confidenceScore > 75 ? 'Under' : 'Over', confidence: confidenceScore - 10 }
    ]
  };

  const query = `
    INSERT INTO ai_predictions (match_id, confidence_score, edgemind_feedback, value_combos, same_match_builder)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (match_id) DO UPDATE SET
      confidence_score = EXCLUDED.confidence_score,
      edgemind_feedback = EXCLUDED.edgemind_feedback,
      value_combos = EXCLUDED.value_combos,
      same_match_builder = EXCLUDED.same_match_builder,
      updated_at = NOW()
  `;

  const values = [
    idEvent,
    confidenceScore,
    edgemindFeedback,
    JSON.stringify(valueCombos),
    JSON.stringify(sameMatchBuilder)
  ];

  try {
    await db.query(query, values);
    console.log(`[generateEdgeMindInsight] Generated insight for event ${idEvent}: ${edgemindFeedback}`);
    return true;
  } catch (err) {
    console.error(`[generateEdgeMindInsight] Failed to upsert prediction for ${idEvent}:`, err.message);
    return false;
  }
}

/**
 * Helper: Fetch from TheSportsDB API
 */
async function fetchTheSportsDB(endpoint) {
  const fetch = require('node-fetch');
  const url = `${THESPORTSDB_BASE_URL}/${endpoint}`;
  console.log("[fetchTheSportsDB] Fetching URL:", url);
  
  const res = await fetch(url);
  const rawText = await res.text();

  if (!res.ok) {
    // Handle 404 errors gracefully - these endpoints may not exist or have no data
    if (res.status === 404) {
      console.warn(`[fetchTheSportsDB] Endpoint not found (404) for URL: ${url} - returning empty data`);
      return {};
    }
    
    console.error(`[fetchTheSportsDB] TheSportsDB API error: ${res.status} for URL: ${url}`, rawText);
    return null;
  }

  if (!rawText || rawText.trim() === '') {
    console.warn(`[fetchTheSportsDB] TheSportsDB returned empty response for URL: ${url} - returning empty data`);
    return {};
  }

  try {
    const data = JSON.parse(rawText);
    return data;
  } catch (err) {
    console.error(`[fetchTheSportsDB] TheSportsDB returned invalid JSON for URL: ${url}:`, rawText);
    return null;
  }
}

/**
 * Helper: Extract possession percentage from stats array
 */
function extractPossession(stats, team) {
  if (!stats || !stats.stats) return 0;
  const possessionStat = stats.stats.find(s => s.strStat === 'Possession %' && s.strTeam === team);
  return possessionStat ? parseInt(possessionStat.strStat.split('%')[0]) || 0 : 0;
}

/**
 * Helper: Calculate form (wins/losses) from last 5 results
 */
function calculateForm(last5Data) {
  if (!last5Data || !last5Data.results) return { wins: 0, losses: 0, draws: 0 };
  
  const results = last5Data.results.slice(0, 5);
  let wins = 0, losses = 0, draws = 0;

  results.forEach(r => {
    if (r.intHomeScore !== null && r.intAwayScore !== null) {
      if (r.intHomeScore > r.intAwayScore) wins++;
      else if (r.intHomeScore < r.intAwayScore) losses++;
      else draws++;
    }
  });

  return { wins, losses, draws };
}

module.exports = {
  syncDailyFixtures,
  enrichMatchContext,
  generateEdgeMindInsight
};
