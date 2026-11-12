'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {
  firstGoalProjection,
  bookingPointsForFixtureTeam,
  redCardMarkets,
  penaltyMarkets,
  playerEligibility,
  playerMarketProjection,
  buildTimelinePlayerMarkets
}=require('../backend/services/timelinePlayerMarketProjection');

function fixture(id,homeId=1,awayId=2){
  return {fixture_id:id,date:'2026-10-'+String(id).padStart(2,'0')+'T18:00:00Z',home:{id:homeId},away:{id:awayId},goals:{home:2,away:1}};
}
function evidence(){
  const recent1=[],recent2=[],events={},players={};
  for(let i=1;i<=6;i++){
    const f=fixture(i);recent1.push(f);recent2.push(f);
    events[String(i)]=[
      {elapsed:10,team_id:i%2?1:2,player_id:101,type:'Goal',detail:'Normal Goal'},
      {elapsed:30,team_id:1,player_id:101,type:'Card',detail:'Yellow Card'}
    ];
    players[String(i)]=[
      {team_id:1,player_id:101,player:'Home Striker',minutes:85,position:'F',substitute:false,goals:1,assists:0,shots_total:3,shots_on:2,passes_total:28,tackles_total:1,fouls_committed:1,fouls_drawn:2,yellow:1,red:0,saves:0},
      {team_id:1,player_id:102,player:'Home Keeper',minutes:90,position:'G',substitute:false,goals:0,assists:0,shots_total:0,shots_on:0,passes_total:22,tackles_total:0,fouls_committed:0,fouls_drawn:0,yellow:0,red:0,saves:4},
      {team_id:2,player_id:201,player:'Away Striker',minutes:82,position:'F',substitute:false,goals:0,assists:1,shots_total:2,shots_on:1,passes_total:24,tackles_total:1,fouls_committed:1,fouls_drawn:1,yellow:0,red:0,saves:0}
    ];
  }
  return {
    teams:{
      '1':{recent_fixtures:recent1},
      '2':{recent_fixtures:recent2}
    },
    fixture_events:events,
    fixture_players:players,
    targets:{
      F1:{
        fixture_id:'F1',kickoff_at:'2026-11-12T17:00:00Z',
        teams:{home:{id:1,name:'Home'},away:{id:2,name:'Away'}},
        team_h2h:[]
      }
    }
  };
}
function scoreCells(){
  return [
    {home_goals:0,away_goals:0,probability:.10},
    {home_goals:1,away_goals:0,probability:.30},
    {home_goals:1,away_goals:1,probability:.20},
    {home_goals:2,away_goals:0,probability:.20},
    {home_goals:0,away_goals:1,probability:.10},
    {home_goals:2,away_goals:1,probability:.10}
  ];
}

test('first-goal market fails closed without five completed timeline samples',()=>{
  const e=evidence();
  e.fixture_events={};
  assert.equal(firstGoalProjection(e,e.targets.F1,scoreCells(),{home:1.5,away:1}),null);
});

test('first-goal probabilities use historical timeline evidence and sum to 100',()=>{
  const e=evidence();
  const p=firstGoalProjection(e,e.targets.F1,scoreCells(),{home:1.5,away:1});
  assert.ok(p);
  assert.equal(Math.round((p.home_pct+p.away_pct+p.no_goal_pct)*100)/100,100);
  assert.equal(p.no_goal_pct,10);
});

test('booking points cap a player at 35 for yellow(s) followed by red',()=>{
  const e=evidence();
  e.fixture_events['1']=[
    {team_id:1,player_id:101,type:'Card',detail:'Yellow Card'},
    {team_id:1,player_id:101,type:'Card',detail:'Yellow Card'},
    {team_id:1,player_id:101,type:'Card',detail:'Red Card'}
  ];
  assert.equal(bookingPointsForFixtureTeam(e,'1',1),35);
});

test('red-card and penalty markets require sufficient completed event evidence',()=>{
  const e=evidence();
  e.fixture_events['2'].push({team_id:1,player_id:101,type:'Card',detail:'Red Card'});
  e.fixture_events['3'].push({team_id:2,player_id:201,type:'Goal',detail:'Penalty'});
  const red=redCardMarkets(e,e.targets.F1);
  const pen=penaltyMarkets(e,e.targets.F1);
  assert.ok(red&&red.match_probability>0&&red.match_probability<1);
  assert.ok(pen&&pen.match_probability>0&&pen.match_probability<1);
});

test('player eligibility requires established recent starts and expected minutes',()=>{
  const weak={position:'F',rows:Array.from({length:4},()=>({minutes:80,substitute:false}))};
  const strong={position:'F',rows:Array.from({length:6},()=>({minutes:80,substitute:false}))};
  assert.equal(playerEligibility(weak).eligible,false);
  assert.equal(playerEligibility(strong).eligible,true);
});

test('player market projection creates separate event probabilities and preserves test-only labels',()=>{
  const e=evidence(),target=e.targets.F1;
  const p=playerMarketProjection(e,target,{goal_home:1.8,goal_away:1.0,card_home:2.2,card_away:1.8});
  for(const family of ['player_goal','player_assist','player_shots','player_shots_on_target','player_passes','player_tackles','player_fouls','player_card','goalkeeper_saves']){
    assert.ok(Array.isArray(p[family])&&p[family].length>0,family);
    assert.ok(p[family].every(x=>x.probability_pct>=0&&x.probability_pct<=100));
  }
  assert.match(p.player_goal[0].label,/expected/);
});

test('combined timeline/player market builder does not fabricate when evidence family is absent',()=>{
  const e=evidence(),target=e.targets.F1;
  const p=buildTimelinePlayerMarkets(e,target,{score_cells:scoreCells(),goal_anchors:{home:1.5,away:1},goal_home:1.5,goal_away:1,card_home:2,card_away:2});
  assert.ok(p.team_to_score_first);
  assert.ok(p.booking_points);
  assert.ok(p.player_goal);
  const noEvents={...e,fixture_events:{}};
  const q=buildTimelinePlayerMarkets(noEvents,target,{score_cells:scoreCells(),goal_anchors:{home:1.5,away:1},goal_home:1.5,goal_away:1,card_home:2,card_away:2});
  assert.equal(q.team_to_score_first,undefined);
  assert.equal(q.red_card,undefined);
  assert.equal(q.penalty_awarded,undefined);
});
