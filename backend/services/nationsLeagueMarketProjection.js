'use strict';

const {
  projectScoreline,
  projectTwoTeamCountDistribution,
  assertPercentageVector
}=require('./footballMarketProbabilityEngine');

const GOAL_MAX=10;
const COUNT_MAX=24;
const MIN_EVENT_SAMPLE=5;

function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function avg(values){
  const xs=values.map(Number).filter(Number.isFinite);
  return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
}
function shrink(mean,n,prior,priorWeight=4){
  const m=finite(mean),p=finite(prior),nn=Number(n);
  if(p===null)return m;
  if(m===null||!Number.isFinite(nn)||nn<=0)return p;
  return ((m*nn)+(p*priorWeight))/(nn+priorWeight);
}
function poissonPmf(k,lambda){
  let p=Math.exp(-lambda);
  for(let i=1;i<=k;i++)p*=lambda/i;
  return p;
}
function independentPoissonGrid(lambdaHome,lambdaAway,max=GOAL_MAX){
  const cells=[];let total=0;
  for(let h=0;h<=max;h++){
    for(let a=0;a<=max;a++){
      const p=poissonPmf(h,lambdaHome)*poissonPmf(a,lambdaAway);
      cells.push({home_goals:h,away_goals:a,probability:p});total+=p;
    }
  }
  return cells.map(x=>({...x,probability:x.probability/total}));
}
function rakeScorelineTo1X2(cells,target){
  const t={HOME:Number(target.home_win)/100,DRAW:Number(target.draw)/100,AWAY:Number(target.away_win)/100};
  if(!assertPercentageVector([Number(target.home_win),Number(target.draw),Number(target.away_win)]))throw new Error('SEALED_1X2_INVALID');
  const mass={HOME:0,DRAW:0,AWAY:0};
  for(const c of cells){
    const key=c.home_goals>c.away_goals?'HOME':c.home_goals===c.away_goals?'DRAW':'AWAY';
    mass[key]+=c.probability;
  }
  if(Object.values(mass).some(x=>x<=0))throw new Error('SCORELINE_CLASS_EMPTY');
  const out=cells.map(c=>{
    const key=c.home_goals>c.away_goals?'HOME':c.home_goals===c.away_goals?'DRAW':'AWAY';
    return {...c,probability:c.probability*(t[key]/mass[key])};
  });
  const sum=out.reduce((a,b)=>a+b.probability,0);
  return out.map(x=>({...x,probability:x.probability/sum}));
}
function teamSeasonRate(team,forAgainst,venue){
  const side=forAgainst==='for'?team?.season_statistics?.goals_for:team?.season_statistics?.goals_against;
  const played=team?.season_statistics?.fixtures?.played?.[venue];
  return {mean:finite(side?.average?.[venue]),n:Number(played)||0};
}
function recentGoalRates(team,teamId){
  const rows=Array.isArray(team?.recent_fixtures)?team.recent_fixtures:[];
  const vals=[];
  for(const f of rows){
    const isHome=Number(f?.home?.id)===Number(teamId),isAway=Number(f?.away?.id)===Number(teamId);
    if(!isHome&&!isAway)continue;
    const gf=finite(isHome?f?.goals?.home:f?.goals?.away);
    const ga=finite(isHome?f?.goals?.away:f?.goals?.home);
    if(gf!==null&&ga!==null)vals.push({gf,ga});
  }
  return {gf:avg(vals.map(x=>x.gf)),ga:avg(vals.map(x=>x.ga)),n:vals.length};
}
function goalPriors(evidence){
  const homeFor=[],awayFor=[];
  for(const team of Object.values(evidence?.teams||{})){
    const h=teamSeasonRate(team,'for','home'),a=teamSeasonRate(team,'for','away');
    if(h.mean!==null&&h.n>0)homeFor.push(...Array(h.n).fill(h.mean));
    if(a.mean!==null&&a.n>0)awayFor.push(...Array(a.n).fill(a.mean));
  }
  return {home:avg(homeFor)||1.45,away:avg(awayFor)||1.15};
}
function h2hGoalRates(target,homeId,awayId){
  const rows=(Array.isArray(target?.team_h2h)?target.team_h2h:[]).filter(f=>finite(f?.goals?.home)!==null&&finite(f?.goals?.away)!==null);
  if(rows.length<3)return null;
  const homeGoals=[],awayGoals=[];
  for(const f of rows){
    if(Number(f.home?.id)===Number(homeId)){homeGoals.push(Number(f.goals.home));awayGoals.push(Number(f.goals.away));}
    else if(Number(f.away?.id)===Number(homeId)){homeGoals.push(Number(f.goals.away));awayGoals.push(Number(f.goals.home));}
  }
  return homeGoals.length>=3?{home:avg(homeGoals),away:avg(awayGoals),n:homeGoals.length}:null;
}
function goalAnchors(evidence,target){
  const homeId=Number(target.teams.home.id),awayId=Number(target.teams.away.id);
  const ht=evidence.teams?.[homeId]||evidence.teams?.[String(homeId)];
  const at=evidence.teams?.[awayId]||evidence.teams?.[String(awayId)];
  if(!ht||!at)throw new Error('TEAM_EVIDENCE_MISSING');
  const prior=goalPriors(evidence),overall=(prior.home+prior.away)/2;
  const homeAttack=teamSeasonRate(ht,'for','home'),awayDef=teamSeasonRate(at,'against','away');
  const awayAttack=teamSeasonRate(at,'for','away'),homeDef=teamSeasonRate(ht,'against','home');
  const hr=recentGoalRates(ht,homeId),ar=recentGoalRates(at,awayId);
  const seasonHome=Math.sqrt(
    Math.max(.05,shrink(homeAttack.mean,homeAttack.n,prior.home,3))*
    Math.max(.05,shrink(awayDef.mean,awayDef.n,prior.home,3))
  );
  const seasonAway=Math.sqrt(
    Math.max(.05,shrink(awayAttack.mean,awayAttack.n,prior.away,3))*
    Math.max(.05,shrink(homeDef.mean,homeDef.n,prior.away,3))
  );
  const recentHome=Math.sqrt(
    Math.max(.05,shrink(hr.gf,hr.n,overall,5))*
    Math.max(.05,shrink(ar.ga,ar.n,overall,5))
  );
  const recentAway=Math.sqrt(
    Math.max(.05,shrink(ar.gf,ar.n,overall,5))*
    Math.max(.05,shrink(hr.ga,hr.n,overall,5))
  );
  let home=.7*seasonHome+.3*recentHome,away=.7*seasonAway+.3*recentAway;
  const h2h=h2hGoalRates(target,homeId,awayId);
  if(h2h){
    home=.85*home+.15*shrink(h2h.home,h2h.n,home,6);
    away=.85*away+.15*shrink(h2h.away,h2h.n,away,6);
  }
  return {home:clamp(home,.15,4.5),away:clamp(away,.15,4.5),prior,h2h_used:Boolean(h2h),recent_samples:{home:hr.n,away:ar.n}};
}
function statNumber(value){
  if(typeof value==='string'&&value.trim().endsWith('%'))return finite(value.trim().slice(0,-1));
  return finite(value);
}
function fixtureTeamStats(evidence,fixtureId,teamId){
  const rows=evidence?.fixture_statistics?.[fixtureId]||evidence?.fixture_statistics?.[String(fixtureId)]||[];
  return rows.find(x=>Number(x.team_id)===Number(teamId))||null;
}
function eventHistory(evidence,teamId,key){
  const team=evidence.teams?.[teamId]||evidence.teams?.[String(teamId)];
  const rows=[];
  for(const f of Array.isArray(team?.recent_fixtures)?team.recent_fixtures:[]){
    const mine=fixtureTeamStats(evidence,f.fixture_id,teamId);
    const oppId=Number(f.home?.id)===Number(teamId)?Number(f.away?.id):Number(f.home?.id);
    const opp=fixtureTeamStats(evidence,f.fixture_id,oppId);
    const own=statNumber(mine?.statistics?.[key]),against=statNumber(opp?.statistics?.[key]);
    if(own!==null&&against!==null)rows.push({for:own,against});
  }
  return rows;
}
function eventPrior(evidence,key){
  const seen=new Set(),vals=[];
  for(const [fid,teams] of Object.entries(evidence?.fixture_statistics||{})){
    if(seen.has(fid))continue;seen.add(fid);
    for(const row of Array.isArray(teams)?teams:[]){
      const v=statNumber(row?.statistics?.[key]);if(v!==null)vals.push(v);
    }
  }
  return avg(vals);
}
function eventLambdas(evidence,target,key){
  const homeId=Number(target.teams.home.id),awayId=Number(target.teams.away.id);
  const h=eventHistory(evidence,homeId,key),a=eventHistory(evidence,awayId,key);
  if(h.length<MIN_EVENT_SAMPLE||a.length<MIN_EVENT_SAMPLE)return null;
  const prior=eventPrior(evidence,key);if(prior===null)return null;
  const hf=shrink(avg(h.map(x=>x.for)),h.length,prior,5);
  const ha=shrink(avg(h.map(x=>x.against)),h.length,prior,5);
  const af=shrink(avg(a.map(x=>x.for)),a.length,prior,5);
  const aa=shrink(avg(a.map(x=>x.against)),a.length,prior,5);
  return {
    home:clamp(Math.sqrt(Math.max(.02,hf)*Math.max(.02,aa)),.02,20),
    away:clamp(Math.sqrt(Math.max(.02,af)*Math.max(.02,ha)),.02,20),
    samples:{home:h.length,away:a.length},prior
  };
}
function independentCountGrid(lambdaHome,lambdaAway,max=COUNT_MAX){
  const cells=[];let total=0;
  for(let h=0;h<=max;h++)for(let a=0;a<=max;a++){
    const p=poissonPmf(h,lambdaHome)*poissonPmf(a,lambdaAway);
    cells.push({home_count:h,away_count:a,probability:p});total+=p;
  }
  return cells.map(x=>({...x,probability:x.probability/total}));
}
function eventPct(scoreCells,predicate){
  return Math.round(scoreCells.filter(predicate).reduce((a,b)=>a+b.probability,0)*10000)/100;
}
function addSelection(map,family,code,label,p,evidenceNote){
  if(!Number.isFinite(Number(p)))return;
  if(!map[family])map[family]=[];
  map[family].push({code,label,probability_pct:Math.round(Number(p)*100)/100,evidence_note:evidenceNote});
}
function buildScorelineMarkets(target,scoreCells,projection){
  const out={};
  const note='Pre-match scoreline model calibrated to the sealed 1X2 distribution; goal-history evidence determines the within-result scoreline shape.';
  for(const [line,v] of Object.entries(projection.total_goals)){
    addSelection(out,'total_goals','O'+line,'Over '+line+' goals',v.over_pct,note);
    addSelection(out,'total_goals','U'+line,'Under '+line+' goals',v.under_pct,note);
  }
  for(const side of ['HOME','AWAY'])for(const [line,v] of Object.entries(projection.team_total_goals[side])){
    addSelection(out,'team_total_goals',side+'_O'+line,(side==='HOME'?target.teams.home.name:target.teams.away.name)+' over '+line+' goals',v.over_pct,note);
    addSelection(out,'team_total_goals',side+'_U'+line,(side==='HOME'?target.teams.home.name:target.teams.away.name)+' under '+line+' goals',v.under_pct,note);
  }
  addSelection(out,'btts','YES','Both teams to score – Yes',projection.btts.yes_pct,note);
  addSelection(out,'btts','NO','Both teams to score – No',projection.btts.no_pct,note);
  addSelection(out,'clean_sheet','HOME_YES',target.teams.home.name+' clean sheet',projection.clean_sheet.home_yes_pct,note);
  addSelection(out,'clean_sheet','AWAY_YES',target.teams.away.name+' clean sheet',projection.clean_sheet.away_yes_pct,note);
  addSelection(out,'win_to_nil','HOME_YES',target.teams.home.name+' win to nil',projection.win_to_nil.home_yes_pct,note);
  addSelection(out,'win_to_nil','AWAY_YES',target.teams.away.name+' win to nil',projection.win_to_nil.away_yes_pct,note);
  addSelection(out,'team_to_score','HOME_YES',target.teams.home.name+' to score',100-projection.clean_sheet.away_yes_pct,note);
  addSelection(out,'team_to_score','AWAY_YES',target.teams.away.name+' to score',100-projection.clean_sheet.home_yes_pct,note);
  const scores=Object.entries(projection.exact_score).sort((a,b)=>b[1]-a[1]).slice(0,8);
  for(const [score,p] of scores)addSelection(out,'correct_score',score,score,p,note);
  const totalEntries=Object.entries(projection.exact_total_goals).sort((a,b)=>Number(a[0])-Number(b[0]));
  for(const [goals,p] of totalEntries.filter(([g])=>Number(g)<=6))addSelection(out,'exact_total_goals',goals,goals+' total goals',p,note);
  const ranges=[[0,1],[2,3],[4,5],[6,10]];
  for(const [lo,hi] of ranges){
    const p=eventPct(scoreCells,c=>{const t=c.home_goals+c.away_goals;return t>=lo&&t<=hi;});
    addSelection(out,'goal_range',lo+'-'+hi,lo+'–'+(hi===10?'6+':hi)+' goals',p,note);
  }
  const target1=target.sealed_1x2;
  addSelection(out,'draw_no_bet','HOME_WIN',target.teams.home.name+' DNB – win',target1.home_win,'Draw '+target1.draw.toFixed(2)+'% is the push/refund state.');
  addSelection(out,'draw_no_bet','AWAY_WIN',target.teams.away.name+' DNB – win',target1.away_win,'Draw '+target1.draw.toFixed(2)+'% is the push/refund state.');

  const resultPred={
    HOME:c=>c.home_goals>c.away_goals,
    DRAW:c=>c.home_goals===c.away_goals,
    AWAY:c=>c.away_goals>c.home_goals
  };
  const resultLabel={HOME:target.teams.home.name+' win',DRAW:'Draw',AWAY:target.teams.away.name+' win'};
  for(const [res,rp] of Object.entries(resultPred)){
    for(const line of [1.5,2.5,3.5]){
      addSelection(out,'same_match_builder',res+'_O'+line,resultLabel[res]+' + Over '+line,eventPct(scoreCells,c=>rp(c)&&(c.home_goals+c.away_goals)>line),note);
      addSelection(out,'same_match_builder',res+'_U'+line,resultLabel[res]+' + Under '+line,eventPct(scoreCells,c=>rp(c)&&(c.home_goals+c.away_goals)<line),note);
    }
    addSelection(out,'same_match_builder',res+'_BTTS_YES',resultLabel[res]+' + BTTS Yes',eventPct(scoreCells,c=>rp(c)&&c.home_goals>0&&c.away_goals>0),note);
    addSelection(out,'same_match_builder',res+'_BTTS_NO',resultLabel[res]+' + BTTS No',eventPct(scoreCells,c=>rp(c)&&!(c.home_goals>0&&c.away_goals>0)),note);
  }
  for(const line of [1.5,2.5,3.5]){
    addSelection(out,'same_match_builder','BTTS_YES_O'+line,'BTTS Yes + Over '+line,eventPct(scoreCells,c=>c.home_goals>0&&c.away_goals>0&&(c.home_goals+c.away_goals)>line),note);
    addSelection(out,'same_match_builder','BTTS_NO_U'+line,'BTTS No + Under '+line,eventPct(scoreCells,c=>!(c.home_goals>0&&c.away_goals>0)&&(c.home_goals+c.away_goals)<line),note);
  }
  const dc={
    '1X':c=>c.home_goals>=c.away_goals,
    '12':c=>c.home_goals!==c.away_goals,
    'X2':c=>c.away_goals>=c.home_goals
  };
  for(const [d,dp] of Object.entries(dc)){
    for(const line of [1.5,2.5,3.5]){
      addSelection(out,'double_chance_combination',d+'_O'+line,d+' + Over '+line,eventPct(scoreCells,c=>dp(c)&&(c.home_goals+c.away_goals)>line),note);
      addSelection(out,'double_chance_combination',d+'_U'+line,d+' + Under '+line,eventPct(scoreCells,c=>dp(c)&&(c.home_goals+c.away_goals)<line),note);
    }
    addSelection(out,'double_chance_combination',d+'_BTTS_YES',d+' + BTTS Yes',eventPct(scoreCells,c=>dp(c)&&c.home_goals>0&&c.away_goals>0),note);
    addSelection(out,'double_chance_combination',d+'_BTTS_NO',d+' + BTTS No',eventPct(scoreCells,c=>dp(c)&&!(c.home_goals>0&&c.away_goals>0)),note);
  }
  return out;
}
function mergeFamilies(a,b){const out={...a};for(const [k,v] of Object.entries(b||{}))out[k]=[...(out[k]||[]),...v];return out;}
function buildCountMarkets(evidence,target,key,families,lines){
  const l=eventLambdas(evidence,target,key);if(!l)return {markets:{},model:null};
  const grid=independentCountGrid(l.home,l.away);
  const p=projectTwoTeamCountDistribution(grid,{lines});
  const out={},note='Pre-match '+key.replace(/_/g,' ')+' count model from recent team for/against histories; test-only and uncalibrated.';
  for(const [line,v] of Object.entries(p.total)){
    addSelection(out,families.total,'O'+line,'Over '+line,v.over_pct,note);
    addSelection(out,families.total,'U'+line,'Under '+line,v.under_pct,note);
  }
  for(const side of ['home','away'])for(const [line,v] of Object.entries(p[side])){
    const team=side==='home'?target.teams.home.name:target.teams.away.name;
    addSelection(out,families.team,side.toUpperCase()+'_O'+line,team+' over '+line,v.over_pct,note);
    addSelection(out,families.team,side.toUpperCase()+'_U'+line,team+' under '+line,v.under_pct,note);
  }
  addSelection(out,families.most,'HOME',target.teams.home.name+' most',p.most.home_pct,note);
  addSelection(out,families.most,'DRAW','Equal',p.most.draw_pct,note);
  addSelection(out,families.most,'AWAY',target.teams.away.name+' most',p.most.away_pct,note);
  return {markets:out,model:l};
}
function projectFixture(evidence,fixtureId){
  if(evidence?.schema_version!=='soccer-markets-001-nations-league-evidence-v1')throw new Error('MARKET_EVIDENCE_SCHEMA_INVALID');
  const target=evidence.targets?.[fixtureId];if(!target)throw new Error('TARGET_FIXTURE_MISSING');
  const anchors=goalAnchors(evidence,target);
  const base=independentPoissonGrid(anchors.home,anchors.away);
  const scoreCells=rakeScorelineTo1X2(base,target.sealed_1x2);
  const projection=projectScoreline(scoreCells,{goal_lines:[0.5,1.5,2.5,3.5,4.5,5.5],team_goal_lines:[0.5,1.5,2.5,3.5]});
  let markets=buildScorelineMarkets(target,scoreCells,projection);
  const corners=buildCountMarkets(evidence,target,'corner_kicks',
    {total:'corners_total',team:'corners_team',most:'corners_most'},[6.5,7.5,8.5,9.5,10.5,11.5,12.5]);
  const cards=buildCountMarkets(evidence,target,'yellow_cards',
    {total:'cards_total',team:'cards_team',most:'cards_most'},[1.5,2.5,3.5,4.5,5.5,6.5]);
  markets=mergeFamilies(markets,corners.markets);
  markets=mergeFamilies(markets,cards.markets);
  return {
    fixture_id:fixtureId,
    kickoff_at:target.kickoff_at,
    model:{
      scoreline:{method:'POISSON_HISTORY_PLUS_1X2_RAKING',lambda_home:anchors.home,lambda_away:anchors.away,h2h_used:anchors.h2h_used,recent_samples:anchors.recent_samples},
      corners:corners.model?{method:'TEAM_FOR_AGAINST_POISSON',...corners.model}:null,
      cards:cards.model?{method:'TEAM_FOR_AGAINST_POISSON',...cards.model}:null
    },
    market_probabilities:markets,
    unavailable_families:[
      'player_goal','player_assist','player_shots','player_shots_on_target','player_passes',
      'player_tackles','player_fouls','player_card','goalkeeper_saves','penalty_awarded',
      'red_card','booking_points','handicap_asian','handicap_european','half_result',
      'half_total_goals','half_btts','team_win_either_half','team_to_score_first'
    ],
    evidence_note:'Test-only uncalibrated market projection. Player/referee/weather-dependent families remain fail-closed until their governed inputs are available.'
  };
}
function projectBatch(evidence){
  const fixtures={};
  for(const id of Object.keys(evidence?.targets||{}))fixtures[id]=projectFixture(evidence,id);
  return {
    schema_version:'soccer-markets-001-projection-v1',
    project_id:'SOCCER-MARKETS-001',
    generated_at:new Date().toISOString(),
    source_evidence_sha256:evidence.evidence_sha256||null,
    fixture_count:Object.keys(fixtures).length,
    test_only:true,
    uncalibrated:true,
    fixtures
  };
}

module.exports={
  goalAnchors,eventHistory,eventLambdas,independentPoissonGrid,rakeScorelineTo1X2,
  buildScorelineMarkets,projectFixture,projectBatch
};
