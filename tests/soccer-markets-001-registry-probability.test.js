'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const registry=require('../backend/config/footballMarketRegistry');
const engine=require('../backend/services/footballMarketProbabilityEngine');

test('canonical registry validates and covers all four customer tabs',()=>{
  assert.equal(registry.validateRegistry(),true);
  for(const tab of Object.values(registry.TABS)){
    assert.ok(registry.tabFamilies(tab).length>0,'missing '+tab);
  }
  assert.equal(registry.getFamily('match_result_1x2').status,'ACTIVE');
  assert.equal(registry.getFamily('double_chance_standard').status,'DERIVABLE');
});

test('legacy aliases resolve into canonical market families',()=>{
  const cases={
    '1x2':'match_result_1x2',
    'match_result':'match_result_1x2',
    'over_2_5':'total_goals',
    'team_total_home_over_1_5':'team_total_goals',
    'corners_over_9_5':'corners_total',
    'over_3_5_yellows':'cards_total',
    'double_chance_1x':'double_chance_standard',
    'combo_dc_1x_and_over_2_5':'double_chance_combination',
    'combo_home_and_over_2_5':'same_match_builder'
  };
  for(const [alias,id] of Object.entries(cases)){
    assert.equal(registry.resolveFamily(alias)?.id,id,alias);
  }
});

test('scoreline projection produces coherent 1X2, DC, totals and BTTS probabilities',()=>{
  const cells=[
    {home_goals:0,away_goals:0,probability:0.10},
    {home_goals:1,away_goals:0,probability:0.30},
    {home_goals:1,away_goals:1,probability:0.20},
    {home_goals:2,away_goals:0,probability:0.20},
    {home_goals:0,away_goals:1,probability:0.10},
    {home_goals:2,away_goals:1,probability:0.10}
  ];
  const p=engine.projectScoreline(cells,{goal_lines:[0.5,1.5,2.5],team_goal_lines:[0.5,1.5]});
  assert.deepEqual(p.match_result,{home_pct:60,draw_pct:30,away_pct:10});
  assert.deepEqual(p.double_chance,{one_x_pct:90,one_two_pct:70,x_two_pct:40});
  assert.deepEqual(p.btts,{yes_pct:30,no_pct:70});
  assert.deepEqual(p.total_goals['2.5'],{over_pct:10,under_pct:90,push_pct:0});
  assert.equal(p.exact_score['1-0'],30);
  assert.equal(engine.assertPercentageVector(Object.values(p.match_result)),true);
});

test('corner/card style joint count distribution derives totals, team totals and most-count 1X2',()=>{
  const p=engine.projectTwoTeamCountDistribution([
    {home_count:4,away_count:3,probability:0.30},
    {home_count:5,away_count:5,probability:0.20},
    {home_count:6,away_count:2,probability:0.30},
    {home_count:2,away_count:6,probability:0.20}
  ],{lines:[7.5,9.5]});
  assert.deepEqual(p.most,{home_pct:60,draw_pct:20,away_pct:20});
  assert.deepEqual(p.total['7.5'],{over_pct:70,under_pct:30,push_pct:0});
});

test('player count market uses its own distribution',()=>{
  const p=engine.projectPlayerCount([
    {count:0,probability:0.2},
    {count:1,probability:0.3},
    {count:2,probability:0.3},
    {count:3,probability:0.2}
  ],[0.5,1.5,2.5]);
  assert.deepEqual(p['1.5'],{over_pct:50,under_pct:50,push_pct:0});
});

test('same-match probability is measured from common joint samples rather than multiplying marginals',()=>{
  const samples=[
    {weight:0.4,home_win:true,over25:true,btts:true},
    {weight:0.2,home_win:true,over25:false,btts:false},
    {weight:0.2,home_win:false,over25:true,btts:true},
    {weight:0.2,home_win:false,over25:false,btts:false}
  ];
  const joint=engine.jointProbabilityFromSamples(samples,[
    s=>s.home_win,
    s=>s.over25
  ]);
  assert.deepEqual(joint,{all_legs_pct:40,not_all_legs_pct:60});
  const home=0.6,over=0.6;
  assert.notEqual(joint.all_legs_pct,home*over*100);
});

test('probability projectors fail closed on missing/invalid evidence',()=>{
  assert.throws(()=>engine.projectScoreline([]),/DISTRIBUTION_REQUIRED/);
  assert.throws(()=>engine.projectPlayerCount([], [0.5]),/COUNT_DISTRIBUTION_REQUIRED/);
  assert.throws(()=>engine.jointProbabilityFromSamples([], [()=>true]),/JOINT_SAMPLES_REQUIRED/);
});
