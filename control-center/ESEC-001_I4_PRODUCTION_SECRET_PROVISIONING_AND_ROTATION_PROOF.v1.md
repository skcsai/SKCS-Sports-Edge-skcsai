# ESEC-001-I4 — Production Secret Provisioning and Rotation Proof

Date: 8 November 2026
Status: **IN PROGRESS — PRE-IMPORT VERIFIED**

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
