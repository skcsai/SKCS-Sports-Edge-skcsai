'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {projectBatch}=require('../backend/services/nationsLeagueMarketProjection');
const {families}=require('../backend/config/footballMarketRegistry');
const {buildSameMatchOffers}=require('../backend/services/sameMatchOfferEngine');

function fail(message){throw new Error(message);}
function sha256(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function finite(v){
  if(v===null||v===undefined||v==='')return null;
  const n=Number(typeof v==='string'?v.replace('%',''):v);
  return Number.isFinite(n)?n:null;
}
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

function normalizePlayerEventEvidence(playerRaw){
  if(playerRaw?.schema_version!=='soccer-markets-001-private-player-event-evidence-v1'){
    fail('PLAYER_EVENT_EVIDENCE_SCHEMA_INVALID');
  }
  const fixtureEvents={};
  for(const [fixtureId,rows] of Object.entries(playerRaw.fixture_events||{})){
    fixtureEvents[String(fixtureId)]=arr(rows).map(e=>({
      elapsed:finite(e.elapsed),extra:finite(e.extra),
      team_id:finite(e.team_id),player_id:finite(e.player_id),player:String(e.player||''),
      assist_id:finite(e.assist_id),assist:String(e.assist||''),
      type:String(e.type||''),detail:String(e.detail||''),comments:e.comments==null?null:String(e.comments)
    }));
  }
  const fixturePlayers={};
  for(const [fixtureId,rows] of Object.entries(playerRaw.fixture_players||{})){
    fixturePlayers[String(fixtureId)]=arr(rows).map(p=>({
      team_id:finite(p.team_id),team:String(p.team||''),player_id:finite(p.player_id),player:String(p.player||''),
      minutes:finite(p.minutes),position:String(p.position||''),rating:finite(p.rating),substitute:p.substitute===true,
      shots_total:finite(p.shots_total),shots_on:finite(p.shots_on),
      goals:finite(p.goals),assists:finite(p.assists),saves:finite(p.saves),
      passes_total:finite(p.passes_total),key_passes:finite(p.key_passes),pass_accuracy:finite(p.pass_accuracy),
      tackles_total:finite(p.tackles_total),blocks:finite(p.blocks),interceptions:finite(p.interceptions),
      duels_total:finite(p.duels_total),duels_won:finite(p.duels_won),
      dribbles_attempts:finite(p.dribbles_attempts),dribbles_success:finite(p.dribbles_success),dribbles_past:finite(p.dribbles_past),
      fouls_drawn:finite(p.fouls_drawn),fouls_committed:finite(p.fouls_committed),
      yellow:finite(p.yellow),red:finite(p.red),
      penalty_won:finite(p.penalty_won),penalty_committed:finite(p.penalty_committed),
      penalty_scored:finite(p.penalty_scored),penalty_missed:finite(p.penalty_missed),penalty_saved:finite(p.penalty_saved)
    }));
  }
  return {fixture_events:fixtureEvents,fixture_players:fixturePlayers};
}

function normalizeEvidence(raw,rawHash,playerRaw,playerHash){
  if(raw?.schema_version!=='soccer-markets-001-private-evidence-v1')fail('RAW_EVIDENCE_SCHEMA_INVALID');
  const targets=arr(raw.targets);
  if(targets.length!==38)fail('TARGET_COUNT_INVALID');
  const earliestKickoff=Math.min(...targets.map(t=>Date.parse(t.kickoff)).filter(Number.isFinite));
  if(!Number.isFinite(earliestKickoff))fail('EARLIEST_KICKOFF_INVALID');
  if(Date.now()>=earliestKickoff-60000)fail('PREMATCH_BATCH_CUTOFF_FAILED');
  if(Number.isFinite(Date.parse(raw.collected_at))&&Date.parse(raw.collected_at)>=earliestKickoff-60000)fail('RAW_EVIDENCE_COLLECTED_TOO_LATE');
  if(Number.isFinite(Date.parse(playerRaw.collected_at))&&Date.parse(playerRaw.collected_at)>=earliestKickoff-60000)fail('PLAYER_EVENT_EVIDENCE_COLLECTED_TOO_LATE');

  const teams={};
  for(const [id,team] of Object.entries(raw.teams||{})){
    const recent=arr(team?.recent).filter(f=>String(f?.status)==='FT').map(normalizeFixture);
    teams[id]={
      season_statistics:{
        fixtures:{played:team?.league?.played||{}},
        goals_for:{average:team?.league?.gf_avg||{}},
        goals_against:{average:team?.league?.ga_avg||{}}
      },
      recent_fixtures:recent
    };
  }
  const fixtureStatistics={};
  for(const [fixtureId,rows] of Object.entries(raw.fixture_stats||{})){
    fixtureStatistics[fixtureId]=arr(rows).map(r=>({
      team_id:Number(r.team_id),team:String(r.team||''),
      statistics:{
        corner_kicks:finite(r.corners),yellow_cards:finite(r.yellow),red_cards:finite(r.red),
        fouls:finite(r.fouls),total_shots:finite(r.shots),shots_on_goal:finite(r.sot),
        ball_possession:finite(r.possession)
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
      fixture_id:id,provider_fixture_id:Number(t.fixture_id),kickoff_at:String(t.kickoff),
      teams:{home:{id:Number(t.home_id),name:String(t.home)},away:{id:Number(t.away_id),name:String(t.away)}},
      sealed_1x2:{home_win:Number(t.home_pct),draw:Number(t.draw_pct),away_win:Number(t.away_pct)},
      team_h2h:h2h
    };
  }
  const player=normalizePlayerEventEvidence(playerRaw);
  const combinedHash=sha256(Buffer.from(JSON.stringify({
    market_evidence_sha256:rawHash,
    player_event_evidence_sha256:playerHash
  })));
  return {
    schema_version:'soccer-markets-001-nations-league-evidence-v3',
    evidence_sha256:combinedHash,
    source_components:{market_evidence_sha256:rawHash,player_event_evidence_sha256:playerHash},
    collected_at:String(playerRaw.collected_at||raw.collected_at||''),
    source_class:'PRIVATE_API_SPORTS_PREMATCH_EVIDENCE',
    test_only:true,fixture_count:38,
    teams,fixture_statistics:fixtureStatistics,
    fixture_events:player.fixture_events,fixture_players:player.fixture_players,
    targets:outTargets
  };
}

function compactProjection(batch,version,sourceHash,evidence){
  const familyIds=new Set(families.map(x=>x.id));
  const f={},s={};
  for(const [fixtureId,p] of Object.entries(batch.fixtures||{})){
    const groups={};
    for(const [family,rows] of Object.entries(p.market_probabilities||{})){
      if(!familyIds.has(family))fail('UNKNOWN_MARKET_FAMILY:'+family);
      if(!Array.isArray(rows)||!rows.length)continue;
      groups[family]=rows.map(row=>{
        const code=String(row.code||'');
        const probability=Number(row.probability_pct);
        const label=String(row.label||code).slice(0,180);
        if(!code||code.length>100||!Number.isFinite(probability)||probability<0||probability>100){
          fail('INVALID_MARKET_ROW:'+fixtureId+':'+family);
        }
        return [code,Math.round(probability*100)/100,label];
      });
    }
    f[fixtureId]=groups;

    const target=evidence?.targets?.[fixtureId];
    if(!target)fail('SMB_TARGET_MISSING:'+fixtureId);
    const goalDiff=Number(p?.model?.scoreline?.lambda_home)-Number(p?.model?.scoreline?.lambda_away);
    const offers=buildSameMatchOffers({
      market_probabilities:p.market_probabilities,
      probabilities_pct:target.sealed_1x2,
      fixture:{home_team:target.teams.home.name,away_team:target.teams.away.name},
      goal_diff:Number.isFinite(goalDiff)?goalDiff:null,
      h2h_matches:Array.isArray(target.team_h2h)?target.team_h2h.length:0
    });
    s[fixtureId]=offers;
  }
  if(Object.keys(f).length!==38||Object.keys(s).length!==38)fail('PROJECTION_FIXTURE_COUNT_INVALID');
  return {v:version,src:sourceHash,n:38,at:batch.generated_at,f,s};
}
function summarize(view){
  const familyCounts={};
  for(const groups of Object.values(view.f)){
    for(const [family,rows] of Object.entries(groups))familyCounts[family]=(familyCounts[family]||0)+rows.length;
  }
  return familyCounts;
}

function main(){
  const input=process.argv[2],outDir=process.argv[3],version=process.argv[4]||'SM001W7',playerInput=process.argv[5];
  if(!input||!outDir||!playerInput){
    fail('USAGE: node script <raw-evidence.json> <out-dir> [version] <player-event-evidence.json>');
  }
  fs.mkdirSync(outDir,{recursive:true});
  const {bytes:rawBytes,json:raw}=readJson(input);
  const {bytes:playerBytes,json:playerRaw}=readJson(playerInput);
  const rawHash=sha256(rawBytes),playerHash=sha256(playerBytes);
  const evidence=normalizeEvidence(raw,rawHash,playerRaw,playerHash);
  const batch=projectBatch(evidence);
  if(batch.fixture_count!==38)fail('BATCH_FIXTURE_COUNT_INVALID');

  const evidenceBytes=Buffer.from(JSON.stringify(evidence));
  const batchBytes=Buffer.from(JSON.stringify(batch));
  const view=compactProjection(batch,version,evidence.evidence_sha256,evidence);
  const viewBytes=Buffer.from(JSON.stringify(view));
  const gz=zlib.gzipSync(viewBytes,{level:9});

  fs.writeFileSync(path.join(outDir,'normalized-evidence.json'),evidenceBytes);
  fs.writeFileSync(path.join(outDir,'projection-batch.json'),batchBytes);
  fs.writeFileSync(path.join(outDir,'projection-web.json'),viewBytes);
  fs.writeFileSync(path.join(outDir,'projection-web.json.gz'),gz);
  fs.writeFileSync(path.join(outDir,'projection-web.b64.txt'),gz.toString('base64'));

  const result={
    version,
    market_evidence_sha256:rawHash,
    player_event_evidence_sha256:playerHash,
    combined_source_sha256:evidence.evidence_sha256,
    normalized_evidence_sha256:sha256(evidenceBytes),
    projection_batch_sha256:sha256(batchBytes),
    projection_web_sha256:sha256(viewBytes),
    projection_gzip_sha256:sha256(gz),
    projection_web_bytes:viewBytes.length,
    fixture_count:38,
    family_selection_counts:summarize(view),
    generated_at:batch.generated_at,
    output_dir:path.resolve(outDir)
  };
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(result,null,2));
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
if(require.main===module)main();
module.exports={normalizeEvidence,normalizePlayerEventEvidence,compactProjection};