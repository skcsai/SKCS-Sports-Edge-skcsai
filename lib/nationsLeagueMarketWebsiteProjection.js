'use strict';

const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {families}=require('../backend/config/footballMarketRegistry');

const PROJECTION_HASH='060a92886581d3be87229916cdc47c7cce62391ea5ffc822f06b4c4d619210dc';
const SOURCE_EVIDENCE_HASH='9c9fb9a45a50b3e38317839bd66aeb252c011162c4bd17a43a62a4032f02ddbc';
const FAMILY_IDS=new Set(families.map(f=>f.id));

function requireMarket(ok,message){if(!ok)throw new Error(message);}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}

function loadMarketProjectionFromEnvironment(value){
  requireMarket(typeof value==='string'&&value.length>0&&value.length<100000,'Private market projection configuration missing');
  const zipped=Buffer.from(value,'base64');
  requireMarket(zipped.length>0&&zipped.length<100000,'Private market projection archive invalid');
  const raw=zlib.gunzipSync(zipped,{maxOutputLength:1024*1024});
  requireMarket(sha256(raw)===PROJECTION_HASH,'Private market projection hash mismatch');
  const view=JSON.parse(raw.toString('utf8'));
  requireMarket(view.v==='SM001W2'&&view.src===SOURCE_EVIDENCE_HASH&&view.n===38&&view.f&&typeof view.f==='object','Invalid private market projection scope');
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
  return {...snapshot,fixtures,market_projection:{
    schema_version:'soccer-markets-001-web-projection-v1',
    test_only:true,
    uncalibrated:true,
    source_evidence_sha256:SOURCE_EVIDENCE_HASH,
    projection_sha256:PROJECTION_HASH,
    fixture_count:38
  }};
}

module.exports={
  PROJECTION_HASH,SOURCE_EVIDENCE_HASH,
  loadMarketProjectionFromEnvironment,attachMarketProbabilities
};
