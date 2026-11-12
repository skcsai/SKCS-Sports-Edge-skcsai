'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildWebsiteSnapshot,loadWebsiteSnapshotFromEnvironment,load1X2ProbabilityProjectionFromEnvironment,attach1X2Probabilities,createEvidenceHandler,BATCH_HASH}=require('../lib/nationsLeagueWebsiteSnapshot');
const fs=require('node:fs'),path=require('node:path');
function response(){return {code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;return this;}};}
const owner={authenticated:true,linkage:{edge_profile_id:'7dab62ea-8a25-42f7-9e28-032e7fa34a26',microsoft_object_id:'06aebbef-2448-42ba-a73c-008021f8b40b'}};
test('bytes outside the reviewed immutable sample are rejected',()=>{assert.throws(()=>buildWebsiteSnapshot(Buffer.from('{}'),Buffer.from('{}')),/hash mismatch/);});
test('unauthenticated request cannot load evidence',async()=>{let reads=0;const h=createEvidenceHandler(async(q,r)=>r.status(401).json({authenticated:false}),()=>{reads++;});const r=response();await h({method:'GET'},r);assert.equal(r.code,401);assert.equal(reads,0);assert.equal(r.headers['Cache-Control'],'private, no-store');assert.equal(r.headers['Vercel-CDN-Cache-Control'],'no-store');});
test('another verified identity cannot load private evidence',async()=>{let reads=0;const h=createEvidenceHandler(async(q,r)=>r.status(200).json({...owner,linkage:{...owner.linkage,microsoft_object_id:'other'}}),()=>{reads++;});const r=response();await h({method:'GET'},r);assert.equal(r.code,403);assert.equal(reads,0);});
test('existing owner receives only the supplied saved projection',async()=>{const snapshot={schema_version:'soccer-website-evidence-v1',test_only:true,fixtures:[]};const h=createEvidenceHandler(async(q,r)=>r.status(200).json(owner),()=>snapshot);const r=response();await h({method:'GET'},r);assert.equal(r.code,200);assert.equal(r.body,snapshot);});
test('write methods cannot authenticate or read evidence',async()=>{const h=createEvidenceHandler(()=>{throw Error('must not run');},()=>{throw Error('must not run');});const r=response();await h({method:'POST'},r);assert.equal(r.code,405);assert.equal(r.headers.Allow,'GET');});
test('missing or invalid data fails closed without demo fallback',async()=>{const h=createEvidenceHandler(async(q,r)=>r.status(200).json(owner),()=>{throw Error('private path must not leak');});const r=response();await h({method:'GET'},r);assert.equal(r.code,503);assert.ok(!JSON.stringify(r.body).includes('private path'));assert.match(r.body.error,/No demonstration/);});
test('private evidence and 1X2 projection are read from server configuration without a committed forecast file',()=>{const route=fs.readFileSync(path.join(__dirname,'../api/evidence/nations-league.js'),'utf8');assert.match(route,/loadWebsiteSnapshotFromEnvironment\(process\.env\.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64\)/);assert.match(route,/process\.env\.SOCCER_WEB_001_1X2_JSON/);assert.doesNotMatch(route,/require\([^)]*evidence\/nations-league/);});
test('missing or altered private configuration cannot supply fabricated data',()=>{assert.throws(()=>loadWebsiteSnapshotFromEnvironment(''),/missing/);const bad=require('node:zlib').gzipSync(Buffer.from('{"fixtures":[]}')).toString('base64');assert.throws(()=>loadWebsiteSnapshotFromEnvironment(bad),/hash mismatch/);assert.throws(()=>load1X2ProbabilityProjectionFromEnvironment(''),/missing/);});
test('1X2 merge attaches only validated accepted-fixture probabilities',()=>{
 const accepted=Array.from({length:38},(_,i)=>({fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(2000000+i),status:'SAVED_PREMATCH',prediction:'home_win',confidence_pct:55}));
 const held=Array.from({length:14},(_,i)=>({fixture_id:'CANARY:API_SPORTS_FOOTBALL:5:2026:'+(3000000+i),status:'HELD'}));
 const fixtures=Object.fromEntries(accepted.map(f=>[f.fixture_id,{home_win:60,draw:25,away_win:15}]));
 const merged=attach1X2Probabilities({schema_version:'soccer-website-evidence-v1',prediction_batch_sha256:BATCH_HASH,fixtures:[...accepted,...held]},{fixtures});
 assert.equal(merged.fixtures.filter(x=>x.outcome_probabilities_pct).length,38);
 assert.deepEqual(merged.fixtures[0].outcome_probabilities_pct,{home_win:60,draw:25,away_win:15});
 assert.equal(merged.fixtures[38].outcome_probabilities_pct,undefined);
});
test('active page restores the rolling lifecycle hub while keeping real private evidence only',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../public/sports-match-hub.html'),'utf8');
 assert.match(html,/Date — Rolling 8-Day Window/);
 assert.match(html,/id="day-tabs"/);
 assert.match(html,/Lifecycle Funnel Summary/);
 assert.match(html,/id="movement-counters"/);
 assert.match(html,/How to use this Hub/);
 assert.match(html,/sports-match-hub-evidence\.js/);
 assert.doesNotMatch(html,/sports-match-hub-mock-data\.js|src="js\/sports-match-hub\.js"|CANARY_FINAL_|71\.58|14 Jul/);
 assert.match(html,/Real saved test evidence/);
 assert.match(html,/Africa\/Johannesburg/);
});
test('real evidence controller drives day tabs and governed stages without mock fallback',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
 assert.match(js,/\/api\/evidence\/nations-league/);
 assert.match(js,/renderDayTabs/);
 assert.match(js,/EVIDENCE_REVIEW/);
 assert.match(js,/STABILITY_REVIEW/);
 assert.match(js,/FINAL_DECISION/);
 assert.match(js,/INSUFFICIENT_COMPLETED_MATCH_HISTORY/);
 assert.match(js,/BELOW_MINIMUM_CONFIDENCE|below the existing confidence requirement/i);
 assert.doesNotMatch(js,/SportsMatchHubMock|sports-match-hub-mock-data/);
 assert.match(js,/does not contain per-stage timestamps/i);
 assert.match(js,/Expected 1X2 outcome/);
 assert.match(js,/governed confidence/i);
 assert.match(js,/outcome_probabilities_pct/);
});
test('SOCCER-WEB-002 exposes exactly four governed fixture market tabs',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
 for(const label of ['1X2','Same Match Bet','Secondary Outcomes','Double Chance & Combinations']) assert.ok(js.includes(label),label+' missing');
 assert.match(js,/setAttribute\('role','tablist'\)/);
 assert.match(js,/setAttribute\('role','tabpanel'\)/);
 assert.match(js,/aria-selected/);
});
test('SOCCER-WEB-002 standard Double Chance is exact addition of sealed mutually exclusive 1X2 only',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
 const block=js.slice(js.indexOf('function renderDoubleChanceMarket'),js.indexOf('function renderFixtureMarketTabs'));
 assert.match(block,/probs\.home_win\+probs\.draw/);
 assert.match(block,/probs\.home_win\+probs\.away_win/);
 assert.match(block,/probs\.draw\+probs\.away_win/);
 assert.doesNotMatch(block,/\*/);
 const p={home_win:11.89,draw:16.53,away_win:71.58};
 assert.equal(Number((p.home_win+p.draw).toFixed(2)),28.42);
 assert.equal(Number((p.home_win+p.away_win).toFixed(2)),83.47);
 assert.equal(Number((p.draw+p.away_win).toFixed(2)),88.11);
});
test('SOCCER-WEB-002 unsupported joint markets fail closed instead of fabricating percentages',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../public/js/sports-match-hub-evidence.js'),'utf8');
 assert.match(js,/No governed probability was saved for this fixture in the current canary/);
 assert.match(js,/Same Match percentages are joint-event probabilities/);
 assert.match(js,/require their own saved joint probabilities/);
 assert.match(js,/does not invent a percentage/);
 assert.match(js,/Match Result \+ Goals/);
 assert.match(js,/Goals Over\/Under/);
});
