# SOCCER-WEB-001: website evidence visibility

Start: immutable SOCCER-UNL-001 closeout, 12 November 2026; public hub still static.

Scope: Display the existing immutable Nations League test evidence on skcsai.co.za through existing owner authentication. All fixture and forecast data remains private; signed-out visitors see an access message. No Shadow output disclosure, recalculation, new provider calls, production prediction writes, subscription/sign-in behaviour changes or production scope expansion. Preserve existing HOLD gates and unrelated work.

Definition of Done: Exact version/hash-verified Azure snapshot and prediction batch; 52 upcoming-at-cutoff fixtures, 38 saved forecasts and 14 holds accurately projected; pre-kickoff timestamps and test/snapshot freshness visible; no mock fallback; owner-only forecast access and public denial tested; staged then verified custom-domain deployment; focused tests, rollback and Control Center evidence.

Authorization: Stephen requested website visibility and unlocked execution in this chat. Existing canary forecasts remain uncalibrated non-production test records.

## Source release preflight

- Immutable Azure source and saved prediction batch read through one bounded job execution; exactly two Blob GETs, zero provider calls, zero scoring, zero SQL writes; source and batch SHA-256 match SOCCER-UNL-001 closeout. Standing collector template unchanged.
- Private website DTO derives 52 upcoming-at-cutoff fixtures: 38 saved pre-match Edge forecasts with GREEN independent comparison and linked Pending IDs, four insufficient-history holds, ten confidence holds. Source timestamps, SAST kickoffs, test/uncalibrated/snapshot labels are explicit. Raw Shadow calculations remain absent.
- 168 focused website, archived UI2 and Control Center tests pass, zero failures/skips. Browser render against real saved projection shows 52 fixtures; On hold filtering shows exactly 14 with evidence reasons. Local rendering uses a test-only auth stub and is not claimed as a production owner-login proof.
- Corrected source-stage https://skcs-sports-edge-skcsai-m54dbqmxw-stephens-projects-e3dd898a.vercel.app is READY: page 200, signed-out 401, invalid-token 401, POST 405, original login page 200 and byte-identical, no public forecast disclosure. Initial source-stage packaging failure resolved by placing the exact two website-only server files under lib; original backend exclusion retained. No predictor or Governor code deployed.
- Source reconciliation preserves already-live C13 home/auth assets and the exact /api/auth/me handler. No customer profile, entitlement, password, database permission, Microsoft callback or sign-in behaviour was changed. Historical UI2 mock page is frozen only in tests.
- Rollback deployment: dpl_FYbJMaa9udoQTs8ZwQd1GkWDu8aL. All pre-existing canonical project records compare equal to the frozen main-branch baseline; existing production prediction and marriage gates remain held.

The website-only reader is placed under lib and intentionally tracked despite the existing Python-oriented Git ignore. No saved forecast data is tracked. The public repository contains code only; the exact private projection is loaded from a sensitive production server setting with a pinned SHA-256 and bounded decompression. Missing or altered configuration fails closed.

Remaining acceptance: custom-domain deployment and the real owner signed-in view.

Privacy release proof: the Edge repository is public. No private forecast file was committed or pushed; all real fixture/forecast data stays in sensitive server configuration and authenticated responses.
