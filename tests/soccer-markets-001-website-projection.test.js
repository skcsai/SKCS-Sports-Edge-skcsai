'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Readable}=require('node:stream');

const {
  PROJECTION_VERSIONS,PROJECTION_HASH,SOURCE_EVIDENCE_HASH,PRIVATE_BLOB_PATH,
  loadMarketProjectionFromEnvironment,
  loadMarketProjectionFromPrivateBlob,
  attachMarketProbabilities
}=require('../lib/nationsLeagueMarketWebsiteProjection');

test('private market projection is hash pinned and fails closed when missing or altered',()=>{
  assert.equal(PROJECTION_HASH,'9e97104599d845aabdabd963e47f7d195ac7c53e8d0c6d4bff262a801d58296d');
  assert.equal(SOURCE_EVIDENCE_HASH,'f008903b9e6f2a13b711333a2d9257389acf52792dcb849a98724f67db418953');
  assert.equal(PROJECTION_VERSIONS.SM001W3.projection_hash,'f70178f1aeadb28a6a7be4d08715da9f36d5d3f2a592e3e1a1f6fa29e47b2cac');
  assert.equal(PROJECTION_VERSIONS.SM001W3.source_evidence_hash,'c44911d157a3bd0be56ecc802f3cca36dc44b8046297267cdcc609b41b38f6b6');
  assert.equal(PROJECTION_VERSIONS.SM001W5.projection_hash,'9e97104599d845aabdabd963e47f7d195ac7c53e8d0c6d4bff262a801d58296d');
  assert.equal(PROJECTION_VERSIONS.SM001W5.source_evidence_hash,'f008903b9e6f2a13b711333a2d9257389acf52792dcb849a98724f67db418953');
  assert.equal(PROJECTION_VERSIONS.SM001W4.projection_hash,'b2cec1855d697cbb3e31d510f010af498c527c2546442b2d5a9c44410ec27296');
  assert.equal(PROJECTION_VERSIONS.SM001W4.source_evidence_hash,'f008903b9e6f2a13b711333a2d9257389acf52792dcb849a98724f67db418953');
  assert.equal(PRIVATE_BLOB_PATH,'soccer-markets-001/2026-11-12/w5-zu0OkIvyLuUcWu8nlw8LXFWUxGJEHt.json');
  assert.throws(()=>loadMarketProjectionFromEnvironment(''),/missing/);
  assert.throws(()=>loadMarketProjectionFromEnvironment(Buffer.from('bad').toString('base64')));
});

test('private Blob loader requests only the pinned private object and fails closed on altered bytes',async()=>{
  let call=null;
  const getter=async(pathname,options)=>{
    call={pathname,options};
    return {stream:Readable.from([Buffer.from('altered')])};
  };
  await assert.rejects(()=>loadMarketProjectionFromPrivateBlob(getter),/hash mismatch|Unexpected token|JSON/);
  assert.equal(call.pathname,PRIVATE_BLOB_PATH);
  assert.deepEqual(call.options,{access:'private',useCache:false});
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
    {v:'SM001W2',src:SOURCE_EVIDENCE_HASH,n:38,f},
    'ENV_ROLLBACK'
  );
  assert.equal(merged.fixtures.filter(x=>x.market_probabilities).length,38);
  assert.deepEqual(merged.fixtures[0].market_probabilities.total_goals[0],{code:'O2.5',probability_pct:61.25});
  assert.equal(merged.fixtures[38].market_probabilities,undefined);
  assert.equal(merged.market_projection.test_only,true);
  assert.equal(merged.market_projection.uncalibrated,true);
  assert.equal(merged.market_projection.transport,'ENV_ROLLBACK');
});

test('W5 market projection must be generated before every saved fixture kickoff',()=>{
  const saved=Array.from({length:38},(_,i)=>({
    fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(5000+i),
    status:'SAVED_PREMATCH',
    kickoff_at:'2026-11-12T17:00:00Z'
  }));
  const f=Object.fromEntries(saved.map(x=>[x.fixture_id,{btts:[['YES',55],['NO',45]]}]));
  const good={v:'SM001W5',src:PROJECTION_VERSIONS.SM001W5.source_evidence_hash,n:38,at:'2026-11-12T09:48:00.201Z',f};
  const merged=attachMarketProbabilities({schema_version:'soccer-website-evidence-v1',fixtures:saved},good,'PRIVATE_BLOB_W5');
  assert.equal(merged.market_projection.generated_at,'2026-11-12T09:48:00.201Z');
  assert.equal(merged.market_projection.transport,'PRIVATE_BLOB_W5');
  assert.throws(()=>attachMarketProbabilities(
    {schema_version:'soccer-website-evidence-v1',fixtures:saved},
    {...good,at:'2026-11-12T17:00:00Z'}
  ),/not created before kickoff/);
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

test('evidence route prefers private Blob W5 with explicit env rollback and Hub uses canonical registry',()=>{
  const route=fs.readFileSync(path.join(__dirname,'../api/evidence/nations-league.js'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
  assert.match(route,/BLOB_STORE_ID/);
  assert.match(route,/loadMarketProjectionFromPrivateBlob/);
  assert.match(route,/PRIVATE_BLOB_W5/);
  assert.match(route,/ENV_ROLLBACK/);
  assert.match(route,/SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64/);
  assert.match(route,/attachMarketProbabilities/);
  assert.match(js,/\/api\/markets\/football/);
  assert.match(js,/soccer-markets-001-registry-v1/);
  assert.match(js,/function selectionLabel/);
  assert.match(js,/details/);
  assert.match(js,/Test-only pre-match probability/);
});
