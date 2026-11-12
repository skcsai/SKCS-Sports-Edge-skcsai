# SKCS Edge Project Backlog

Generated from `EDGE_MASTER_PROJECT_REGISTER.v1.json`.

A repository file is an asset. It is not automatically a project.

| Project ID | Project | Category | Status | Priority | Governed By | Next Action |
|---|---|---|---|---|---|---|
| ECC-001 | Edge Control Center v1 | Control Center | DONE | critical | ECC-001 | Inspect and separately approve EPR-001 Edge Master Project Register. |
| EPR-001 | Edge Master Project Register | Control Center | TESTED | critical | EPR-001 | EPR-001 foundation closed and TESTED. Preserve the Edge Master Project Register, complete tracked repository asset coverage, governed pre-existing untracked workspace candidate snapshot, governed unresolved final project ownership findings, and rule/governance authority candidate graph as Control Center truth. Do not start ESA-001 or unblock Scout ↔ Edge marriage without separate approval; preserve all blocked gates and fail-closed integrity laws. |
| EDGE-GOV-001 | Edge Asset Work Sequence Policy | Control Center | DONE | critical | EDGE-GOV-001 | No further action. |
| ESA-001 | Edge System and Runtime Inventory | Architecture Foundation | TESTED | critical | ESA-001 | ESA-001 closed as TESTED; follow Control Center sequencing for the next governed task. |
| EAC-001 | Edge Asset Classification and Repository Map | Repository Organization | TESTED | critical | EAC-001 | EAC-001 is TESTED and closed. Preserve the 1048/1048 classification inventory and 29-batch map as governance truth. Do not reopen EAC for ESA runtime-inventory drift. Re-enter the Edge Control Center/governors and separately reconcile the stale ESA runtime inventory before any D1/R1 prediction implementation, marriage-gate clearance, provider removal, database mutation, deployment, or publication activation. |
| EAC-R1-001 | EAC-001 B18 Manifest and Repository Map Alignment Repair | Repository Organization | DONE | critical | EAC-R1-001 | No further action. |
| EMG-001 | Scout-Edge Marriage Gate Contract | Scout Handoff | APPROVED | critical | EMG-001 | Contract sealed (EMG-001-C1). Proceed to EFI-001 contract inspection when separately authorized. Gate remains BLOCKED. |
| EFI-001 | FIP Intake Handshake | Scout Handoff | TESTED | critical | EFI-001 | EFI-001-I1 tested. Continue only with separately authorized EST-001-I1/EPI/EPRV/E2E sequencing; do not clear the marriage gate or run E2E proof from this packet. |
| EST-001 | Supabase Storage and FIP Retention Contract | Data and Storage | TESTED | critical | EST-001 | EST-001-I1 tested. Continue only with separately authorized EPI/EPRV/E2E sequencing or a separately approved physical Supabase persistence packet; do not persist full FIP bodies or clear gates from this packet. |
| ESEC-001 | Subscriber and Security Boundary | Security and Commercial Boundary | PARTIAL | critical | ESEC-001 | ESEC-001-I1 source-and-test remediation PASS. AUTH-001, SUB-001, KEY-001, CRON-001, ROUTE-001 and DB-001 are source-closed and tested; CRED-001 source credential separation is closed but production configuration and rotation proof remain unverified. RLS-001 remains OPEN and separately excluded. Keep ESEC-001 PARTIAL and all runtime gates BLOCKED. Next separately authorize RLS-001 or production runtime/deployment verification; do not deploy, execute E2E proof, activate Scout transport, apply RLS migrations or clear any gate without explicit approval. |
| EPI-001 | Prediction Pipeline Integrity | Prediction Pipeline | TESTED | critical | EPI-001 | EPI-001-C1 tested. Continue only with separately authorized EPI implementation, EPRV provider-removal, or E2E sequencing; do not change prediction runtime, remove providers, run SQL, mutate Supabase, or clear gates from this packet. |
| EPRV-001 | External Sports Provider Removal | Provider Boundary | PARTIAL | critical | EPRV-001 | EPRV-001-C1 tested. Continue only with a separately authorized provider-removal implementation packet after FIP replacement mapping and fail-closed no-input proof are prepared; do not edit runtime provider code, delete providers, run SQL, mutate Supabase, execute E2E proof, or clear gates from this packet. |
| EGR-001 | Grading and Accuracy Governance | Prediction Lifecycle | PROPOSED | high | EGR-001 | Wait for system inventory. |
| EAI-001 | AI Provider and EdgeMind Boundary | AI and Inference | PROPOSED | high | EAI-001 | Wait for system inventory. |
| EUI-001 | Subscriber UI and Prediction Delivery | UI and Delivery | PROPOSED | high | EUI-001 | Wait for security and pipeline inventory. |
| ECU-001 | Edge Control Center Operator UI | UI and Delivery | APPROVED | high | ECU-001 | Implement ECU-001 Edge Control Center operator UI v1 |
| EOPS-001 | Deployment and Operations Governance | Deployment and Operations | PROPOSED | high | EOPS-001 | Wait for system, storage, and security inventory. |
| FIP-001 | Scout FIP Authority Contract | Scout Handoff | APPROVED | critical | FIP-001 | Authority registered (FIP-001-C1). Proceed to EFI-001-I1 intake implementation when separately authorized. |
| E2E-001 | Scout to Edge End-to-End Proof | Scout Handoff | BLOCKED | critical | E2E-001 | E2E-001 remains BLOCKED after ESEC-001-I1 source-and-test remediation. ESEC-001 is still PARTIAL because RLS-001, production credential verification and runtime/deployment proof remain open. Do not execute live E2E proof, authorize Scout transport, deploy functions, apply RLS migrations, alter provider runtime, enable routes or clear any runtime governance gate without separate explicit approval. |
| ESA-RR-001 | ESA-RR-001 Runtime Repair Base Contract (Approved) | Governance and Contract Refinement | APPROVED | high | ESA-RR-001 | Proceed to ESA-RR-002 scope refinement and sealing (contract-only). |
| ESA-RR-002 | ESA-RR-002 Implementation Law Seal (Hold) | Governance and Contract Refinement | TESTED | critical | ESA-RR-002 | Resume EAC-001 classification at B02 / file 16. |
| SEM-GOV-001A | Canonical Lifecycle, Terminology, Rolling Eight-Day Funnel and Help Contract | Unified Sports Intelligence Lifecycle | APPROVED | critical | SEM-GOV-001A | SEM-GOV-001A contract sealed. SEM-GOV-001B-C1 persistence contract sealed. Runtime Governor implementation remains blocked until separately authorized. |
| SEM-GOV-001B | Football Lifecycle Persistence Contract | Unified Sports Intelligence Lifecycle | APPROVED | critical | SEM-GOV-001B | SEM-GOV-001B-C1 contract sealed. SEM-GOV-001B-I2 design packet sealed. SEM-GOV-001B-I3 pure LifecycleGovernor foundation sealed. SEM-GOV-001B-I4-CAP closed with HOLD. SEM-GOV-001B-I4-CAP2 closed with PASS FOR I4 CONTROL CENTER ACTIVATION. I4 implementation blocked pending separate implementation packet and supabase_storage_gate clearance. |
| SEM-GOV-001B-I2 | Lifecycle Governor Foundation Design Packet | Unified Sports Intelligence Lifecycle | APPROVED | critical | SEM-GOV-001B-I2 | SEM-GOV-001B-I2 design packet sealed. SEM-GOV-001B-I3 pure LifecycleGovernor foundation sealed. |
| SEM-GOV-001B-I3 | Pure Lifecycle Governor Foundation | Unified Sports Intelligence Lifecycle | APPROVED | critical | SEM-GOV-001B-I3 | SEM-GOV-001B-I3 pure LifecycleGovernor foundation sealed. SEM-GOV-001B-I4-CAP closed with HOLD. SEM-GOV-001B-I4-CAP2 closed with PASS FOR I4 CONTROL CENTER ACTIVATION. I4 implementation blocked pending separate implementation packet and supabase_storage_gate clearance. |
| SEM-GOV-001B-I4-CAP | Supabase Free-Tier Capacity and Retention Design | Unified Sports Intelligence Lifecycle | DONE | critical | SEM-GOV-001B-I4-CAP | SEM-GOV-001B-I4-CAP closed with HOLD. SEM-GOV-001B-I4-CAP2 closed with PASS FOR I4 CONTROL CENTER ACTIVATION. I4 implementation blocked pending separate implementation packet and supabase_storage_gate clearance. |
| SEM-GOV-001B-I4-CAP2 | 50-Fixture Daily Admission Capacity and Enforcement Design | Unified Sports Intelligence Lifecycle | DONE | critical | SEM-GOV-001B-I4-CAP2 | SEM-GOV-001B-I4-CAP2 closed with PASS FOR I4 CONTROL CENTER ACTIVATION. SEM-GOV-001B-I4 implementation foundation TESTED; migration authored NOT APPLIED; production activation BLOCKED. |
| SEM-GOV-001B-I4 | Lifecycle Persistence Implementation | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001B-I4 | SEM-GOV-001B-I4 implementation foundation TESTED. Migration authored NOT APPLIED. Production activation BLOCKED pending supabase_storage_gate clearance and separate authorization. |
| SEM-GOV-001D-UI1 | Sports Match Hub UI Information Architecture and Screen Contract | Unified Sports Intelligence Lifecycle | PROPOSED | critical | SEM-GOV-001D-UI1 | SEM-GOV-001D-UI1 screen contract PROPOSED. UI2 static implementation NOT STARTED pending separate authorization. |
| SEM-GOV-001D-UI2 | Static Sports Match Hub Implementation | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI2 | SEM-GOV-001D-UI2 static Hub TESTED. UI3 read-model API NOT STARTED pending separate authorization. |
| SEM-GOV-001D-HOME1 | Home Page Information Architecture and Visual Consolidation | Unified Sports Intelligence Lifecycle | TESTED | high | SEM-GOV-001D-HOME1 | SEM-GOV-001D-HOME1 home landing TESTED. UI3/UI4 NOT STARTED. |
| SEM-GOV-001D-UI3-I1 | Lifecycle Read-Model API Inspection and Contract | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I1 | SEM-GOV-001D-UI3-I1 inspection PASS WITH BLOCKER. UI3 implementation BLOCKED pending metadata projection, identifier design, migration apply, and gate clearance. |
| SEM-GOV-001D-UI3-I2 | Canonical Fixture Metadata Projection Inspection and Contract | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I2 | SEM-GOV-001D-UI3-I2 inspection PASS WITH BLOCKER. Source B persistence NOT AUTHORIZED pending EST-001 and storage-policy mini-project. |
| SEM-GOV-001D-UI3-I3 | Source B Storage Policy and Retention Contract | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I3 | SEM-GOV-001D-UI3-I3 PASS WITH CORRECTION. D3 schema design packet SEM-GOV-001D-UI3-I4 authorized. |
| SEM-GOV-001D-UI3-I4 | Source B Schema and Persistence Implementation Design | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I4 | SEM-GOV-001D-UI3-I4 PASS WITH CORRECTION. UI3-I5 implementation authorized. |
| SEM-GOV-001D-UI3-I5 | Source B Migration and Isolated Persistence Implementation | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I5 | SEM-GOV-001D-UI3-I5 PASS WITH CORRECTION. UI3-I6 adapter contract authorized. |
| SEM-GOV-001D-UI3-I6 | EFI-001 Governed Intake Inspection and Adapter Contract | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I6 | SEM-GOV-001D-UI3-I6 PASS WITH BLOCKER. UI3-I7 adapter implementation authorized. |
| SEM-GOV-001D-UI3-I7 | Governed FIP Intake Adapter Implementation | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I7 | SEM-GOV-001D-UI3-I7 PASS WITH CORRECTION. Durable evidence storage authorized in UI3-I8. |
| SEM-GOV-001D-UI3-I8 | Durable Intake Evidence Storage and Isolated Implementation | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I8 | SEM-GOV-001D-UI3-I8 PASS WITH CORRECTION. Composition root authorized in UI3-I9. |
| SEM-GOV-001D-UI3-I9 | Production Composition and M2M Auth Foundation | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I9 | SEM-GOV-001D-UI3-I9 PASS. Migration readiness authorized in UI3-I10. |
| SEM-GOV-001D-UI3-I10 | Migration Readiness and Controlled Apply | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I10 | SEM-GOV-001D-UI3-I10 formal Gate B closure PASS. I11 Gate A authorized. |
| SEM-GOV-001D-UI3-I11 | Controlled End-to-End Marriage Proof | Unified Sports Intelligence Lifecycle | TESTED | critical | SEM-GOV-001D-UI3-I11 | SEM-GOV-001D-UI3-I11 is closed as TESTED with Gate B PASS_MOCK_ONLY and Gate B-C1 PASS. Next perform a separate E2E-001 execution-readiness blocker reconciliation. Do not authorize live proof execution, runtime activation, I12, D1, R1, Scout transport, or governance-gate clearance in this closure. |
| SXE-FIP-LAB-001 | Genuine Scout-to-Edge External FIP Controlled Proof | Scout Handoff | IN_PROGRESS | critical | SXE-FIP-LAB-001 | Run the read-only one-commit publication preflight for SXE-FIP-LAB-001D. After that governance reconciliation is published and identity-locked, return to Scout Control Center for the first legally executable official fixture-source authorization. Do not acquire data, consume a genuine FIP, run a live prediction, or deploy. |
| SXE-FIP-LAB-001B | Edge Canonical FIP Intake Boundary Hardening | Scout Handoff | TESTED | critical | SXE-FIP-LAB-001B | Closed at TESTED. No further action is assigned to SXE-FIP-LAB-001B; subsequent sequencing is owned by SXE-FIP-LAB-001 and SXE-FIP-LAB-001D. |
| SXE-FIP-LAB-001C | Edge Hardening Closure Verification | Scout Handoff | TESTED | high | SXE-FIP-LAB-001C | Closed at TESTED. No further action is assigned to SXE-FIP-LAB-001C; the published-baseline debt attribution remains recorded. |
| SXE-FIP-LAB-001D | Edge Post-Publication Metadata Reconciliation | Scout Handoff | TESTED | high | SXE-FIP-LAB-001D | SXE-FIP-LAB-001D is closed at TESTED. Run the read-only one-commit publication preflight for the exact four-file governance scope. After publication and identity lock, return to Scout Control Center for official fixture-source authorization. |
| ESA-RR-003 | ESA-RR-003 Irrecoverable Preserved-Candidate Resolution Contract | Governance and Contract Refinement | TESTED | critical | ESA-RR-003 | CLOSED. Preserve the sealed evidence-only law. Separately govern existing ESA-RR-002 runtime-inventory drift and any ESA-RR-004 checker/generated-output implementation before EPI/D1 prediction work begins. |
| ESA-RR-004 | ESA-RR-004 Runtime Inventory Evidence-Only Reconciliation | Governance Runtime Inventory Repair | TESTED | critical | ESA-RR-004 | CLOSED. Exact-eight evidence-only tombstones and regenerated runtime inventory/map are proven by T01-T16 plus clean read-only control:runtime replay. Prediction/runtime application changes remain separately governed. |
| EPI-001-D1-R1 | EPI-001-D1-R1 Governed D1 Prediction Provenance Integration | Prediction Pipeline Integrity | TESTED | critical | EPI-001-D1-R1 | CLOSED. Preserve minimal R1 provenance whitelist and existing D1 behaviour; return to Edge Control Center/governors for separately authorized next work. |
| EPRV-001-C2 | EPRV-001-C2 FIP Replacement Mapping and Fail-Closed Provider Readiness Contract | External Provider Removal Governance | TESTED | critical | EPRV-001-C2 | CLOSED / HOLD FOR IMPLEMENTATION. Five context classes remain MISSING_BLOCKER; no provider-removal runtime work authorized. |
| EPRV-001-C3 | EPRV-001-C3 Upstream Context Availability Reconciliation | External Provider Removal Governance | TESTED | critical | EPRV-001-C3 | CLOSED. Three Scout-existing transport gaps; two upstream collection/governance gaps; provider removal remains HOLD. |
| EPRV-001-C4 | EPRV-001-C4 Governed Scout Context Transport Field Contract | External Provider Removal Governance | TESTED | critical | EPRV-001-C4 | CLOSED. Three field contracts sealed; runtime mapping waits for separately authorized Scout FIP emission. |
| EOPS-001-A1 | Azure Migration Stage A - Inventory, Costed Candidate and Startup Safety | Deployment and Operations | TESTED | critical | EOPS-001-A1 | CLOSED. Stage A candidate, cost evidence, startup safety, secure container build and Azure what-if published; no deployment or Stage B. |
| ESEC-001-I2 | Production Runtime Credential and Deployment Configuration Verification | Subscriber and Security Boundary | TESTED | critical | ESEC-001-I2 | CLOSED / HOLD. Verification proved production credential/deployment blockers; no deployment, secret mutation, RLS or Stage B. |
| ESEC-001-I3 | Production Credential Remediation and Key Vault Integration | Subscriber and Security Boundary | TESTED | critical | ESEC-001-I3 | CLOSED / HOLD. Source/RBAC/Key Vault-reference remediation passed; empty Edge vault and separate RLS-001 keep deployment blocked. |
| ESEC-001-I4 | Production Secret Provisioning and Rotation Proof | Subscriber and Security Boundary | TESTED | critical | ESEC-001-I4 | CLOSED / HOLD. Seven credentials provisioned securely; temporary write role revoked; cron-secret and skcs-refresh-key explicitly blocked; RLS separate; no deployment or Stage B. |
| ESEC-001-I5 | Azure Scheduler and Refresh Credential Boundary Resolution | Subscriber and Security Boundary | TESTED | critical | ESEC-001-I5 | CLOSED / HOLD. Azure uses ADMIN_API_KEY for refresh/operator auth; Azure-only cron-secret created securely; temporary write role revoked; RLS remains separate; no deployment or Stage B. |
| ESEC-001-I6 | RLS-001 Server-Only Table Boundary and Privilege Hardening | Subscriber and Security Boundary | TESTED | critical | ESEC-001-I6 | CLOSED / HOLD — source hardening proven; live migration apply deferred to next authorized active database target; no Supabase restore or Stage B. |

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