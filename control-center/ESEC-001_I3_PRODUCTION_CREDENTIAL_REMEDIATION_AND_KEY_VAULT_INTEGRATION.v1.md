# ESEC-001-I3 — Production Credential Remediation and Key Vault Integration

Date: 8 November 2026
Status: **IN PROGRESS — REMEDIATION PASS / PRODUCTION SECRET POPULATION HOLD**

## Objective

Resolve the production credential defects proven by ESEC-001-I2 without deploying Edge. I3 removes partial secret disclosure, separates public and privileged Supabase credential classes, establishes least-privilege Key Vault RBAC, and adds Key Vault-backed Container Apps secret-reference design. Secret values are not created, changed, rotated, read, copied or committed in this packet.

## Control Center start point

- Canonical start commit: `265d6d8d3a1ccf81ff387a399115b5276b4ed254`.
- I3 registration published at `9054473bdb449a421254d3e3786728c3f40a2982`.
- Registration accepted by the Edge Control Center as startable.
- Registration baseline: 361/361 tests PASS; projects/assets/classification/runtime PASS; runtime inventory 233 governed / 224 discovered / 0 warnings.
- Parent `ESEC-001` remains PARTIAL.
- `RLS-001` remains separate and OPEN.

## Source remediation

Provider diagnostics in `backend/services/dataProvider.js` now report only `SET` or `MISSING`. They no longer print any prefix from API-Sports, Odds API, TheSportsDB or RapidAPI credentials.

Protected runtime paths no longer use the ambiguous `SUPABASE_KEY` fallback.

Credential use is explicit:

- subscriber-facing/read-only routes use `SUPABASE_ANON_KEY`;
- privileged write/RPC/cache/admin paths require `SUPABASE_SERVICE_ROLE_KEY`;
- no protected I3 runtime path falls back between anon and service-role credentials.

## Azure Key Vault RBAC

The Edge vault is `kv-skcs-edge036-zan1`.

Two scoped RBAC assignments were applied and verified at **this vault only**:

- Edge user-assigned managed identity → **Key Vault Secrets User**;
- signed-in deployment identity → **Key Vault Reader**.

Microsoft's verified built-in role definitions show:

- Key Vault Secrets User: secret value retrieval plus metadata, required by the runtime;
- Key Vault Reader: metadata only, used for governance verification without secret values.

No new subscription-wide role was created.

## Metadata-only proof

After RBAC propagation, `az keyvault secret list` succeeded. It returned:

- secret count: **0**;
- secret values read: **NO**.

This proves RBAC is working but also proves the Edge vault is currently empty. Production secret population must therefore be a separate governed step.

## Container Apps secret-reference design

`infra/azure/eops-001-a1/main.bicep` now defines Key Vault-backed references for:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `ADMIN_API_KEY`
- `SKCS_REFRESH_KEY`
- `X_APISPORTS_KEY`
- `ODDS_API_KEY`

No values are embedded in Bicep.

`productionSecretsEnabled` defaults to `false`, preserving the side-effect-free Stage A canary. A later governed deployment may enable these bindings only after the required vault secrets exist.

The runtime Key Vault role is deliberately **not duplicated inside the Bicep template** because I3 already established and proved it as a prerequisite. The first what-if exposed that duplicate-assignment risk; the template was corrected before any deployment.

## Bicep and what-if proof

- `az bicep build`: **PASS**.
- What-if with `productionSecretsEnabled=true`: **Succeeded**.
- Proposed creation: one future Edge canary Container App.
- Existing Key Vault/environment/managed identity/storage/logging: **Ignore / unchanged**.
- Destructive changes: **0**.
- ACR AcrPull remains the known cross-resource-group what-if limitation where the generated role-assignment ID cannot be resolved until deployment.
- Deployment performed: **NO**.

## Remaining blockers

### KV-SECRETS-EMPTY-001

The Edge Key Vault contains **zero production secrets**. I3 is not authorized to create, import, rotate or copy secret values. The future Container App therefore cannot enable production secret bindings yet.

### RLS-001

RLS remains separately OPEN under ESEC-001. I3 does not apply or change RLS.

## Current disposition

Source credential remediation: **PASS**.
Vault RBAC: **PASS**.
Key Vault reference design: **PASS**.
Production secret population: **HOLD**.
RLS: **OPEN / separate**.
Azure Stage B: **NOT AUTHORIZED**.

## No-mutation proof

No secret value was read. No secret was created, changed, rotated or deleted. No Container App was deployed. Supabase was not restored. RLS was not applied. Render, Vercel and DNS were not changed. Stage B did not start.

## Validation checkpoint

Validation checkpoint: focused I3 8/8 PASS; related ESEC security regression 36/36 PASS; full Edge Control Center 369/369 PASS; projects/assets/classification/runtime PASS; runtime 233 inventory / 224 discovered / 0 warnings.
