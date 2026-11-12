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

## UI2 lifecycle-hub restoration repair

Stephen reported that the published saved-evidence table had displaced the deliberately designed rolling lifecycle Sports Match Hub. The preserved UI2 source was inspected at the previous canonical commit and in the retained acceptance fixture before any repair.

Repair scope remains inside SOCCER-WEB-001. The home page, authentication handler, private snapshot, provider usage, prediction code, Shadow output, production/marriage gates and unrelated assets are unchanged.

- Restored the original dashboard structure: Sport, Competition, **Date — Rolling 8-Day Window**, Lifecycle State, Lifecycle Funnel Summary, selected-day counters, fixture stage/state table, fixture detail stage path, EdgeMind saved-evidence summary and guide rail.
- Did **not** restore the old mock-data runtime. The active page still loads only `js/sports-match-hub-evidence.js` and the authenticated `/api/evidence/nations-league` endpoint.
- The immutable canary evidence is mapped conservatively: insufficient-history holds stop at Evidence Review; confidence holds stop at Stability Review; GREEN saved pre-match records reach Final Decision / Review Complete.
- The UI explicitly states that the immutable snapshot does not contain per-stage timestamps and therefore does not invent them.
- The lifecycle funnel uses the verified batch counts: 52 upcoming-at-cutoff; 48 after four history holds; 38 after ten confidence holds; 38 GREEN saved records through publication/final decision.
- Eight clickable day tabs are anchored to the saved evidence window, preserving the intended day-by-day operating view while the current source remains a fixed canary snapshot.
- Focused regression protection now asserts the rolling day tabs, lifecycle funnel, governed stage mapping, real evidence endpoint and absence of mock runtime fallback.

Repair branch: `repair/soccer-web-001-ui2-restore`, based exactly on published `f680515eaf3134982b816b00f1f9051e0d7acacb`.

Repair acceptance remains pending until the branch preview is READY, the restored UI is verified against the real authenticated evidence path, and the exact reviewed repair is promoted to the custom domain.


## Full 1X2 probability visibility repair

Stephen confirmed that the customer-facing 1X2 example must show all three expected outcomes (1 / X / 2), not only the selected outcome and governed confidence.

Evidence inspection was read-only against the immutable `SOCCER-UNL-001` batch already exported in Azure logs. No API-SPORTS request, prediction rerun, Shadow call, or database/write operation occurred.

- All 38 accepted saved Edge seals contain `decision.probabilities_pct.home_win`, `draw`, and `away_win`.
- Each triplet sums to 100% within stored rounding; the selected prediction is the largest stored probability. Two stored `raw_top_probability_pct` values differ from their rounded selected value by 0.01 percentage point and are accepted only within the explicit 0.011 stored-rounding tolerance.
- Example verified from the immutable seal: Türkiye 11.89%, Draw 16.53%, Belgium 71.58%.
- Governed confidence remains a separate field. Where the raw top probability exceeds the existing confidence cap, the website must show the full expected 1X2 probability and the governed confidence separately rather than treating them as the same metric.
- A probability-only private projection was derived for exactly 38 accepted fixtures, SHA-256 `2489fd77c34ea2ba812254a54552a52574f2b79853f51d236c18774753b08a98`. Held fixtures have no forecast probabilities.
- Public source contains no probability dataset. Code accepts the projection only from sensitive server configuration and pins its exact SHA-256.
- Focused isolated Vercel Sandbox test: 11 tests, 11 pass, 0 fail/skipped. The hash-pinned loader independently read all 38 probability rows and returned the Türkiye/Belgium triplet above.
- Preview deployment for branch `repair/soccer-web-001-1x2-probabilities` is READY. The existing production website remains unchanged at this checkpoint.
- Publication is blocked only by Vercel configuration authority: the connected Vercel credential returns HTTP 403 for both listing and creating project environment variables. The code fails safe and preserves the current website when `SOCCER_WEB_001_1X2_JSON` is absent. No private values were committed as a workaround.

Exact remaining action: provision the validated probability projection as sensitive Vercel variable `SOCCER_WEB_001_1X2_JSON` for production/preview using an authorized Vercel account or CLI, then verify the authenticated owner view and publish the reviewed branch.


### 1X2 release gate resolved

- DeskMCP local Vercel CLI identity `sfynn13433-3427` was used only for Vercel configuration; the dirty historical Edge workspace was inspected and not modified.
- `SOCCER_WEB_001_1X2_JSON` was provisioned as a Vercel **Secret** for Production and Preview. Vercel listing confirms the value is Hidden. The temporary local transfer file was deleted immediately after provisioning.
- Fresh preview deployment `dpl_9g5NsFBBsmde9GmsDKqjUQq79KMG` from reviewed branch commit `474d110fe0df7e07a207e15e24a84d68cea9aa82` is READY.
- Authenticated Vercel CLI preview delivery check: Hub HTML contains the restored day-tabs and Lifecycle Funnel Summary; deployed JS contains `Expected 1X2 outcome`, `outcome_probabilities_pct`, and the separate `governed confidence` label.
- Preview application evidence endpoint remains closed to signed-out access and returns the existing Microsoft sign-in-required error.
- Focused isolated tests remain 11/11 PASS. No fixture recollection, scoring rerun, Shadow call, API-SPORTS call, production prediction write or database mutation occurred.

Production publication may now proceed only by non-force fast-forward from the previously verified production base `69c938c4c1919ae3fcdd61a82b742632a2c6f71d`, provided canonical main is still identical to that base.
