# SOCCER-GATE-001 — 1X2 Publication, Fallback and Market Consistency Contract v1

## Status
IN_PROGRESS / owner-authorized on 12 November 2026.

## Objective
Define and implement the governed customer-market publication law for football without changing the model's underlying probabilities.

Customer market order:
1. 1X2
2. Secondary Outcomes
3. Same Match Bet
4. Double Chance & Combinations

The four market families remain independently selectable by customers when each one is independently valid. The order above is also the fallback priority when the 1X2 market does not qualify.

## 1. Provisional 1X2 publication bands
The band applies to the **sealed 1X2 outcome probability**, not the capped governed-confidence display value.

- **75% and above — STRONG ZONE.** The 1X2 outcome may publish when all hard gates are clean.
- **70% to below 75% — REVIEW ZONE.** The original probability is never increased. The 1X2 outcome may publish only when the supporting-evidence Governor qualifies it.
- **Below 70% — FALLBACK ZONE.** The 1X2 outcome is not published as the primary recommendation. Edge evaluates independently valid Secondary Outcomes first, then Same Match Bet, then Double Chance & Combinations.
- **Any probability — HOLD/VETO.** A hard contradiction, post-kickoff generation, invalid provenance, failed Scout/Edge comparison, or other hard governor may block publication regardless of percentage.

These values are provisional operating bands and must later be calibrated against settled SKCS predictions. They are not claimed as universal statistical thresholds.

## 2. Review-zone promotion
A 70–<75% 1X2 outcome is not mathematically changed into 75%. If it passes, it remains displayed at its original sealed probability and is labelled **REVIEW-QUALIFIED** with the reasons that supported publication.

Hard prerequisites:
- forecast sealed before kickoff;
- canonical fixture/evidence validation passed;
- Scout Shadow comparison is GREEN / non-contradictory;
- no published-market logical contradiction;
- no material hard-veto context factor;
- no evidence used twice as both model input and independent corroboration.

Review-zone promotion requires:
- at least **two independent corroborating SUPPORTS** from distinct evidence families; and
- no material CONTRADICTS factor.

Eligible corroborating evidence families, when governed data exists:
- player-v-player H2H / matchup evidence;
- confirmed lineup and player availability;
- team H2H and current form;
- weather / venue conditions;
- referee-v-team historical interaction;
- tactical matchup / role interaction;
- other separately governed contextual evidence.

A factor counts only when its source is governed, its evidence quality is sufficient, it is relevant to the predicted direction, and it is marked independent of the inputs already used to generate the sealed 1X2 probability.

Player-v-player H2H and referee-v-team interaction are recognized by this contract but are **not activated merely by naming them**. They may count only after their evidence contracts and transport are implemented and proven.

## 3. Customer-choice law
Passing 1X2 does not suppress Secondary Outcomes, Same Match Bet, or Double Chance & Combinations. A customer may prefer any independently valid market.

Failing 1X2 changes the preferred fallback route; it does not automatically make another market valid.

Each displayed market must independently satisfy:
- real governed pre-match probability/evidence;
- its own market-specific threshold/gate;
- no fabrication/default percentage;
- no logical contradiction with another published market for the same fixture.

## 4. Market-consistency law
Publication consistency is about **logical impossibility**, not merely correlation or overlap.

Examples:
- Home Win and X2: contradictory.
- Away Win and 1X: contradictory.
- Draw and 12: contradictory.
- BTTS Yes and BTTS No: contradictory.
- Over 2.5 and Under 2.5: contradictory.
- Home Win and 1X: compatible.
- Home Win and Over 2.5: compatible unless a separate governed rule proves otherwise.
- Draw and BTTS Yes: compatible (for example 1–1).

Existing portfolio/ACCA diversification rules must not be reused as customer-market contradiction rules when they classify compatible overlapping markets as conflicts.

## 5. No-fabrication law
Fallback may choose among real governed markets; it must never synthesize a confidence percentage simply because a secondary market is desired.

Legacy fixed/default secondary confidences must not be used for customer publication. If no independently scored secondary market exists, the Secondary tab must say unavailable / HOLD rather than create a value.

## 6. Existing safety law preserved
This contract does not weaken:
- pre-kickoff-only prediction generation;
- existing HOLD gates;
- Scout Shadow comparison;
- provenance and immutable evidence;
- owner/private evidence boundary while public release remains gated;
- no uncontrolled provider prediction input;
- no customer publication of mutually contradictory outcomes.

## Definition of Done
SOCCER-GATE-001 is TESTED only when:
1. Control Center records this contract and project state.
2. The website market order is 1X2 → Secondary Outcomes → Same Match Bet → Double Chance & Combinations.
3. A pure deterministic 1X2 publication Governor implements STRONG / REVIEW / FALLBACK / HOLD without changing probability.
4. Review-zone promotion proves independent corroboration and no double counting.
5. Publication-specific logical contradiction checks treat compatible markets correctly.
6. Synthetic/default secondary confidence generation is removed from the customer publication path.
7. Focused tests cover boundary values, promotion, veto, customer choice, contradictions and no-fabrication.
8. Existing website/authentication/pre-kickoff protections remain green.
9. Preview and custom-domain verification pass before closure.
