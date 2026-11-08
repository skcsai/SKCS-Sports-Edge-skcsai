# ESEC-001-I5 — Azure Scheduler and Refresh Credential Boundary Resolution

Date: 8 November 2026
Status: **IN PROGRESS — PRE-APPLY VERIFIED**

## Objective

Resolve the two credential blockers left by ESEC-001-I4 without deploying Edge.

I5 establishes one source of truth for Azure refresh/operator authentication and creates a separate Azure-only scheduler secret. Current Vercel and Render credentials remain unchanged.

## Governed start point

- I4 closure: `113b0c6867fd63c847ec5eb01ac972f697d6f74f`.
- I5 registration: `53f9b32e270c9769f39584301a927fb9db1772df`.
- Edge Control Center accepted I5 as startable.
- Baseline: 375/375 tests PASS; projects/assets/classification/runtime PASS; runtime 233 / 224 / 0 warnings.

## Refresh credential decision

Azure does **not** require a separate `SKCS_REFRESH_KEY`.

Evidence:

- current Vercel production contains `ADMIN_API_KEY` and does not contain `SKCS_REFRESH_KEY`;
- `backend/server-express.js` accepts `ADMIN_API_KEY` when `SKCS_REFRESH_KEY` is absent;
- the current package refresh trigger uses `ADMIN_API_KEY` for manual/operator refresh and `CRON_SECRET` for scheduler operations;
- scripts that still reference `SKCS_REFRESH_KEY` are classified UNKNOWN / UNRESOLVED with no registered runtime consumers.

Therefore the simplest correct Azure design is to keep `ADMIN_API_KEY` as the refresh/operator credential and remove Azure-only wiring for `SKCS_REFRESH_KEY`. I5 does not rewrite or delete the unresolved legacy scripts.

## Bicep change

Only three Azure wiring elements are removed:

1. the `skcsRefreshKeySecretName` parameter;
2. the `skcs-refresh-key` Key Vault secret reference;
3. the `SKCS_REFRESH_KEY` Container App environment injection.

`ADMIN_API_KEY` and `CRON_SECRET` remain wired.

The revised Bicep compiles successfully.

## Azure-only scheduler secret

The current Vercel `CRON_SECRET` is provider-protected and non-exportable. Azure does not need to reuse it because Azure is not yet live and its future scheduler can use a separate scheduler credential.

I5 therefore creates a fresh Azure-only `cron-secret` directly in Edge Key Vault.

The governed creator:

- refuses to overwrite an existing `cron-secret`;
- generates 48 bytes using the operating system cryptographic random-number generator;
- encodes the result as base64url;
- writes the value only to a short-lived local file;
- uses `az keyvault secret set --file`, never `--value`;
- suppresses secret-set output;
- overwrites and deletes the temporary secret file;
- grants temporary Key Vault Secrets Officer at the Edge vault only;
- revokes that temporary role in a `finally` cleanup path.

Dry-run result before creation: `READY_TO_CREATE`. Key Vault contains seven I4 secrets and no `cron-secret`.

## Rotation policy

The Azure scheduler secret has no automatic expiry because an uncoordinated expiry could break scheduled work. Rotation must be coordinated with every Azure scheduler caller that uses the secret. The I5 creator refuses silent overwrite; future rotation requires a separately governed action.

## Hard boundaries

No Azure Container App deployment. No Stage B. No RLS. No Render or Vercel secret changes. No DNS change. No Supabase mutation. No secret value disclosure.

## Bicep and what-if proof

- az bicep build: PASS.
- Resource-group what-if with productionSecretsEnabled=true: Succeeded.
- Changes: Create 1, Ignore 5, Unsupported 1, Modify 0, Delete 0.
- The only Create is the already-known future ca-skcs-edge-a1-canary Container App.
- Existing Edge environment, Key Vault, managed identity, Log Analytics workspace and storage account are Ignore / unchanged.
- The Unsupported item is the already-known cross-resource-group ACR AcrPull role-assignment ID calculation limitation.
- Deployment performed: NO.

## Pre-Apply validation

Pre-Apply validation: focused I5 proof 6/6 PASS; I3+I5 regression proof 14/14 PASS; full Edge Control Center 375/375 PASS; 1,077/1,077 assets classified; runtime 233 inventory / 224 discovered / 0 warnings.
