# ESEC-001-I2 — Production Runtime Credential and Deployment Configuration Verification

Date: 8 November 2026
Status: **TESTED / HOLD — READ-ONLY — NO DEPLOYMENT**

## Objective

Verify whether the Edge production credential and Azure deployment boundary is ready for a live canary. This packet does not authorize deployment, secret creation/rotation, RLS changes, Supabase restoration, DNS, Render/Vercel changes or Stage B.

## Control Center start point

- Registration commit: `416676dd40e62bff889a0d342ced6a662e39a93c`.
- Registration accepted by Edge Control Center.
- Registration checkpoint: 361/361 tests PASS; Control Center, project register, assets, classification and runtime inventory PASS.
- Parent `ESEC-001` remains PARTIAL.
- `RLS-001` remains separately OPEN.

## Read-only Azure evidence

The existing Edge Key Vault `kv-skcs-edge036-zan1` uses Azure RBAC, has purge protection enabled, seven-day soft-delete retention and public network access enabled.

No secret value was requested or read. The signed-in deployment identity is a subscription Owner at the management plane, but Key Vault rejected even secret-metadata listing with `ForbiddenByRbac`. Secret existence, expiry and rotation metadata are therefore not proven.

The user-assigned Edge identity `id-skcs-edge036-zan-001` currently has **zero Azure RBAC role assignments**, so it has no proven Key Vault data-plane secret-read permission.

The Edge Container Apps environment is healthy on Consumption and there are still **zero live Edge Container Apps**.

## Deployment candidate evidence

The Stage A Bicep candidate remains side-effect safe in `SKCS_STARTUP_MODE=canary`, but it contains no `keyVaultUrl`, no Container Apps `secretRef` wiring, and no plaintext production secret values. This is safe for Stage A verification but is not a production credential configuration.

## Credential-class law

ESEC-001-I1 remains authoritative. Database, Supabase anon, Supabase service-role, scheduler, operator/admin, provider and Scout HMAC credentials must remain distinct. A legacy `SUPABASE_KEY` alias remains referenced in active backend modules; production configuration must not use it to blur anon and service-role classes.

## New security blocker

`backend/services/dataProvider.js` currently logs prefixes of the API-Sports and Odds API secret values using `.slice(...)`. Production runtime must log only SET/MISSING state, never any characters from a secret. I2 records this defect and does not repair it.

## Decision

**ESEC-001-I2 = TESTED / HOLD candidate.**

Production Azure deployment is not approved because:

1. Edge managed identity has no proven Key Vault data-plane role.
2. Secret metadata/rotation state cannot currently be verified.
3. Container Apps Bicep has no Key Vault secret-reference wiring.
4. Provider-key diagnostics expose partial secret values.
5. Legacy `SUPABASE_KEY` naming remains ambiguous for production configuration.
6. `RLS-001` remains separately OPEN.

Therefore `ESEC-001` stays PARTIAL and `EOPS-001` / Azure Stage B stays blocked.

## No-mutation proof

No secret value read; no secret created, changed, rotated or deleted; no Azure Container App deployed; no RLS migration applied; no Supabase restore; no Render/Vercel/DNS change; no Stage B start.

## Next governed work

A separately registered security-remediation mini-project should remove partial-secret logging, establish explicit production credential names, design Key Vault references and least-privilege RBAC, and prove rotation metadata without exposing values. RLS remains a separate mini-project.

## Formal closure

ESEC-001-I2 is **TESTED and CLOSED / HOLD**. The verification succeeded by proving that Azure Stage B must remain blocked. Parent ESEC-001 remains PARTIAL. No cloud or secret mutation occurred.

Final closure verification: focused I2 proof 6/6 PASS; full Edge Control Center 361/361 PASS; projects/assets/classification/runtime PASS; runtime 233 inventory / 224 discovered / 0 warnings.
