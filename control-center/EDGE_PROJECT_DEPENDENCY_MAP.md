# SKCS Edge Project Dependency Map

Generated from `EDGE_MASTER_PROJECT_REGISTER.v1.json`.

## ECC-001 — Edge Control Center v1

Status: DONE
Governed by: ECC-001
Blocked by: none
Blocks: EPR-001

## EPR-001 — Edge Master Project Register

Status: TESTED
Governed by: EPR-001
Blocked by: ECC-001
Blocks: EDGE-GOV-001, ESA-001, EAC-001

## EDGE-GOV-001 — Edge Asset Work Sequence Policy

Status: DONE
Governed by: EDGE-GOV-001
Blocked by: EPR-001
Blocks: none

## ESA-001 — Edge System and Runtime Inventory

Status: TESTED
Governed by: ESA-001
Blocked by: EPR-001
Blocks: EAC-001, EMG-001, EFI-001, EST-001, ESEC-001, EPI-001, EGR-001, EAI-001, EUI-001, EOPS-001, FIP-001, SEM-GOV-001A

## EAC-001 — Edge Asset Classification and Repository Map

Status: TESTED
Governed by: EAC-001
Blocked by: EPR-001, ESA-001
Blocks: EAC-R1-001, EMG-001, ESA-RR-003

## EAC-R1-001 — EAC-001 B18 Manifest and Repository Map Alignment Repair

Status: DONE
Governed by: EAC-R1-001
Blocked by: EAC-001
Blocks: none

## EMG-001 — Scout-Edge Marriage Gate Contract

Status: APPROVED
Governed by: EMG-001
Blocked by: ESA-001, EAC-001
Blocks: EFI-001, EST-001, ESEC-001, FIP-001

## EFI-001 — FIP Intake Handshake

Status: TESTED
Governed by: EFI-001
Blocked by: ESA-001, EMG-001
Blocks: EPRV-001, E2E-001

## EST-001 — Supabase Storage and FIP Retention Contract

Status: TESTED
Governed by: EST-001
Blocked by: ESA-001, EMG-001
Blocks: EOPS-001, E2E-001, SEM-GOV-001D-UI3-I2

## ESEC-001 — Subscriber and Security Boundary

Status: PARTIAL
Governed by: ESEC-001
Blocked by: ESA-001, EMG-001
Blocks: EUI-001, EOPS-001, E2E-001

## EPI-001 — Prediction Pipeline Integrity

Status: TESTED
Governed by: EPI-001
Blocked by: ESA-001
Blocks: EGR-001, EAI-001, EUI-001, E2E-001, SEM-GOV-001A

## EPRV-001 — External Sports Provider Removal

Status: PARTIAL
Governed by: EPRV-001
Blocked by: EFI-001
Blocks: E2E-001

## EGR-001 — Grading and Accuracy Governance

Status: PROPOSED
Governed by: EGR-001
Blocked by: ESA-001, EPI-001
Blocks: none

## EAI-001 — AI Provider and EdgeMind Boundary

Status: PROPOSED
Governed by: EAI-001
Blocked by: ESA-001, EPI-001
Blocks: none

## EUI-001 — Subscriber UI and Prediction Delivery

Status: PROPOSED
Governed by: EUI-001
Blocked by: ESA-001, ESEC-001, EPI-001
Blocks: none

## ECU-001 — Edge Control Center Operator UI

Status: APPROVED
Governed by: ECU-001
Blocked by: none
Blocks: none

## EOPS-001 — Deployment and Operations Governance

Status: PROPOSED
Governed by: EOPS-001
Blocked by: ESA-001, EST-001, ESEC-001
Blocks: EOPS-001-A1

## FIP-001 — Scout FIP Authority Contract

Status: APPROVED
Governed by: FIP-001
Blocked by: ESA-001, EMG-001
Blocks: none

## E2E-001 — Scout to Edge End-to-End Proof

Status: BLOCKED
Governed by: E2E-001
Blocked by: EFI-001, EST-001, ESEC-001, EPI-001, EPRV-001
Blocks: none

## ESA-RR-001 — ESA-RR-001 Runtime Repair Base Contract (Approved)

Status: APPROVED
Governed by: ESA-RR-001
Blocked by: none
Blocks: none

## ESA-RR-002 — ESA-RR-002 Implementation Law Seal (Hold)

Status: TESTED
Governed by: ESA-RR-002
Blocked by: none
Blocks: ESA-RR-003

## SEM-GOV-001A — Canonical Lifecycle, Terminology, Rolling Eight-Day Funnel and Help Contract

Status: APPROVED
Governed by: SEM-GOV-001A
Blocked by: ESA-001, EPI-001
Blocks: SEM-GOV-001B, SEM-GOV-001D-UI1

## SEM-GOV-001B — Football Lifecycle Persistence Contract

Status: APPROVED
Governed by: SEM-GOV-001B
Blocked by: SEM-GOV-001A
Blocks: SEM-GOV-001B-I2

## SEM-GOV-001B-I2 — Lifecycle Governor Foundation Design Packet

Status: APPROVED
Governed by: SEM-GOV-001B-I2
Blocked by: SEM-GOV-001B
Blocks: SEM-GOV-001B-I3

## SEM-GOV-001B-I3 — Pure Lifecycle Governor Foundation

Status: APPROVED
Governed by: SEM-GOV-001B-I3
Blocked by: SEM-GOV-001B-I2
Blocks: SEM-GOV-001B-I4-CAP

## SEM-GOV-001B-I4-CAP — Supabase Free-Tier Capacity and Retention Design

Status: DONE
Governed by: SEM-GOV-001B-I4-CAP
Blocked by: SEM-GOV-001B-I3
Blocks: SEM-GOV-001B-I4-CAP2

## SEM-GOV-001B-I4-CAP2 — 50-Fixture Daily Admission Capacity and Enforcement Design

Status: DONE
Governed by: SEM-GOV-001B-I4-CAP2
Blocked by: SEM-GOV-001B-I4-CAP
Blocks: SEM-GOV-001B-I4

## SEM-GOV-001B-I4 — Lifecycle Persistence Implementation

Status: TESTED
Governed by: SEM-GOV-001B-I4
Blocked by: SEM-GOV-001B-I4-CAP2
Blocks: SEM-GOV-001D-UI1, SEM-GOV-001D-UI3-I1

## SEM-GOV-001D-UI1 — Sports Match Hub UI Information Architecture and Screen Contract

Status: PROPOSED
Governed by: SEM-GOV-001D-UI1
Blocked by: SEM-GOV-001A, SEM-GOV-001B-I4
Blocks: SEM-GOV-001D-UI2

## SEM-GOV-001D-UI2 — Static Sports Match Hub Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI2
Blocked by: SEM-GOV-001D-UI1
Blocks: SEM-GOV-001D-HOME1

## SEM-GOV-001D-HOME1 — Home Page Information Architecture and Visual Consolidation

Status: TESTED
Governed by: SEM-GOV-001D-HOME1
Blocked by: SEM-GOV-001D-UI2
Blocks: SEM-GOV-001D-UI3-I1

## SEM-GOV-001D-UI3-I1 — Lifecycle Read-Model API Inspection and Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I1
Blocked by: SEM-GOV-001D-HOME1, SEM-GOV-001B-I4
Blocks: SEM-GOV-001D-UI3-I2

## SEM-GOV-001D-UI3-I2 — Canonical Fixture Metadata Projection Inspection and Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I2
Blocked by: SEM-GOV-001D-UI3-I1, EST-001
Blocks: SEM-GOV-001D-UI3-I3

## SEM-GOV-001D-UI3-I3 — Source B Storage Policy and Retention Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I3
Blocked by: SEM-GOV-001D-UI3-I2
Blocks: SEM-GOV-001D-UI3-I4

## SEM-GOV-001D-UI3-I4 — Source B Schema and Persistence Implementation Design

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I4
Blocked by: SEM-GOV-001D-UI3-I3
Blocks: SEM-GOV-001D-UI3-I5

## SEM-GOV-001D-UI3-I5 — Source B Migration and Isolated Persistence Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I5
Blocked by: SEM-GOV-001D-UI3-I4
Blocks: SEM-GOV-001D-UI3-I6

## SEM-GOV-001D-UI3-I6 — EFI-001 Governed Intake Inspection and Adapter Contract

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I6
Blocked by: SEM-GOV-001D-UI3-I5
Blocks: SEM-GOV-001D-UI3-I7

## SEM-GOV-001D-UI3-I7 — Governed FIP Intake Adapter Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I7
Blocked by: SEM-GOV-001D-UI3-I6
Blocks: SEM-GOV-001D-UI3-I8

## SEM-GOV-001D-UI3-I8 — Durable Intake Evidence Storage and Isolated Implementation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I8
Blocked by: SEM-GOV-001D-UI3-I7
Blocks: SEM-GOV-001D-UI3-I9

## SEM-GOV-001D-UI3-I9 — Production Composition and M2M Auth Foundation

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I9
Blocked by: SEM-GOV-001D-UI3-I8
Blocks: SEM-GOV-001D-UI3-I10

## SEM-GOV-001D-UI3-I10 — Migration Readiness and Controlled Apply

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I10
Blocked by: SEM-GOV-001D-UI3-I9
Blocks: SEM-GOV-001D-UI3-I11

## SEM-GOV-001D-UI3-I11 — Controlled End-to-End Marriage Proof

Status: TESTED
Governed by: SEM-GOV-001D-UI3-I11
Blocked by: SEM-GOV-001D-UI3-I10
Blocks: SXE-FIP-LAB-001

## SXE-FIP-LAB-001 — Genuine Scout-to-Edge External FIP Controlled Proof

Status: IN_PROGRESS
Governed by: SXE-FIP-LAB-001
Blocked by: SEM-GOV-001D-UI3-I11
Blocks: none

## SXE-FIP-LAB-001B — Edge Canonical FIP Intake Boundary Hardening

Status: TESTED
Governed by: SXE-FIP-LAB-001B
Blocked by: none
Blocks: none

## SXE-FIP-LAB-001C — Edge Hardening Closure Verification

Status: TESTED
Governed by: SXE-FIP-LAB-001C
Blocked by: none
Blocks: none

## SXE-FIP-LAB-001D — Edge Post-Publication Metadata Reconciliation

Status: TESTED
Governed by: SXE-FIP-LAB-001D
Blocked by: none
Blocks: none

## ESA-RR-003 — ESA-RR-003 Irrecoverable Preserved-Candidate Resolution Contract

Status: TESTED
Governed by: ESA-RR-003
Blocked by: ESA-RR-002, EAC-001
Blocks: ESA-RR-004

## ESA-RR-004 - ESA-RR-004 Runtime Inventory Evidence-Only Reconciliation

Status: TESTED
Governed by: ESA-RR-004
Blocked by: ESA-RR-003
Blocks: none

## EPI-001-D1-R1 - EPI-001-D1-R1 Governed D1 Prediction Provenance Integration

Status: TESTED
Governed by: EPI-001-D1-R1
Blocked by: EPI-001, EFI-001, EST-001, ESA-RR-004
Blocks: E2E-001

## EPRV-001-C2 - EPRV-001-C2 FIP Replacement Mapping and Fail-Closed Provider Readiness Contract

Status: TESTED
Governed by: EPRV-001-C2
Blocked by: EFI-001, EPI-001-D1-R1, ESA-RR-004
Blocks: none

## EPRV-001-C3 - EPRV-001-C3 Upstream Context Availability Reconciliation

Status: TESTED
Governed by: EPRV-001-C3
Blocked by: EPRV-001-C2
Blocks: none

## EPRV-001-C4 - EPRV-001-C4 Governed Scout Context Transport Field Contract

Status: TESTED
Governed by: EPRV-001-C4
Blocked by: EPRV-001-C3
Blocks: none

## EOPS-001-A1 — Azure Migration Stage A - Inventory, Costed Candidate and Startup Safety

Status: TESTED
Governed by: EOPS-001-A1
Blocked by: ESA-001, EST-001
Blocks: none

## ESEC-001-I2 — Production Runtime Credential and Deployment Configuration Verification

Status: TESTED
Governed by: ESEC-001-I2
Blocked by: ESA-001, EOPS-001-A1
Blocks: none

## ESEC-001-I3 — Production Credential Remediation and Key Vault Integration

Status: TESTED
Governed by: ESEC-001-I3
Blocked by: ESA-001, ESEC-001-I2, EOPS-001-A1
Blocks: none

## ESEC-001-I4 — Production Secret Provisioning and Rotation Proof

Status: TESTED
Governed by: ESEC-001-I4
Blocked by: ESA-001, ESEC-001-I3, EOPS-001-A1
Blocks: none

## ESEC-001-I5 — Azure Scheduler and Refresh Credential Boundary Resolution

Status: TESTED
Governed by: ESEC-001-I5
Blocked by: ESA-001, ESEC-001-I4, EOPS-001-A1
Blocks: none

## ESEC-001-I6 — RLS-001 Server-Only Table Boundary and Privilege Hardening

Status: TESTED
Governed by: ESEC-001-I6
Blocked by: ESA-001, ESEC-001-I5, SEM-GOV-001D-UI3-I10
Blocks: none

## SOCCER-WEB-001 — TESTED

Display the existing immutable Nations League test evidence on skcsai.co.za through existing owner authentication. All fixture and forecast data remains private; signed-out visitors see an access message. No Shadow output disclosure, recalculation, new provider calls, production prediction writes, subscription/sign-in behaviour changes or production scope expansion. Preserve existing HOLD gates and unrelated work.

Definition of Done: Exact version/hash-verified Azure snapshot and prediction batch; 52 upcoming-at-cutoff fixtures, 38 saved forecasts and 14 holds accurately projected; pre-kickoff timestamps and test/snapshot freshness visible; no mock fallback; owner-only forecast access and public denial tested; staged then verified custom-domain deployment; focused tests, rollback and Control Center evidence.

Closure: TESTED on 12 November 2026. Rolling 8-day lifecycle Hub restored over real saved evidence; all 38 accepted fixtures expose the sealed 1/X/2 probability split through a hash-pinned private Vercel projection; focused suite 11/11 PASS; production deployment dpl_9r9asVUnawjznjSFcDToD2DZBNKp READY on skcsai.co.za and www.skcsai.co.za; signed-out evidence remains blocked. Further customer prediction-market expansion is separate work.

## SOCCER-WEB-002 — TESTED

Four operational fixture-detail market tabs: **1X2**, **Same Match Bet**, **Secondary Outcomes**, and **Double Chance & Combinations**.

Definition of Done: exactly four accessible tabs operate in the fixture detail; 1X2 is unchanged; Double Chance displays exact derived 1X/X2/12 values; unsupported Same Match Bet/Secondary/combination outputs fail closed with plain-language unavailable status; no mock fallback; focused tests and live custom-domain verification pass.

Closure: TESTED on 12 November 2026. Production deployment `dpl_HfAL9BFedQbeRCt4UzFuhbMxh214` is READY on `skcsai.co.za` and `www.skcsai.co.za`. Focused website tests 14/14 PASS; JavaScript syntax PASS; Control Center checker PASS. Standard Double Chance is derived only from sealed 1X2 probabilities. Unsupported joint markets are not fabricated and remain unavailable until a separately governed pre-match market pipeline saves them.

## SOCCER-GATE-001 — TESTED / HOLD

Governed football customer-market publication law implemented and verified.

- Customer order: **1X2 → Secondary Outcomes → Same Match Bet → Double Chance & Combinations**.
- 1X2 75%+ = STRONG candidate subject to hard gates.
- 1X2 70% to below 75% = REVIEW band; original probability is never changed. Publication requires at least two distinct governed independent corroborating supports, Scout Shadow GREEN, clean provenance/pre-kickoff proof and no material contradiction.
- Below 70% = route preference to independently valid Secondary Outcomes; other customer market families remain selectable when independently valid.
- No synthetic/default secondary confidence may be published.
- Logical contradiction is separated from correlation/overlap so compatible customer choices remain available.
- Focused + website + Control Center ledger tests: **74/74 PASS**.
- Production deployment `dpl_9RXH9Xi7Vutq61QNTuvfaunJG6Xk` READY on `skcsai.co.za` and `www.skcsai.co.za`; requested tab order and owner-only evidence boundary verified live.

**HOLD boundary:** player-v-player H2H, referee-v-team history and weather cannot yet promote a 70-<75% review-band fixture because those evidence families are not all live governed transport inputs. The Governor fails closed until a separate evidence-transport/quality mini-project proves them.

## SOCCER-MARKETS-001 - IN_PROGRESS / W7 LIVE CHECKPOINT

Create one governed football market catalogue across **1X2 -> Secondary Outcomes -> Same Match Bet -> Double Chance & Combinations**.

Live W7 checkpoint:
- Existing sealed pre-match 1X2 remains unchanged and was not recollected.
- W7 was generated at `2026-11-12T14:10:52.703Z` (16:10:52 SAST), before the earliest 19:00 SAST kickoff.
- W7 projection SHA-256: `0be14df273654f52944bbaf4e0511d406f60199e8e125cbac0228ab098fe109c`.
- Same Match customer output is **4-Leg / 6-Leg / 8-Leg** only; the raw two-leg combination inventory is internal evidence.
- Each available size displays at most the top three ranked compatible offers.
- Tiers: **Statistical Edge / Speculative Edge / High-Variance Play**; <8% joint probability is suppressed.
- Unavailable size tabs are greyed and display only **Insufficient data**.
- 4-leg available 32/38; 6-leg 19/38; 8-leg 10/38.
- W7 uses contradiction screening plus a correlation-aware Gaussian-copula joint model.
- Focused regression **56/56 PASS**; Control Center checker PASS.
- Preview `dpl_GA9hqSvr8bsTFPwx9h1aTKkoBvRA` READY and private Blob runtime proof PASS.
- Production `dpl_DF9TthytoB6SPW6xTJYz6RKZsCVN` READY at `bb9358b0ea684b950b7ab15ba465988a289287e0`, mapped to `www.skcsai.co.za` and `skcsai.co.za`.
- Production static verification confirms the new 4/6/8 renderer and removes the old raw Same Match presentation.

Remaining scope before formal closure:
- Add/catalogue the additional builder families identified by the owner-provided Same Bet Builder benchmark.
- Keep player publication HOLD until current-fixture eligibility/expected-minutes is confirmed.
- Keep sparse evidence fail-closed.

Next action: Remain inside SOCCER-MARKETS-001. Treat W7 Same Match 4/6/8 as the live customer checkpoint. Continue cataloguing and modelling the additional builder families identified by the owner benchmark across Secondary/Same Match candidate eligibility before formal closure; preserve fail-closed player/current-lineup and sparse-evidence gates.