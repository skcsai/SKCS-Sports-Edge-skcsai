'use strict';

const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {families}=require('./footballMarketRegistry');

const PROJECTION_VERSIONS=Object.freeze({
  SM001W2:{
    projection_hash:'060a92886581d3be87229916cdc47c7cce62391ea5ffc822f06b4c4d619210dc',
    source_evidence_hash:'9c9fb9a45a50b3e38317839bd66aeb252c011162c4bd17a43a62a4032f02ddbc'
  },
  SM001W3:{
    projection_hash:'f70178f1aeadb28a6a7be4d08715da9f36d5d3f2a592e3e1a1f6fa29e47b2cac',
    source_evidence_hash:'c44911d157a3bd0be56ecc802f3cca36dc44b8046297267cdcc609b41b38f6b6'
  },
  SM001W4:{
    projection_hash:'b2cec1855d697cbb3e31d510f010af498c527c2546442b2d5a9c44410ec27296',
    source_evidence_hash:'f008903b9e6f2a13b711333a2d9257389acf52792dcb849a98724f67db418953'
  },
  SM001W5:{
    projection_hash:'9e97104599d845aabdabd963e47f7d195ac7c53e8d0c6d4bff262a801d58296d',
    source_evidence_hash:'f008903b9e6f2a13b711333a2d9257389acf52792dcb849a98724f67db418953'
  }
});
const ACTIVE_PROJECTION_VERSION='SM001W5';
const PROJECTION_HASH=PROJECTION_VERSIONS[ACTIVE_PROJECTION_VERSION].projection_hash;
const SOURCE_EVIDENCE_HASH=PROJECTION_VERSIONS[ACTIVE_PROJECTION_VERSION].source_evidence_hash;
const FAMILY_IDS=new Set(families.map(f=>f.id));

function requireMarket(ok,message){if(!ok)throw new Error(message);}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}

function loadMarketProjectionFromEnvironment(value){
  requireMarket(typeof value==='string'&&value.length>0&&value.length<100000,'Private market projection configuration missing');
  const zipped=Buffer.from(value,'base64');
  requireMarket(zipped.length>0&&zipped.length<100000,'Private market projection archive invalid');
  const raw=zlib.gunzipSync(zipped,{maxOutputLength:1024*1024});
  const rawHash=sha256(raw);
  const view=JSON.parse(raw.toString('utf8'));
  const version=PROJECTION_VERSIONS[view.v];
  requireMarket(version&&rawHash===version.projection_hash,'Private market projection hash mismatch');
  requireMarket(view.src===version.source_evidence_hash&&view.n===38&&view.f&&typeof view.f==='object','Invalid private market projection scope');
  if(view.v==='SM001W5'){
    requireMarket(typeof view.at==='string'&&Number.isFinite(Date.parse(view.at)),'Invalid W5 pre-match generation timestamp');
  }
  const ids=Object.keys(view.f);
  requireMarket(ids.length===38,'Invalid private market fixture count');
  for(const fixtureId of ids){
    requireMarket(/^CANARY:API_SPORTS_FOOTBALL:5:2026:\d+$/.test(fixtureId),'Invalid private market fixture ID');
    const groups=view.f[fixtureId];
    requireMarket(groups&&typeof groups==='object'&&!Array.isArray(groups),'Invalid private market group');
    for(const [family,rows] of Object.entries(groups)){
      requireMarket(FAMILY_IDS.has(family),'Unknown private market family');
      requireMarket(Array.isArray(rows)&&rows.length>0&&rows.length<=250,'Invalid private market rows');
      const seen=new Set();
      for(const row of rows){
        requireMarket(Array.isArray(row)&&row.length===2,'Invalid private market row');
        const code=String(row[0]||''),p=Number(row[1]);
        requireMarket(code.length>0&&code.length<=80&&!seen.has(code),'Invalid or duplicate private market code');
        requireMarket(Number.isFinite(p)&&p>=0&&p<=100,'Invalid private market probability');
        seen.add(code);
      }
    }
  }
  return view;
}

function attachMarketProbabilities(snapshot,view){
  requireMarket(snapshot?.schema_version==='soccer-website-evidence-v1'&&Array.isArray(snapshot.fixtures),'Invalid website snapshot for market merge');
  const fixtures=snapshot.fixtures.map(f=>({...f}));
  let attached=0;
  for(const f of fixtures){
    const groups=view.f[f.fixture_id];
    if(f.status==='SAVED_PREMATCH'){
      requireMarket(groups,'Missing saved market projection');
      if(view.v==='SM001W5'){
        requireMarket(
          Number.isFinite(Date.parse(f.kickoff_at))&&Date.parse(view.at)<Date.parse(f.kickoff_at)-60000,
          'W5 market projection was not created before kickoff'
        );
      }
      f.market_probabilities={};
      for(const [family,rows] of Object.entries(groups)){
        f.market_probabilities[family]=rows.map(([code,p])=>({code,probability_pct:p}));
      }
      attached++;
    }else{
      requireMarket(!groups,'Held fixture unexpectedly has market projection');
    }
  }
  requireMarket(attached===38,'Incomplete private market projection merge');
  const version=PROJECTION_VERSIONS[view.v];
  requireMarket(version,'Unknown private market projection version');
  return {...snapshot,fixtures,market_projection:{
    schema_version:'soccer-markets-001-web-projection-v1',
    private_projection_version:view.v,
    test_only:true,
    uncalibrated:true,
    source_evidence_sha256:version.source_evidence_hash,
    projection_sha256:version.projection_hash,
    generated_at:view.v==='SM001W5'?view.at:null,
    fixture_count:38
  }};
}

module.exports={
  PROJECTION_VERSIONS,ACTIVE_PROJECTION_VERSION,PROJECTION_HASH,SOURCE_EVIDENCE_HASH,
  loadMarketProjectionFromEnvironment,attachMarketProbabilities
};
