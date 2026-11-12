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
  },
  SM001W6:{
    projection_hash:'be56c53888878351c0fd5f1918cb766a29d12c35ac3769b59f6b09e390aff73f',
    source_evidence_hash:'ed8b5f78691e7aa06be487deff5e3a3eddd506836b9cc6dcb1a0983456a41eac'
  },
  SM001W7:{
    projection_hash:'0be14df273654f52944bbaf4e0511d406f60199e8e125cbac0228ab098fe109c',
    source_evidence_hash:'ed8b5f78691e7aa06be487deff5e3a3eddd506836b9cc6dcb1a0983456a41eac'
  }
});
const ACTIVE_PROJECTION_VERSION='SM001W7';
const PROJECTION_HASH=PROJECTION_VERSIONS[ACTIVE_PROJECTION_VERSION].projection_hash;
const SOURCE_EVIDENCE_HASH=PROJECTION_VERSIONS[ACTIVE_PROJECTION_VERSION].source_evidence_hash;
const PRIVATE_BLOB_PATH='soccer-markets-001/2026-11-12/w7-CFyxiE39JXPAyN5bZiowDNurn4J9EK.json';
const FAMILY_IDS=new Set(families.map(f=>f.id));
const MAX_PROJECTION_BYTES=8*1024*1024;
const MAX_ROWS_PER_FAMILY=600;
const SMB_TIER_LABELS=['Statistical Edge','Speculative Edge','High-Variance Play'];

function requireMarket(ok,message){if(!ok)throw new Error(message);}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function versionHasTimestamp(version){return ['SM001W5','SM001W6','SM001W7'].includes(version);}

function validateSameMatchOffers(smb){
  requireMarket(smb&&smb.schema_version==='soccer-smb-offers-v1','Invalid W7 Same Match offer');
  requireMarket([2,4,6,8].includes(Number(smb.max_legs)),'Invalid W7 SMB max legs');
  requireMarket(Array.isArray(smb.tiers)&&smb.tiers.length===3,'Invalid W7 SMB tiers');
  requireMarket(smb.tiers.map(x=>String(x.label||'')).join('|')===SMB_TIER_LABELS.join('|'),'Invalid W7 SMB tier labels');
  for(const size of [4,6,8]){
    const slot=smb.sizes&&smb.sizes[String(size)];
    requireMarket(slot&&Number(slot.leg_count)===size,'Invalid W7 SMB size');
    requireMarket(typeof slot.available==='boolean','Invalid W7 SMB availability');
    requireMarket(Array.isArray(slot.offers)&&slot.offers.length<=3,'Invalid W7 SMB offer count');
    if(!slot.available){
      requireMarket(slot.display==='Insufficient data'&&slot.offers.length===0,'Invalid W7 SMB disabled state');
      continue;
    }
    requireMarket(slot.offers.length>0,'Available W7 SMB tab has no offers');
    for(const offer of slot.offers){
      requireMarket(Number(offer.leg_count)===size&&Array.isArray(offer.legs)&&offer.legs.length===size,'Invalid W7 SMB legs');
      const joint=Number(offer.joint_probability_pct);
      requireMarket(Number.isFinite(joint)&&joint>=8&&joint<=100,'Invalid W7 SMB probability');
      requireMarket(SMB_TIER_LABELS.includes(String(offer.tier_label||'')),'Invalid W7 SMB tier');
      for(const leg of offer.legs){
        requireMarket(leg&&typeof leg==='object','Invalid W7 SMB leg');
        requireMarket(String(leg.family||'').length>0&&String(leg.code||'').length>0,'Invalid W7 SMB leg identity');
        requireMarket(String(leg.label||'').length>0&&String(leg.label||'').length<=180,'Invalid W7 SMB leg label');
        const p=Number(leg.probability_pct);
        requireMarket(Number.isFinite(p)&&p>=0&&p<=100,'Invalid W7 SMB leg probability');
      }
    }
  }
}

function validateMarketProjectionBytes(value){
  const raw=Buffer.isBuffer(value)?value:Buffer.from(value||'');
  requireMarket(raw.length>0&&raw.length<MAX_PROJECTION_BYTES,'Private market projection bytes invalid');
  const rawHash=sha256(raw);
  const view=JSON.parse(raw.toString('utf8'));
  const version=PROJECTION_VERSIONS[view.v];
  requireMarket(version&&rawHash===version.projection_hash,'Private market projection hash mismatch');
  requireMarket(view.src===version.source_evidence_hash&&view.n===38&&view.f&&typeof view.f==='object','Invalid private market projection scope');
  if(versionHasTimestamp(view.v)){
    requireMarket(typeof view.at==='string'&&Number.isFinite(Date.parse(view.at)),'Invalid pre-match generation timestamp');
  }
  const ids=Object.keys(view.f);
  requireMarket(ids.length===38,'Invalid private market fixture count');
  if(view.v==='SM001W7'){
    requireMarket(view.s&&typeof view.s==='object'&&!Array.isArray(view.s),'Missing W7 Same Match offers');
    requireMarket(Object.keys(view.s).length===38,'Invalid W7 Same Match fixture count');
  }
  for(const fixtureId of ids){
    requireMarket(/^CANARY:API_SPORTS_FOOTBALL:5:2026:\d+$/.test(fixtureId),'Invalid private market fixture ID');
    const groups=view.f[fixtureId];
    requireMarket(groups&&typeof groups==='object'&&!Array.isArray(groups),'Invalid private market group');
    if(view.v==='SM001W7')validateSameMatchOffers(view.s[fixtureId]);
    for(const [family,rows] of Object.entries(groups)){
      requireMarket(FAMILY_IDS.has(family),'Unknown private market family');
      requireMarket(Array.isArray(rows)&&rows.length>0&&rows.length<=MAX_ROWS_PER_FAMILY,'Invalid private market rows');
      const seen=new Set();
      for(const row of rows){
        requireMarket(Array.isArray(row)&&(row.length===2||row.length===3),'Invalid private market row');
        const code=String(row[0]||''),p=Number(row[1]),label=row.length===3?String(row[2]||''):'';
        requireMarket(code.length>0&&code.length<=100&&!seen.has(code),'Invalid or duplicate private market code');
        requireMarket(Number.isFinite(p)&&p>=0&&p<=100,'Invalid private market probability');
        requireMarket(row.length===2||(label.length>0&&label.length<=180),'Invalid private market label');
        seen.add(code);
      }
    }
  }
  return view;
}

function loadMarketProjectionFromEnvironment(value){
  requireMarket(typeof value==='string'&&value.length>0&&value.length<100000,'Private market projection configuration missing');
  const zipped=Buffer.from(value,'base64');
  requireMarket(zipped.length>0&&zipped.length<100000,'Private market projection archive invalid');
  const raw=zlib.gunzipSync(zipped,{maxOutputLength:MAX_PROJECTION_BYTES});
  return validateMarketProjectionBytes(raw);
}

async function streamToBuffer(stream){
  const chunks=[];let total=0;
  for await(const chunk of stream){
    const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    total+=b.length;
    requireMarket(total<MAX_PROJECTION_BYTES,'Private market projection blob too large');
    chunks.push(b);
  }
  return Buffer.concat(chunks);
}

async function loadMarketProjectionFromPrivateBlob(getter){
  const getBlob=getter||require('@vercel/blob').get;
  const result=await getBlob(PRIVATE_BLOB_PATH,{access:'private',useCache:false});
  requireMarket(result&&result.stream,'Private market projection blob unavailable');
  const view=validateMarketProjectionBytes(await streamToBuffer(result.stream));
  requireMarket(view.v===ACTIVE_PROJECTION_VERSION,'Private market projection blob is not the active projection');
  return view;
}

function attachMarketProbabilities(snapshot,view,transport='PRIVATE_PROJECTION'){
  requireMarket(snapshot?.schema_version==='soccer-website-evidence-v1'&&Array.isArray(snapshot.fixtures),'Invalid website snapshot for market merge');
  const fixtures=snapshot.fixtures.map(f=>({...f}));let attached=0;
  for(const f of fixtures){
    const groups=view.f[f.fixture_id];
    if(f.status==='SAVED_PREMATCH'){
      requireMarket(groups,'Missing saved market projection');
      if(versionHasTimestamp(view.v)){
        requireMarket(
          Number.isFinite(Date.parse(f.kickoff_at))&&Date.parse(view.at)<Date.parse(f.kickoff_at)-60000,
          'Market projection was not created before kickoff'
        );
      }
      f.market_probabilities={};
      if(view.v==='SM001W7')f.same_match_offers=view.s[f.fixture_id];
      for(const [family,rows] of Object.entries(groups)){
        f.market_probabilities[family]=rows.map(row=>({
          code:row[0],
          probability_pct:row[1],
          ...(row.length===3?{label:row[2]}:{})
        }));
      }
      attached++;
    }else{
      requireMarket(!groups,'Held fixture unexpectedly has market projection');
      if(view.v==='SM001W7')requireMarket(!view.s[f.fixture_id],'Held fixture unexpectedly has Same Match offers');
    }
  }
  requireMarket(attached===38,'Incomplete private market projection merge');
  const version=PROJECTION_VERSIONS[view.v];
  requireMarket(version,'Unknown private market projection version');
  return {...snapshot,fixtures,market_projection:{
    schema_version:'soccer-markets-001-web-projection-v1',
    private_projection_version:view.v,
    transport,
    test_only:true,
    uncalibrated:true,
    source_evidence_sha256:version.source_evidence_hash,
    projection_sha256:version.projection_hash,
    generated_at:versionHasTimestamp(view.v)?view.at:null,
    fixture_count:38
  }};
}

module.exports={
  PROJECTION_VERSIONS,ACTIVE_PROJECTION_VERSION,PROJECTION_HASH,SOURCE_EVIDENCE_HASH,PRIVATE_BLOB_PATH,
  MAX_PROJECTION_BYTES,MAX_ROWS_PER_FAMILY,SMB_TIER_LABELS,
  validateSameMatchOffers,validateMarketProjectionBytes,loadMarketProjectionFromEnvironment,loadMarketProjectionFromPrivateBlob,
  attachMarketProbabilities
};