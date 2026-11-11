'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');

const {
    computeScoutPackageHash,
    deriveScoutEvidenceBaseline
} = require('../backend/services/scoutEvidenceBaseline');
const { evaluateDirect1x2 } = require('../backend/services/direct1x2Engine');

const PACKAGE_SHA = '153684f6d7511ce653d26e490c8f507b0a7e0ad23d834d84671d9adea5a65912';

function loadAiPipelineIsolated() {
    const query = async () => ({ rows: [] });
    const fakePool = {
        query,
        connect: async () => ({
            query,
            release() {}
        })
    };
    const fakeDb = new Proxy(
        {
            pool: fakePool,
            query,
            withTransaction: async (fn) => fn({ query })
        },
        {
            get(target, property) {
                if (property in target) return target[property];
                return async () => null;
            }
        }
    );

    for (const modulePath of ['../backend/db', '../backend/database']) {
        const resolved = require.resolve(modulePath);
        require.cache[resolved] = {
            id: resolved,
            filename: resolved,
            loaded: true,
            exports: fakeDb
        };
    }

    let networkAttempts = 0;
    const blocked = () => {
        networkAttempts += 1;
        throw new Error('EPI001I1_NETWORK_BLOCKED');
    };
    const originals = {
        httpRequest: http.request,
        httpGet: http.get,
        httpsRequest: https.request,
        httpsGet: https.get,
        fetch: global.fetch
    };

    http.request = blocked;
    http.get = blocked;
    https.request = blocked;
    https.get = blocked;
    global.fetch = blocked;

    try {
        const aiPipeline = require('../backend/services/aiPipeline');
        return { aiPipeline, networkAttempts };
    } finally {
        http.request = originals.httpRequest;
        http.get = originals.httpGet;
        https.request = originals.httpsRequest;
        https.get = originals.httpsGet;
        global.fetch = originals.fetch;
    }
}

function rehashPackage(input) {
    const { package_sha256, ...body } = input;
    input.package_sha256 = computeScoutPackageHash(body);
    return input;
}
function proofPackage() {
    const value = {
        schema_version: 'scout-match-evidence-package-v1',
        fixture: {
            competition_id: 39,
            competition: 'Premier League',
            kickoff_at: '2026-11-08T14:00:00.000Z',
            canonical_fixture_id: 'FIXT_cbf67cd74c69e3843b83',
            home_team: { name: 'Crystal Palace' },
            away_team: { name: 'Liverpool' }
        },
        prediction_cutoff: '2026-11-06T10:48:52.000Z',
        package_sha256: null,
        odds: false,
        prediction_execution: false,
        edge_consumer_policy: 'EDGE_CONSUME_NO_RECOMPUTE',
        team_form: {
            home: {
                current_form: ['D', 'W', 'L', 'L', 'L'],
                season_summary: {
                    won: 2,
                    drawn: 1,
                    lost: 6,
                    goals_for: 9,
                    goals_against: 21
                }
            },
            away: {
                current_form: ['W', 'L', 'W', 'W', 'L'],
                season_summary: {
                    won: 4,
                    drawn: 3,
                    lost: 2,
                    goals_for: 11,
                    goals_against: 9
                }
            }
        },
        h2h: {
            recent_meetings: [
                { home_score: 3, away_score: 1 },
                { home_score: 0, away_score: 3 },
                { home_score: 2, away_score: 1 }
            ]
        },
        player_histories: {
            home: new Array(29).fill({}),
            away: new Array(31).fill({})
        }
    };

    const { package_sha256, ...body } = value;
    value.package_sha256 = computeScoutPackageHash(body);
    return value;
}

test('fails closed when package provenance is missing', () => {
    const input = proofPackage();
    delete input.package_sha256;

    const result = deriveScoutEvidenceBaseline(input);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'SCOUT_BASELINE_PACKAGE_HASH_MISSING');
});


test('fails closed when the canonical Scout package hash does not match the body', () => {
    const input = proofPackage();
    input.team_form.home.season_summary.won += 1;

    const result = deriveScoutEvidenceBaseline(input);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'SCOUT_BASELINE_PACKAGE_HASH_MISMATCH');
});
test('fails closed when cutoff is not before kickoff', () => {
    const input = proofPackage();
    input.prediction_cutoff = input.fixture.kickoff_at;
    rehashPackage(input);

    const result = deriveScoutEvidenceBaseline(input);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'SCOUT_BASELINE_CUTOFF_INVALID');
});

test('fails closed if Scout odds or prediction execution are enabled', () => {
    const withOdds = proofPackage();
    withOdds.odds = true;
    rehashPackage(withOdds);
    assert.equal(
        deriveScoutEvidenceBaseline(withOdds).code,
        'SCOUT_BASELINE_BOUNDARY_INVALID'
    );

    const withPrediction = proofPackage();
    withPrediction.prediction_execution = true;
    rehashPackage(withPrediction);
    assert.equal(
        deriveScoutEvidenceBaseline(withPrediction).code,
        'SCOUT_BASELINE_BOUNDARY_INVALID'
    );
});

test('derives a deterministic evidence-only Liverpool baseline', () => {
    const result = deriveScoutEvidenceBaseline(proofPackage());

    assert.equal(result.ok, true);
    assert.equal(result.source, 'scout_evidence_baseline');
    assert.equal(result.prediction, 'away_win');
    assert.equal(result.evidence.package_sha256, computeScoutPackageHash((({ package_sha256, ...body }) => body)(proofPackage())));
    assert.equal(result.evidence.player_history_records_available, 60);
    assert.equal(result.evidence.player_history_weighted_in_baseline, false);
    assert.equal(result.evidence.odds_used, false);
    assert.equal(result.evidence.provider_prediction_used, false);
    assert.equal(result.evidence.ai_fallback_used, false);

    assert.ok(result.probabilities.away > result.probabilities.home);
    assert.ok(result.probabilities.away > result.probabilities.draw);
    assert.ok(Math.abs(
        result.probabilities.home
        + result.probabilities.draw
        + result.probabilities.away
        - 1
    ) < 0.001);
});

test('existing waterfall and direct1x2 engines consume the baseline under isolated dependencies', () => {
    const baseline = deriveScoutEvidenceBaseline(proofPackage());
    assert.equal(baseline.ok, true);

    const isolated = loadAiPipelineIsolated();
    assert.equal(isolated.networkAttempts, 0);

    const waterfall = isolated.aiPipeline.__test.deriveWaterfallProbabilities(
        baseline.prediction,
        baseline.confidence / 100,
        {}
    );

    const direct = evaluateDirect1x2({
        baseProb: {
            home: waterfall.home_win,
            draw: waterfall.draw,
            away: waterfall.away_win
        },
        form: baseline.direct_context.form,
        h2h: baseline.direct_context.h2h,
        injuries: baseline.direct_context.injuries,
        weather: baseline.direct_context.weather
    });

    assert.equal(direct.market, '1X2');
    assert.equal(direct.outcome, 'away_win');
    assert.ok(direct.confidence >= 45);
    assert.equal(direct.stages.length, 6);
});
