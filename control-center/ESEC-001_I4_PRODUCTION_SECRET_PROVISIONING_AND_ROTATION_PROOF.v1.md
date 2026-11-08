# ESEC-001-I4 — Production Secret Provisioning and Rotation Proof

Date: 8 November 2026
Status: **TESTED / HOLD — CLOSED**

## Objective

Provision only verified existing Edge production credentials into Azure Key Vault without exposing their values. Preserve the current sources for rollback, prove metadata/rotation handling, and keep Azure deployment blocked.

## Governed start point

- I3 closure: `3fa0747b3a7f0d745b19f3eb1e5aca0e6bd6323f`.
- I4 registration: `acde69043849c3b887738a95231f4b6e9cba4819`.
- Edge Control Center accepted I4 as startable.
- Registration baseline: 369/369 tests PASS; projects/assets/classification/runtime PASS; runtime 233 / 224 / 0 warnings.

## Source evidence

Current Vercel production project `skcs-sports-edge-skcsai` contains eight of the nine I3 credential names. `SKCS_REFRESH_KEY` is absent.

Seven current Vercel values are exportable through the authenticated CLI. `CRON_SECRET` is provider-protected Secret type and Vercel substitutes `[SENSITIVE]`; I4 therefore refuses to guess or copy it from an unverifiable local source.

A one-time equality-only comparison proved that current Vercel matches the historical local Edge source for database URL, Supabase URL, Supabase anon key, Supabase service-role key and Odds API key. Current Vercel differs from the local copy for `ADMIN_API_KEY` and `X_APISPORTS_KEY`; therefore **current Vercel production is authoritative** for those values.

The Render Edge service still exists but is user-suspended. I4 does not modify it and treats it only as rollback evidence.

No credential value appears in this packet or report.

## Dry-run result

The governed provisioning script reports:

- 7 ready for secure import;
- `cron-secret` blocked because Vercel will not export the Secret-type value;
- `skcs-refresh-key` blocked because no authoritative source exists;
- secret values displayed: false;
- temporary Vercel env file wiped and removed.

## Non-echoing transfer design

The script:

1. pulls Vercel production configuration into a temporary file under the user's local SKCS secure-temp area;
2. parses the file locally with `dotenv`;
3. writes each importable value into a short-lived per-secret file;
4. calls `az keyvault secret set --file` — **never `--value`**;
5. suppresses Azure secret-set output;
6. overwrites/deletes each per-secret file immediately;
7. overwrites/deletes the Vercel temp file and manifest in a `finally` cleanup path.

No secret value is placed in Git, reports, chat, command arguments or normal command output.

## Temporary write permission

The signed-in deployment identity has subscription Owner plus Edge-vault Key Vault Reader, but management-plane Owner does not provide Key Vault secret writes.

I4 therefore authorizes a temporary **Key Vault Secrets Officer** role at the **Edge vault scope only**. It must be revoked immediately after the import attempt, whether success or failure, returning the deployment identity to Reader-only metadata access.

## Rotation policy

- Database/Supabase: preserve current values during migration overlap; rotate only after replacement is proven and rollback closes.
- Admin API key: preserve current Vercel production value during migration; rotate in a separately coordinated post-cutover security step.
- Provider keys: preserve current production values; rotate according to provider lifecycle and the provider-removal programme.
- Cron secret: fail closed until a coordinated rotation/replacement can update every caller atomically.
- SKCS refresh key: no authoritative source; do not invent it in I4. A later governed decision can retain the current ADMIN_API_KEY fallback or introduce a separate key.

## Hard boundaries

No Azure Container App deployment. No Stage B. No RLS. No Supabase restore. No Render/Vercel/DNS mutation. No secret regeneration. No secret value output.

## Pre-import validation

Pre-import validation: focused I4 proof **6/6 PASS**; full Edge Control Center **369/369 PASS**; 1,073/1,073 assets classified; runtime 233 inventory / 224 discovered / 0 warnings.

## Apply result

The published governed import candidate was run once in Apply mode.

Seven verified current Vercel production values were provisioned into the Edge Key Vault:

- database-url
- supabase-url
- supabase-anon-key
- supabase-service-role-key
- admin-api-key
- x-apisports-key
- odds-api-key

Two required names remain explicitly blocked:

- cron-secret — Vercel protects the current CRON_SECRET as a non-exportable Secret value. I4 did not substitute an unverifiable local copy.
- skcs-refresh-key — no authoritative source exists. I4 did not invent or generate a replacement.

No secret value was displayed by the Apply run and no secret value was read back from Azure.

## Post-import proof

Metadata-only Key Vault inspection confirms exactly seven provisioned I4 secrets. All seven are enabled and carry the I4 project/source/rotation tags. Their expiry field is currently unset; therefore rotation is governed by the recorded coordination policy rather than an automatic expiry date.

The temporary Key Vault Secrets Officer role was automatically revoked after the import. Post-import state is:

- deployment identity: inherited subscription Owner for management-plane work plus Key Vault Reader at the Edge vault;
- temporary Secrets Officer: absent;
- Edge runtime managed identity: Key Vault Secrets User at the Edge vault.

Operational boundary proof after import:

- live Edge Container Apps: 0;
- secure-temp sensitive files: 0;
- Render changed: NO;
- Vercel changed: NO;
- DNS changed: NO;
- RLS changed: NO;
- Stage B started: NO.

I4 can close as TESTED / HOLD because its Definition of Done permits every required secret to be either PROVISIONED or EXPLICITLY_BLOCKED. Parent ESEC-001 remains PARTIAL because cron-secret, skcs-refresh-key, and RLS-001 still require separately governed resolution.

## Formal closure

ESEC-001-I4 is TESTED and CLOSED / HOLD.

Closure proof:

- seven verified current Vercel production credentials are provisioned in Edge Key Vault;
- no secret value was displayed or read back;
- temporary Key Vault Secrets Officer access is absent after the import;
- deployment identity is back to metadata-only Key Vault Reader at the Edge vault;
- runtime identity retains Key Vault Secrets User;
- secure-temp sensitive-file count is zero;
- live Edge Container App count is zero;
- focused I4 proof is permanently included in the Control Center suite;
- final suite: 375/375 PASS;
- Control Center/projects/assets/classification/runtime: PASS;
- runtime inventory: 233 / 224 / 0 warnings.

Remaining explicit blockers are cron-secret, skcs-refresh-key and separate RLS-001. Parent ESEC-001 remains PARTIAL and Azure Stage B remains blocked.
