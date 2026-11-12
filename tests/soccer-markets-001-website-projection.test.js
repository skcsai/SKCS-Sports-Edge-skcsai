'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const {
  PROJECTION_VERSIONS,PROJECTION_HASH,SOURCE_EVIDENCE_HASH,
  loadMarketProjectionFromEnvironment,
  attachMarketProbabilities
}=require('../lib/nationsLeagueMarketWebsiteProjection');

test('private market projection is hash pinned and fails closed when missing or altered',()=>{
  assert.equal(PROJECTION_HASH,'060a92886581d3be87229916cdc47c7cce62391ea5ffc822f06b4c4d619210dc');
  assert.equal(SOURCE_EVIDENCE_HASH,'9c9fb9a45a50b3e38317839bd66aeb252c011162c4bd17a43a62a4032f02ddbc');
  assert.equal(PROJECTION_VERSIONS.SM001W3.projection_hash,'f70178f1aeadb28a6a7be4d08715da9f36d5d3f2a592e3e1a1f6fa29e47b2cac');
  assert.equal(PROJECTION_VERSIONS.SM001W3.source_evidence_hash,'c44911d157a3bd0be56ecc802f3cca36dc44b8046297267cdcc609b41b38f6b6');
  assert.throws(()=>loadMarketProjectionFromEnvironment(''),/missing/);
  assert.throws(()=>loadMarketProjectionFromEnvironment(Buffer.from('bad').toString('base64')));
});

test('market merge attaches only the 38 accepted saved fixtures and never held fixtures',()=>{
  const saved=Array.from({length:38},(_,i)=>({
    fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(2000+i),
    status:'SAVED_PREMATCH'
  }));
  const held=Array.from({length:14},(_,i)=>({
    fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(3000+i),
    status:'HELD'
  }));
  const f=Object.fromEntries(saved.map(x=>[x.fixture_id,{
    total_goals:[['O2.5',61.25],['U2.5',38.75]],
    btts:[['YES',54.1],['NO',45.9]]
  }]));
  const merged=attachMarketProbabilities(
    {schema_version:'soccer-website-evidence-v1',fixtures:[...saved,...held]},
    {v:'SM001W2',src:SOURCE_EVIDENCE_HASH,n:38,f}
  );
  assert.equal(merged.fixtures.filter(x=>x.market_probabilities).length,38);
  assert.deepEqual(merged.fixtures[0].market_probabilities.total_goals[0],{code:'O2.5',probability_pct:61.25});
  assert.equal(merged.fixtures[38].market_probabilities,undefined);
  assert.equal(merged.market_projection.test_only,true);
  assert.equal(merged.market_projection.uncalibrated,true);
});

test('held fixture market data is rejected rather than leaked',()=>{
  const saved=Array.from({length:38},(_,i)=>({fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(4000+i),status:'SAVED_PREMATCH'}));
  const held={fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:9999',status:'HELD'};
  const f=Object.fromEntries(saved.map(x=>[x.fixture_id,{btts:[['YES',50],['NO',50]]}]));
  f[held.fixture_id]={btts:[['YES',50],['NO',50]]};
  assert.throws(()=>attachMarketProbabilities(
    {schema_version:'soccer-website-evidence-v1',fixtures:[...saved,held]},
    {v:'SM001W2',src:SOURCE_EVIDENCE_HASH,n:38,f}
  ),/Held fixture unexpectedly/);
});

test('evidence route loads private market secret and Hub uses canonical registry-driven expandable families',()=>{
  const route=fs.readFileSync(path.join(__dirname,'../api/evidence/nations-league.js'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
  assert.match(route,/SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64/);
  assert.match(route,/attachMarketProbabilities/);
  assert.match(js,/\/api\/markets\/football/);
  assert.match(js,/soccer-markets-001-registry-v1/);
  assert.match(js,/function selectionLabel/);
  assert.match(js,/details/);
  assert.match(js,/Test-only pre-match probability/);
});
