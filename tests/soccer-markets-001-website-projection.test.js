'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Readable}=require('node:stream');

const {
  PROJECTION_VERSIONS,ACTIVE_PROJECTION_VERSION,PROJECTION_HASH,SOURCE_EVIDENCE_HASH,PRIVATE_BLOB_PATH,
  MAX_PROJECTION_BYTES,MAX_ROWS_PER_FAMILY,
  loadMarketProjectionFromEnvironment,
  loadMarketProjectionFromPrivateBlob,
  attachMarketProbabilities
}=require('../lib/nationsLeagueMarketWebsiteProjection');

test('W6 private market projection is hash pinned and bounded',()=>{
  assert.equal(ACTIVE_PROJECTION_VERSION,'SM001W6');
  assert.equal(PROJECTION_HASH,'be56c53888878351c0fd5f1918cb766a29d12c35ac3769b59f6b09e390aff73f');
  assert.equal(SOURCE_EVIDENCE_HASH,'ed8b5f78691e7aa06be487deff5e3a3eddd506836b9cc6dcb1a0983456a41eac');
  assert.equal(PROJECTION_VERSIONS.SM001W6.projection_hash,PROJECTION_HASH);
  assert.equal(PROJECTION_VERSIONS.SM001W6.source_evidence_hash,SOURCE_EVIDENCE_HASH);
  assert.equal(PRIVATE_BLOB_PATH,'soccer-markets-001/2026-11-12/w6-jSYsQSELY0qCkAjkoTqFf82mSoeVyP.json');
  assert.equal(MAX_PROJECTION_BYTES,8*1024*1024);
  assert.equal(MAX_ROWS_PER_FAMILY,600);
  assert.throws(()=>loadMarketProjectionFromEnvironment(''),/missing/);
  assert.throws(()=>loadMarketProjectionFromEnvironment(Buffer.from('bad').toString('base64')));
});

test('private Blob loader requests only W6 and fails closed on altered bytes',async()=>{
  let call=null;
  const getter=async(pathname,options)=>{
    call={pathname,options};
    return {stream:Readable.from([Buffer.from('altered')])};
  };
  await assert.rejects(()=>loadMarketProjectionFromPrivateBlob(getter),/hash mismatch|Unexpected token|JSON/);
  assert.equal(call.pathname,PRIVATE_BLOB_PATH);
  assert.deepEqual(call.options,{access:'private',useCache:false});
});

test('market merge remains backwards-compatible with 2-field rollback rows',()=>{
  const saved=Array.from({length:38},(_,i)=>({
    fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(2000+i),status:'SAVED_PREMATCH'
  }));
  const held=Array.from({length:14},(_,i)=>({
    fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(3000+i),status:'HELD'
  }));
  const f=Object.fromEntries(saved.map(x=>[x.fixture_id,{
    total_goals:[['O2.5',61.25],['U2.5',38.75]],
    btts:[['YES',54.1],['NO',45.9]]
  }]));
  const merged=attachMarketProbabilities(
    {schema_version:'soccer-website-evidence-v1',fixtures:[...saved,...held]},
    {v:'SM001W2',src:PROJECTION_VERSIONS.SM001W2.source_evidence_hash,n:38,f},
    'ENV_ROLLBACK'
  );
  assert.equal(merged.fixtures.filter(x=>x.market_probabilities).length,38);
  assert.deepEqual(merged.fixtures[0].market_probabilities.total_goals[0],{code:'O2.5',probability_pct:61.25});
  assert.equal(merged.fixtures[38].market_probabilities,undefined);
  assert.equal(merged.market_projection.transport,'ENV_ROLLBACK');
});

test('W6 preserves customer labels and must be generated before every saved fixture kickoff',()=>{
  const saved=Array.from({length:38},(_,i)=>({
    fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(5000+i),
    status:'SAVED_PREMATCH',kickoff_at:'2026-11-12T17:00:00Z'
  }));
  const f=Object.fromEntries(saved.map(x=>[x.fixture_id,{
    btts:[['YES',55,'Both teams to score – Yes'],['NO',45,'Both teams to score – No']],
    player_goal:[['P101_ANYTIME',27.5,'Example Striker (Home expected) anytime scorer']]
  }]));
  const good={v:'SM001W6',src:PROJECTION_VERSIONS.SM001W6.source_evidence_hash,n:38,at:'2026-11-12T10:21:26.461Z',f};
  const merged=attachMarketProbabilities({schema_version:'soccer-website-evidence-v1',fixtures:saved},good,'PRIVATE_BLOB_W6');
  assert.equal(merged.market_projection.generated_at,'2026-11-12T10:21:26.461Z');
  assert.equal(merged.market_projection.transport,'PRIVATE_BLOB_W6');
  assert.deepEqual(merged.fixtures[0].market_probabilities.player_goal[0],{
    code:'P101_ANYTIME',probability_pct:27.5,label:'Example Striker (Home expected) anytime scorer'
  });
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
    {v:'SM001W2',src:PROJECTION_VERSIONS.SM001W2.source_evidence_hash,n:38,f}
  ),/Held fixture unexpectedly/);
});

test('evidence route prefers private Blob W6 with explicit env rollback and Hub uses canonical registry',()=>{
  const route=fs.readFileSync(path.join(__dirname,'../api/evidence/nations-league.js'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
  assert.match(route,/BLOB_STORE_ID/);
  assert.match(route,/loadMarketProjectionFromPrivateBlob/);
  assert.match(route,/PRIVATE_BLOB_W6/);
  assert.match(route,/ENV_ROLLBACK/);
  assert.match(route,/SOCCER_MARKETS_001_PROJECTION_GZIP_BASE64/);
  assert.match(route,/attachMarketProbabilities/);
  assert.match(js,/\/api\/markets\/football/);
  assert.match(js,/soccer-markets-001-registry-v1/);
  assert.match(js,/function selectionLabel/);
  assert.match(js,/Test-only pre-match probability/);
});
