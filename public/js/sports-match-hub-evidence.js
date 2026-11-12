(function(){
  'use strict';

  var data=null;
  var selectedDay=0;
  var lifecycle='';
  var query='';
  var detailId='';

  var $=function(id){return document.getElementById(id);};
  var DAY_LABELS=['Today','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7','Day 8'];
  var STAGES=[
    {code:'ADMITTED',label:'Admitted',cls:'admitted'},
    {code:'EVIDENCE_REVIEW',label:'Evidence Review',cls:'evidence'},
    {code:'CONTEXT_REVIEW',label:'Context Review',cls:'context'},
    {code:'STABILITY_REVIEW',label:'Stability Review',cls:'stability'},
    {code:'PUBLICATION_REVIEW',label:'Publication Review',cls:'publication'},
    {code:'FINAL_DECISION',label:'Final Decision',cls:'final'}
  ];

  function node(tag,text,cls){
    var e=document.createElement(tag);
    if(text!==undefined)e.textContent=text;
    if(cls)e.className=cls;
    return e;
  }

  function fmt(value){
    return new Intl.DateTimeFormat('en-ZA',{
      timeZone:'Africa/Johannesburg',
      day:'2-digit',month:'short',year:'numeric',
      hour:'2-digit',minute:'2-digit',hourCycle:'h23'
    }).format(new Date(value))+' SAST';
  }

  function ymd(value){
    return new Intl.DateTimeFormat('en-CA',{
      timeZone:'Africa/Johannesburg',
      year:'numeric',month:'2-digit',day:'2-digit'
    }).format(new Date(value));
  }

  function windowBase(){
    return new Date(ymd(data.source_observed_at||data.predictions_saved_at)+'T12:00:00+02:00');
  }

  function dateForOffset(offset){
    var d=new Date(windowBase());
    d.setDate(d.getDate()+offset);
    return d;
  }

  function ymdForOffset(offset){
    return ymd(dateForOffset(offset));
  }

  function tabDate(offset){
    return new Intl.DateTimeFormat('en-ZA',{
      timeZone:'Africa/Johannesburg',
      day:'2-digit',month:'short'
    }).format(dateForOffset(offset));
  }

  function showStatus(text){
    $('system-status-text').textContent=text;
  }

  function announce(text){
    var live=$('status-announcer');
    if(!live)return;
    live.textContent='';
    setTimeout(function(){live.textContent=text;},10);
  }

  function message(title,text,login){
    var box=$('fixture-panel');
    box.replaceChildren(node('h2',title),node('p',text));
    if(login){
      var a=node('a','Sign in with Microsoft','btn btn--primary');
      a.href='login.html?next=sports-match-hub.html';
      a.addEventListener('click',function(){
        try{sessionStorage.setItem('c13_after_auth','sports-match-hub.html');}catch(e){}
      });
      box.appendChild(a);
    }
  }

  function stageFor(f){
    if(f.status==='HELD' && f.hold_reason==='INSUFFICIENT_COMPLETED_MATCH_HISTORY'){
      return {code:'EVIDENCE_REVIEW',label:'Evidence Review',state:'HELD',stateLabel:'On Hold'};
    }
    if(f.status==='HELD'){
      return {code:'STABILITY_REVIEW',label:'Stability Review',state:'HELD',stateLabel:'On Hold'};
    }
    return {code:'FINAL_DECISION',label:'Final Decision',state:'FINAL_APPROVED',stateLabel:'Review Complete'};
  }

  function stateClass(code){
    return 'lifecycle-badge lifecycle-badge--'+String(code||'').toLowerCase().replace(/_/g,'-');
  }

  function stageClass(code){
    var match=STAGES.find(function(s){return s.code===code;});
    return 'stage-badge stage-badge--'+(match?match.cls:'admitted');
  }

  function pickText(f){
    if(f.status!=='SAVED_PREMATCH')return 'No forecast';
    if(f.prediction==='home_win')return f.home_team+' to win';
    if(f.prediction==='away_win')return f.away_team+' to win';
    if(f.prediction==='draw')return 'Draw';
    return 'Saved pre-match forecast';
  }

  function summaryText(f){
    if(f.status==='HELD' && f.hold_reason==='INSUFFICIENT_COMPLETED_MATCH_HISTORY'){
      return 'Stopped at Evidence Review: insufficient completed-match history.';
    }
    if(f.status==='HELD'){
      return 'Stopped at Stability Review: below the existing confidence requirement.';
    }
    return 'Edge sealed → Scout Shadow GREEN → saved pre-match. Result pending.';
  }

  function selectedRows(){
    if(!data)return [];
    var date=ymdForOffset(selectedDay);
    return data.fixtures.filter(function(f){
      var info=stageFor(f);
      if(ymd(f.kickoff_at)!==date)return false;
      if(lifecycle && info.state!==lifecycle)return false;
      if(query && (f.home_team+' '+f.away_team).toLowerCase().indexOf(query)===-1)return false;
      return true;
    }).sort(function(a,b){return a.kickoff_at.localeCompare(b.kickoff_at);});
  }

  function renderDayTabs(){
    var root=$('day-tabs');
    root.replaceChildren();
    for(var i=0;i<8;i++){
      (function(offset){
        var b=node('button',undefined,'day-tab'+(selectedDay===offset?' day-tab--active':''));
        b.type='button';
        b.setAttribute('role','tab');
        b.setAttribute('aria-selected',selectedDay===offset?'true':'false');
        b.setAttribute('aria-controls','fixture-panel');
        b.dataset.day=String(offset);
        b.append(node('span',DAY_LABELS[offset],'day-tab__label'),node('span',tabDate(offset),'day-tab__date'));
        b.addEventListener('click',function(){
          selectedDay=offset;
          detailId='';
          render();
          announce(DAY_LABELS[offset]+' selected');
        });
        root.appendChild(b);
      })(i);
    }
  }

  function funnelCard(stage,count,total){
    var card=node('article',undefined,'funnel-stage funnel-stage--'+stage.cls);
    var pct=total?Math.round((count/total)*100):0;
    card.append(
      node('span',String(STAGES.indexOf(stage)+1)+'.','funnel-stage__seq'),
      node('div','●','funnel-stage__icon'),
      node('p',stage.label,'funnel-stage__label'),
      node('p',String(count),'funnel-stage__count'),
      node('p',String(pct)+'%','funnel-stage__percent')
    );
    return card;
  }

  function renderFunnel(){
    var dayRows=data.fixtures.filter(function(f){return ymd(f.kickoff_at)===ymdForOffset(selectedDay);});
    var total=dayRows.length;
    var history=dayRows.filter(function(f){return f.status==='HELD'&&f.hold_reason==='INSUFFICIENT_COMPLETED_MATCH_HISTORY';}).length;
    var confidence=dayRows.filter(function(f){return f.status==='HELD'&&f.hold_reason!=='INSUFFICIENT_COMPLETED_MATCH_HISTORY';}).length;
    var afterHistory=total-history;
    var passed=afterHistory-confidence;
    var values=[total,afterHistory,afterHistory,passed,passed,passed];
    var root=$('lifecycle-funnel');
    root.replaceChildren();
    STAGES.forEach(function(stage,i){root.appendChild(funnelCard(stage,values[i],total));});
  }

  function movementCard(label,value){
    var c=node('div',undefined,'movement-card');
    c.append(node('p',label,'movement-card__label'),node('p',String(value),'movement-card__value'));
    return c;
  }

  function renderMovement(){
    var dateRows=data.fixtures.filter(function(f){return ymd(f.kickoff_at)===ymdForOffset(selectedDay);});
    var complete=dateRows.filter(function(f){return f.status==='SAVED_PREMATCH';}).length;
    var history=dateRows.filter(function(f){return f.status==='HELD'&&f.hold_reason==='INSUFFICIENT_COMPLETED_MATCH_HISTORY';}).length;
    var confidence=dateRows.filter(function(f){return f.status==='HELD'&&f.hold_reason!=='INSUFFICIENT_COMPLETED_MATCH_HISTORY';}).length;
    var root=$('movement-counters');
    root.replaceChildren(
      movementCard('Fixtures on selected day',dateRows.length),
      movementCard('Review complete',complete),
      movementCard('On hold',history+confidence),
      movementCard('History holds',history),
      movementCard('Confidence holds',confidence),
      movementCard('Pending results',complete)
    );
  }

  function renderLegend(){
    var root=$('lifecycle-legend');
    root.replaceChildren(
      node('span','Lifecycle States:','smh-legend__title'),
      node('span','Review Complete',stateClass('FINAL_APPROVED')),
      node('span','On Hold',stateClass('HELD'))
    );
  }

  function renderChips(){
    var root=$('filter-chips');
    root.replaceChildren();
    if(lifecycle){
      root.appendChild(node('span',lifecycle==='HELD'?'On Hold':'Review Complete','filter-chip'));
    }
    if(query){
      root.appendChild(node('span','Team: '+query,'filter-chip'));
    }
    $('clear-filters').hidden=!lifecycle&&!query;
  }

  function renderEdgeMind(){
    var all=data.fixtures.filter(function(f){return ymd(f.kickoff_at)===ymdForOffset(selectedDay);});
    var complete=all.filter(function(f){return f.status==='SAVED_PREMATCH';}).length;
    var held=all.length-complete;
    var history=all.filter(function(f){return f.status==='HELD'&&f.hold_reason==='INSUFFICIENT_COMPLETED_MATCH_HISTORY';}).length;
    var confidence=held-history;
    var root=$('edgemind-content');
    root.replaceChildren(
      node('p','Saved-evidence summary — no live inference.','smh-edgemind-mock-note')
    );
    var ul=node('ul',undefined,'smh-edgemind-list');
    [
      all.length+' fixture'+(all.length===1?'':'s')+' in the selected day.',
      complete+' reached Review Complete.',
      held+' are On Hold.',
      history+' history hold'+(history===1?'':'s')+'; '+confidence+' confidence hold'+(confidence===1?'':'s')+'.',
      'All shown forecasts were saved before kickoff.'
    ].forEach(function(t){
      var li=node('li');
      li.append(node('span','•','smh-edgemind-list__icon'),node('span',t));
      ul.appendChild(li);
    });
    root.appendChild(ul);
  }

  function renderTable(rows){
    var wrap=node('div',undefined,'fixture-table-wrap');
    var table=node('table',undefined,'fixture-table');
    var thead=node('thead');
    var hr=node('tr');
    ['Fixture','Competition','Kickoff','Stage','State','Status / Evidence',''].forEach(function(t){hr.appendChild(node('th',t));});
    thead.appendChild(hr);
    table.appendChild(thead);
    var body=node('tbody');

    rows.forEach(function(f){
      var info=stageFor(f);
      var tr=node('tr');
      var teams=node('td');
      teams.setAttribute('data-label','Fixture');
      var teamWrap=node('div',undefined,'fixture-teams');
      teamWrap.append(node('span',f.home_team+' vs '+f.away_team,'fixture-teams__names'));
      teams.appendChild(teamWrap);

      var comp=node('td','UEFA Nations League','fixture-competition');comp.setAttribute('data-label','Competition');
      var ko=node('td',fmt(f.kickoff_at));ko.setAttribute('data-label','Kickoff');
      var st=node('td');st.setAttribute('data-label','Stage');st.appendChild(node('span',info.label,stageClass(info.code)));
      var state=node('td');state.setAttribute('data-label','State');state.appendChild(node('span',info.stateLabel,stateClass(info.state)));
      var sum=node('td');sum.setAttribute('data-label','Status / Evidence');
      sum.append(node('span',summaryText(f),'fixture-summary'));
      if(f.status==='SAVED_PREMATCH'){
        sum.appendChild(node('div',pickText(f)+' · '+(f.confidence_pct===undefined?'—':f.confidence_pct+'% confidence'),'fixture-evidence'));
      }
      var action=node('td');action.setAttribute('data-label','Action');action.className='fixture-table__action-cell';
      var btn=node('button','View fixture','btn btn--ghost');
      btn.type='button';
      btn.addEventListener('click',function(){detailId=f.prediction_record_id||f.pending_record_id||f.home_team+'|'+f.away_team;renderFixtures();});
      action.appendChild(btn);
      tr.append(teams,comp,ko,st,state,sum,action);
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function findDetail(){
    return data.fixtures.find(function(f){
      return (f.prediction_record_id||f.pending_record_id||f.home_team+'|'+f.away_team)===detailId;
    });
  }

  function renderDetail(f){
    var info=stageFor(f);
    var box=node('article',undefined,'fixture-detail');
    var back=node('button','← Back to fixtures','btn btn--ghost');
    back.type='button';
    back.addEventListener('click',function(){detailId='';renderFixtures();});
    box.append(back,node('h2',f.home_team+' vs '+f.away_team,'fixture-detail__title'),node('p','Kickoff: '+fmt(f.kickoff_at)));
    box.appendChild(node('p','Current saved state: '+info.stateLabel+' at '+info.label+'.'));

    var ol=node('ol',undefined,'stage-stepper');
    var stopIndex=STAGES.findIndex(function(s){return s.code===info.code;});
    STAGES.forEach(function(s,i){
      var cls='stage-stepper__item';
      if(f.status==='SAVED_PREMATCH'){
        cls+=i===STAGES.length-1?' stage-stepper__item--active':' stage-stepper__item--done';
      }else if(i<stopIndex){
        cls+=' stage-stepper__item--done';
      }else if(i===stopIndex){
        cls+=' stage-stepper__item--active';
      }
      ol.appendChild(node('li',s.label,cls));
    });
    box.appendChild(ol);
    box.appendChild(node('p',summaryText(f),'fixture-detail__note'));

    if(f.status==='SAVED_PREMATCH'){
      var p=node('p');
      p.textContent='Saved forecast: '+pickText(f)+' · '+(f.confidence_pct===undefined?'—':f.confidence_pct+'%')+' · sealed '+fmt(f.committed_at)+' · saved '+fmt(f.persisted_at)+'.';
      box.appendChild(p);
      box.appendChild(node('p','Independent comparison: GREEN. Result: pending.'));
      if(f.prediction_record_id)box.appendChild(node('p','Prediction record: '+f.prediction_record_id,'fixture-evidence'));
      if(f.pending_record_id)box.appendChild(node('p','Linked Pending record: '+f.pending_record_id,'fixture-evidence'));
    }else{
      box.appendChild(node('p','No forecast was created for this held fixture.'));
    }
    box.appendChild(node('p','This immutable canary snapshot records the final governed outcome. It does not contain per-stage timestamps, so the page does not invent them.','fixture-detail__note'));
    return box;
  }

  function renderFixtures(){
    var root=$('fixture-panel');
    root.replaceChildren();
    if(detailId){
      var f=findDetail();
      if(f){root.appendChild(renderDetail(f));return;}
      detailId='';
    }
    var rows=selectedRows();
    $('result-count').textContent=rows.length+' fixture'+(rows.length===1?'':'s')+' on '+tabDate(selectedDay);
    if(!rows.length){
      root.appendChild(node('div',undefined,'ui-state-block'));
      root.firstChild.append(node('h2','No fixtures for '+tabDate(selectedDay),'ui-state-block__heading'),node('p','The saved test batch contains no fixtures matching this day and filter combination.'));
      return;
    }
    root.appendChild(renderTable(rows));
  }

  function render(){
    if(!data)return;
    renderDayTabs();
    renderFunnel();
    renderMovement();
    renderLegend();
    renderChips();
    renderEdgeMind();
    renderFixtures();
  }

  function display(snapshot){
    if(snapshot.schema_version!=='soccer-website-evidence-v1'||snapshot.test_only!==true||snapshot.fixtures.length!==52){
      throw Error('Unexpected evidence response');
    }
    data=snapshot;
    showStatus('Saved test evidence');
    $('hub-account-link').textContent='Account';
    $('hub-account-link').href='subscription.html';
    $('hub-controls').hidden=false;
    $('secondary-controls').hidden=false;
    $('funnel-panel').hidden=false;
    $('edgemind-panel').hidden=false;
    $('legend-panel').hidden=false;
    $('freshness-indicator').textContent='Source collected '+fmt(data.source_observed_at)+' · Forecasts saved '+fmt(data.predictions_saved_at);
    $('evidence-notice').textContent='Real Nations League test records · Uncalibrated · Snapshot from 12 November 2026. Use the rolling day controls to inspect where each fixture finished in the governed review.';
    $('evidence-fingerprints').textContent='Source SHA-256: '+data.source_sha256+' · Saved prediction batch SHA-256: '+data.prediction_batch_sha256;
    render();
  }

  async function load(){
    showStatus('Checking access');
    data=null;
    detailId='';
    $('hub-account-link').textContent='Login';
    $('hub-account-link').href='login.html?next=sports-match-hub.html';
    $('hub-controls').hidden=true;
    $('secondary-controls').hidden=true;
    $('funnel-panel').hidden=true;
    $('edgemind-panel').hidden=true;
    $('legend-panel').hidden=true;
    $('result-count').textContent='';
    $('freshness-indicator').textContent='';
    $('evidence-fingerprints').textContent='';

    var token;
    try{token=sessionStorage.getItem('c13_microsoft_access_token');}catch(e){}
    if(!token){
      showStatus('Sign-in required');
      message('Private test evidence','Use your existing linked Microsoft sign-in to see the real fixtures, saved forecasts and HOLD reasons.',true);
      return;
    }

    message('Loading saved evidence','Retrieving the verified test snapshot.');
    try{
      var response=await fetch('/api/evidence/nations-league',{
        method:'GET',
        headers:{Authorization:'Bearer '+token},
        cache:'no-store',
        credentials:'same-origin',
        redirect:'error',
        signal:AbortSignal.timeout(20000)
      });
      if(response.status===401||response.status===403){
        showStatus('Sign-in required');
        message('Sign-in required','The current session cannot access these private test records. Sign in with the existing linked Microsoft account.',true);
        return;
      }
      if(!response.ok)throw Error('Evidence unavailable');
      display(await response.json());
    }catch(e){
      showStatus('Evidence unavailable');
      message('Saved evidence unavailable','The test records could not be loaded. No mock fixtures or forecasts are being shown. Use Refresh evidence to try again.');
    }
  }

  $('filter-lifecycle').addEventListener('change',function(e){lifecycle=e.target.value;detailId='';render();});
  $('filter-team').addEventListener('input',function(e){query=e.target.value.trim().toLowerCase();detailId='';if(data)render();});
  $('clear-filters').addEventListener('click',function(){lifecycle='';query='';$('filter-lifecycle').value='';$('filter-team').value='';detailId='';render();});
  $('refresh-evidence').addEventListener('click',load);
  $('filter-toggle').addEventListener('click',function(){
    var sheet=$('filter-sheet');
    var opening=sheet.hidden;
    sheet.hidden=!opening;
    $('filter-toggle').setAttribute('aria-expanded',opening?'true':'false');
  });
  $('nav-toggle').addEventListener('click',function(){
    var nav=$('site-nav');
    var opening=!nav.classList.contains('site-nav--open');
    nav.classList.toggle('site-nav--open',opening);
    $('nav-toggle').setAttribute('aria-expanded',opening?'true':'false');
  });

  load();
})();