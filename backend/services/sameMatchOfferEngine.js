'use strict';

const crypto=require('node:crypto');

const TIERS=Object.freeze({
  TIER_1:{id:'TIER_1',label:'Statistical Edge',leg_count:4},
  TIER_2:{id:'TIER_2',label:'Speculative Edge',leg_count:6},
  TIER_3:{id:'TIER_3',label:'High-Variance Play',leg_count:8}
});
const TIER_BY_SIZE=Object.freeze({4:TIERS.TIER_1,6:TIERS.TIER_2,8:TIERS.TIER_3});
const LEG_SIZES=[4,6,8];
const PLAYER_FAMILIES=new Set(['player_goal','player_assist','player_shots','player_shots_on_target','player_passes','player_tackles','player_fouls','player_card','goalkeeper_saves']);
const MIN_LEG_PROBABILITY=50;
const MIN_JOINT_PROBABILITY=8;
const MAX_POOL=80;
const MAX_ALTERNATIVES_PER_GROUP=4;
const BEAM_WIDTH=700;
const FINALISTS_PER_SIZE=36;
const COPULA_SAMPLES=4096;

function clamp(n,lo,hi){return Math.max(lo,Math.min(hi,n));}
function pct(n){return Math.round(Number(n)*100)/100;}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function normalizeCode(v){return String(v||'').trim().toUpperCase();}
function hash32(value){
  const h=crypto.createHash('sha256').update(String(value)).digest();
  return h.readUInt32LE(0) || 1;
}
function xorshift32(seed){
  let x=seed>>>0;
  return function(){
    x^=x<<13;x^=x>>>17;x^=x<<5;
    return ((x>>>0)+0.5)/4294967296;
  };
}
function normalPair(rng){
  const u1=Math.max(1e-12,rng());
  const u2=rng();
  const r=Math.sqrt(-2*Math.log(u1));
  const t=2*Math.PI*u2;
  return [r*Math.cos(t),r*Math.sin(t)];
}

// Acklam inverse-normal approximation.
function invNorm(p){
  p=clamp(Number(p),1e-10,1-1e-10);
  const a=[-3.969683028665376e+01,2.209460984245205e+02,-2.759285104469687e+02,1.383577518672690e+02,-3.066479806614716e+01,2.506628277459239e+00];
  const b=[-5.447609879822406e+01,1.615858368580409e+02,-1.556989798598866e+02,6.680131188771972e+01,-1.328068155288572e+01];
  const c=[-7.784894002430293e-03,-3.223964580411365e-01,-2.400758277161838e+00,-2.549732539343734e+00,4.374664141464968e+00,2.938163982698783e+00];
  const d=[7.784695709041462e-03,3.224671290700398e-01,2.445134137142996e+00,3.754408661907416e+00];
  const plow=.02425,phigh=1-plow;
  let q,r;
  if(p<plow){
    q=Math.sqrt(-2*Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if(p>phigh){
    q=Math.sqrt(-2*Math.log(1-p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  q=p-.5;r=q*q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}
function cholesky(matrix){
  const n=matrix.length,L=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++){
    for(let j=0;j<=i;j++){
      let sum=matrix[i][j];
      for(let k=0;k<j;k++)sum-=L[i][k]*L[j][k];
      if(i===j){
        if(sum<=1e-9)return null;
        L[i][j]=Math.sqrt(sum);
      }else L[i][j]=sum/L[j][j];
    }
  }
  return L;
}
function safeCorrelationMatrix(legs,context){
  const n=legs.length;
  let scale=1;
  for(let attempt=0;attempt<8;attempt++){
    const m=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:pairCorrelation(legs[i],legs[j],context)*scale));
    const L=cholesky(m);
    if(L)return {matrix:m,L};
    scale*=.78;
  }
  return {matrix:Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0)),L:Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0))};
}
function teamSideFromLabel(label,fixture){
  const s=String(label||'').toLowerCase();
  const h=String(fixture?.home_team||fixture?.home||'').toLowerCase();
  const a=String(fixture?.away_team||fixture?.away||'').toLowerCase();
  if(h&&s.includes(h))return 'HOME';
  if(a&&s.includes(a))return 'AWAY';
  if(/\bhome\b/.test(s))return 'HOME';
  if(/\baway\b/.test(s))return 'AWAY';
  return null;
}
function playerKey(code){
  const m=String(code||'').match(/^P([0-9]+)_/i);
  return m?m[1]:null;
}
function metadata(family,code,label,fixture){
  const f=String(family||'');
  const c=normalizeCode(code);
  const l=String(label||'');
  const side=teamSideFromLabel(l,fixture);
  let process='other',direction='neutral',line=null;
  if(f==='match_result_1x2'||f==='double_chance_standard'){process='result';direction=c;}
  else if(['total_goals','team_total_goals','btts','clean_sheet','win_to_nil','team_to_score','goal_range','handicap_european','handicap_asian','winning_margin'].includes(f))process='goals';
  else if(['half_result','half_total_goals','half_btts','team_win_either_half'].includes(f))process='half';
  else if(f.startsWith('corners_'))process='corners';
  else if(['cards_total','cards_team','cards_most','red_card','booking_points','player_card'].includes(f))process='cards';
  else if(f==='penalty_awarded')process='penalty';
  else if(['player_goal','player_assist','player_shots','player_shots_on_target'].includes(f))process='player_attack';
  else if(['player_passes','player_tackles','player_fouls'].includes(f))process='player_control';
  else if(f==='goalkeeper_saves')process='keeper';
  const ou=c.match(/_?([OU])([0-9]+(?:[.][0-9]+)?)$/);
  if(ou){direction=ou[1]==='O'?'OVER':'UNDER';line=Number(ou[2]);}
  if(/BTTS.*YES|^YES$/.test(c)&&f==='btts')direction='YES';
  if(/BTTS.*NO|^NO$/.test(c)&&f==='btts')direction='NO';
  if(f==='red_card'||f==='penalty_awarded'||f==='player_card'){
    if(c.endsWith('_YES')||c==='YES')direction='YES';
    if(c.endsWith('_NO')||c==='NO')direction='NO';
  }
  return {family:f,code:c,label:l,side,process,direction,line,player:playerKey(c)};
}
function favoriteInfo(probabilities,fixture){
  const home=finite(probabilities?.home_win??probabilities?.home_pct);
  const draw=finite(probabilities?.draw??probabilities?.draw_pct);
  const away=finite(probabilities?.away_win??probabilities?.away_pct);
  if(![home,draw,away].every(Number.isFinite))return null;
  const rows=[
    {code:'HOME',label:(fixture?.home_team||fixture?.home||'Home')+' win',probability_pct:home,side:'HOME'},
    {code:'DRAW',label:'Draw',probability_pct:draw,side:null},
    {code:'AWAY',label:(fixture?.away_team||fixture?.away||'Away')+' win',probability_pct:away,side:'AWAY'}
  ].sort((a,b)=>b.probability_pct-a.probability_pct);
  return {favorite:rows[0],all:rows};
}
function maxLegsAllowed(probabilities,goalDiff=null,fixture=null){
  const f=favoriteInfo(probabilities,fixture);
  if(!f)return 2;
  const p=f.favorite.probability_pct;
  const gd=finite(goalDiff);
  if(p>80||(gd!==null&&Math.abs(gd)>4))return 8;
  if(p>=65||(gd!==null&&Math.abs(gd)>=2.5))return 6;
  if(p>=50||(gd!==null&&Math.abs(gd)>=1))return 4;
  return 2;
}
function tierForSize(size){return TIER_BY_SIZE[Number(size)]||null;}
function selectionGroup(leg){
  const m=leg.meta;
  if(m.player)return m.family+':P'+m.player;
  if(m.family==='team_total_goals'||m.family==='corners_team'||m.family==='cards_team')return m.family+':'+(m.side||'MATCH');
  return m.family;
}
function goalConstraint(leg){
  const m=leg.meta;
  const c=m.code;
  if(m.family==='total_goals'&&m.line!==null)return m.direction==='OVER'?{min:Math.floor(m.line)+1,max:Infinity}:{min:0,max:Math.ceil(m.line)-1};
  if(m.family==='goal_range'){
    const z=c.match(/^([0-9]+)-([0-9]+)$/);if(z)return {min:Number(z[1]),max:Number(z[2])};
    const p=c.match(/^([0-9]+)[+]$/);if(p)return {min:Number(p[1]),max:Infinity};
  }
  if(m.family==='exact_total_goals'&&/^[0-9]+$/.test(c))return {min:Number(c),max:Number(c)};
  if(m.family==='correct_score'){
    const z=c.match(/^([0-9]+)-([0-9]+)$/);if(z){const t=Number(z[1])+Number(z[2]);return {min:t,max:t};}
  }
  return null;
}
function contradictory(a,b,fixture){
  if(selectionGroup(a)===selectionGroup(b))return true;
  const A=a.meta,B=b.meta;
  const ga=goalConstraint(a),gb=goalConstraint(b);
  if(ga&&gb&&Math.max(ga.min,gb.min)>Math.min(ga.max,gb.max))return true;
  if(A.family==='btts'&&B.family==='clean_sheet'||B.family==='btts'&&A.family==='clean_sheet'){
    const x=A.family==='btts'?A:B; if(x.direction==='YES')return true;
  }
  if(A.family==='btts'&&B.family==='win_to_nil'||B.family==='btts'&&A.family==='win_to_nil'){
    const x=A.family==='btts'?A:B; if(x.direction==='YES')return true;
  }
  const result=A.family==='match_result_1x2'?A:(B.family==='match_result_1x2'?B:null);
  const other=result===A?B:A;
  if(result){
    if(result.code==='HOME'&&other.family==='clean_sheet'&&other.side==='AWAY')return true;
    if(result.code==='AWAY'&&other.family==='clean_sheet'&&other.side==='HOME')return true;
    if(result.code==='DRAW'&&other.family==='clean_sheet')return true; // locked SMB rule
    if(result.code==='HOME'&&other.family==='win_to_nil'&&other.side==='AWAY')return true;
    if(result.code==='AWAY'&&other.family==='win_to_nil'&&other.side==='HOME')return true;
  }
  const teamNo=(x)=>x.family==='team_to_score'&&x.direction==='NO';
  const clean=(x)=>x.family==='clean_sheet';
  if(teamNo(A)&&clean(B)&&A.side&&B.side&&A.side!==B.side)return false;
  if(teamNo(A)&&clean(B)&&A.side&&B.side&&A.side===B.side)return true;
  if(teamNo(B)&&clean(A)&&A.side&&B.side&&A.side===B.side)return true;
  if(A.family==='team_to_score'&&B.family==='player_goal'&&A.direction==='NO'&&A.side&&A.side===B.side)return true;
  if(B.family==='team_to_score'&&A.family==='player_goal'&&B.direction==='NO'&&B.side&&B.side===A.side)return true;
  return false;
}
function related(a,b){
  const A=a.meta,B=b.meta;
  if(A.process===B.process)return true;
  const pair=new Set([A.process,B.process]);
  if(pair.has('result')&&(pair.has('goals')||pair.has('half')||pair.has('player_attack')||pair.has('corners')))return true;
  if(pair.has('goals')&&(pair.has('player_attack')||pair.has('keeper')||pair.has('half')))return true;
  if(pair.has('cards')&&(pair.has('player_control')||pair.has('penalty')))return true;
  return false;
}
function pairCorrelation(a,b,context={}){
  const A=a.meta,B=b.meta;
  let rho=0;
  const result=A.process==='result'?A:(B.process==='result'?B:null);
  const other=result===A?B:A;
  const fav=context.favorite_side;
  const sameFav=result&&result.side&&fav&&result.side===fav;
  if(sameFav&&other.family==='total_goals'&&other.direction==='OVER'&&other.line===2.5)rho=.28;
  else if(sameFav&&other.family==='player_shots_on_target'&&other.side===fav)rho=.35;
  else if(sameFav&&other.process==='corners'&&other.direction==='OVER')rho=.20;
  else if((A.family==='btts'&&A.direction==='YES'&&B.family==='total_goals'&&B.direction==='OVER'&&B.line===2.5)||
          (B.family==='btts'&&B.direction==='YES'&&A.family==='total_goals'&&A.direction==='OVER'&&A.line===2.5))rho=.25;
  else if((A.family==='player_shots_on_target'&&B.family==='goalkeeper_saves')||(B.family==='player_shots_on_target'&&A.family==='goalkeeper_saves'))rho=.15;
  else if(A.process==='goals'&&B.process==='goals')rho=.16;
  else if(A.process==='half'&&B.process==='goals'||B.process==='half'&&A.process==='goals')rho=.14;
  else if(A.process==='player_attack'&&B.process==='goals'||B.process==='player_attack'&&A.process==='goals')rho=.18;
  else if(A.process==='cards'&&B.process==='player_control'||B.process==='cards'&&A.process==='player_control')rho=.12;
  else if(related(a,b))rho=.10;
  if((A.family==='btts'&&A.direction==='YES'&&B.family==='total_goals'&&B.direction==='UNDER')||
     (B.family==='btts'&&B.direction==='YES'&&A.family==='total_goals'&&A.direction==='UNDER'))rho=-.12;
  const h2h=finite(context.h2h_matches);
  if(rho!==0&&(h2h===null||h2h<5))rho*=.8;
  return clamp(rho,-.45,.55);
}
function heuristicJoint(combo,context){
  let log=0;
  for(const leg of combo)log+=Math.log(clamp(leg.probability_pct/100,.001,.999));
  let corr=0;
  for(let i=0;i<combo.length;i++)for(let j=i+1;j<combo.length;j++)corr+=pairCorrelation(combo[i],combo[j],context);
  const processBonus=1+Math.max(0,new Set(combo.map(x=>x.meta.process)).size-1)*0.025;
  return Math.exp(log)*Math.exp(.32*corr)*processBonus;
}
function gaussianCopulaJoint(combo,context,samples=COPULA_SAMPLES){
  const p=combo.map(x=>clamp(x.probability_pct/100,.0001,.9999));
  const z=p.map(invNorm);
  const {L}=safeCorrelationMatrix(combo,context);
  const rng=xorshift32(hash32(combo.map(x=>x.family+':'+x.code).join('|')));
  let hit=0;
  for(let s=0;s<samples;s++){
    const u=Array(combo.length);let k=0;
    while(k<combo.length){
      const [a,b]=normalPair(rng);u[k++]=a;if(k<combo.length)u[k++]=b;
    }
    let ok=true;
    for(let i=0;i<combo.length&&ok;i++){
      let v=0;for(let j=0;j<=i;j++)v+=L[i][j]*u[j];
      if(v>z[i])ok=false;
    }
    if(ok)hit++;
  }
  return hit/samples*100;
}
function rowToLeg(family,row,fixture){
  const code=String(row?.code??row?.[0]??'');
  const probability_pct=finite(row?.probability_pct??row?.[1]);
  const label=String(row?.label??row?.[2]??code);
  if(!code||probability_pct===null||probability_pct<MIN_LEG_PROBABILITY||probability_pct>=99.5)return null;
  const leg={family,code,label,probability_pct:pct(probability_pct)};
  leg.meta=metadata(family,code,label,fixture);
  return leg;
}
function candidatePool({market_probabilities,probabilities_pct,fixture,include_player_markets=false}){
  const excluded=new Set([
    'same_match_builder','double_chance_combination',
    'correct_score','exact_total_goals'
  ]);
  const rows=[];
  const fav=favoriteInfo(probabilities_pct,fixture);
  if(fav&&fav.favorite.probability_pct>=MIN_LEG_PROBABILITY){
    const leg={family:'match_result_1x2',code:fav.favorite.code,label:fav.favorite.label,probability_pct:pct(fav.favorite.probability_pct)};
    leg.meta=metadata(leg.family,leg.code,leg.label,fixture);rows.push(leg);
  }

  const home=finite(probabilities_pct?.home_win??probabilities_pct?.home_pct);
  const draw=finite(probabilities_pct?.draw??probabilities_pct?.draw_pct);
  const away=finite(probabilities_pct?.away_win??probabilities_pct?.away_pct);
  if([home,draw,away].every(Number.isFinite)){
    const dc=[
      {code:'1X',label:(fixture?.home_team||fixture?.home||'Home')+' or Draw',p:home+draw},
      {code:'12',label:(fixture?.home_team||fixture?.home||'Home')+' or '+(fixture?.away_team||fixture?.away||'Away'),p:home+away},
      {code:'X2',label:'Draw or '+(fixture?.away_team||fixture?.away||'Away'),p:draw+away}
    ];
    for(const row of dc){
      if(row.p<MIN_LEG_PROBABILITY||row.p>=99.5)continue;
      const leg={family:'double_chance_standard',code:row.code,label:row.label,probability_pct:pct(row.p)};
      leg.meta=metadata(leg.family,leg.code,leg.label,fixture);rows.push(leg);
    }
  }

  for(const [family,selections] of Object.entries(market_probabilities||{})){
    if(excluded.has(family)||!Array.isArray(selections))continue;
    if(PLAYER_FAMILIES.has(family)&&!include_player_markets)continue;
    const grouped=new Map();
    for(const row of selections){
      const leg=rowToLeg(family,row,fixture);if(!leg)continue;
      const g=selectionGroup(leg);
      if(!grouped.has(g))grouped.set(g,[]);
      grouped.get(g).push(leg);
    }
    for(const list of grouped.values()){
      list.sort((a,b)=>b.probability_pct-a.probability_pct);
      rows.push(...list.slice(0,MAX_ALTERNATIVES_PER_GROUP));
    }
  }

  const seen=new Set(),unique=[];
  for(const leg of rows.sort((a,b)=>b.probability_pct-a.probability_pct)){
    const key=leg.family+':'+leg.code;
    if(seen.has(key))continue;
    seen.add(key);unique.push(leg);
    if(unique.length>=MAX_POOL)break;
  }
  return unique;
}
function requiredProcessCount(size){
  return Number(size)===4?3:Number(size)===6?4:5;
}
function processDiverse(combo,size){
  return new Set(combo.map(x=>x.meta.process)).size>=requiredProcessCount(size);
}
function overlapCount(a,b){
  const A=new Set(a.map(x=>x.family+':'+x.code));
  return b.reduce((n,x)=>n+(A.has(x.family+':'+x.code)?1:0),0);
}
function sufficientlyDifferent(combo,selected,size){
  const minimumDifferent=Number(size)===4?2:Number(size)===6?2:3;
  return selected.every(item=>Number(size)-overlapCount(combo,item.legs)>=minimumDifferent);
}
function compatibleWithCombo(combo,leg,fixture){
  return combo.every(existing=>!contradictory(existing,leg,fixture));
}
function signature(combo){return combo.map(x=>x.family+':'+x.code).sort().join('|');}
function beamCandidates(pool,size,context,fixture){
  let beam=[[]];
  for(let depth=0;depth<size;depth++){
    const next=[],seen=new Set();
    for(const combo of beam){
      const lastIndex=combo.length?pool.indexOf(combo[combo.length-1]):-1;
      for(let i=lastIndex+1;i<pool.length;i++){
        const leg=pool[i];
        if(!compatibleWithCombo(combo,leg,fixture))continue;
        const c=[...combo,leg],sig=signature(c);
        if(seen.has(sig))continue;seen.add(sig);
        next.push({combo:c,score:heuristicJoint(c,context)});
      }
    }
    next.sort((a,b)=>b.score-a.score);
    beam=next.slice(0,BEAM_WIDTH).map(x=>x.combo);
    if(!beam.length)break;
  }
  return beam.filter(combo=>processDiverse(combo,size)).slice(0,FINALISTS_PER_SIZE);
}
function buildSameMatchOffers({market_probabilities,probabilities_pct,fixture={},goal_diff=null,h2h_matches=null,include_player_markets=false}){
  const fav=favoriteInfo(probabilities_pct,fixture);
  const maxLegs=maxLegsAllowed(probabilities_pct,goal_diff,fixture);
  const context={favorite_side:fav?.favorite?.side||null,h2h_matches};
  const pool=candidatePool({market_probabilities,probabilities_pct,fixture,include_player_markets});
  const sizes={};
  for(const size of LEG_SIZES){
    if(size>maxLegs){
      sizes[size]={leg_count:size,available:false,status:'INSUFFICIENT_DATA',display:'Insufficient data',offers:[]};
      continue;
    }
    const candidates=beamCandidates(pool,size,context,fixture);
    const scored=[];
    for(const combo of candidates){
      const joint=pct(gaussianCopulaJoint(combo,context));
      const tier=tierForSize(size);
      if(!tier||joint<MIN_JOINT_PROBABILITY)continue;
      scored.push({
        leg_count:size,
        joint_probability_pct:joint,
        tier_id:tier.id,
        tier_label:tier.label,
        legs:combo.map(x=>({family:x.family,code:x.code,label:x.label,probability_pct:x.probability_pct}))
      });
    }
    scored.sort((a,b)=>b.joint_probability_pct-a.joint_probability_pct||signature(a.legs).localeCompare(signature(b.legs)));
    const unique=[],seen=new Set();
    for(const item of scored){
      const sig=item.legs.map(x=>x.family+':'+x.code).sort().join('|');
      if(seen.has(sig)||!sufficientlyDifferent(item.legs,unique,size))continue;
      seen.add(sig);unique.push(item);
      if(unique.length===3)break;
    }
    const fixedTier=tierForSize(size);
    sizes[size]=unique.length
      ?{leg_count:size,available:true,status:'AVAILABLE',display:size+'-Leg - '+fixedTier.label,tier_id:fixedTier.id,tier_label:fixedTier.label,offers:unique}
      :{leg_count:size,available:false,status:'INSUFFICIENT_DATA',display:'Insufficient data',tier_id:fixedTier.id,tier_label:fixedTier.label,offers:[]};
  }
  return {
    schema_version:'soccer-smb-offers-v1',
    max_legs:maxLegs,
    favorite:fav?{code:fav.favorite.code,label:fav.favorite.label,probability_pct:pct(fav.favorite.probability_pct)}:null,
    tiers:[
      {id:'TIER_1',label:'Statistical Edge',leg_count:4},
      {id:'TIER_2',label:'Speculative Edge',leg_count:6},
      {id:'TIER_3',label:'High-Variance Play',leg_count:8}
    ],
    sizes
  };
}

module.exports={
  TIERS,TIER_BY_SIZE,LEG_SIZES,MIN_LEG_PROBABILITY,MIN_JOINT_PROBABILITY,
  maxLegsAllowed,tierForSize,candidatePool,contradictory,pairCorrelation,
  gaussianCopulaJoint,buildSameMatchOffers
};