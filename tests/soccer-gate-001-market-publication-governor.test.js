'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const {
  ONE_X_TWO_STRONG_MIN,
  ONE_X_TWO_REVIEW_MIN,
  MARKET_FAMILY_ORDER,
  evaluate1X2Publication,
  arePublishedMarketsLogicallyCompatible,
  validatePublishedMarketSet
}=require('../backend/services/primaryMarketPublicationGovernor');
const { getStandardSecondaryMarkets }=require('../backend/services/marketIntelligence');
const { isCompatibleWithMain }=require('../backend/services/contradictionGovernance');

function clean(overrides={}){
  return {
    probability_pct:80,
    sealed_before_kickoff:true,
    fixture_evidence_valid:true,
    contradiction_free:true,
    hard_veto:false,
    shadow_status:'GREEN',
    factors:[],
    ...overrides
  };
}

function support(family,note=''){
  return {
    family,
    direction:'SUPPORTS',
    governed:true,
    independent_from_model:true,
    material:true,
    quality:'VERIFIED',
    source_ref:'proof:'+family,
    note
  };
}

test('provisional 1X2 bands are 70 review / 75 strong',()=>{
  assert.equal(ONE_X_TWO_REVIEW_MIN,70);
  assert.equal(ONE_X_TWO_STRONG_MIN,75);
  assert.deepEqual(MARKET_FAMILY_ORDER,[
    '1X2','SECONDARY_OUTCOMES','SAME_MATCH_BET','DOUBLE_CHANCE_AND_COMBINATIONS'
  ]);
});

test('75 and above passes only with clean hard gates',()=>{
  const at75=evaluate1X2Publication(clean({probability_pct:75}));
  assert.equal(at75.zone,'STRONG');
  assert.equal(at75.primary_1x2_status,'PASS');
  assert.equal(at75.probability_pct,75);
  assert.equal(at75.probability_changed,false);

  const veto=evaluate1X2Publication(clean({probability_pct:92,hard_veto:true}));
  assert.equal(veto.primary_1x2_status,'HOLD');
  assert.ok(veto.hard_gate_failures.includes('HARD_CONTEXT_VETO'));
});

test('73.22 review-band fixture can qualify without changing 73.22',()=>{
  const verdict=evaluate1X2Publication(clean({
    probability_pct:73.22,
    factors:[
      support('player_h2h','Player A has governed matchup advantage'),
      support('confirmed_lineup','Relevant players confirmed')
    ]
  }));
  assert.equal(verdict.zone,'REVIEW');
  assert.equal(verdict.primary_1x2_status,'REVIEW_QUALIFIED');
  assert.equal(verdict.preferred_family,'1X2');
  assert.equal(verdict.probability_pct,73.22);
  assert.equal(verdict.probability_changed,false);
  assert.equal(verdict.review_support_count,2);
});

test('review band requires distinct independent governed supports',()=>{
  const doubleCount=evaluate1X2Publication(clean({
    probability_pct:73.22,
    factors:[
      support('player_h2h'),
      {...support('confirmed_lineup'),independent_from_model:false}
    ]
  }));
  assert.equal(doubleCount.primary_1x2_status,'ROUTE_TO_SECONDARY');
  assert.equal(doubleCount.reason,'INSUFFICIENT_INDEPENDENT_CORROBORATION');

  const sameFamily=evaluate1X2Publication(clean({
    probability_pct:74.5,
    factors:[support('team_form'),support('team_form')]
  }));
  assert.equal(sameFamily.review_support_count,1);
  assert.equal(sameFamily.primary_1x2_status,'ROUTE_TO_SECONDARY');
});

test('material contradictory corroboration blocks review-zone promotion',()=>{
  const verdict=evaluate1X2Publication(clean({
    probability_pct:74.99,
    factors:[
      support('player_h2h'),
      support('confirmed_lineup'),
      {
        family:'weather',
        direction:'CONTRADICTS',
        governed:true,
        independent_from_model:true,
        material:true,
        quality:'VERIFIED'
      }
    ]
  }));
  assert.equal(verdict.primary_1x2_status,'ROUTE_TO_SECONDARY');
  assert.equal(verdict.reason,'MATERIAL_REVIEW_CONTRADICTION');
});

test('below 70 routes preference to Secondary but other customer families remain selectable',()=>{
  const verdict=evaluate1X2Publication(clean({probability_pct:69.99}));
  assert.equal(verdict.zone,'FALLBACK');
  assert.equal(verdict.primary_1x2_status,'ROUTE_TO_SECONDARY');
  assert.equal(verdict.preferred_family,'SECONDARY_OUTCOMES');
  assert.equal(verdict.secondary_remains_customer_selectable,true);
  assert.equal(verdict.same_match_remains_customer_selectable,true);
  assert.equal(verdict.double_chance_remains_customer_selectable,true);
});

test('Scout Shadow / pre-match / provenance remain hard gates',()=>{
  assert.equal(evaluate1X2Publication(clean({shadow_status:'RED'})).primary_1x2_status,'HOLD');
  assert.equal(evaluate1X2Publication(clean({sealed_before_kickoff:false})).primary_1x2_status,'HOLD');
  assert.equal(evaluate1X2Publication(clean({fixture_evidence_valid:false})).primary_1x2_status,'HOLD');
});

test('publication contradiction law blocks impossible results but allows compatible customer choice',()=>{
  assert.equal(arePublishedMarketsLogicallyCompatible(
    {market:'1x2',prediction:'home_win'},
    {market:'double_chance',prediction:'1X'}
  ),true);
  assert.equal(arePublishedMarketsLogicallyCompatible(
    {market:'1x2',prediction:'home_win'},
    {market:'double_chance',prediction:'X2'}
  ),false);
  assert.equal(arePublishedMarketsLogicallyCompatible(
    {market:'1x2',prediction:'draw'},
    {market:'btts_yes',prediction:'yes'}
  ),true);
  assert.equal(arePublishedMarketsLogicallyCompatible(
    {market:'btts_yes',prediction:'yes'},
    {market:'btts_no',prediction:'no'}
  ),false);
  assert.equal(arePublishedMarketsLogicallyCompatible(
    {market:'over_2_5',prediction:'over'},
    {market:'under_2_5',prediction:'under'}
  ),false);
  assert.equal(arePublishedMarketsLogicallyCompatible(
    {market:'over_1_5',prediction:'over'},
    {market:'under_2_5',prediction:'under'}
  ),true);

  const set=validatePublishedMarketSet([
    {market:'1x2',prediction:'home_win'},
    {market:'double_chance',prediction:'1X'},
    {market:'over_2_5',prediction:'over'}
  ]);
  assert.equal(set.is_valid,true);
});

test('legacy fixed secondary defaults are disabled for customer publication',()=>{
  assert.deepEqual(getStandardSecondaryMarkets({},'home_win'),[]);
  assert.deepEqual(getStandardSecondaryMarkets({},'away_win'),[]);
  assert.deepEqual(getStandardSecondaryMarkets({},'draw'),[]);

  const source=fs.readFileSync(path.join(__dirname,'../backend/services/aiPipeline.js'),'utf8');
  const section=source.slice(
    source.indexOf('function buildMandatorySecondaryInsights'),
    source.indexOf('function directConfidenceTierWarning')
  );
  assert.doesNotMatch(section,/fallback_defaults|standard_defaults/);
  assert.doesNotMatch(section,/clamp\(Number\(primaryConfidence\) - 3/);
  assert.match(section,/independently scored probability/);
});

test('draw and BTTS Yes are compatible in main-pick contradiction governance',()=>{
  assert.equal(isCompatibleWithMain('btts_yes','X'),true);
  assert.equal(isCompatibleWithMain('12','X'),false);
});

test('website tab order matches governed customer/fallback order',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
  const start=source.indexOf('var definitions=[');
  const end=source.indexOf('];',start);
  const block=source.slice(start,end);
  const indexes=[
    block.indexOf("label:'1X2'"),
    block.indexOf("label:'Secondary Outcomes'"),
    block.indexOf("label:'Same Match Bet'"),
    block.indexOf("label:'Double Chance & Combinations'")
  ];
  assert.ok(indexes.every(i=>i>=0));
  assert.deepEqual(indexes.slice().sort((a,b)=>a-b),indexes);
});
