'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {
  maxLegsAllowed,tierFor,contradictory,buildSameMatchOffers
}=require('../backend/services/sameMatchOfferEngine');

const fixture={home_team:'Alpha FC',away_team:'Beta FC'};

function row(code,p,label){return {code,probability_pct:p,label};}
function richMarkets(){
  return {
    total_goals:[row('O1.5',91,'Over 1.5'),row('O2.5',79,'Over 2.5')],
    team_total_goals:[row('H-O0.5',94,'Alpha FC Over 0.5'),row('H-O1.5',78,'Alpha FC Over 1.5')],
    btts:[row('NO',72,'BTTS No'),row('YES',28,'BTTS Yes')],
    clean_sheet:[row('HOME-YES',68,'Alpha FC clean sheet')],
    team_to_score:[row('HOME-YES',95,'Alpha FC to score — Yes'),row('AWAY-NO',72,'Beta FC to score — No')],
    corners_total:[row('O6.5',92,'Over 6.5 corners'),row('O8.5',76,'Over 8.5 corners')],
    corners_team:[row('H-O3.5',84,'Alpha FC corners Over 3.5')],
    cards_total:[row('O1.5',90,'Over 1.5 cards'),row('O2.5',73,'Over 2.5 cards')],
    half_result:[row('FIRST_HOME',71,'Alpha FC first-half win')],
    half_total_goals:[row('FIRST_O0.5',83,'First half Over 0.5')],
    player_shots_on_target:[row('P10_SHOTS_ON_O0.5',82,'Lead Striker (Alpha FC expected) over 0.5 shots on target')],
    player_shots:[row('P10_SHOTS_TOTAL_O1.5',88,'Lead Striker (Alpha FC expected) over 1.5 shots')],
    player_goal:[row('P10_ANYTIME',64,'Lead Striker (Alpha FC expected) anytime scorer')],
    goalkeeper_saves:[row('P99_SAVES_O1.5',81,'Beta Keeper (Beta FC expected) over 1.5 saves')],
    player_tackles:[row('P20_TACKLES_TOTAL_O0.5',86,'Alpha Defender (Alpha FC expected) over 0.5 tackles')],
    player_passes:[row('P30_PASSES_O29.5',85,'Alpha Midfielder (Alpha FC expected) over 29.5 passes')],
    red_card:[row('MATCH_NO',88,'Red card in match – No')],
    penalty_awarded:[row('MATCH_NO',89,'Penalty awarded – No')],
    booking_points:[row('MATCH_U79.5',80,'Match under 79.5 booking points')]
  };
}

test('locked Gulf-in-Class leg caps are applied from favourite win probability',()=>{
  assert.equal(maxLegsAllowed({home_win:49,draw:26,away_win:25},null,fixture),2);
  assert.equal(maxLegsAllowed({home_win:55,draw:25,away_win:20},null,fixture),4);
  assert.equal(maxLegsAllowed({home_win:70,draw:18,away_win:12},null,fixture),6);
  assert.equal(maxLegsAllowed({home_win:81,draw:12,away_win:7},null,fixture),8);
});

test('customer tier names use approved SKCS branding',()=>{
  assert.equal(tierFor(31).label,'Statistical Edge');
  assert.equal(tierFor(20).label,'Speculative Edge');
  assert.equal(tierFor(10).label,'High-Variance Play');
  assert.equal(tierFor(7.99),null);
});

test('hard contradictions are blocked before combination scoring',()=>{
  const a={family:'match_result_1x2',code:'HOME',label:'Alpha FC win',probability_pct:80};
  a.meta={family:a.family,code:'HOME',label:a.label,side:'HOME',process:'result',direction:'HOME',line:null,player:null};
  const b={family:'clean_sheet',code:'AWAY-YES',label:'Beta FC clean sheet',probability_pct:70};
  b.meta={family:b.family,code:b.code,label:b.label,side:'AWAY',process:'goals',direction:'neutral',line:null,player:null};
  assert.equal(contradictory(a,b,fixture),true);

  const c={family:'total_goals',code:'O2.5',label:'Over 2.5',probability_pct:70};
  c.meta={family:c.family,code:c.code,label:c.label,side:null,process:'goals',direction:'OVER',line:2.5,player:null};
  const d={family:'goal_range',code:'0-1',label:'0–1 goals',probability_pct:60};
  d.meta={family:d.family,code:d.code,label:d.label,side:null,process:'goals',direction:'neutral',line:null,player:null};
  assert.equal(contradictory(c,d,fixture),true);
});

test('strong fixture produces ranked top-three 4/6/8-leg offers with tier labels',()=>{
  const result=buildSameMatchOffers({
    market_probabilities:richMarkets(),
    probabilities_pct:{home_win:82,draw:11,away_win:7},
    fixture
  });
  assert.equal(result.max_legs,8);
  for(const size of [4,6,8]){
    assert.equal(result.sizes[size].available,true,'expected '+size+'-leg availability');
    assert.ok(result.sizes[size].offers.length>=1&&result.sizes[size].offers.length<=3);
    for(const offer of result.sizes[size].offers){
      assert.equal(offer.legs.length,size);
      assert.ok(offer.joint_probability_pct>=8);
      assert.ok(['Statistical Edge','Speculative Edge','High-Variance Play'].includes(offer.tier_label));
      assert.equal(new Set(offer.legs.map(x=>x.family+':'+x.code)).size,size);
    }
  }
});

test('6-leg fixture greys 8-leg tab with simple Insufficient data wording',()=>{
  const result=buildSameMatchOffers({
    market_probabilities:richMarkets(),
    probabilities_pct:{home_win:72,draw:17,away_win:11},
    fixture
  });
  assert.equal(result.max_legs,6);
  assert.equal(result.sizes[8].available,false);
  assert.equal(result.sizes[8].display,'Insufficient data');
  assert.equal(result.sizes[8].status,'INSUFFICIENT_DATA');
});

test('weak fixture does not manufacture 4/6/8-leg offers',()=>{
  const result=buildSameMatchOffers({
    market_probabilities:richMarkets(),
    probabilities_pct:{home_win:44,draw:31,away_win:25},
    fixture
  });
  assert.equal(result.max_legs,2);
  for(const size of [4,6,8]){
    assert.equal(result.sizes[size].available,false);
    assert.equal(result.sizes[size].display,'Insufficient data');
    assert.deepEqual(result.sizes[size].offers,[]);
  }
});