'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../backend/services/nationsLeagueMarketProjection');

function stats(cornersHome,cardsHome,cornersAway,cardsAway){
  return [
    {team_id:1,statistics:{corner_kicks:cornersHome,yellow_cards:cardsHome}},
    {team_id:2,statistics:{corner_kicks:cornersAway,yellow_cards:cardsAway}}
  ];
}
function evidence(){
  const recent=[];
  const fixtureStats={};
  for(let i=0;i<8;i++){
    const id=100+i;
    recent.push({fixture_id:id,home:{id:1},away:{id:2},goals:{home:i%3,away:(i+1)%3}});
    fixtureStats[id]=stats(4+(i%3),1+(i%3),3+(i%4),1+((i+1)%3));
  }
  return {
    schema_version:'soccer-markets-001-nations-league-evidence-v1',
    evidence_sha256:'a'.repeat(64),
    teams:{
      1:{season_statistics:{fixtures:{played:{home:4,away:4}},goals_for:{average:{home:'1.4',away:'1.1'}},goals_against:{average:{home:'1.0',away:'1.2'}}},recent_fixtures:recent},
      2:{season_statistics:{fixtures:{played:{home:4,away:4}},goals_for:{average:{home:'1.2',away:'1.6'}},goals_against:{average:{home:'1.5',away:'1.3'}}},recent_fixtures:recent}
    },
    fixture_statistics:fixtureStats,
    targets:{
      F1:{
        fixture_id:'F1',kickoff_at:'2026-11-12T17:00:00Z',
        teams:{home:{id:1,name:'Home'},away:{id:2,name:'Away'}},
        sealed_1x2:{home_win:20,draw:20,away_win:60},
        team_h2h:[]
      }
    }
  };
}
test('scoreline raking preserves the sealed 1X2 exactly',()=>{
  const e=evidence(),a=m.goalAnchors(e,e.targets.F1);
  const base=m.independentPoissonGrid(a.home,a.away);
  const r=m.rakeScorelineTo1X2(base,e.targets.F1.sealed_1x2);
  const h=r.filter(x=>x.home_goals>x.away_goals).reduce((s,x)=>s+x.probability,0)*100;
  const d=r.filter(x=>x.home_goals===x.away_goals).reduce((s,x)=>s+x.probability,0)*100;
  const aw=r.filter(x=>x.home_goals<x.away_goals).reduce((s,x)=>s+x.probability,0)*100;
  assert.ok(Math.abs(h-20)<1e-8);
  assert.ok(Math.abs(d-20)<1e-8);
  assert.ok(Math.abs(aw-60)<1e-8);
});
test('fixture projection creates independent market families from the coherent model',()=>{
  const p=m.projectFixture(evidence(),'F1');
  for(const family of ['total_goals','team_total_goals','btts','correct_score','clean_sheet','win_to_nil','draw_no_bet','same_match_builder','double_chance_combination','corners_total','corners_team','corners_most','cards_total','cards_team','cards_most']){
    assert.ok(Array.isArray(p.market_probabilities[family])&&p.market_probabilities[family].length>0,family);
  }
  assert.equal(p.model.scoreline.method,'POISSON_HISTORY_PLUS_1X2_RAKING');
  assert.equal(p.model.corners.method,'TEAM_FOR_AGAINST_POISSON');
  assert.equal(p.model.cards.method,'TEAM_FOR_AGAINST_POISSON');
  assert.ok(p.unavailable_families.includes('player_shots'));
});
test('Same Match probabilities are direct scoreline events and stay within 0..100',()=>{
  const p=m.projectFixture(evidence(),'F1');
  const rows=p.market_probabilities.same_match_builder;
  assert.ok(rows.length>10);
  assert.ok(rows.every(x=>x.probability_pct>=0&&x.probability_pct<=100));
  const awayOver=rows.find(x=>x.code==='AWAY_O2.5');
  assert.ok(awayOver&&Number.isFinite(awayOver.probability_pct));
});
test('event-history markets fail closed below sample minimum',()=>{
  const e=evidence();
  e.teams[1].recent_fixtures=e.teams[1].recent_fixtures.slice(0,2);
  const p=m.projectFixture(e,'F1');
  assert.equal(p.model.corners,null);
  assert.equal(p.model.cards,null);
  assert.equal(p.market_probabilities.corners_total,undefined);
  assert.equal(p.market_probabilities.cards_total,undefined);
});
