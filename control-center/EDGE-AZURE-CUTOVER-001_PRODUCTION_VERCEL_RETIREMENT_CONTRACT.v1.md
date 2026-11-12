# EDGE-AZURE-CUTOVER-001 — Production Vercel Retirement Contract v1

## Authority

Owner instruction on 12 November 2026: complete the SKCS production move to Azure and remove Vercel from the production path. This mini-project temporarily holds SOCCER-MARKETS-001. No football/prediction logic changes are authorized inside this cutover.

## Frozen application payload

- Source branch frozen for migration input: `feature/soccer-markets-001-complete-catalogue`
- Frozen source commit: `84e0fac1ef9eee281d0321a6a6d256cd018cb819`
- Corrected focused market regression at freeze point: 57/57 PASS.
- During this cutover, application logic may be changed only when required to make the existing application run correctly on Azure. Any prediction/model/market-rule change is prohibited.

## Start point

- Public production domains `skcsai.co.za` and `www.skcsai.co.za` are still served by Vercel.
- Vercel deployment quota has blocked further same-day production releases.
- Azure subscription `a62a614c-efbc-4fa2-bfc1-b5894e0e0ad2` is Enabled.
- Azure already contains Edge PostgreSQL Flexible Server, ACR, Key Vault, Storage, Log Analytics, managed identities, Container Apps environments, Container Apps/jobs, networking/private DNS and customer identity resources.
- Six Edge Container Apps currently report provisioningState `Succeeded`.
- Latest verification candidates include `ca-skcs-edge-c14-zan-001` and `ca-skcs-edge-c14-zan-002`.
- Existing Stage-A Bicep is canary-only and must not be treated as the final production definition without promotion/hardening.

## Objective

Move the SKCS public website and Edge web/API runtime completely from Vercel to Azure while preserving the existing UI, authentication boundary, database/storage integrations and rollback capability.

## In scope

1. Identify and prove the canonical Azure production Container App target.
2. Build/push the frozen application image to the governed Azure Container Registry.
3. Configure production Container App ingress, health probes, scaling and managed identity.
4. Bind required secrets through Azure Key Vault references; no plaintext secret values in source or deployment logs.
5. Connect the runtime to the existing Azure PostgreSQL/Storage/observability resources.
6. Verify website, APIs, Sports Match Hub, owner authentication and protected evidence on the Azure hostname before DNS cutover.
7. Bind `skcsai.co.za` and `www.skcsai.co.za` to Azure Container Apps with TLS.
8. Change production DNS only after Azure acceptance passes.
9. Verify both custom domains are served by Azure.
10. Retain the last known-good Vercel deployment as rollback only during the cutover window, then remove Vercel from production traffic.
11. Record deployment IDs/revisions, DNS/TLS evidence, tests, rollback and final Control Center closeout.

## Explicitly out of scope

- Prediction or market-model changes.
- Recomputing sealed pre-match predictions.
- Rewriting historical forecast evidence.
- Customer subscription/payment work.
- New provider integrations.
- Deleting Azure resources that are merely old or redundant; cleanup is a later governed task.
- Deleting the Vercel project before Azure rollback proof is complete.

## Definition of Done

EDGE-AZURE-CUTOVER-001 is complete only when:

1. `https://skcsai.co.za` is served from Azure.
2. `https://www.skcsai.co.za` is served from Azure.
3. Website static assets and the existing UI load successfully.
4. Edge API health and required application routes pass on Azure.
5. Owner sign-in/authentication boundary works on Azure.
6. Protected evidence remains denied to unauthenticated users.
7. Azure PostgreSQL/storage/Key Vault/observability integrations pass.
8. No production DNS record points to Vercel.
9. Vercel receives no production traffic.
10. Rollback to the prior Vercel production deployment is documented and proven before retirement.
11. Focused application tests and Control Center checks PASS.
12. Control Center records the exact Azure production revision and cutover evidence.

## Rollback law

Until final closeout, the last known-good Vercel deployment remains an emergency rollback target only. DNS must not be changed until the Azure hostname passes acceptance. If post-DNS validation fails, restore the previous DNS target first, then diagnose Azure.

## Estimated active engineering effort

Approximately 4–6 active hours because the core Azure resources already exist. DNS/TLS propagation may add elapsed time but is not counted as engineering effort.
