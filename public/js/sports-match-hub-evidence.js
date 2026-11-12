(function(){
 'use strict';
 var data=null,day='',state='',query='';
 var $=function(id){return document.getElementById(id);};
 var fmt=function(value){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value))+' SAST';};
 var ymd=function(value){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));};
 function node(tag,text,cls){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function showStatus(text){$('system-status-text').textContent=text;}
 function message(title,text,login){var box=$('fixture-panel');box.replaceChildren(node('h2',title),node('p',text));if(login){var a=node('a','Sign in with Microsoft','btn');a.href='login.html?next=sports-match-hub.html';a.addEventListener('click',function(){sessionStorage.setItem('c13_after_auth','sports-match-hub.html');});box.appendChild(a);} }
 function stat(label,value){var card=node('div',undefined,'smh-funnel-stage');card.append(node('span',label),node('strong',String(value)));return card;}
 function render(){
  var now=Date.now(),rows=data.fixtures.filter(function(f){return(!day||ymd(f.kickoff_at)===day)&&(!state||f.status===state)&&(!query||(f.home_team+' '+f.away_team).toLowerCase().includes(query));});
  $('result-count').textContent=rows.length+' of '+data.fixtures.length+' fixtures';
  var root=$('fixture-panel');root.replaceChildren();if(!rows.length){root.append(node('p','No saved fixtures match these filters.'));return;}
  var table=node('table',undefined,'smh-table'),head=node('thead'),tr=node('tr');['Fixture','Kickoff (SAST)','Saved forecast','Confidence','Decision / evidence'].forEach(function(t){tr.appendChild(node('th',t));});head.appendChild(tr);table.appendChild(head);var body=node('tbody');
  rows.forEach(function(f){var r=node('tr');r.append(node('td',f.home_team+' vs '+f.away_team),node('td',fmt(f.kickoff_at)));
   var pick=f.prediction==='home_win'?f.home_team+' to win':f.prediction==='away_win'?f.away_team+' to win':f.prediction==='draw'?'Draw':'No forecast';
   r.appendChild(node('td',f.status==='SAVED_PREMATCH'?pick:'On hold'));r.appendChild(node('td',f.confidence_pct===undefined?'—':f.confidence_pct+'%'));
   var detail=node('td');
   if(f.status==='HELD')detail.append(node('p',f.hold_reason==='BELOW_MINIMUM_CONFIDENCE'?'Below the existing confidence requirement.':'Insufficient completed-match history.'));
   else{detail.append(node('p','Independent comparison: GREEN. Result: pending.'),node('p','Forecast sealed: '+fmt(f.committed_at)),node('p','Saved: '+fmt(f.persisted_at)));
    if(now>=Date.parse(f.kickoff_at))detail.appendChild(node('p','Kickoff has passed. This is the original saved pre-match forecast; the result has not been verified.'));
    var d=node('details'),s=node('summary','Record evidence');d.append(s,node('p','Prediction record: '+f.prediction_record_id),node('p','Linked Pending record: '+f.pending_record_id));detail.appendChild(d);
   }r.appendChild(detail);body.appendChild(r);
  });table.appendChild(body);var wrap=node('div',undefined,'smh-evidence-scroll');wrap.appendChild(table);root.appendChild(wrap);
 }
 function display(snapshot){
  if(snapshot.schema_version!=='soccer-website-evidence-v1'||snapshot.test_only!==true||snapshot.fixtures.length!==52)throw Error('Unexpected evidence response');data=snapshot;
  showStatus('Saved test evidence');$('hub-account-link').textContent='Account';$('hub-account-link').href='subscription.html';$('freshness-indicator').textContent='Source collected '+fmt(data.source_observed_at)+' · Forecasts saved '+fmt(data.predictions_saved_at);
  $('evidence-notice').textContent='Real Nations League test records · Uncalibrated · Snapshot from 12 November 2026 · This page reads saved evidence; it does not create forecasts or update match results.';
  var counts=data.counts;$('lifecycle-funnel').replaceChildren(stat('Fixtures archived',counts.archived),stat('Historical evidence only',counts.historical_evidence_only),stat('Upcoming at cutoff',counts.upcoming_at_cutoff),stat('Saved pre-match forecasts',counts.saved_prematch),stat('History holds',counts.held_history),stat('Confidence holds',counts.held_confidence));
  var dates=[...new Set(data.fixtures.map(function(f){return ymd(f.kickoff_at);}))];var select=$('filter-date');dates.forEach(function(d){var o=node('option',d);o.value=d;select.appendChild(o);});
  $('evidence-fingerprints').textContent='Source SHA-256: '+data.source_sha256+' · Saved prediction batch SHA-256: '+data.prediction_batch_sha256;
  $('hub-filters').hidden=false;render();
 }
 async function load(){
  showStatus('Checking access');data=null;$('hub-account-link').textContent='Login';$('hub-account-link').href='login.html?next=sports-match-hub.html';$('hub-filters').hidden=true;$('lifecycle-funnel').replaceChildren();$('result-count').textContent='';$('freshness-indicator').textContent='';$('evidence-fingerprints').textContent='';$('filter-date').replaceChildren(node('option','All saved fixture dates'));$('filter-date').firstChild.value='';day='';var token;try{token=sessionStorage.getItem('c13_microsoft_access_token');}catch{}
  if(!token){showStatus('Sign-in required');message('Private test evidence','Use your existing linked Microsoft sign-in to see the real fixtures, saved forecasts and HOLD reasons.',true);return;}
  message('Loading saved evidence','Retrieving the verified test snapshot.');
  try{var response=await fetch('/api/evidence/nations-league',{method:'GET',headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(20000)});
   if(response.status===401||response.status===403){showStatus('Sign-in required');message('Sign-in required','The current session cannot access these private test records. Sign in with the existing linked Microsoft account.',true);return;}
   if(!response.ok)throw Error('Evidence unavailable');display(await response.json());
  }catch{showStatus('Evidence unavailable');message('Saved evidence unavailable','The test records could not be loaded. No mock fixtures or forecasts are being shown. Use Refresh evidence to try again.');}
 }
 $('filter-date').addEventListener('change',function(e){day=e.target.value;render();});$('filter-lifecycle').addEventListener('change',function(e){state=e.target.value;render();});$('filter-team').addEventListener('input',function(e){query=e.target.value.trim().toLowerCase();if(data)render();});$('refresh-evidence').addEventListener('click',load);
 load();
})();
