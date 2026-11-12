'use strict';
// Read-only projection of the immutable SOCCER-UNL-001 test. Never scores a match.
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const PRIVATE_VIEW_HASH='18a22f32e5bf7f42114abff3127376a7498adc314f5d6e1a84643bfd55288279';
const PROBABILITY_VIEW_HASH='2489fd77c34ea2ba812254a54552a52574f2b79853f51d236c18774753b08a98';
const SOURCE_HASH='dfae66c4865fdeb9a8117f823394dbbb6629fdf57a5b7dcb9982b4b3f2e81243';
const BATCH_HASH='cc44011233aceacf551f2ff1c685d95e1f9ce43f5aa389c0601e2ecd8883398d';
const HISTORY_HOLDS=new Set([1528970,1545615,1528989,1545618]);
const OWNER_PROFILE='7dab62ea-8a25-42f7-9e28-032e7fa34a26';
const OWNER_OBJECT='06aebbef-2448-42ba-a73c-008021f8b40b';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function requireEvidence(ok,reason){if(!ok)throw new Error(reason);}
function canonical(x){return Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;}
const digest=x=>hash(Buffer.from(JSON.stringify(canonical(x))));
function buildWebsiteSnapshot(sourceBytes,batchBytes){
 requireEvidence(hash(sourceBytes)===SOURCE_HASH&&hash(batchBytes)===BATCH_HASH,'Immutable evidence hash mismatch');
 const source=JSON.parse(sourceBytes),batch=JSON.parse(batchBytes);
 requireEvidence(source.project_id==='SOCCER-UNL-001'&&batch.project_id===source.project_id&&batch.official===false&&batch.schema_version==='unl-canary-atomic-batch-v1','Unexpected evidence scope');
 requireEvidence(source.fixtures.length===156&&batch.pairs.length===38,'Unexpected evidence count');
 const pairs=new Map(),holds=new Map(batch.held.map(h=>[h.fixture_id,h.reason]));
 for(const pair of batch.pairs){
  const {final,pending,seal,review}=pair,edge=seal.payload.edge;
  requireEvidence(!pairs.has(final.fixture_id)&&review.verdict==='GREEN'&&final.official===false&&pending.official===false&&pending.prediction_final_id===final.id&&pending.fixture_id===final.fixture_id&&pending.resolution_status==='pending'&&pending.is_correct===null,'Invalid saved prediction pair');
  requireEvidence(digest(seal.payload)===seal.commitment_id&&final.commitment_id===seal.commitment_id&&edge.fixture.canonical_fixture_id===final.fixture_id&&edge.fixture.kickoff_at===final.kickoff_at&&edge.decision.outcome===final.prediction&&edge.decision.confidence_pct===final.confidence,'Invalid saved Edge seal');
  const probs=edge.decision.probabilities_pct||{},values=[probs.home_win,probs.draw,probs.away_win];
  requireEvidence(values.every(v=>Number.isFinite(v)&&v>=0&&v<=100)&&Math.abs(values.reduce((a,b)=>a+b,0)-100)<=0.02,'Invalid saved 1X2 probabilities');
  const chosen=probs[final.prediction];
  requireEvidence(Number.isFinite(chosen)&&Math.abs(chosen-edge.decision.raw_top_probability_pct)<=0.011&&final.confidence<=chosen+0.011,'Invalid saved 1X2 winner probability');
  requireEvidence(Date.parse(seal.payload.committed_at)<Date.parse(final.kickoff_at)&&Date.parse(batch.created_at)<Date.parse(final.kickoff_at),'Prediction was not saved before kickoff');pairs.set(final.fixture_id,pair);
 }
 const future=source.fixtures.filter(f=>f.acquisition_class==='FUTURE_SCHEDULED');
 requireEvidence(future.length===52&&new Set(future.map(f=>f.canonical_fixture_id)).size===52,'Unexpected future fixture set');
 const fixtures=future.map(f=>{
  const id=f.canonical_fixture_id,pair=pairs.get(id),reason=holds.get(id);
  requireEvidence(f.competition_id===5&&f.season===2026&&f.home_team?.name&&f.away_team?.name&&Number.isFinite(Date.parse(f.kickoff_at)),'Invalid fixture');
  requireEvidence(!pair||(!reason&&!HISTORY_HOLDS.has(f.provider_fixture_id)),'Contradictory fixture disposition');
  requireEvidence(pair||reason==='BELOW_MINIMUM_CONFIDENCE'||HISTORY_HOLDS.has(f.provider_fixture_id),'Unexplained fixture hold');
  const row={fixture_id:id,provider_fixture_id:f.provider_fixture_id,home_team:f.home_team.name,away_team:f.away_team.name,competition:f.competition,kickoff_at:f.kickoff_at,status:pair?'SAVED_PREMATCH':'HELD',hold_reason:pair?null:reason||'INSUFFICIENT_COMPLETED_MATCH_HISTORY',resolution_status:pair?'pending':null};
  if(pair){
   const decision=pair.seal.payload.edge.decision,p=decision.probabilities_pct;
   Object.assign(row,{market:pair.final.market,prediction:pair.final.prediction,confidence_pct:pair.final.confidence,raw_top_probability_pct:decision.raw_top_probability_pct,outcome_probabilities_pct:{home_win:p.home_win,draw:p.draw,away_win:p.away_win},committed_at:pair.seal.payload.committed_at,persisted_at:batch.created_at,comparison:'GREEN',prediction_record_id:pair.final.id,pending_record_id:pair.pending.id});
  }
  return row;
 }).sort((a,b)=>a.kickoff_at.localeCompare(b.kickoff_at)||a.fixture_id.localeCompare(b.fixture_id));
 const counts={archived:156,historical_evidence_only:104,upcoming_at_cutoff:fixtures.length,saved_prematch:fixtures.filter(f=>f.status==='SAVED_PREMATCH').length,held_history:fixtures.filter(f=>f.hold_reason==='INSUFFICIENT_COMPLETED_MATCH_HISTORY').length,held_confidence:fixtures.filter(f=>f.hold_reason==='BELOW_MINIMUM_CONFIDENCE').length};
 requireEvidence(counts.saved_prematch===38&&counts.held_history===4&&counts.held_confidence===10,'Disposition count mismatch');
 return {schema_version:'soccer-website-evidence-v1',project_id:'SOCCER-WEB-001',source_project_id:'SOCCER-UNL-001',test_only:true,calibrated:false,continuously_updated:false,source_observed_at:source.observed_at,predictions_saved_at:batch.created_at,source_sha256:SOURCE_HASH,prediction_batch_sha256:BATCH_HASH,counts,fixtures};
}
function loadWebsiteSnapshotFromEnvironment(value){
 requireEvidence(typeof value==='string'&&value.length>0&&value.length<10000&&/^[A-Za-z0-9+/=]+$/.test(value.trim()),'Private website evidence configuration missing');
 const bytes=zlib.gunzipSync(Buffer.from(value.trim(),'base64'),{maxOutputLength:65536});
 requireEvidence(hash(bytes)===PRIVATE_VIEW_HASH,'Private website evidence hash mismatch');
 return JSON.parse(bytes);
}
function load1X2ProbabilityProjectionFromEnvironment(value){
 requireEvidence(typeof value==='string'&&value.length>0&&value.length<10000,'Private 1X2 probability configuration missing');
 const bytes=Buffer.from(value,'utf8');
 requireEvidence(hash(bytes)===PROBABILITY_VIEW_HASH,'Private 1X2 probability hash mismatch');
 const view=JSON.parse(value);
 requireEvidence(view.schema_version==='soccer-web-001-1x2-v1'&&view.source_batch_sha256===BATCH_HASH&&view.fixture_count===38&&view.fixtures&&typeof view.fixtures==='object','Invalid private 1X2 probability scope');
 const ids=Object.keys(view.fixtures);requireEvidence(ids.length===38,'Invalid private 1X2 probability count');
 for(const id of ids){
  const p=view.fixtures[id]||{},values=[p.home_win,p.draw,p.away_win];
  requireEvidence(/^CANARY:API_SPORTS_FOOTBALL:5:2026:\d+$/.test(id)&&values.every(v=>Number.isFinite(v)&&v>=0&&v<=100)&&Math.abs(values.reduce((a,b)=>a+b,0)-100)<=0.02,'Invalid private 1X2 probability row');
 }
 return view;
}
function attach1X2Probabilities(snapshot,view){
 requireEvidence(snapshot?.schema_version==='soccer-website-evidence-v1'&&snapshot.prediction_batch_sha256===BATCH_HASH,'Invalid website snapshot for 1X2 merge');
 const fixtures=snapshot.fixtures.map(f=>({...f}));let attached=0;
 for(const f of fixtures){
  const p=view.fixtures[f.fixture_id];
  if(f.status==='SAVED_PREMATCH'){
   requireEvidence(p,'Missing saved 1X2 probabilities');
   const chosen=p[f.prediction],top=Math.max(p.home_win,p.draw,p.away_win);
   requireEvidence(Number.isFinite(chosen)&&Math.abs(chosen-top)<=0.02&&f.confidence_pct<=chosen+0.011,'Contradictory saved 1X2 probabilities');
   f.outcome_probabilities_pct={home_win:p.home_win,draw:p.draw,away_win:p.away_win};
   f.raw_top_probability_pct=chosen;attached++;
  }else requireEvidence(!p,'Held fixture unexpectedly has 1X2 probabilities');
 }
 requireEvidence(attached===38,'Incomplete saved 1X2 probability merge');
 return {...snapshot,fixtures};
}

function createEvidenceHandler(authenticate,loadSnapshot){
 return async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Authorization');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
  try{
   let code=401,identity=null;
   const gate={setHeader(){},status(n){code=n;return this;},json(value){identity=value;return this;}};
   await authenticate(req,gate);
   if(code!==200||identity?.authenticated!==true)return res.status(code===403?403:401).json({error:'Sign in with the existing linked Microsoft account to view test evidence.'});
   if(identity.linkage?.edge_profile_id!==OWNER_PROFILE||identity.linkage?.microsoft_object_id!==OWNER_OBJECT)return res.status(403).json({error:'Private test evidence is restricted to the linked owner.'});
   const snapshot=await loadSnapshot();requireEvidence(snapshot.schema_version==='soccer-website-evidence-v1'&&snapshot.test_only===true,'Invalid website evidence');
   return res.status(200).json(snapshot);
  }catch{return res.status(503).json({error:'Saved test evidence is unavailable. No demonstration data has been substituted.'});}
 };
}
module.exports={buildWebsiteSnapshot,loadWebsiteSnapshotFromEnvironment,load1X2ProbabilityProjectionFromEnvironment,attach1X2Probabilities,createEvidenceHandler,SOURCE_HASH,BATCH_HASH};
