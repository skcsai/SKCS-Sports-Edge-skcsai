'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {projectBatch}=require('../backend/services/nationsLeagueMarketProjection');
const {families}=require('../backend/config/footballMarketRegistry');

function fail(message){throw new Error(message);}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function arr(value){
  if(Array.isArray(value))return value;
  if(Array.isArray(value?.value))return value.value;
  return [];
}
function readJson(file){
  const bytes=fs.readFileSync(file);
  const text=bytes.toString('utf8').replace(/^\uFEFF/,'');
  return {bytes,json:JSON.parse(text)};
}
function normalizeFixture(f){
  return {
    fixture_id:Number(f.id),
    date:String(f.date),
    status:String(f.status||''),
    home:{id:Number(f.home_id),name:String(f.home||'')},
    away:{id:Number(f.away_id),name:String(f.away||'')},
    goals:{home:finite(f.home_goals),away:finite(f.away_goals)},
    halftime_goals:{home:finite(f.ht_home),away:finite(f.ht_away)}
  };
}
function targetId(providerId){return 'CANARY:API_SPORTS_FOOTBALL:5:2026:'+Number(providerId);}
function normalizeEvidence(raw,rawHash){
  if(raw?.schema_version!=='soccer-markets-001-private-evidence-v1')fail('RAW_EVIDENCE_SCHEMA_INVALID');
  const targets=arr(raw.targets);
  if(targets.length!==38)fail('TARGET_COUNT_INVALID');
  const teams={};
  for(const [id,team] of Object.entries(raw.teams||{})){
    const recent=arr(team?.recent)
      .filter(f=>String(f?.status)==='FT')
      .map(normalizeFixture);
    teams[id]={
      season_statistics:{
        fixtures:{played:team?.league?.played||{}},
        goals_for:{average:team?.league?.gf_avg||{}},
        goals_against:{average:team?.league?.ga_avg||{}}
      },
      recent_fixtures:recent
    };
  }
  const fixture_statistics={};
  for(const [fixtureId,rows] of Object.entries(raw.fixture_stats||{})){
    fixture_statistics[fixtureId]=arr(rows).map(r=>({
      team_id:Number(r.team_id),
      team:String(r.team||''),
      statistics:{
        corner_kicks:finite(r.corners),
        yellow_cards:finite(r.yellow),
        red_cards:finite(r.red),
        fouls:finite(r.fouls),
        total_shots:finite(r.shots),
        shots_on_goal:finite(r.sot),
        ball_possession:finite(typeof r.possession==='string'?r.possession.replace('%',''):r.possession)
      }
    }));
  }
  const outTargets={};
  for(const t of targets){
    const kickoff=Date.parse(t.kickoff);
    if(!Number.isFinite(kickoff))fail('TARGET_KICKOFF_INVALID:'+t.fixture_id);
    if(Date.now()>=kickoff-60000)fail('PREMATCH_CUTOFF_FAILED:'+t.fixture_id);
    const id=targetId(t.fixture_id);
    const h2h=arr(raw.h2h?.[String(t.fixture_id)])
      .filter(f=>String(f?.status)==='FT'&&Date.parse(f?.date)<kickoff)
      .map(normalizeFixture);
    const recentHome=teams[String(t.home_id)]?.recent_fixtures||[];
    const recentAway=teams[String(t.away_id)]?.recent_fixtures||[];
    if(recentHome.some(f=>Date.parse(f.date)>=kickoff)||recentAway.some(f=>Date.parse(f.date)>=kickoff)){
      fail('FUTURE_LEAKAGE_DETECTED:'+t.fixture_id);
    }
    outTargets[id]={
      fixture_id:id,
      provider_fixture_id:Number(t.fixture_id),
      kickoff_at:String(t.kickoff),
      teams:{
        home:{id:Number(t.home_id),name:String(t.home)},
        away:{id:Number(t.away_id),name:String(t.away)}
      },
      sealed_1x2:{
        home_win:Number(t.home_pct),
        draw:Number(t.draw_pct),
        away_win:Number(t.away_pct)
      },
      team_h2h:h2h
    };
  }
  return {
    schema_version:'soccer-markets-001-nations-league-evidence-v2',
    evidence_sha256:rawHash,
    collected_at:String(raw.collected_at||''),
    source_class:'PRIVATE_API_SPORTS_PREMATCH_EVIDENCE',
    test_only:true,
    fixture_count:38,
    teams,
    fixture_statistics,
    targets:outTargets
  };
}
function compactProjection(batch,version,sourceHash){
  const familyIds=new Set(families.map(x=>x.id));
  const f={};
  for(const [fixtureId,p] of Object.entries(batch.fixtures||{})){
    const groups={};
    for(const [family,rows] of Object.entries(p.market_probabilities||{})){
      if(!familyIds.has(family))fail('UNKNOWN_MARKET_FAMILY:'+family);
      if(!Array.isArray(rows)||!rows.length)continue;
      groups[family]=rows.map(row=>{
        const code=String(row.code||'');
        const probability=Number(row.probability_pct);
        if(!code||!Number.isFinite(probability)||probability<0||probability>100)fail('INVALID_MARKET_ROW:'+fixtureId+':'+family);
        return [code,Math.round(probability*100)/100];
      });
    }
    f[fixtureId]=groups;
  }
  if(Object.keys(f).length!==38)fail('PROJECTION_FIXTURE_COUNT_INVALID');
  return {v:version,src:sourceHash,n:38,f};
}
function summarize(view){
  const familyCounts={};
  for(const groups of Object.values(view.f)){
    for(const [family,rows] of Object.entries(groups)){
      familyCounts[family]=(familyCounts[family]||0)+rows.length;
    }
  }
  return familyCounts;
}

function main(){
  const input=process.argv[2],outDir=process.argv[3],version=process.argv[4]||'SM001W4';
  if(!input||!outDir)fail('USAGE: node script <raw-evidence.json> <out-dir> [version]');
  fs.mkdirSync(outDir,{recursive:true});
  const {bytes,json:raw}=readJson(input);
  const rawHash=sha256(bytes);
  const evidence=normalizeEvidence(raw,rawHash);
  const batch=projectBatch(evidence);
  if(batch.fixture_count!==38)fail('BATCH_FIXTURE_COUNT_INVALID');

  const evidenceBytes=Buffer.from(JSON.stringify(evidence));
  const batchBytes=Buffer.from(JSON.stringify(batch));
  const view=compactProjection(batch,version,rawHash);
  const viewBytes=Buffer.from(JSON.stringify(view));
  const gz=zlib.gzipSync(viewBytes,{level:9});
  const viewHash=sha256(viewBytes);

  fs.writeFileSync(path.join(outDir,'normalized-evidence.json'),evidenceBytes);
  fs.writeFileSync(path.join(outDir,'projection-batch.json'),batchBytes);
  fs.writeFileSync(path.join(outDir,'projection-web.json'),viewBytes);
  fs.writeFileSync(path.join(outDir,'projection-web.json.gz'),gz);
  fs.writeFileSync(path.join(outDir,'projection-web.b64.txt'),gz.toString('base64'));

  const result={
    version,
    raw_evidence_sha256:rawHash,
    normalized_evidence_sha256:sha256(evidenceBytes),
    projection_batch_sha256:sha256(batchBytes),
    projection_web_sha256:viewHash,
    projection_gzip_sha256:sha256(gz),
    fixture_count:38,
    family_selection_counts:summarize(view),
    generated_at:batch.generated_at,
    output_dir:path.resolve(outDir)
  };
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(result,null,2));
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
if(require.main===module)main();
module.exports={normalizeEvidence,compactProjection};
