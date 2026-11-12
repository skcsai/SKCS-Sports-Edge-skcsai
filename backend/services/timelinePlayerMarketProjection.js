'use strict';

const MIN_PLAYER_APPEARANCES=5;
const MIN_TEAM_EVENT_MATCHES=5;

function finite(value){
  if(value===null||value===undefined||value==='')return null;
  const n=Number(typeof value==='string'?value.replace('%',''):value);
  return Number.isFinite(n)?n:null;
}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function pct(n){return Math.round(Number(n)*100)/100;}
function mean(xs){
  const vals=(xs||[]).map(finite).filter(x=>x!==null);
  return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
}
function poissonPmf(k,lambda){
  let p=Math.exp(-lambda);
  for(let i=1;i<=k;i++)p*=lambda/i;
  return p;
}
function overUnder(lambda,line,max=120){
  let under=0,push=0,total=0;
  for(let k=0;k<=max;k++){
    const p=poissonPmf(k,lambda); total+=p;
    if(k<line)under+=p; else if(k===line)push+=p;
  }
  const over=Math.max(0,total-under-push);
  const norm=total||1;
  return {over_pct:pct(over/norm*100),under_pct:pct(under/norm*100),push_pct:pct(push/norm*100)};
}
function addSelection(out,family,code,label,probability,note){
  const p=finite(probability);
  if(p===null||p<0||p>100)return;
  if(!out[family])out[family]=[];
  out[family].push({code,label,probability_pct:pct(p),evidence_note:note});
}
function teamRecentFixtureIds(evidence,teamId){
  const team=evidence?.teams?.[teamId]||evidence?.teams?.[String(teamId)];
  return (Array.isArray(team?.recent_fixtures)?team.recent_fixtures:[])
    .map(f=>String(f.fixture_id))
    .filter(Boolean);
}
function eventRows(evidence,fixtureId){
  return evidence?.fixture_events?.[fixtureId]||evidence?.fixture_events?.[String(fixtureId)]||[];
}
function playerRows(evidence,fixtureId){
  return evidence?.fixture_players?.[fixtureId]||evidence?.fixture_players?.[String(fixtureId)]||[];
}
function activePlayerSet(evidence,fixtureId){
  const set=new Set();
  for(const row of playerRows(evidence,fixtureId)){
    if(finite(row?.minutes)>0&&finite(row?.player_id)!==null)set.add(Number(row.player_id));
  }
  return set;
}
function confirmedPenaltyEvent(event){
  if(String(event?.type)!=='Goal'&&String(event?.type)!=='Var')return false;
  const detail=String(event?.detail||'');
  if(String(event?.type)==='Goal')return detail==='Penalty'||detail==='Missed Penalty';
  return detail==='Penalty confirmed';
}
function isGoalEvent(event){
  return String(event?.type)==='Goal'&&!['Missed Penalty'].includes(String(event?.detail||''));
}
function isRedCardEvent(event){return String(event?.type)==='Card'&&String(event?.detail)==='Red Card';}
function isYellowCardEvent(event){return String(event?.type)==='Card'&&String(event?.detail)==='Yellow Card';}

function firstGoalForFixture(evidence,fixtureId){
  const goals=eventRows(evidence,fixtureId)
    .filter(isGoalEvent)
    .sort((a,b)=>(finite(a.elapsed)||0)-(finite(b.elapsed)||0)||(finite(a.extra)||0)-(finite(b.extra)||0));
  return goals.length?Number(goals[0].team_id):null;
}
function firstGoalHistory(evidence,teamId){
  const ids=teamRecentFixtureIds(evidence,teamId);
  let forFirst=0,againstFirst=0,noGoal=0,n=0;
  for(const id of ids){
    if(!Object.prototype.hasOwnProperty.call(evidence?.fixture_events||{},String(id)))continue;
    const players=playerRows(evidence,id);
    const fixtureTeams=new Set(players.map(x=>Number(x.team_id)).filter(Number.isFinite));
    if(fixtureTeams.size&& !fixtureTeams.has(Number(teamId)))continue;
    const first=firstGoalForFixture(evidence,id);
    n++;
    if(first===null)noGoal++;
    else if(first===Number(teamId))forFirst++;
    else againstFirst++;
  }
  return {n,forFirst,againstFirst,noGoal};
}
function firstGoalProjection(evidence,target,scoreCells,goalAnchors){
  const homeId=Number(target.teams.home.id),awayId=Number(target.teams.away.id);
  const h=firstGoalHistory(evidence,homeId),a=firstGoalHistory(evidence,awayId);
  if(h.n<MIN_TEAM_EVENT_MATCHES||a.n<MIN_TEAM_EVENT_MATCHES)return null;
  const noGoalMass=scoreCells
    .filter(c=>c.home_goals===0&&c.away_goals===0)
    .reduce((s,c)=>s+c.probability,0);
  const anyGoal=1-noGoalMass;
  const rateShare=goalAnchors.home/(goalAnchors.home+goalAnchors.away);
  let share=rateShare;
  if(h.n>=MIN_TEAM_EVENT_MATCHES&&a.n>=MIN_TEAM_EVENT_MATCHES){
    const homeFor=(h.forFirst+1)/(h.forFirst+h.againstFirst+2);
    const awayConcede=(a.againstFirst+1)/(a.forFirst+a.againstFirst+2);
    const empirical=(homeFor+awayConcede)/2;
    share=.6*rateShare+.4*empirical;
  }
  share=clamp(share,.05,.95);
  return {
    home_pct:pct(anyGoal*share*100),
    away_pct:pct(anyGoal*(1-share)*100),
    no_goal_pct:pct(noGoalMass*100),
    samples:{home:h.n,away:a.n}
  };
}

function teamBinaryHistory(evidence,teamId,predicate){
  const ids=teamRecentFixtureIds(evidence,teamId);
  let yes=0,n=0;
  for(const id of ids){
    const rows=eventRows(evidence,id);
    if(!rows.length)continue;
    n++;
    if(rows.some(e=>predicate(e,Number(teamId),id)))yes++;
  }
  return {yes,n};
}
function betaRate(history,prior=0.08,weight=8){
  if(!history||history.n<=0)return prior;
  return (history.yes+prior*weight)/(history.n+weight);
}
function h2hBinaryRate(evidence,target,teamId,predicate){
  const rows=Array.isArray(target?.team_h2h)?target.team_h2h:[];
  let yes=0,n=0;
  for(const f of rows){
    const id=String(f.fixture_id);
    const events=eventRows(evidence,id);
    if(!events.length)continue;
    n++;
    if(events.some(e=>predicate(e,Number(teamId),id)))yes++;
  }
  return n>=2?{yes,n}:null;
}
function blendedBinaryTeamProbability(evidence,target,teamId,predicate,prior){
  const base=teamBinaryHistory(evidence,teamId,predicate);
  if(base.n<MIN_TEAM_EVENT_MATCHES)return null;
  let rate=betaRate(base,prior,8);
  const h2h=h2hBinaryRate(evidence,target,teamId,predicate);
  if(h2h){
    const hw=Math.min(.15,.04*h2h.n);
    rate=(1-hw)*rate+hw*betaRate(h2h,rate,4);
  }
  return {probability:clamp(rate,.001,.95),samples:base.n,h2h_samples:h2h?.n||0};
}

function redCardMarkets(evidence,target){
  const homeId=Number(target.teams.home.id),awayId=Number(target.teams.away.id);
  const pred=(event,teamId,fixtureId)=>{
    if(Number(event.team_id)!==teamId||!isRedCardEvent(event))return false;
    const active=activePlayerSet(evidence,fixtureId);
    return !event.player_id||active.size===0||active.has(Number(event.player_id));
  };
  const hp=blendedBinaryTeamProbability(evidence,target,homeId,pred,.06);
  const ap=blendedBinaryTeamProbability(evidence,target,awayId,pred,.06);
  if(!hp||!ap)return null;
  const match=1-(1-hp.probability)*(1-ap.probability);
  return {home:hp,away:ap,match_probability:match};
}

function penaltyMarkets(evidence,target){
  const homeId=Number(target.teams.home.id),awayId=Number(target.teams.away.id);
  const pred=(event,teamId)=>Number(event.team_id)===teamId&&confirmedPenaltyEvent(event);
  const hp=blendedBinaryTeamProbability(evidence,target,homeId,pred,.12);
  const ap=blendedBinaryTeamProbability(evidence,target,awayId,pred,.12);
  if(!hp||!ap)return null;
  const match=1-(1-hp.probability)*(1-ap.probability);
  return {home:hp,away:ap,match_probability:match};
}

function bookingPointsForFixtureTeam(evidence,fixtureId,teamId){
  const active=activePlayerSet(evidence,fixtureId);
  const byPlayer=new Map();
  for(const event of eventRows(evidence,fixtureId)){
    if(Number(event.team_id)!==Number(teamId)||String(event.type)!=='Card'||!event.player_id)continue;
    if(active.size&& !active.has(Number(event.player_id)))continue;
    const item=byPlayer.get(Number(event.player_id))||{yellow:0,red:0};
    if(isYellowCardEvent(event))item.yellow++;
    if(isRedCardEvent(event))item.red++;
    byPlayer.set(Number(event.player_id),item);
  }
  let points=0;
  for(const card of byPlayer.values()){
    if(card.red>0)points+=25+(card.yellow>0?10:0);
    else points+=card.yellow*10;
  }
  return points;
}
function bookingPointHistory(evidence,teamId){
  const values=[];
  for(const id of teamRecentFixtureIds(evidence,teamId)){
    if(!eventRows(evidence,id).length)continue;
    values.push(bookingPointsForFixtureTeam(evidence,id,teamId));
  }
  return values;
}
function empiricalConvolution(a,b){
  const probs=new Map();
  if(!a.length||!b.length)return probs;
  const w=1/(a.length*b.length);
  for(const x of a)for(const y of b)probs.set(x+y,(probs.get(x+y)||0)+w);
  return probs;
}
function bookingPointMarkets(evidence,target){
  const h=bookingPointHistory(evidence,Number(target.teams.home.id));
  const a=bookingPointHistory(evidence,Number(target.teams.away.id));
  if(h.length<MIN_TEAM_EVENT_MATCHES||a.length<MIN_TEAM_EVENT_MATCHES)return null;
  const dist=empiricalConvolution(h,a);
  return {home:h,away:a,match:dist};
}

function playerHistories(evidence,teamId){
  const ids=teamRecentFixtureIds(evidence,teamId);
  const byPlayer=new Map();
  for(const id of ids){
    const rows=playerRows(evidence,id).filter(r=>Number(r.team_id)===Number(teamId)&&finite(r.minutes)>0&&finite(r.player_id)!==null);
    for(const row of rows){
      const pid=Number(row.player_id);
      const item=byPlayer.get(pid)||{player_id:pid,name:String(row.player||pid),position:String(row.position||''),rows:[]};
      item.name=String(row.player||item.name);
      item.position=String(row.position||item.position);
      item.rows.push({...row,fixture_id:id});
      byPlayer.set(pid,item);
    }
  }
  return [...byPlayer.values()];
}
function playerEligibility(history){
  const rows=history.rows||[];
  const appearances=rows.length;
  const starts=rows.filter(r=>r.substitute===false).length;
  const minutes=rows.reduce((s,r)=>s+(finite(r.minutes)||0),0);
  const avgMinutes=appearances?minutes/appearances:0;
  const minAvg=history.position==='G'?70:45;
  return {
    eligible:appearances>=MIN_PLAYER_APPEARANCES&&starts>=3&&avgMinutes>=minAvg,
    appearances,starts,total_minutes:minutes,expected_minutes:clamp(avgMinutes,15,90)
  };
}
function countValue(row,key){
  const v=finite(row?.[key]);
  return v===null?0:Math.max(0,v);
}
function playerRate(history,key){
  let count=0,minutes=0;
  for(const row of history.rows||[]){
    const m=finite(row.minutes);
    if(m===null||m<=0)continue;
    count+=countValue(row,key); minutes+=m;
  }
  if(minutes<270)return null;
  return {per90:count/minutes*90,count,minutes};
}
function counterpartPositionsForMetric(key){
  if(['goals','assists','shots_total','shots_on'].includes(key))return new Set(['D','G']);
  if(['tackles_total','fouls_committed','fouls_drawn'].includes(key))return new Set(['F','M']);
  return new Set(['D','M','F','G']);
}
function playerOpponentH2HModifier(evidence,target,history,key){
  const baseline=playerRate(history,key);
  if(!baseline||baseline.per90<=0)return null;
  const teamId=Number(history.rows?.find(r=>finite(r.team_id)!==null)?.team_id);
  if(!Number.isFinite(teamId))return null;
  const homeId=Number(target.teams.home.id),awayId=Number(target.teams.away.id);
  const opponentId=teamId===homeId?awayId:teamId===awayId?homeId:null;
  if(opponentId===null)return null;
  const allowed=counterpartPositionsForMetric(key);
  const pairs=new Map();
  for(const f of Array.isArray(target.team_h2h)?target.team_h2h:[]){
    const rows=playerRows(evidence,String(f.fixture_id));
    const me=rows.find(r=>Number(r.team_id)===teamId&&Number(r.player_id)===Number(history.player_id)&&(finite(r.minutes)||0)>0);
    if(!me)continue;
    for(const opp of rows){
      if(Number(opp.team_id)!==opponentId||(finite(opp.minutes)||0)<=0||!allowed.has(String(opp.position||'')))continue;
      const pid=Number(opp.player_id); if(!Number.isFinite(pid))continue;
      const item=pairs.get(pid)||{player_id:pid,name:String(opp.player||pid),position:String(opp.position||''),matches:0,metric:0,minutes:0,opponent_minutes:0};
      item.matches++; item.metric+=countValue(me,key); item.minutes+=(finite(me.minutes)||0); item.opponent_minutes+=(finite(opp.minutes)||0);
      pairs.set(pid,item);
    }
  }
  const candidates=[...pairs.values()].filter(x=>x.matches>=2&&x.minutes>=90)
    .sort((a,b)=>b.matches-a.matches||b.opponent_minutes-a.opponent_minutes);
  if(!candidates.length)return null;
  const best=candidates[0];
  const h2hPer90=best.metric/best.minutes*90;
  const ratio=clamp(h2hPer90/baseline.per90,.5,1.5);
  const weight=Math.min(.20,.06*best.matches);
  return {
    factor:clamp(1+weight*(ratio-1),.90,1.10),
    opponent_player_id:best.player_id,
    opponent_name:best.name,
    opponent_position:best.position,
    shared_matches:best.matches,
    h2h_per90:h2hPer90,
    baseline_per90:baseline.per90
  };
}
function h2hNote(modifier){
  return modifier?' Direct player H2H: '+modifier.shared_matches+' shared matches vs '+modifier.opponent_name+'; capped event-rate modifier applied.':'';
}
function teamAttackingMatchupModifier(evidence,target,teamId){
  const candidates=playerHistories(evidence,teamId)
    .map(history=>({history,eligibility:playerEligibility(history)}))
    .filter(x=>x.eligibility.eligible&&x.history.position!=='G')
    .sort((a,b)=>b.eligibility.starts-a.eligibility.starts||b.eligibility.expected_minutes-a.eligibility.expected_minutes)
    .slice(0,5);
  const factors=[];
  const details=[];
  for(const item of candidates){
    const mod=playerOpponentH2HModifier(evidence,target,item.history,'shots_on')||playerOpponentH2HModifier(evidence,target,item.history,'goals');
    if(mod){factors.push(mod.factor);details.push({player_id:item.history.player_id,player:item.history.name,...mod});}
  }
  if(!factors.length)return {factor:1,details:[]};
  const average=factors.reduce((a,b)=>a+b,0)/factors.length;
  return {factor:clamp(average,.94,1.06),details};
}
function playerCardRate(history){
  let carded=0,n=0;
  for(const row of history.rows||[]){
    if((finite(row.minutes)||0)<=0)continue;
    n++;
    if(countValue(row,'yellow')>0||countValue(row,'red')>0)carded++;
  }
  if(n<MIN_PLAYER_APPEARANCES)return null;
  return (carded+1)/(n+2);
}
function countLines(lambda,lines){
  return lines.map(line=>({line,...overUnder(lambda,line)}));
}
function passLines(lambda){
  const center=Math.max(9.5,Math.floor(lambda/10)*10-0.5);
  return [...new Set([Math.max(9.5,center-10),center,center+10])];
}
function playerMarketProjection(evidence,target,context={}){
  const out={};
  const teams=[
    {side:'HOME',id:Number(target.teams.home.id),name:target.teams.home.name,goalLambda:context.goal_home,cardLambda:context.card_home,sotOpponent:context.sot_away},
    {side:'AWAY',id:Number(target.teams.away.id),name:target.teams.away.name,goalLambda:context.goal_away,cardLambda:context.card_away,sotOpponent:context.sot_home}
  ];
  const note='Private test-only player projection from recent completed-match player rates and expected minutes. Public publication remains gated by current-fixture lineup/eligibility evidence.';
  for(const team of teams){
    const histories=playerHistories(evidence,team.id)
      .map(history=>({history,eligibility:playerEligibility(history)}))
      .filter(item=>item.eligibility.eligible)
      .sort((a,b)=>b.eligibility.starts-a.eligibility.starts||b.eligibility.expected_minutes-a.eligibility.expected_minutes||b.eligibility.appearances-a.eligibility.appearances)
      .slice(0,14);
    const teamGoalRecent=mean((evidence.teams?.[team.id]||evidence.teams?.[String(team.id)])?.recent_fixtures?.map(f=>{
      const home=Number(f.home?.id)===team.id;
      return home?finite(f.goals?.home):finite(f.goals?.away);
    })||[])||1;
    const attackScale=Number.isFinite(team.goalLambda)?clamp(team.goalLambda/teamGoalRecent,.6,1.5):1;
    for(const item of histories){
      const h=item.history;
      const eligibility=item.eligibility;
      const prefix='P'+h.player_id;
      const name=h.name+' ('+team.name+' expected)';
      const minutesScale=eligibility.expected_minutes/90;

      const goals=playerRate(h,'goals');
      if(h.position!=='G'&&goals&&goals.count>0){
        const matchup=playerOpponentH2HModifier(evidence,target,h,'goals');
        const lambda=clamp(goals.per90*minutesScale*attackScale*(matchup?.factor||1),0.02,2.5);
        const anytime=(1-Math.exp(-lambda))*100;
        addSelection(out,'player_goal',prefix+'_ANYTIME',name+' anytime scorer',anytime,note+h2hNote(matchup));
      }
      const assists=playerRate(h,'assists');
      if(h.position!=='G'&&assists&&assists.count>0){
        const matchup=playerOpponentH2HModifier(evidence,target,h,'assists');
        const lambda=clamp(assists.per90*minutesScale*attackScale*(matchup?.factor||1),0.02,2);
        addSelection(out,'player_assist',prefix+'_YES',name+' to assist', (1-Math.exp(-lambda))*100,note+h2hNote(matchup));
      }
      const specs=[
        ['player_shots','shots_total',[0.5,1.5,2.5,3.5],1],
        ['player_shots_on_target','shots_on',[0.5,1.5,2.5],1],
        ['player_tackles','tackles_total',[0.5,1.5,2.5,3.5],1],
        ['player_fouls','fouls_committed',[0.5,1.5,2.5],1]
      ];
      for(const [family,key,lines,scale] of specs){
        if(h.position==='G')continue;
        const rate=playerRate(h,key); if(!rate)continue;
        const lambda=clamp(rate.per90*minutesScale*scale,0.05,12);
        for(const v of countLines(lambda,lines)){
          addSelection(out,family,prefix+'_'+key.toUpperCase()+'_O'+v.line,name+' over '+v.line+' '+key.replace(/_/g,' '),v.over_pct,note);
          addSelection(out,family,prefix+'_'+key.toUpperCase()+'_U'+v.line,name+' under '+v.line+' '+key.replace(/_/g,' '),v.under_pct,note);
        }
      }
      const foulsWon=playerRate(h,'fouls_drawn');
      if(h.position!=='G'&&foulsWon){
        const lambda=clamp(foulsWon.per90*minutesScale,0.05,8);
        for(const v of countLines(lambda,[0.5,1.5,2.5])){
          addSelection(out,'player_fouls',prefix+'_FOULS_WON_O'+v.line,name+' over '+v.line+' fouls won',v.over_pct,note);
          addSelection(out,'player_fouls',prefix+'_FOULS_WON_U'+v.line,name+' under '+v.line+' fouls won',v.under_pct,note);
        }
      }
      const passes=playerRate(h,'passes_total');
      if(passes){
        const lambda=clamp(passes.per90*minutesScale,1,120);
        for(const v of countLines(lambda,passLines(lambda))){
          addSelection(out,'player_passes',prefix+'_PASSES_O'+v.line,name+' over '+v.line+' passes',v.over_pct,note);
          addSelection(out,'player_passes',prefix+'_PASSES_U'+v.line,name+' under '+v.line+' passes',v.under_pct,note);
        }
      }
      const cardRate=playerCardRate(h);
      if(cardRate!==null){
        const scale=Number.isFinite(team.cardLambda)?clamp(team.cardLambda/2,0.65,1.5):1;
        const p=clamp(cardRate*scale,.01,.75);
        addSelection(out,'player_card',prefix+'_YES',name+' to receive a card',p*100,note);
        addSelection(out,'player_card',prefix+'_NO',name+' not to receive a card',(1-p)*100,note);
      }
      if(h.position==='G'){
        const saves=playerRate(h,'saves');
        if(saves&&saves.count>0){
          const lambda=clamp(saves.per90*minutesScale,0.05,12);
          for(const v of countLines(lambda,[1.5,2.5,3.5,4.5,5.5])){
            addSelection(out,'goalkeeper_saves',prefix+'_SAVES_O'+v.line,name+' over '+v.line+' saves',v.over_pct,note);
            addSelection(out,'goalkeeper_saves',prefix+'_SAVES_U'+v.line,name+' under '+v.line+' saves',v.under_pct,note);
          }
        }
      }
    }
  }
  return out;
}

function buildTimelinePlayerMarkets(evidence,target,context={}){
  const out={};
  const first=firstGoalProjection(evidence,target,context.score_cells||[],context.goal_anchors||{home:1,away:1});
  if(first){
    const firstNote='First-goal model combines the coherent no-goal scoreline mass with recent first-goal history and team goal intensities.';
    addSelection(out,'team_to_score_first','HOME',target.teams.home.name+' to score first',first.home_pct,firstNote);
    addSelection(out,'team_to_score_first','AWAY',target.teams.away.name+' to score first',first.away_pct,firstNote);
    addSelection(out,'team_to_score_first','NO_GOAL','No goal',first.no_goal_pct,firstNote);
  }

  const red=redCardMarkets(evidence,target);
  if(red){
    const note='Red-card event model from completed historical card events; active-player rows are used where available. Test-only and uncalibrated.';
    addSelection(out,'red_card','MATCH_YES','Red card in match – Yes',red.match_probability*100,note);
    addSelection(out,'red_card','MATCH_NO','Red card in match – No',(1-red.match_probability)*100,note);
    addSelection(out,'red_card','HOME_YES',target.teams.home.name+' red card – Yes',red.home.probability*100,note);
    addSelection(out,'red_card','AWAY_YES',target.teams.away.name+' red card – Yes',red.away.probability*100,note);
  }

  const pen=penaltyMarkets(evidence,target);
  if(pen){
    const note='Confirmed-penalty event model from historical penalty/missed-penalty/VAR-confirmed evidence. Test-only and uncalibrated.';
    addSelection(out,'penalty_awarded','MATCH_YES','Penalty awarded – Yes',pen.match_probability*100,note);
    addSelection(out,'penalty_awarded','MATCH_NO','Penalty awarded – No',(1-pen.match_probability)*100,note);
    addSelection(out,'penalty_awarded','HOME_YES',target.teams.home.name+' awarded a penalty – Yes',pen.home.probability*100,note);
    addSelection(out,'penalty_awarded','AWAY_YES',target.teams.away.name+' awarded a penalty – Yes',pen.away.probability*100,note);
  }

  const booking=bookingPointMarkets(evidence,target);
  if(booking){
    const note='Booking points settlement: yellow=10, red=25, with a player capped at 35 when a red follows earlier yellow(s); 90-minute active-player events only where player data is available.';
    for(const [scope,values] of [['HOME',booking.home],['AWAY',booking.away]]){
      const dist=new Map();
      for(const n of values)dist.set(n,(dist.get(n)||0)+1/values.length);
      for(const line of [19.5,29.5,39.5,49.5,59.5]){
        let over=0;for(const [n,p] of dist)if(n>line)over+=p;
        addSelection(out,'booking_points',scope+'_O'+line,(scope==='HOME'?target.teams.home.name:target.teams.away.name)+' over '+line+' booking points',over*100,note);
        addSelection(out,'booking_points',scope+'_U'+line,(scope==='HOME'?target.teams.home.name:target.teams.away.name)+' under '+line+' booking points',(1-over)*100,note);
      }
    }
    for(const line of [29.5,39.5,49.5,59.5,69.5,79.5]){
      let over=0;for(const [n,p] of booking.match)if(n>line)over+=p;
      addSelection(out,'booking_points','MATCH_O'+line,'Match over '+line+' booking points',over*100,note);
      addSelection(out,'booking_points','MATCH_U'+line,'Match under '+line+' booking points',(1-over)*100,note);
    }
  }

  const player=playerMarketProjection(evidence,target,context);
  for(const [family,rows] of Object.entries(player))out[family]=[...(out[family]||[]),...rows];
  return out;
}

module.exports={
  firstGoalHistory,firstGoalProjection,redCardMarkets,penaltyMarkets,
  bookingPointsForFixtureTeam,bookingPointMarkets,playerHistories,playerEligibility,
  playerRate,playerMarketProjection,buildTimelinePlayerMarkets
};
