# SOCCER-MARKETS-001 — Complete Football Market Catalogue & Probability Contract v1

## Status
IN_PROGRESS / owner-authorized on 12 November 2026.

## Objective
Create one governed source of truth for the complete football customer-market catalogue used by SKCS Sports Edge, grouped into the four customer tabs:

1. 1X2
2. Secondary Outcomes
3. Same Match Bet
4. Double Chance & Combinations

Every market family must:
- expose its own pre-match probability or settlement-aware probability vector;
- state the mathematical/probabilistic model that produces that probability;
- state the governed evidence families allowed to influence it;
- state the contradictions it can create with other published markets;
- fail closed when required evidence is missing;
- never inherit or copy a confidence percentage from another market;
- never synthesize a joint probability by multiplying marginal percentages unless a separately validated joint model explicitly permits it.

## Current-state audit conclusion
The repository contains substantial but fragmented football-market support. 1X2 is the only currently proven customer-facing probability market with a sealed three-way probability distribution. Secondary, Same Match Bet and Double Chance/Combination support exists across multiple allowlists, parsers, scoring helpers and legacy UI/config files, but there is no single complete market catalogue and several older scoring paths use generic/default/seeded heuristics that are not suitable as public probability authority.

SOCCER-MARKETS-001 therefore treats existing market code as candidate/reusable implementation only until each family is mapped to this contract and proven.

# Tab 1 — 1X2

## Full-time Match Result
Outcomes:
- HOME
- DRAW
- AWAY

Probability semantics:
- Three mutually exclusive probabilities summing to 100%.

Primary evidence families:
- team attacking/defensive strength;
- recent form;
- team H2H;
- confirmed lineup/availability;
- goalkeeper strength;
- player-v-player matchup aggregates;
- tactical matchup;
- venue/home advantage;
- travel/fatigue;
- weather/playing conditions;
- referee/team interaction only where governed evidence proves relevance;
- Scout Shadow independent comparison.

Publication law:
- governed by SOCCER-GATE-001.

# Tab 2 — Secondary Outcomes

Secondary Outcomes are independently customer-selectable whether or not 1X2 passes. They are also the first fallback family when 1X2 does not qualify.

## Result-derived single markets
### Draw No Bet
Outcomes:
- HOME
- AWAY
- DRAW = push/refund state

Probability semantics:
- expose P(win), P(push), P(loss), not a misleading single win percentage only.

### Handicap markets
Families:
- European/3-way handicap
- Asian handicap

Probability semantics:
- derive from the full score-difference distribution.
- Asian lines must expose win / half-win / push / half-loss / loss where applicable.

## Goals markets
### Total Goals Over/Under
Parameterized by line L.
Typical lines may include 0.5, 1.5, 2.5, 3.5, 4.5, 5.5 and governed Asian goal lines.

### Team Total Goals Over/Under
Parameterized by:
- HOME/AWAY team
- line L

### Both Teams To Score
Outcomes:
- YES
- NO

### Exact Total Goals
Parameterized by exact total G.

### Goal Range / Multigoals
Parameterized by governed goal interval.

### Team To Score
Families:
- home team to score yes/no
- away team to score yes/no
- team to score first
- team to score last
- team to score in both halves
- team to score in either half

### Clean Sheet / Win To Nil
Families:
- home clean sheet
- away clean sheet
- home win to nil
- away win to nil

### Correct Score
Outcomes:
- governed exact scoreline matrix

### Winning Margin
Parameterized by governed goal-difference bands.

Primary goal evidence:
- team xG/xGA and shot quality;
- striker/forward versus defender/goalkeeper matchup history;
- player expected minutes and role;
- finishing and goalkeeper form;
- service quality / chance creation;
- set-piece strength;
- team H2H scoring pattern;
- tactical style and pace;
- weather;
- referee penalty tendency where governed;
- injuries/lineup.

Probability model:
- coherent home/away goal-distribution model (for example a calibrated bivariate score model / simulation), from which totals, BTTS, correct score, team totals and margins are derived consistently.

## Half / period markets
Families:
- 1st-half 1X2
- 2nd-half 1X2
- 1st-half Double Chance
- 2nd-half Double Chance
- 1st-half Draw No Bet
- 2nd-half Draw No Bet
- 1st-half goals O/U
- 2nd-half goals O/U
- 1st-half team totals
- 2nd-half team totals
- 1st-half BTTS
- 2nd-half BTTS
- 1st-half correct score
- 2nd-half correct score
- 1st-half clean sheet
- 2nd-half clean sheet

Evidence:
- half-specific scoring/conceding rates;
- starting intensity;
- substitution patterns;
- fitness/fatigue;
- tactical timing;
- lineup;
- player matchup evidence relevant to expected half/minutes.

## Corners markets
Families:
- total corners O/U at line L
- home corners O/U at line L
- away corners O/U at line L
- most corners / corners 1X2
- corner handicap
- exact corners
- corner range
- odd/even corners
- first corner
- last corner
- Nth corner
- race to N corners
- 1st-half corners O/U / team corners / most corners
- 2nd-half corners equivalents where supported

Primary corner evidence:
- team corner-for / corner-against rates;
- possession/territory;
- crossing frequency;
- blocked-shot rate;
- shot volume;
- winger/fullback versus defender matchup history;
- defender clearances/blocks;
- tactical width;
- game-state tendency;
- lineup;
- weather/wind where material.

Probability model:
- team-specific corner count distributions plus joint match simulation; no reuse of goal probability as a corner probability.

## Cards / bookings markets
Families:
- total yellow cards O/U at line L
- home yellow cards O/U
- away yellow cards O/U
- total booking points O/U
- team booking points
- red card yes/no
- team red card yes/no
- first card / team first card
- most cards / cards 1X2
- card handicap
- player to receive a card

Primary cards evidence:
- referee yellow/red/penalty/foul rates;
- team foul and disciplinary rates;
- player disciplinary history;
- defender/attacker and midfielder duel H2H;
- dribble/foul-drawn profiles;
- rivalry/derby/game importance;
- possession mismatch;
- tactical fouling;
- lineup.

Probability model:
- referee/team/player-aware count and event models, not generic volatility labels.

## Player markets
Families:
- anytime goalscorer
- first goalscorer
- last goalscorer
- player to score or assist
- player assists
- player shots O/U
- player shots on target O/U
- player passes O/U
- player tackles O/U
- player fouls committed O/U
- player fouls won O/U
- player card yes/no
- goalkeeper saves O/U

Required evidence:
- confirmed/expected starter status;
- expected minutes;
- role/position;
- penalty/free-kick/corner responsibilities;
- player event rates;
- team tactical role;
- opponent positional matchup;
- player-v-player H2H where sample/role/recency quality is sufficient;
- opponent goalkeeper/defender quality for attacking props;
- opponent attack volume for goalkeeper saves;
- injuries and substitution likelihood.

Probability model:
- player-specific event-rate distributions conditional on expected minutes and matchup.

## Other governed fixture markets
Candidate families that require explicit data support before activation:
- penalties awarded yes/no;
- penalty scored/missed;
- odd/even goals;
- team winning either half;
- team winning both halves;
- highest-scoring half;
- to qualify (knockout competitions only);
- set-piece/statistical markets such as free kicks, throw-ins and goal kicks when reliable governed data exists.

# Tab 3 — Same Match Bet

Same Match Bet is a JOINT-event market engine, not a list of copied single-market percentages.

Eligible leg families may include, when individually governed:
- 1X2;
- Draw No Bet;
- totals;
- team totals;
- BTTS;
- clean sheet / win to nil;
- half markets;
- corners;
- cards;
- handicaps;
- player goals/assists/shots/SOT/passes/tackles/fouls/cards/saves;
- other activated secondary markets.

Examples of market-family combinations are not the authority. The authority is the allowed-leg matrix plus the joint-event model.

Probability semantics:
- P(all selected legs occur).
- Must be estimated from one coherent joint simulation/event model or another separately validated dependence model.
- Do not multiply marginal probabilities as though legs were independent.
- Correlation/dependence must be explicit and testable.
- logically impossible combinations must be rejected before scoring.

H2H/context influence:
- each underlying event process receives its own relevant player/team/referee/weather features before joint simulation.
- the same evidence may not be counted twice at combination level.

# Tab 4 — Double Chance & Combinations

## Standard Double Chance
Outcomes:
- 1X
- 12
- X2

Probability semantics:
- exact sums from the sealed mutually exclusive 1X2 distribution:
  - P(1X) = P(Home) + P(Draw)
  - P(12) = P(Home) + P(Away)
  - P(X2) = P(Draw) + P(Away)

## Double Chance combination families
Any activated combination containing a Double Chance leg is displayed in this tab rather than Same Match Bet.

Governed families may include:
- Double Chance + Total Goals O/U
- Double Chance + BTTS
- Double Chance + Team Total Goals
- Double Chance + Goal Range / Multigoals
- Double Chance + Clean Sheet / team-to-score event where logically valid
- Double Chance + Corners
- Double Chance + Cards
- Double Chance + Player props
- Double Chance + half/period market
- other activated Same Match legs containing a Double Chance component

Probability semantics:
- standard DC uses exact 1X2 sums.
- DC combinations use the same coherent joint-event engine as Same Match Bet.
- no combination may be derived merely by multiplying the DC probability by a second marginal probability.

# Shared Probability Architecture

## One coherent pre-match event model
SKCS should move toward a common simulated match-state model from which market probabilities are read, rather than giving each market an unrelated heuristic percentage.

The event model must represent, where supported:
- home/away goals and scorelines;
- team shots and shots on target;
- corners;
- fouls/cards;
- player events;
- goalkeeper saves;
- half/period state;
- lineup/minutes;
- referee effects;
- weather/venue effects.

This permits:
- internally consistent probabilities across tabs;
- mathematically valid joint Same Match probabilities;
- contradiction detection from the same simulated state;
- H2H effects to influence the correct event process rather than being added manually to a published percentage.

# H2H and Context Law

H2H is not one generic input.

## Team H2H
Relevant to:
- 1X2
- goals
- BTTS
- team totals
- some half markets

## Player-v-player H2H
Must be role- and event-specific.

Examples of evidence families:
- striker/forward vs centre-back/goalkeeper -> goals, shots, SOT, player scoring, 1X2 support
- winger/fullback vs fullback/centre-back -> corners, crosses, shots, assists
- dribbler vs defender -> fouls, cards, tackles, progression
- creative midfielder vs marker/midfield unit -> assists, key passes, shots created
- set-piece taker vs aerial defenders/goalkeeper -> goals, corners, assists, cards/fouls
- goalkeeper vs opposing shooters -> saves, goals conceded, clean sheet

The example pairings above illustrate evidence assignment only. The implementation must use a governed role/event mapping table rather than hard-code only these named examples.

## Referee-v-team / referee-v-player
Potentially relevant to:
- yellow/red cards;
- fouls;
- penalties;
- disciplinary player props;
- goals only through a separately proven penalty/discipline channel;
- 1X2 only as corroborating/context evidence unless the model is explicitly trained to incorporate it.

## Weather
Potentially relevant to:
- goals/shot quality;
- corners/crossing;
- passing;
- cards/fouls in some conditions;
- goalkeeper events;
- overall 1X2 only through modelled event impact or independent Governor corroboration.

# Market-specific publication gates

The 70-75% provisional review rule belongs to 1X2 only.

Each market family requires its own calibrated threshold / risk-coverage rule because natural event frequencies differ.

Examples of different probability semantics:
- Correct Score may have a low top probability and still be well calibrated.
- Double Chance naturally has much higher probabilities than 1X2.
- Draw No Bet has a push state.
- Asian lines can have half-win/half-loss states.
- player events and cards have position/minutes-dependent base rates.

No universal 70/72/75 threshold may be copied across every market family.

# External market-reference law

Bookmaker and API-Sports market catalogues may be used to discover market names/availability only.

They are not SKCS probability authority.

API-Sports pre-match odds/bet references may be captured as external market metadata where legally/governance-approved, but SKCS probabilities must be generated and sealed independently by Scout/Edge.

# Definition of Done

SOCCER-MARKETS-001 is TESTED only when:
1. this catalogue is represented in one machine-readable canonical market registry;
2. every active football market maps to one of the four customer tabs;
3. duplicate/conflicting legacy market names are normalized to canonical IDs;
4. every market declares probability semantics, required evidence, model family, settlement states, contradiction rules and publication-gate family;
5. legacy generic/seeded/default probability paths are proven unable to publish customer probabilities;
6. 1X2 remains unchanged and green;
7. Secondary market families have real market-specific probability engines or remain unavailable;
8. Same Match Bet has a validated joint-probability engine, not marginal multiplication;
9. Standard Double Chance remains exact 1X2 sums; DC combinations use the joint engine;
10. player/team/referee/weather H2H/context inputs are governed by role/event mapping and provenance;
11. focused contract tests prove catalogue completeness and no orphan active market;
12. Control Center checker passes;
13. no public customer market is exposed as real until its probability engine and required evidence are proven.


## W6 checkpoint — 12 November 2026

SOCCER-MARKETS-001 remains **IN_PROGRESS** because deployed W6 runtime acceptance is blocked by Vercel's daily deployment quota.

Implemented and source-proven:
- one canonical machine-readable football market registry across all four customer tabs;
- sealed 1X2 preserved unchanged;
- coherent scoreline-derived goals/BTTS/team-total/correct-score/clean-sheet/win-to-nil/DNB/handicap/winning-margin markets;
- event-count corners/yellow-card models with event-specific team H2H only when matching evidence exists;
- first/second-half result/goals/BTTS models;
- direct-event Same Match and Double Chance scoreline combinations rather than marginal multiplication;
- team-to-score-first timeline model;
- red-card, penalty-awarded and booking-points event models;
- player goal/assist/shots/SOT/passes/tackles/fouls/card and goalkeeper-saves private test models from completed historical player evidence;
- private Blob/OIDC transport with pinned source/projection hashes and pre-kickoff timing enforcement;
- registry-driven Hub rendering that preserves customer-facing labels.

W6 private evidence/projection proof:
- 38 sealed Nations League fixtures and 46 teams;
- 361 historical fixture-stat records;
- 361 historical fixture event timelines;
- 13,566 player-match rows across 3,586 unique players;
- market evidence SHA-256: `f008903b9e6f2a13b711333a2d9257389acf52792dcb849a98724f67db418953`;
- player/event evidence SHA-256: `16062dab8526171490252f8224b5f936f14da93115c45bddd7f9151a7c9649bc`;
- combined source SHA-256: `ed8b5f78691e7aa06be487deff5e3a3eddd506836b9cc6dcb1a0983456a41eac`;
- W6 generated at `2026-11-12T10:21:26.461Z` (12:21:26 SAST), before the earliest 19:00 SAST kickoff;
- W6 projection SHA-256: `be56c53888878351c0fd5f1918cb766a29d12c35ac3769b59f6b09e390aff73f`;
- 30/38 fixtures have all 40 registry market families; seven have 39 (goalkeeper-saves held); one has 31 (corners/cards plus goalkeeper-saves held);
- all 38 fixtures have team-to-score-first, red-card, penalty-awarded and booking-points;
- focused W6 regression: **50/50 PASS**, zero failures/skips; syntax checks PASS; Control Center checker PASS.

Deployment boundary:
- private W6 is stored in Vercel Blob `skcs-edge-private-evidence` and verified through the Node `@vercel/blob` OIDC read path;
- Preview `dpl_WxqBRR5NRaxvZZbajgTQeDWr7vh3` is READY at the earlier Blob/OIDC branch commit and proves the dependency/build path;
- W6 itself has not been deployed because both Vercel API and CLI are now blocked by `api-deployments-free-per-day` (>100 deployments/day);
- Production is unchanged and W6 must not be described as live until a fresh W6 Preview proves the exact W6 runtime and authenticated Hub before controlled promotion.

Remaining fail-closed boundaries:
- player outputs are private/test-only expected-lineup projections until current-fixture lineup/eligibility and expected-minutes evidence is confirmed;
- player-v-player H2H/matchup and referee/weather modifiers remain absent when governed inputs are unavailable;
- cross-process Same Match combinations involving goals with corners/cards/player props require a validated common joint-event simulation;
- sparse-evidence fixture families remain unavailable rather than using defaults.

No new 1X2 prediction is required and the existing sealed pre-match 1X2 must not be recollected or rewritten.
