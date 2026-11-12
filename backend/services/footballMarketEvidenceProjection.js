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
  const baseTotal=bh+ba;
  const baseLogRatio=Math.log((bh+0.15)/(ba+0.15));
  let best=null;

  function consider(lh,la){
    const cells=poissonJoint(lh,la,max_goals);
    const o=outcomeVector(cells);
    const fit=(o.home-target.home)**2+(o.draw-target.draw)**2+(o.away-target.away)**2;
    const totalPenalty=((lh+la-baseTotal)/Math.max(1,baseTotal))**2;
    const ratioPenalty=(Math.log((lh+0.15)/(la+0.15))-baseLogRatio)**2;
    const objective=30*fit+0.35*totalPenalty+0.05*ratioPenalty;
    if(!best||objective<best.objective)best={lh,la,cells,o,objective,fit};
  }

  for(let lh=0.15;lh<=4.5;lh+=0.1){
    for(let la=0.15;la<=4.5;la+=0.1)consider(Number(lh.toFixed(3)),Number(la.toFixed(3)));
  }
  const center=best;
  for(let lh=Math.max(0.05,center.lh-0.15);lh<=Math.min(5,center.lh+0.15);lh+=0.01){
    for(let la=Math.max(0.05,center.la-0.15);la<=Math.min(5,center.la+0.15);la+=0.01){
      consider(Number(lh.toFixed(3)),Number(la.toFixed(3)));
    }
  }
  const maxErr=Math.max(
    Math.abs(best.o.home-target.home),
    Math.abs(best.o.draw-target.draw),
    Math.abs(best.o.away-target.away)
  )*100;
  if(maxErr>3)throw new Error('SEALED_1X2_SCORELINE_CALIBRATION_FAILED');
  return {
    home_goal_rate:best.lh,
    away_goal_rate:best.la,
    base_home_goal_rate:bh,
    base_away_goal_rate:ba,
    max_1x2_error_pct:pct(maxErr),
    scoreline_cells:best.cells
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
      {code:dc+'+BTTS-N',label:dc+' + BTTS No',probability_pct:scoreEventProbability(cal.scoreline_cells,(h,a)=>pred(h,a)&&!(h>0&&a>0)}
    );
  }

  if(input.corner_evidence){
    const hc=weightedEventRate(input.corner_evidence.home);
    const ac=weightedEventRate(input.corner_evidence.away);
    const corner=projectTwoTeamCountDistribution(countJoint(hc,ac,20),{lines:[6.5,7.5,8.5,9.5,10.5,11.5,12.5]});
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
