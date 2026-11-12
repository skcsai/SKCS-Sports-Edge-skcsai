'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {buildWebsiteSnapshot,loadWebsiteSnapshotFromEnvironment,createEvidenceHandler}=require('../lib/nationsLeagueWebsiteSnapshot');
const fs=require('node:fs'),path=require('node:path');
function response(){return {code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;return this;}};}
const owner={authenticated:true,linkage:{edge_profile_id:'7dab62ea-8a25-42f7-9e28-032e7fa34a26',microsoft_object_id:'06aebbef-2448-42ba-a73c-008021f8b40b'}};
test('bytes outside the reviewed immutable sample are rejected',()=>{assert.throws(()=>buildWebsiteSnapshot(Buffer.from('{}'),Buffer.from('{}')),/hash mismatch/);});
test('unauthenticated request cannot load evidence',async()=>{let reads=0;const h=createEvidenceHandler(async(q,r)=>r.status(401).json({authenticated:false}),()=>{reads++;});const r=response();await h({method:'GET'},r);assert.equal(r.code,401);assert.equal(reads,0);assert.equal(r.headers['Cache-Control'],'private, no-store');assert.equal(r.headers['Vercel-CDN-Cache-Control'],'no-store');});
test('another verified identity cannot load private evidence',async()=>{let reads=0;const h=createEvidenceHandler(async(q,r)=>r.status(200).json({...owner,linkage:{...owner.linkage,microsoft_object_id:'other'}}),()=>{reads++;});const r=response();await h({method:'GET'},r);assert.equal(r.code,403);assert.equal(reads,0);});
test('existing owner receives only the supplied saved projection',async()=>{const snapshot={schema_version:'soccer-website-evidence-v1',test_only:true,fixtures:[]};const h=createEvidenceHandler(async(q,r)=>r.status(200).json(owner),()=>snapshot);const r=response();await h({method:'GET'},r);assert.equal(r.code,200);assert.equal(r.body,snapshot);});
test('write methods cannot authenticate or read evidence',async()=>{const h=createEvidenceHandler(()=>{throw Error('must not run');},()=>{throw Error('must not run');});const r=response();await h({method:'POST'},r);assert.equal(r.code,405);assert.equal(r.headers.Allow,'GET');});
test('missing or invalid data fails closed without demo fallback',async()=>{const h=createEvidenceHandler(async(q,r)=>r.status(200).json(owner),()=>{throw Error('private path must not leak');});const r=response();await h({method:'GET'},r);assert.equal(r.code,503);assert.ok(!JSON.stringify(r.body).includes('private path'));assert.match(r.body.error,/No demonstration/);});
test('private evidence is read from server configuration, without a committed forecast file',()=>{const route=fs.readFileSync(path.join(__dirname,'../api/evidence/nations-league.js'),'utf8');assert.match(route,/loadWebsiteSnapshotFromEnvironment\(process\.env\.SOCCER_WEB_001_SNAPSHOT_GZIP_BASE64\)/);assert.doesNotMatch(route,/require\([^)]*evidence\/nations-league/);});
test('missing or altered private configuration cannot supply fabricated data',()=>{assert.throws(()=>loadWebsiteSnapshotFromEnvironment(''),/missing/);const bad=require('node:zlib').gzipSync(Buffer.from('{"fixtures":[]}')).toString('base64');assert.throws(()=>loadWebsiteSnapshotFromEnvironment(bad),/hash mismatch/);});
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
});