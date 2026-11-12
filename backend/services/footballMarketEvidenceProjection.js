'use strict';

const {
  projectScoreline,
  projectTwoTeamCountDistribution
}=require('./footballMarketProbabilityEngine');

function clamp(n,lo,hi){return Math.max(lo,Math.min(hi,n));}
function pct(n){return Math.round(Number(n)*100)/100;}
function poissonPmf(lambda,k){
  let p=Math.exp(-lambda);
  for(let i=1;i<=k;i++)p*=lambda/i;
  return p;
}
function poissonJoint(lambdaHome,lambdaAway,max=10){
  const rows=[];
  let total=0;
  for(let h=0;h<=max;h++){
    const ph=poissonPmf(lambdaHome,h);
    for(let a=0;a<=max;a++){
      const p=ph*poissonPmf(lambdaAway,a);
      rows.push({home_goals:h,away_goals:a,probability:p});
      total+=p;
    }
  }
  return rows.map(r=>({...r,probability:r.probability/total}));
}
function outcomeVector(cells){
  let h=0,d=0,a=0;
  for(const r of cells){
    if(r.home_goals>r.away_goals)h+=r.probability;
    else if(r.home_goals===r.away_goals)d+=r.probability;
    else a+=r.probability;
  }
  return {home:h,draw:d,away:a};
}
function normalizeSealed(sealed){
  const h=Number(sealed?.home_pct??sealed?.home_win);
  const d=Number(sealed?.draw_pct??sealed?.draw);
  const a=Number(sealed?.away_pct??sealed?.away_win);
  if(![h,d,a].every(Number.isFinite))throw new Error('SEALED_1X2_REQUIRED');
  const sum=h+d+a;
  if(Math.abs(sum-100)>0.1)throw new Error('SEALED_1X2_SUM_INVALID');
  return {home:h/100,draw:d/100,away:a/100};
}

function calibrateScorelineToSealed1X2({sealed_1x2,base_home_goals,base_away_goals,max_goals=10}){
  const target=normalizeSealed(sealed_1x2);
  const bh=clamp(Number(base_home_goals),0.15,4.5);
  const ba=clamp(Number(base_away_goals),0.15,4.5);
  if(!Number.isFinite(bh)||!Number.isFinite(ba))throw new Error('BASE_GOAL_RATES_REQUIRED');

  // Start with the evidence-driven goal rates, then calibrate only the three
  // mutually exclusive outcome masses to the already-sealed 1X2 authority.
  // Within each outcome class (home/draw/away), the scoreline shape remains
  // the evidence-driven Poisson shape. This avoids inventing a second 1X2.
  const baseCells=poissonJoint(bh,ba,max_goals);
  const base=outcomeVector(baseCells);
  if(base.home<=0||base.draw<=0||base.away<=0)throw new Error('BASE_SCORELINE_OUTCOME_MASS_INVALID');
  const factors={
    home:target.home/base.home,
    draw:target.draw/base.draw,
    away:target.away/base.away
  };
  const cells=baseCells.map(r=>{
    const outcome=r.home_goals>r.away_goals?'home':r.home_goals===r.away_goals?'draw':'away';
    return {...r,probability:r.probability*factors[outcome]};
  });
  const total=cells.reduce((a,b)=>a+b.probability,0);
  for(const r of cells)r.probability/=total;
  const calibrated=outcomeVector(cells);
  const maxErr=Math.max(
    Math.abs(calibrated.home-target.home),
    Math.abs(calibrated.draw-target.draw),
    Math.abs(calibrated.away-target.away)
  )*100;
  if(maxErr>0.02)throw new Error('SEALED_1X2_SCORELINE_CALIBRATION_FAILED');

  return {
    calibration_method:'OUTCOME_MASS_REWEIGHT_V1',
    home_goal_rate:bh,
    away_goal_rate:ba,
    base_home_goal_rate:bh,
    base_away_goal_rate:ba,
    max_1x2_error_pct:pct(maxErr),
    scoreline_cells:cells
  };
}

function mean(values){
  const xs=(Array.isArray(values)?values:[]).map(Number).filter(Number.isFinite);
  return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
}
function weightedEventRate({own_samples,opponent_conceded_samples,h2h_samples=[]}){
  const own=mean(own_samples),opp=mean(opponent_conceded_samples),h2h=mean(h2h_samples);
  if(own===null&&opp===null)throw new Error('EVENT_RATE_EVIDENCE_REQUIRED');
  const general=own===null?opp:opp===null?own:(own+opp)/2;
  const h2hN=Array.isArray(h2h_samples)?h2h_samples.filter(x=>Number.isFinite(Number(x))).length:0;
  const h2hWeight=h2h===null?0:Math.min(0.20,0.05*h2hN);
  return pct((1-h2hWeight)*general+h2hWeight*h2h);
}
function countJoint(lambdaHome,lambdaAway,max=20){
  const rows=[];let total=0;
  for(let h=0;h<=max;h++){
    const ph=poissonPmf(lambdaHome,h);
    for(let a=0;a<=max;a++){
      const p=ph*poissonPmf(lambdaAway,a);
      rows.push({home_count:h,away_count:a,probability:p}); total+=p;
    }
  }
  return rows.map(r=>({...r,probability:r.probability/total}));
}
function scoreEventProbability(cells,predicate){
  let p=0;
  for(const r of cells)if(predicate(r.home_goals,r.away_goals))p+=r.probability;
  return pct(p*100);
}
function topScoreSelections(scoreMap,limit=6){
  return Object.entries(scoreMap)
    .map(([score,probability_pct])=>({code:score,label:score,probability_pct}))
    .sort((a,b)=>b.probability_pct-a.probability_pct)
    .slice(0,limit);
}
function lineSelections(prefix,grid,lines){
  const out=[];
  for(const line of lines){
    const p=grid[String(line)];
    if(!p)continue;
    out.push({code:'O'+line,label:'Over '+line,probability_pct:p.over_pct});
    out.push({code:'U'+line,label:'Under '+line,probability_pct:p.under_pct});
  }
  return out;
}
function favoriteOutcome(sealed){
  const s=normalizeSealed(sealed);
  return [['HOME',s.home],['DRAW',s.draw],['AWAY',s.away]].sort((a,b)=>b[1]-a[1])[0][0];
}
function outcomePredicate(outcome){
  if(outcome==='HOME')return (h,a)=>h>a;
  if(outcome==='AWAY')return (h,a)=>a>h;
  return (h,a)=>h===a;
}
function dcPredicate(dc){
  if(dc==='1X')return (h,a)=>h>=a;
  if(dc==='X2')return (h,a)=>a>=h;
  return (h,a)=>h!==a;
}
function totalGoalRangeSelections(cells){
  const ranges=[
    {code:'0-1',label:'0–1 goals',test:(h,a)=>(h+a)<=1},
    {code:'2-3',label:'2–3 goals',test:(h,a)=>(h+a)>=2&&(h+a)<=3},
    {code:'4-5',label:'4–5 goals',test:(h,a)=>(h+a)>=4&&(h+a)<=5},
    {code:'6+',label:'6+ goals',test:(h,a)=>(h+a)>=6}
  ];
  return ranges.map(r=>({code:r.code,label:r.label,probability_pct:scoreEventProbability(cells,r.test)}));
}
function winningMarginSelections(cells){
  const defs=[
    {code:'HOME-1',label:'Home by exactly 1',test:(h,a)=>h-a===1},
    {code:'HOME-2+',label:'Home by 2+',test:(h,a)=>h-a>=2},
    {code:'DRAW',label:'Draw',test:(h,a)=>h===a},
    {code:'AWAY-1',label:'Away by exactly 1',test:(h,a)=>a-h===1},
    {code:'AWAY-2+',label:'Away by 2+',test:(h,a)=>a-h>=2}
  ];
  return defs.map(r=>({code:r.code,label:r.label,probability_pct:scoreEventProbability(cells,r.test)}));
}
function countRangeSelections(rows){
  const total=(min,max)=>pct(rows.filter(r=>r.home_count+r.away_count>=min&&(max===Infinity||r.home_count+r.away_count<=max)).reduce((a,b)=>a+b.probability,0)*100);
  return [
    {code:'0-7',label:'0–7',probability_pct:total(0,7)},
    {code:'8-10',label:'8–10',probability_pct:total(8,10)},
    {code:'11-13',label:'11–13',probability_pct:total(11,13)},
    {code:'14+',label:'14+',probability_pct:total(14,Infinity)}
  ];
}
function cornerHandicapSelections(rows){
  const p=test=>pct(rows.filter(r=>test(r.home_count,r.away_count)).reduce((a,b)=>a+b.probability,0)*100);
  return [
    {code:'HOME-1.5',label:'Home -1.5 corners',probability_pct:p((h,a)=>h-a>1.5)},
    {code:'HOME+1.5',label:'Home +1.5 corners',probability_pct:p((h,a)=>h-a>-1.5)},
    {code:'AWAY-1.5',label:'Away -1.5 corners',probability_pct:p((h,a)=>a-h>1.5)},
    {code:'AWAY+1.5',label:'Away +1.5 corners',probability_pct:p((h,a)=>a-h>-1.5)}
  ];
}

function buildFixtureMarketProjection(input={}){
  const sealed=input.sealed_1x2;
  const cal=calibrateScorelineToSealed1X2({
    sealed_1x2:sealed,
    base_home_goals:input.base_home_goals,
    base_away_goals:input.base_away_goals
  });
  const score=projectScoreline(cal.scoreline_cells,{
    goal_lines:[0.5,1.5,2.5,3.5,4.5,5.5],
    team_goal_lines:[0.5,1.5,2.5]
  });

  const market_probabilities={};
  market_probabilities.draw_no_bet=[
    {code:'HOME',label:'Home win',probability_pct:score.match_result.home_pct},
    {code:'PUSH',label:'Draw / push',probability_pct:score.match_result.draw_pct},
    {code:'AWAY',label:'Away win',probability_pct:score.match_result.away_pct}
  ];
  market_probabilities.total_goals=lineSelections('TG',score.total_goals,[0.5,1.5,2.5,3.5,4.5,5.5]);
  market_probabilities.team_total_goals=[
    ...lineSelections('HTG',score.team_total_goals.HOME,[0.5,1.5,2.5]).map(x=>({...x,code:'H-'+x.code,label:'Home '+x.label})),
    ...lineSelections('ATG',score.team_total_goals.AWAY,[0.5,1.5,2.5]).map(x=>({...x,code:'A-'+x.code,label:'Away '+x.label}))
  ];
  market_probabilities.btts=[
    {code:'YES',label:'Both teams to score — Yes',probability_pct:score.btts.yes_pct},
    {code:'NO',label:'Both teams to score — No',probability_pct:score.btts.no_pct}
  ];
  market_probabilities.clean_sheet=[
    {code:'HOME-YES',label:'Home clean sheet',probability_pct:score.clean_sheet.home_yes_pct},
    {code:'AWAY-YES',label:'Away clean sheet',probability_pct:score.clean_sheet.away_yes_pct}
  ];
  market_probabilities.win_to_nil=[
    {code:'HOME-YES',label:'Home win to nil',probability_pct:score.win_to_nil.home_yes_pct},
    {code:'AWAY-YES',label:'Away win to nil',probability_pct:score.win_to_nil.away_yes_pct}
  ];
  market_probabilities.correct_score=topScoreSelections(score.exact_score,6);
  market_probabilities.exact_total_goals=Object.entries(score.exact_total_goals)
    .map(([goals,probability_pct])=>({code:goals,label:goals+' total goals',probability_pct}))
    .sort((a,b)=>b.probability_pct-a.probability_pct)
    .slice(0,7);
  market_probabilities.goal_range=totalGoalRangeSelections(cal.scoreline_cells);
  market_probabilities.team_to_score=[
    {code:'HOME-YES',label:'Home team to score — Yes',probability_pct:pct(100-score.clean_sheet.away_yes_pct)},
    {code:'HOME-NO',label:'Home team to score — No',probability_pct:score.clean_sheet.away_yes_pct},
    {code:'AWAY-YES',label:'Away team to score — Yes',probability_pct:pct(100-score.clean_sheet.home_yes_pct)},
    {code:'AWAY-NO',label:'Away team to score — No',probability_pct:score.clean_sheet.home_yes_pct}
  ];
  market_probabilities.winning_margin=winningMarginSelections(cal.scoreline_cells);
  const fav=favoriteOutcome(sealed);
  const favPred=outcomePredicate(fav);
  market_probabilities.same_match_builder=[
    {code:fav+'+O1.5',label:fav+' result + Over 1.5',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>favPred(h,a)&&(h+a)>1.5)},
    {code:fav+'+O2.5',label:fav+' result + Over 2.5',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>favPred(h,a)&&(h+a)>2.5)},
    {code:fav+'+U3.5',label:fav+' result + Under 3.5',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>favPred(h,a)&&(h+a)<3.5)},
    {code:fav+'+BTTS-Y',label:fav+' result + BTTS Yes',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>favPred(h,a)&&h>0&&a>0)},
    {code:'O2.5+BTTS-Y',label:'Over 2.5 + BTTS Yes',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>(h+a)>2.5&&h>0&&a>0)},
    {code:'U3.5+BTTS-N',label:'Under 3.5 + BTTS No',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>(h+a)<3.5&&!(h>0&&a>0))}
  ];

  market_probabilities.double_chance_standard=[
    {code:'1X',label:'Home or Draw',probability_pct:score.double_chance.one_x_pct},
    {code:'12',label:'Home or Away',probability_pct:score.double_chance.one_two_pct},
    {code:'X2',label:'Draw or Away',probability_pct:score.double_chance.x_two_pct}
  ];
  market_probabilities.double_chance_combination=[];
  for(const dc of ['1X','12','X2']){
    const pred=dcPredicate(dc);
    market_probabilities.double_chance_combination.push(
      {code:dc+'+O2.5',label:dc+' + Over 2.5',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>pred(h,a)&&(h+a)>2.5)},
      {code:dc+'+U3.5',label:dc+' + Under 3.5',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>pred(h,a)&&(h+a)<3.5)},
      {code:dc+'+BTTS-Y',label:dc+' + BTTS Yes',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>pred(h,a)&&h>0&&a>0)},
      {code:dc+'+BTTS-N',label:dc+' + BTTS No',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>pred(h,a)&&!(h>0&&a>0))}
    );
  }

  if(input.corner_evidence){
    const hc=weightedEventRate(input.corner_evidence.home);
    const ac=weightedEventRate(input.corner_evidence.away);
    const cornerCells=countJoint(hc,ac,20);
    const corner=projectTwoTeamCountDistribution(cornerCells,{lines:[6.5,7.5,8.5,9.5,10.5,11.5,12.5]});
    market_probabilities.corners_total=lineSelections('C',corner.total,[6.5,7.5,8.5,9.5,10.5,11.5,12.5]);
    market_probabilities.corners_team=[
      ...lineSelections('HC',corner.home,[2.5,3.5,4.5,5.5,6.5]).map(x=>({...x,code:'H-'+x.code,label:'Home corners '+x.label.replace(/^(Over|Under) /,'$1 ')})),
      ...lineSelections('AC',corner.away,[2.5,3.5,4.5,5.5,6.5]).map(x=>({...x,code:'A-'+x.code,label:'Away corners '+x.label.replace(/^(Over|Under) /,'$1 ')}))
    ];
    market_probabilities.corners_most=[
      {code:'HOME',label:'Home most corners',probability_pct:corner.most.home_pct},
      {code:'DRAW',label:'Equal corners',probability_pct:corner.most.draw_pct},
      {code:'AWAY',label:'Away most corners',probability_pct:corner.most.away_pct}
    ];
    market_probabilities.corners_range=countRangeSelections(cornerCells);
    market_probabilities.corners_handicap=cornerHandicapSelections(cornerCells);
  }

  if(input.card_evidence){
    const hy=weightedEventRate(input.card_evidence.home);
    const ay=weightedEventRate(input.card_evidence.away);
    const cards=projectTwoTeamCountDistribution(countJoint(hy,ay,12),{lines:[1.5,2.5,3.5,4.5,5.5,6.5]});
    market_probabilities.cards_total=lineSelections('Y',cards.total,[1.5,2.5,3.5,4.5,5.5,6.5]);
    market_probabilities.cards_team=[
      ...lineSelections('HY',cards.home,[0.5,1.5,2.5,3.5]).map(x=>({...x,code:'H-'+x.code,label:'Home cards '+x.label})),
      ...lineSelections('AY',cards.away,[0.5,1.5,2.5,3.5]).map(x=>({...x,code:'A-'+x.code,label:'Away cards '+x.label}))
    ];
    market_probabilities.cards_most=[
      {code:'HOME',label:'Home most cards',probability_pct:cards.most.home_pct},
      {code:'DRAW',label:'Equal cards',probability_pct:cards.most.draw_pct},
      {code:'AWAY',label:'Away most cards',probability_pct:cards.most.away_pct}
    ];
  }

  return {
    schema_version:'soccer-markets-001-fixture-projection-v1',
    fixture_id:String(input.fixture_id||''),
    generated_from_pre_match_evidence:true,
    calibration:{
      home_goal_rate:cal.home_goal_rate,
      away_goal_rate:cal.away_goal_rate,
      base_home_goal_rate:cal.base_home_goal_rate,
      base_away_goal_rate:cal.base_away_goal_rate,
      max_1x2_error_pct:cal.max_1x2_error_pct
    },
    market_probabilities
  };
}

module.exports={
  calibrateScorelineToSealed1X2,
  weightedEventRate,
  buildFixtureMarketProjection,
  scoreEventProbability
};
