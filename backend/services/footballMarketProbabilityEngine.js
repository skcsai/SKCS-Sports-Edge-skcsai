'use strict';

const EPS=1e-9;

function pct(x){return Math.round(x*10000)/100;}
function num(x){const n=Number(x);return Number.isFinite(n)?n:null;}
function normalizeProbability(value){
  const n=num(value);
  if(n===null||n<0)return null;
  if(n<=1+EPS)return n;
  if(n<=100+EPS)return n/100;
  return null;
}
function normalizeCells(cells,homeKey,awayKey,probKey){
  if(!Array.isArray(cells)||cells.length===0)throw new Error('DISTRIBUTION_REQUIRED');
  const out=[];
  let total=0;
  for(const row of cells){
    const a=Number(row?.[homeKey]),b=Number(row?.[awayKey]),p=normalizeProbability(row?.[probKey]);
    if(!Number.isInteger(a)||a<0||!Number.isInteger(b)||b<0||p===null)throw new Error('DISTRIBUTION_CELL_INVALID');
    out.push({a,b,p}); total+=p;
  }
  if(total<=0)throw new Error('DISTRIBUTION_TOTAL_INVALID');
  return out.map(x=>({...x,p:x.p/total}));
}
function distributionFromPairs(pairs){
  if(!Array.isArray(pairs)||pairs.length===0)throw new Error('COUNT_DISTRIBUTION_REQUIRED');
  let total=0;const out=[];
  for(const row of pairs){
    const count=Number(row?.count),p=normalizeProbability(row?.probability);
    if(!Number.isInteger(count)||count<0||p===null)throw new Error('COUNT_DISTRIBUTION_CELL_INVALID');
    out.push({count,p});total+=p;
  }
  if(total<=0)throw new Error('COUNT_DISTRIBUTION_TOTAL_INVALID');
  return out.map(x=>({...x,p:x.p/total}));
}
function lineSettlement(total,line){
  const l=Number(line); if(!Number.isFinite(l)||l<0)throw new Error('LINE_INVALID');
  if(total>l)return 'OVER';
  if(total<l)return 'UNDER';
  return 'PUSH';
}
function overUnderFromCountDistribution(pairs,line){
  const rows=distributionFromPairs(pairs);
  let over=0,under=0,push=0;
  for(const r of rows){
    const s=lineSettlement(r.count,line);
    if(s==='OVER')over+=r.p; else if(s==='UNDER')under+=r.p; else push+=r.p;
  }
  return {over_pct:pct(over),under_pct:pct(under),push_pct:pct(push)};
}
function rangeFromCountDistribution(pairs,min,max){
  const rows=distributionFromPairs(pairs);
  const lo=Number(min),hi=max===Infinity?Infinity:Number(max);
  if(!Number.isInteger(lo)||lo<0||(!(hi===Infinity)&&(!Number.isInteger(hi)||hi<lo)))throw new Error('RANGE_INVALID');
  let inside=0; for(const r of rows)if(r.count>=lo&&r.count<=hi)inside+=r.p;
  return {in_range_pct:pct(inside),outside_range_pct:pct(1-inside)};
}
function exactFromCountDistribution(pairs,count){
  const rows=distributionFromPairs(pairs); const c=Number(count);
  if(!Number.isInteger(c)||c<0)throw new Error('COUNT_INVALID');
  const p=rows.filter(x=>x.count===c).reduce((a,b)=>a+b.p,0);
  return {exact_pct:pct(p),other_pct:pct(1-p)};
}

function projectScoreline(cells,options={}){
  const rows=normalizeCells(cells,'home_goals','away_goals','probability');
  const goalLines=Array.isArray(options.goal_lines)?options.goal_lines:[0.5,1.5,2.5,3.5,4.5,5.5];
  const teamLines=Array.isArray(options.team_goal_lines)?options.team_goal_lines:[0.5,1.5,2.5];
  let home=0,draw=0,away=0,bttsYes=0,homeClean=0,awayClean=0,homeWinNil=0,awayWinNil=0;
  const totalMass=new Map(),homeMass=new Map(),awayMass=new Map(),scoreMass={};
  for(const r of rows){
    if(r.a>r.b)home+=r.p; else if(r.a===r.b)draw+=r.p; else away+=r.p;
    if(r.a>0&&r.b>0)bttsYes+=r.p;
    if(r.b===0)homeClean+=r.p;
    if(r.a===0)awayClean+=r.p;
    if(r.a>r.b&&r.b===0)homeWinNil+=r.p;
    if(r.b>r.a&&r.a===0)awayWinNil+=r.p;
    totalMass.set(r.a+r.b,(totalMass.get(r.a+r.b)||0)+r.p);
    homeMass.set(r.a,(homeMass.get(r.a)||0)+r.p);
    awayMass.set(r.b,(awayMass.get(r.b)||0)+r.p);
    scoreMass[`${r.a}-${r.b}`]=pct(r.p);
  }
  const toPairs=m=>Array.from(m.entries()).map(([count,p])=>({count,probability:p}));
  const totalPairs=toPairs(totalMass),homePairs=toPairs(homeMass),awayPairs=toPairs(awayMass);
  const totals={},teamTotals={HOME:{},AWAY:{}};
  for(const line of goalLines)totals[String(line)]=overUnderFromCountDistribution(totalPairs,line);
  for(const line of teamLines){
    teamTotals.HOME[String(line)]=overUnderFromCountDistribution(homePairs,line);
    teamTotals.AWAY[String(line)]=overUnderFromCountDistribution(awayPairs,line);
  }
  return {
    match_result:{home_pct:pct(home),draw_pct:pct(draw),away_pct:pct(away)},
    double_chance:{one_x_pct:pct(home+draw),one_two_pct:pct(home+away),x_two_pct:pct(draw+away)},
    btts:{yes_pct:pct(bttsYes),no_pct:pct(1-bttsYes)},
    total_goals:totals,
    team_total_goals:teamTotals,
    clean_sheet:{home_yes_pct:pct(homeClean),home_no_pct:pct(1-homeClean),away_yes_pct:pct(awayClean),away_no_pct:pct(1-awayClean)},
    win_to_nil:{home_yes_pct:pct(homeWinNil),home_no_pct:pct(1-homeWinNil),away_yes_pct:pct(awayWinNil),away_no_pct:pct(1-awayWinNil)},
    exact_score:scoreMass,
    exact_total_goals:Object.fromEntries(totalPairs.map(x=>[String(x.count),pct(x.probability)])),
    scoreline_distribution:rows.map(r=>({home_goals:r.a,away_goals:r.b,probability_pct:pct(r.p)})),
    _count_distributions:{total_goals:totalPairs,home_goals:homePairs,away_goals:awayPairs}
  };
}

function projectTwoTeamCountDistribution(cells,options={}){
  const rows=normalizeCells(cells,'home_count','away_count','probability');
  const lines=Array.isArray(options.lines)?options.lines:[6.5,7.5,8.5,9.5,10.5,11.5,12.5];
  const total=new Map(),home=new Map(),away=new Map();
  let homeMost=0,drawMost=0,awayMost=0;
  for(const r of rows){
    total.set(r.a+r.b,(total.get(r.a+r.b)||0)+r.p);
    home.set(r.a,(home.get(r.a)||0)+r.p);
    away.set(r.b,(away.get(r.b)||0)+r.p);
    if(r.a>r.b)homeMost+=r.p; else if(r.a===r.b)drawMost+=r.p; else awayMost+=r.p;
  }
  const pairs=m=>Array.from(m.entries()).map(([count,p])=>({count,probability:p}));
  const totalPairs=pairs(total),homePairs=pairs(home),awayPairs=pairs(away);
  const mk=(p)=>Object.fromEntries(lines.map(line=>[String(line),overUnderFromCountDistribution(p,line)]));
  return {
    total:mk(totalPairs),home:mk(homePairs),away:mk(awayPairs),
    most:{home_pct:pct(homeMost),draw_pct:pct(drawMost),away_pct:pct(awayMost)},
    _count_distributions:{total:totalPairs,home:homePairs,away:awayPairs}
  };
}

function projectBernoulli(probability){
  const p=normalizeProbability(probability); if(p===null)throw new Error('BERNOULLI_PROBABILITY_INVALID');
  return {yes_pct:pct(p),no_pct:pct(1-p)};
}
function projectPlayerCount(pairs,lines){
  const rows=distributionFromPairs(pairs);
  return Object.fromEntries((lines||[0.5,1.5,2.5]).map(line=>[String(line),overUnderFromCountDistribution(rows,line)]));
}
function jointProbabilityFromSamples(samples,predicates){
  if(!Array.isArray(samples)||samples.length===0)throw new Error('JOINT_SAMPLES_REQUIRED');
  if(!Array.isArray(predicates)||predicates.length===0||predicates.some(fn=>typeof fn!=='function'))throw new Error('JOINT_PREDICATES_REQUIRED');
  let totalWeight=0,hitWeight=0;
  for(const sample of samples){
    const w=normalizeProbability(sample?.weight??1);
    if(w===null)throw new Error('JOINT_SAMPLE_WEIGHT_INVALID');
    totalWeight+=w;
    if(predicates.every(fn=>fn(sample)===true))hitWeight+=w;
  }
  if(totalWeight<=0)throw new Error('JOINT_SAMPLE_TOTAL_INVALID');
  const p=hitWeight/totalWeight;
  return {all_legs_pct:pct(p),not_all_legs_pct:pct(1-p)};
}
function assertPercentageVector(values,tolerance=0.03){
  const nums=values.map(Number);
  if(nums.some(x=>!Number.isFinite(x)||x<0||x>100))return false;
  return Math.abs(nums.reduce((a,b)=>a+b,0)-100)<=tolerance;
}

module.exports={
  projectScoreline,
  projectTwoTeamCountDistribution,
  projectBernoulli,
  projectPlayerCount,
  jointProbabilityFromSamples,
  overUnderFromCountDistribution,
  rangeFromCountDistribution,
  exactFromCountDistribution,
  assertPercentageVector
};
