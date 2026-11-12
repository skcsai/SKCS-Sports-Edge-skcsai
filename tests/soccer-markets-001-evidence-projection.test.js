'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {
  calibrateScorelineToSealed1X2,
  weightedEventRate,
  buildFixtureMarketProjection
}=require('../backend/services/footballMarketEvidenceProjection');

test('scoreline calibration stays close to sealed 1X2 while preserving empirical goal-scale evidence',()=>{
  const cal=calibrateScorelineToSealed1X2({
    sealed_1x2:{home_pct:11.89,draw_pct:16.53,away_pct:71.58},
    base_home_goals:1.225,
    base_away_goals:1.925
  });
  assert.ok(cal.max_1x2_error_pct<=3);
  assert.ok(cal.home_goal_rate>0);
  assert.ok(cal.away_goal_rate>cal.home_goal_rate);
});

test('event-specific H2H affects a count rate without double-counting general evidence',()=>{
  const noH2H=weightedEventRate({
    own_samples:[9,5,6,5,2,12,8,12,13,2],
    opponent_conceded_samples:[9,5,6,4,5,3,2,5,2,7],
    h2h_samples:[]
  });
  const withH2H=weightedEventRate({
    own_samples:[9,6,5,2,12,8,12,13,2],
    opponent_conceded_samples:[9,6,4,5,3,2,5,2,7],
    h2h_samples:[5]
  });
  assert.notEqual(withH2H,noH2H);
});

test('Türkiye-Belgium evidence proof yields real goal/corner/card and joint probabilities',()=>{
  const p=buildFixtureMarketProjection({
    fixture_id:1528958,
    sealed_1x2:{home_pct:11.89,draw_pct:16.53,away_pct:71.58},
    base_home_goals:1.225,
    base_away_goals:1.925,
    corner_evidence:{
      home:{
        own_samples:[9,6,5,2,12,8,12,13,2],
        opponent_conceded_samples:[9,6,4,5,3,2,5,2,7],
        h2h_samples:[5]
      },
      away:{
        own_samples:[2,2,8,1,5,4,8,4,2],
        opponent_conceded_samples:[3,2,3,9,0,5,2,1,3],
        h2h_samples:[2]
      }
    },
    card_evidence:{
      home:{
        own_samples:[2,3,2,0,1,1,1,0,5],
        opponent_conceded_samples:[1,0,3,2,2,1,2,1,2],
        h2h_samples:[4]
      },
      away:{
        own_samples:[2,3,5,2,0,1,0,1,2],
        opponent_conceded_samples:[2,0,3,1,1,0,2,1,3],
        h2h_samples:[4]
      }
    }
  });

  assert.equal(p.fixture_id,'1528958');
  assert.ok(p.market_probabilities.total_goals.length>=10);
  assert.ok(p.market_probabilities.btts.length===2);
  assert.ok(p.market_probabilities.correct_score.length===6);
  assert.ok(p.market_probabilities.corners_total.length>0);
  assert.ok(p.market_probabilities.cards_total.length>0);
  assert.ok(p.market_probabilities.same_match_builder.length>0);
  assert.ok(p.market_probabilities.double_chance_combination.length>0);
  assert.ok(p.market_probabilities.double_chance_standard.some(x=>x.code==='X2'&&Math.abs(x.probability_pct-88.11)<0.05));
});

test('fixture market projection fails closed without required sealed and base-goal evidence',()=>{
  assert.throws(()=>buildFixtureMarketProjection({fixture_id:1}),/SEALED_1X2_REQUIRED/);
});
