'use strict';

const TABS=Object.freeze({
  ONE_X_TWO:'1X2',
  SECONDARY:'SECONDARY_OUTCOMES',
  SAME_MATCH:'SAME_MATCH_BET',
  DOUBLE_CHANCE:'DOUBLE_CHANCE_AND_COMBINATIONS'
});

const STATUS=Object.freeze({
  ACTIVE:'ACTIVE',
  DERIVABLE:'DERIVABLE',
  REQUIRES_EVIDENCE:'REQUIRES_EVIDENCE'
});

const families=[
  {
    id:'match_result_1x2',tab:TABS.ONE_X_TWO,label:'1X2',status:STATUS.ACTIVE,
    outcomes:['HOME','DRAW','AWAY'],probability_semantics:'MUTUALLY_EXCLUSIVE_SUM_100',
    engine:'SEALED_1X2',gate_family:'ONE_X_TWO',
    evidence:['team_strength','team_form','team_h2h','lineup_availability','goalkeeper','player_matchups','tactics','venue','travel_fatigue','weather','referee_context','scout_shadow']
  },
  {
    id:'draw_no_bet',tab:TABS.SECONDARY,label:'Draw No Bet',status:STATUS.REQUIRES_EVIDENCE,
    outcomes:['HOME','AWAY','PUSH_DRAW'],probability_semantics:'WIN_PUSH_LOSS_VECTOR',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'DRAW_NO_BET',
    evidence:['scoreline_distribution','team_strength','lineup_availability','team_h2h']
  },
  {
    id:'total_goals',tab:TABS.SECONDARY,label:'Total Goals Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{line:'NON_NEGATIVE_HALF_OR_ASIAN_LINE'},
    outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],probability_semantics:'GOAL_COUNT_DISTRIBUTION',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'TOTAL_GOALS',
    evidence:['scoreline_distribution','xg_xga','shots','finishing','goalkeeper','striker_defender_h2h','weather','lineup_availability','tactics']
  },
  {
    id:'team_total_goals',tab:TABS.SECONDARY,label:'Team Total Goals Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY'],line:'NON_NEGATIVE_HALF_OR_ASIAN_LINE'},
    outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],probability_semantics:'TEAM_GOAL_COUNT_DISTRIBUTION',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'TEAM_TOTAL_GOALS',
    evidence:['team_score_distribution','xg_xga','shots','finishing','goalkeeper','striker_defender_h2h','lineup_availability','tactics']
  },
  {
    id:'btts',tab:TABS.SECONDARY,label:'Both Teams To Score',status:STATUS.REQUIRES_EVIDENCE,
    outcomes:['YES','NO'],probability_semantics:'SCORELINE_EVENT_PROBABILITY',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'BTTS',
    evidence:['scoreline_distribution','team_attack_defence','goalkeeper','lineup_availability','team_h2h','player_matchups']
  },
  {
    id:'correct_score',tab:TABS.SECONDARY,label:'Correct Score',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{home_goals:'INTEGER_0_PLUS',away_goals:'INTEGER_0_PLUS'},
    outcomes:['EXACT_SCORELINE'],probability_semantics:'SCORELINE_CELL_PROBABILITY',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'CORRECT_SCORE',
    evidence:['scoreline_distribution']
  },
  {
    id:'exact_total_goals',tab:TABS.SECONDARY,label:'Exact Total Goals',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{goals:'INTEGER_0_PLUS'},outcomes:['EXACT_TOTAL'],probability_semantics:'TOTAL_GOAL_MASS',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'EXACT_TOTAL_GOALS',evidence:['scoreline_distribution']
  },
  {
    id:'goal_range',tab:TABS.SECONDARY,label:'Goal Range / Multigoals',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{min:'INTEGER_0_PLUS',max:'INTEGER_0_PLUS_OR_INF'},outcomes:['IN_RANGE','OUTSIDE_RANGE'],
    probability_semantics:'TOTAL_GOAL_RANGE_MASS',engine:'SCORELINE_DISTRIBUTION',gate_family:'GOAL_RANGE',
    evidence:['scoreline_distribution']
  },
  {
    id:'clean_sheet',tab:TABS.SECONDARY,label:'Clean Sheet',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY']},outcomes:['YES','NO'],probability_semantics:'OPPONENT_ZERO_GOALS_EVENT',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'CLEAN_SHEET',
    evidence:['scoreline_distribution','goalkeeper','defence','opponent_attack','lineup_availability']
  },
  {
    id:'win_to_nil',tab:TABS.SECONDARY,label:'Win To Nil',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY']},outcomes:['YES','NO'],probability_semantics:'WIN_AND_OPPONENT_ZERO_EVENT',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'WIN_TO_NIL',
    evidence:['scoreline_distribution','goalkeeper','defence','attack','lineup_availability']
  },
  {
    id:'winning_margin',tab:TABS.SECONDARY,label:'Winning Margin',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY'],min_margin:'INTEGER_1_PLUS',max_margin:'INTEGER_1_PLUS_OR_INF'},
    outcomes:['IN_MARGIN','OUTSIDE_MARGIN'],probability_semantics:'SCORE_DIFFERENCE_MASS',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'WINNING_MARGIN',evidence:['scoreline_distribution']
  },
  {
    id:'team_to_score',tab:TABS.SECONDARY,label:'Team To Score',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY']},outcomes:['YES','NO'],probability_semantics:'TEAM_GOALS_ZERO_VS_POSITIVE',
    engine:'SCORELINE_DISTRIBUTION',gate_family:'TEAM_TO_SCORE',evidence:['team_score_distribution','attack','goalkeeper','lineup_availability']
  },
  {
    id:'team_to_score_first',tab:TABS.SECONDARY,label:'Team To Score First',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY']},outcomes:['YES','NO','NO_GOAL'],probability_semantics:'FIRST_GOAL_EVENT',
    engine:'EVENT_TIMELINE_SIMULATION',gate_family:'TEAM_TO_SCORE_FIRST',
    evidence:['goal_timing','starting_intensity','lineup_availability','attack_defence','player_matchups']
  },
  {
    id:'half_result',tab:TABS.SECONDARY,label:'Half Result 1X2',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{half:['FIRST','SECOND']},outcomes:['HOME','DRAW','AWAY'],probability_semantics:'HALF_SCORELINE_SUM_100',
    engine:'HALF_SCORELINE_DISTRIBUTION',gate_family:'HALF_RESULT',
    evidence:['half_score_distribution','goal_timing','starting_intensity','substitution_patterns','fatigue','lineup_availability']
  },
  {
    id:'half_total_goals',tab:TABS.SECONDARY,label:'Half Goals Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{half:['FIRST','SECOND'],line:'NON_NEGATIVE_HALF_OR_ASIAN_LINE'},
    outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],probability_semantics:'HALF_GOAL_COUNT_DISTRIBUTION',
    engine:'HALF_SCORELINE_DISTRIBUTION',gate_family:'HALF_TOTAL_GOALS',
    evidence:['half_score_distribution','goal_timing','tactics','fatigue','substitution_patterns']
  },
  {
    id:'half_btts',tab:TABS.SECONDARY,label:'Half Both Teams To Score',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{half:['FIRST','SECOND']},outcomes:['YES','NO'],probability_semantics:'HALF_SCORELINE_EVENT',
    engine:'HALF_SCORELINE_DISTRIBUTION',gate_family:'HALF_BTTS',evidence:['half_score_distribution']
  },
  {
    id:'team_win_either_half',tab:TABS.SECONDARY,label:'Team To Win Either Half',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY']},outcomes:['YES','NO'],probability_semantics:'HALF_RESULT_UNION_EVENT',
    engine:'HALF_SCORELINE_DISTRIBUTION',gate_family:'TEAM_WIN_EITHER_HALF',evidence:['half_score_distribution']
  },
  {
    id:'handicap_european',tab:TABS.SECONDARY,label:'European Handicap',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY'],line:'INTEGER'},outcomes:['HOME','DRAW','AWAY'],
    probability_semantics:'ADJUSTED_SCORE_DIFFERENCE_3WAY',engine:'SCORELINE_DISTRIBUTION',gate_family:'EUROPEAN_HANDICAP',
    evidence:['scoreline_distribution']
  },
  {
    id:'handicap_asian',tab:TABS.SECONDARY,label:'Asian Handicap',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY'],line:'ASIAN_QUARTER_LINE'},outcomes:['WIN','HALF_WIN','PUSH','HALF_LOSS','LOSS'],
    probability_semantics:'SETTLEMENT_STATE_VECTOR',engine:'SCORELINE_DISTRIBUTION',gate_family:'ASIAN_HANDICAP',
    evidence:['scoreline_distribution']
  },
  {
    id:'corners_total',tab:TABS.SECONDARY,label:'Total Corners Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{line:'NON_NEGATIVE_HALF_OR_ASIAN_LINE'},outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],
    probability_semantics:'CORNER_COUNT_DISTRIBUTION',engine:'CORNER_DISTRIBUTION',gate_family:'CORNERS_TOTAL',
    evidence:['corner_for_against','possession_territory','crosses','blocked_shots','shots','winger_defender_h2h','clearances','tactical_width','weather','lineup_availability']
  },
  {
    id:'corners_team',tab:TABS.SECONDARY,label:'Team Corners Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY'],line:'NON_NEGATIVE_HALF_OR_ASIAN_LINE'},outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],
    probability_semantics:'TEAM_CORNER_COUNT_DISTRIBUTION',engine:'CORNER_DISTRIBUTION',gate_family:'CORNERS_TEAM',
    evidence:['team_corner_for_against','winger_defender_h2h','crosses','blocked_shots','tactical_width','lineup_availability']
  },
  {
    id:'corners_most',tab:TABS.SECONDARY,label:'Most Corners / Corners 1X2',status:STATUS.REQUIRES_EVIDENCE,
    outcomes:['HOME','DRAW','AWAY'],probability_semantics:'CORNER_DIFFERENCE_3WAY',
    engine:'CORNER_DISTRIBUTION',gate_family:'CORNERS_MOST',evidence:['joint_corner_distribution']
  },
  {
    id:'corners_handicap',tab:TABS.SECONDARY,label:'Corner Handicap',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY'],line:'HANDICAP_LINE'},outcomes:['COVER','PUSH','NOT_COVER'],
    probability_semantics:'CORNER_DIFFERENCE_SETTLEMENT',engine:'CORNER_DISTRIBUTION',gate_family:'CORNERS_HANDICAP',
    evidence:['joint_corner_distribution']
  },
  {
    id:'corners_range',tab:TABS.SECONDARY,label:'Corner Range / Exact Corners',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{min:'INTEGER_0_PLUS',max:'INTEGER_0_PLUS_OR_INF'},outcomes:['IN_RANGE','OUTSIDE_RANGE'],
    probability_semantics:'CORNER_TOTAL_RANGE_MASS',engine:'CORNER_DISTRIBUTION',gate_family:'CORNERS_RANGE',
    evidence:['joint_corner_distribution']
  },
  {
    id:'cards_total',tab:TABS.SECONDARY,label:'Total Yellow Cards Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{line:'NON_NEGATIVE_HALF_OR_ASIAN_LINE'},outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],
    probability_semantics:'YELLOW_CARD_COUNT_DISTRIBUTION',engine:'CARD_DISTRIBUTION',gate_family:'CARDS_TOTAL',
    evidence:['referee_cards','team_discipline','player_discipline','duel_h2h','fouls','dribbles','rivalry_importance','lineup_availability']
  },
  {
    id:'cards_team',tab:TABS.SECONDARY,label:'Team Yellow Cards Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['HOME','AWAY'],line:'NON_NEGATIVE_HALF_OR_ASIAN_LINE'},outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],
    probability_semantics:'TEAM_CARD_COUNT_DISTRIBUTION',engine:'CARD_DISTRIBUTION',gate_family:'CARDS_TEAM',
    evidence:['referee_cards','team_discipline','player_discipline','duel_h2h','lineup_availability']
  },
  {
    id:'cards_most',tab:TABS.SECONDARY,label:'Most Cards / Cards 1X2',status:STATUS.REQUIRES_EVIDENCE,
    outcomes:['HOME','DRAW','AWAY'],probability_semantics:'CARD_DIFFERENCE_3WAY',
    engine:'CARD_DISTRIBUTION',gate_family:'CARDS_MOST',evidence:['joint_card_distribution']
  },
  {
    id:'red_card',tab:TABS.SECONDARY,label:'Red Card',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['MATCH','HOME','AWAY']},outcomes:['YES','NO'],probability_semantics:'RED_CARD_EVENT',
    engine:'DISCIPLINE_EVENT_MODEL',gate_family:'RED_CARD',
    evidence:['referee_reds','team_discipline','player_discipline','duel_h2h','rivalry_importance']
  },
  {
    id:'booking_points',tab:TABS.SECONDARY,label:'Booking Points Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['MATCH','HOME','AWAY'],line:'BOOKING_POINT_LINE'},outcomes:['OVER','UNDER','PUSH_OR_SPLIT_IF_APPLICABLE'],
    probability_semantics:'BOOKING_POINT_DISTRIBUTION',engine:'DISCIPLINE_EVENT_MODEL',gate_family:'BOOKING_POINTS',
    evidence:['referee_cards','team_discipline','player_discipline','duel_h2h']
  },
  {
    id:'penalty_awarded',tab:TABS.SECONDARY,label:'Penalty Awarded',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{team:['MATCH','HOME','AWAY']},outcomes:['YES','NO'],probability_semantics:'PENALTY_EVENT',
    engine:'PENALTY_EVENT_MODEL',gate_family:'PENALTY',
    evidence:['referee_penalties','team_box_entries','defender_fouls','attacker_fouls_won','player_h2h']
  },
  {
    id:'player_goal',tab:TABS.SECONDARY,label:'Player To Score',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID',timing:['ANYTIME','FIRST','LAST']},outcomes:['YES','NO'],
    probability_semantics:'PLAYER_GOAL_EVENT',engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_GOAL',
    evidence:['confirmed_lineup','expected_minutes','role','penalty_duty','set_piece_duty','player_goal_rate','shots','xg','striker_defender_h2h','goalkeeper_matchup','tactics']
  },
  {
    id:'player_assist',tab:TABS.SECONDARY,label:'Player Assist',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID'},outcomes:['YES','NO'],probability_semantics:'PLAYER_ASSIST_EVENT',
    engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_ASSIST',
    evidence:['confirmed_lineup','expected_minutes','role','set_piece_duty','chance_creation','creative_midfielder_h2h','teammate_finishing','tactics']
  },
  {
    id:'player_shots',tab:TABS.SECONDARY,label:'Player Shots Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID',line:'NON_NEGATIVE_HALF_LINE'},outcomes:['OVER','UNDER'],
    probability_semantics:'PLAYER_SHOT_COUNT_DISTRIBUTION',engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_SHOTS',
    evidence:['confirmed_lineup','expected_minutes','role','player_shot_rate','striker_defender_h2h','tactics','opponent_defence']
  },
  {
    id:'player_shots_on_target',tab:TABS.SECONDARY,label:'Player Shots On Target Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID',line:'NON_NEGATIVE_HALF_LINE'},outcomes:['OVER','UNDER'],
    probability_semantics:'PLAYER_SOT_COUNT_DISTRIBUTION',engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_SOT',
    evidence:['confirmed_lineup','expected_minutes','role','shot_quality','player_sot_rate','striker_defender_h2h','goalkeeper_matchup']
  },
  {
    id:'player_passes',tab:TABS.SECONDARY,label:'Player Passes Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID',line:'NON_NEGATIVE_HALF_LINE'},outcomes:['OVER','UNDER'],
    probability_semantics:'PLAYER_PASS_COUNT_DISTRIBUTION',engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_PASSES',
    evidence:['confirmed_lineup','expected_minutes','role','possession_projection','pressing_matchup','tactics']
  },
  {
    id:'player_tackles',tab:TABS.SECONDARY,label:'Player Tackles Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID',line:'NON_NEGATIVE_HALF_LINE'},outcomes:['OVER','UNDER'],
    probability_semantics:'PLAYER_TACKLE_COUNT_DISTRIBUTION',engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_TACKLES',
    evidence:['confirmed_lineup','expected_minutes','role','defender_attacker_h2h','opponent_dribbles','possession_projection','tactics']
  },
  {
    id:'player_fouls',tab:TABS.SECONDARY,label:'Player Fouls Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID',kind:['COMMITTED','WON'],line:'NON_NEGATIVE_HALF_LINE'},outcomes:['OVER','UNDER'],
    probability_semantics:'PLAYER_FOUL_COUNT_DISTRIBUTION',engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_FOULS',
    evidence:['confirmed_lineup','expected_minutes','role','duel_h2h','referee_fouls','dribble_profile','tactics']
  },
  {
    id:'player_card',tab:TABS.SECONDARY,label:'Player To Receive Card',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID'},outcomes:['YES','NO'],probability_semantics:'PLAYER_CARD_EVENT',
    engine:'PLAYER_EVENT_MODEL',gate_family:'PLAYER_CARD',
    evidence:['confirmed_lineup','expected_minutes','role','player_discipline','duel_h2h','referee_cards','foul_profile']
  },
  {
    id:'goalkeeper_saves',tab:TABS.SECONDARY,label:'Goalkeeper Saves Over/Under',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{player_id:'CANONICAL_PLAYER_ID',line:'NON_NEGATIVE_HALF_LINE'},outcomes:['OVER','UNDER'],
    probability_semantics:'GOALKEEPER_SAVE_COUNT_DISTRIBUTION',engine:'PLAYER_EVENT_MODEL',gate_family:'GOALKEEPER_SAVES',
    evidence:['confirmed_lineup','expected_minutes','opponent_shot_volume','opponent_sot_quality','goalkeeper_save_rate','shooter_goalkeeper_h2h']
  },
  {
    id:'same_match_builder',tab:TABS.SAME_MATCH,label:'Same Match Bet',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{legs:'ARRAY_OF_ACTIVATED_MARKET_LEGS'},
    outcomes:['ALL_LEGS_OCCUR','NOT_ALL_LEGS_OCCUR'],probability_semantics:'JOINT_EVENT_PROBABILITY',
    engine:'JOINT_EVENT_SIMULATION',gate_family:'SAME_MATCH',
    evidence:['joint_event_samples','leg_probability_models','dependence_structure','contradiction_check']
  },
  {
    id:'double_chance_standard',tab:TABS.DOUBLE_CHANCE,label:'Standard Double Chance',status:STATUS.DERIVABLE,
    outcomes:['1X','12','X2'],probability_semantics:'EXACT_SUM_FROM_1X2',
    engine:'SEALED_1X2_SUMS',gate_family:'DOUBLE_CHANCE',
    evidence:['sealed_1x2_distribution']
  },
  {
    id:'double_chance_combination',tab:TABS.DOUBLE_CHANCE,label:'Double Chance + Combination',status:STATUS.REQUIRES_EVIDENCE,
    parameter_schema:{double_chance:['1X','12','X2'],other_leg:'ANY_ACTIVATED_COMPATIBLE_MARKET'},
    outcomes:['ALL_LEGS_OCCUR','NOT_ALL_LEGS_OCCUR'],probability_semantics:'JOINT_EVENT_PROBABILITY',
    engine:'JOINT_EVENT_SIMULATION',gate_family:'DOUBLE_CHANCE_COMBINATION',
    evidence:['joint_event_samples','sealed_1x2_distribution','other_leg_model','dependence_structure','contradiction_check']
  }
];

const aliases=Object.freeze({
  '1x2':'match_result_1x2','match_result':'match_result_1x2','full_time_result':'match_result_1x2',
  'draw_no_bet_home':'draw_no_bet','draw_no_bet_away':'draw_no_bet','dnb_home':'draw_no_bet','dnb_away':'draw_no_bet',
  'over_1_5':'total_goals','over_2_5':'total_goals','over_3_5':'total_goals','over_4_5':'total_goals','over_5_5':'total_goals',
  'under_1_5':'total_goals','under_2_5':'total_goals','under_3_5':'total_goals','under_4_5':'total_goals','under_5_5':'total_goals',
  'home_over_0_5':'team_total_goals','home_over_1_5':'team_total_goals','away_over_0_5':'team_total_goals','away_over_1_5':'team_total_goals',
  'btts':'btts','btts_yes':'btts','btts_no':'btts',
  'first_half_draw':'half_result','first_half_home_win':'half_result','first_half_away_win':'half_result',
  'first_half_over_0_5':'half_total_goals','first_half_over_1_5':'half_total_goals','first_half_under_1_5':'half_total_goals',
  'over_0_5_first_half':'half_total_goals','under_1_5_first_half':'half_total_goals',
  'home_win_either_half':'team_win_either_half','away_win_either_half':'team_win_either_half',
  'corners_over':'corners_total','corners_under':'corners_total',
  'yellow_cards_over':'cards_total','yellow_cards_under':'cards_total',
  'double_chance':'double_chance_standard','double_chance_1x':'double_chance_standard','double_chance_x2':'double_chance_standard','double_chance_12':'double_chance_standard',
  'combo_match_result_ou':'same_match_builder','combo_btts_ou':'same_match_builder',
  'combo_dc_ou':'double_chance_combination'
});

function getFamily(id){return families.find(f=>f.id===id)||null;}
function resolveFamily(market){
  const raw=String(market||'').trim().toLowerCase();
  if(!raw)return null;
  if(aliases[raw])return getFamily(aliases[raw]);
  if(/^over_\d+_\d+$/.test(raw)||/^under_\d+_\d+$/.test(raw))return getFamily('total_goals');
  if(/^team_total_(home|away)_(over|under)_\d+_\d+$/.test(raw))return getFamily('team_total_goals');
  if(/^corners_(over|under)_\d+_\d+$/.test(raw))return getFamily('corners_total');
  if(/^(over|under)_\d+_\d+_yellows$/.test(raw))return getFamily('cards_total');
  if(/^combo_dc_/.test(raw))return getFamily('double_chance_combination');
  if(/^combo_/.test(raw))return getFamily('same_match_builder');
  if(/^ht_ft_/.test(raw))return getFamily('same_match_builder');
  return null;
}

function tabFamilies(tab){return families.filter(f=>f.tab===tab);}
function validateRegistry(){
  const ids=new Set();
  for(const f of families){
    if(ids.has(f.id))throw new Error('DUPLICATE_MARKET_FAMILY:'+f.id);
    ids.add(f.id);
    if(!Object.values(TABS).includes(f.tab))throw new Error('INVALID_TAB:'+f.id);
    if(!Object.values(STATUS).includes(f.status))throw new Error('INVALID_STATUS:'+f.id);
    if(!f.label||!f.probability_semantics||!f.engine||!f.gate_family)throw new Error('INCOMPLETE_FAMILY:'+f.id);
    if(!Array.isArray(f.evidence)||f.evidence.length===0)throw new Error('MISSING_EVIDENCE:'+f.id);
  }
  return true;
}

validateRegistry();

module.exports={TABS,STATUS,families,aliases,getFamily,resolveFamily,tabFamilies,validateRegistry};
