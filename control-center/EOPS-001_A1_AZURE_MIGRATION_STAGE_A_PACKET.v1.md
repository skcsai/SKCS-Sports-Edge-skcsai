# EOPS-001-A1 — Azure Migration Stage A: Inventory, Costed Candidate and Startup Safety

Date: 8 November 2026
Owner: Stephen / SKCS AI SPORTS EDGE (PTY) LTD
Status: **TESTED — PUBLISHED — NO DEPLOYMENT**

## 1. Boundary

This child project is owned by EOPS-001 and covers Stage A only: verify the current Edge/Scout start point, Azure cost/credit evidence and Supabase coupling; remove proven canary startup hazards; harden and build the production container definition; prepare a minimal Azure Container Apps candidate; validate it with Bicep build and what-if; and preserve rollback.

It does **not** authorize Stage B, production deployment, database cutover, Supabase restore, scheduler activation, DNS changes, Vercel/Render retirement, prediction-rule changes or Scout changes.

## 2. Verified start point

- Edge HEAD: `1ac5216b7b8515afea3f057ebaed4f08cc6e399c`; initial worktree clean.
- Scout HEAD: `5e9fd2e3d8fed637063b51365e02b01c525fd4ba`.
- Scout preserved change: `diagnostics/ALIAS_DRIFT_SCAN_2026-07-01.md`; untouched.
- Pre-change Edge `npm run control:verify`: **353/353 tests PASS**.
- Control Center, projects, assets, classification and runtime inventory: **PASS**.
- Runtime inventory baseline: 233 governed surfaces, 224 discovered, 0 warnings.

## 3. Azure cost and credit evidence

Authenticated subscription: `a62a614c-efbc-4fa2-bfc1-b5894e0e0ad2`.

Billing account: active Microsoft Customer Agreement; billing profile `SKCS AI Sports Edge`.

### Remaining credit

The authenticated billing-profile available-balance endpoint returned `amount: null`. Therefore the historical approximately $5,000 balance is **not** promoted to current November evidence. Exact remaining credit remains an open financial evidence item.

### Actual current Azure burn

Cost Management ActualCost, month-to-date on 8 November 2026: **$17.454513 USD**.

Largest measured components:

| Service | MTD USD |
|---|---:|
| NAT Gateway | 7.3341 |
| Load Balancer | 3.9472 |
| Azure Database for PostgreSQL | 2.9622 |
| Virtual Network / public IP | 1.5788 |
| Container Registry | 1.2021 |
| Azure Monitor | 0.3327 |
| Azure DNS | 0.0708 |
| Storage | 0.0204 |
| Key Vault | 0.0062 |

The earlier subscription budget object reported about $2.86. That value is treated as lagging/incomplete because Cost Management returned the fuller $17.45 ActualCost set.

Straight-line 60-day planning range from the current burn is approximately **$130.91–$149.61**, using eight-calendar-day vs seven-completed-day denominators. This is a planning projection, not a bill guarantee.

## 4. Proposed Azure canary

Existing Edge foundation reused:

- Container Apps environment: `cae-skcs-edge036-zan-001`
- Managed identity: `id-skcs-edge036-zan-001`
- Key Vault: `kv-skcs-edge036-zan1`
- Storage: `stskcsedge036zan001`
- Log Analytics: `log-skcs-edge036-zan-001`
- Current live Edge Container Apps: **0**

Candidate:

- `ca-skcs-edge-a1-canary`
- Consumption environment
- 0.5 vCPU / 1 GiB
- min replicas 0 / max replicas 1
- HTTPS-only external ingress, port 8080
- no application secrets in Bicep
- `SKCS_STARTUP_MODE=canary`
- existing Edge managed identity
- existing ACR, with only AcrPull proposed for the Edge identity

Azure retail reference for South Africa North gives Standard active compute of $0.000024/vCPU-second plus $0.000003/GiB-second and $0.40 per million requests. At 0.5 vCPU + 1 GiB, an intentionally conservative always-active 60-day compute ceiling is about **$77.76** before requests and any separately applicable environment meter. With minReplicas=0, normal idle cost should be lower.

Measured current baseline plus that always-active ceiling is approximately **$208.67–$227.37 for 60 days**. Adding the handover's full $250 migration/overlap allowance gives approximately **$458.67–$477.37**. That fits the planning envelope, but it does **not** cost-certify later Azure database/auth/frontend stages and does not substitute for the missing exact credit balance.

## 5. Supabase inventory

Supabase connector found one project, ref `vzzmirotzqrrwgoieojo`, currently **INACTIVE**. Stage A did not wake or restore it.

Because the project is inactive, live table, bucket and object-volume queries are unavailable. The latest governed database-size evidence is `152390803` bytes (~145.33 MiB) in `reports/ui3-i10/post-apply-schema-snapshot.json`; it is historical evidence, not a current live measurement.

Repository inspection confirms active Supabase coupling in:

- browser authentication/session/login flows;
- backend JWT user verification;
- multiple backend `createClient` callers;
- RPC use including `upsert_canonical_event`;
- Supabase Edge/Function source in the repository.

The bounded active-code grep found no direct `.storage.` or `.channel(` calls outside bundled/client-library code. That is **not** proof storage or realtime are unused; live service inventory remains blocked while the project is inactive.

## 6. Startup safety repair

Normal startup previously performed database bootstrap mutations, initialized internal cron schedules, and started the heartbeat/provider work automatically.

Implemented:

- `SKCS_STARTUP_MODE=normal|canary`;
- default `normal` preserves existing behaviour;
- `canary` suppresses database bootstrap, cron initialization and heartbeat startup;
- any invalid startup-mode value fails closed;
- Cricbuzz publisher loading is deferred until its authenticated cron route is actually called;
- Supabase-bound cricket insights/count/cron routers are not imported during canary startup.

Final clean-environment canary proof:

- no `DATABASE_URL`;
- no Supabase credentials;
- no provider keys;
- `GET /api/health` → **HTTP 200 / status ok**;
- database bootstrap suppressed;
- internal cron initialization suppressed;
- heartbeat startup suppressed.

## 7. Container and dependency proof

Dockerfile now:

- uses `node:20-alpine`;
- installs `npm ci --omit=dev`;
- copies runtime files owned by the built-in `node` user;
- sets production environment and port 8080;
- runs as **non-root `node`**.

Initial production audit exposed 23 vulnerabilities: 2 critical, 11 high, 9 moderate, 1 low. Stage A repaired the production dependency graph and updated Express 4.22.2 → 4.22.3.

Final `npm audit --omit=dev`: **0 vulnerabilities**.

The full developer install still reports development-only moderate findings; those packages are not installed into the production image.

Local Docker is unavailable. Equivalent bounded container proof used Azure Container Registry **no-push** build:

- secure build run: `df1f`
- result: **PASS**
- production install inside image: **0 vulnerabilities**
- base: `node:20-alpine`, digest `sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293`
- no ACR repository/tag persisted after the run.

## 8. Bicep / no-deploy proof

Files:

- `infra/azure/eops-001-a1/main.bicep`
- `infra/azure/eops-001-a1/acr-pull.bicep`

`az bicep build`: **PASS**.

Azure resource-group what-if: **Succeeded**.

Expected new effects only:

1. Create `ca-skcs-edge-a1-canary`.
2. Grant `AcrPull` on the existing registry to the existing Edge managed identity.

Existing environment, Key Vault, identity, storage and logging resources were reported as Ignore/no-change. The role-assignment resource is reported as Unsupported by what-if because its generated ID cannot be fully calculated until deployment; this is an Azure what-if limitation, not an applied mutation.

Post-proof live check: Edge Container Apps list remains `[]`.

## 9. Rollback

### Current Stage A

No cloud rollback is needed because no Container App, role assignment, secret, database, DNS, Render, Vercel or Supabase mutation was made. If this local candidate is rejected, do not publish it; live production remains unchanged.

### Future Stage B canary

If later authorized, rollback is bounded to the Stage B-created canary app and its dedicated AcrPull assignment. Do not alter the existing Edge environment, Scout resources, Supabase, Render, Vercel or DNS as part of canary rollback.

## 10. Closure state

Final full Edge verification after all Stage A changes: **361/361 tests PASS**; Control Center, projects, assets, classification and runtime inventory all PASS; runtime inventory remains 233 governed surfaces / 224 discovered / 0 warnings.

Technical Stage A evidence is complete enough for a **local closure candidate** after final repository/governance regression.

Publication completed under Stephen's explicit EOPS-001-A1 authorization at commit `3e9e40434b6fb2e9d5abe453d7332361546829e4`. Stage B and live deployment remain separately governed and not authorized.

Open evidence items that carry forward:

1. exact remaining Azure startup credit balance;
2. live Supabase bucket/table/object volumes while the project remains inactive;
3. Stage B deployment authorization;
4. later-stage Azure database, identity and frontend pricing/cutover proof.

## 11. Formal closure

EOPS-001-A1 is **TESTED and CLOSED**. Canonical Edge publication: `3e9e40434b6fb2e9d5abe453d7332361546829e4`. The measured-cost limitation and inactive-Supabase live-volume limitation are explicitly preserved as later-stage evidence items; they do not invalidate Stage A because Stage A required those limitations to be recorded without waking or mutating production services. No live Azure canary, database, scheduler, frontend, DNS, Supabase, Render or Vercel cutover occurred.

Runtime inventory closure reconciliation: Stage A changed the exact bytes of `backend/server-express.js`, `Dockerfile` and `package.json`. Their three `source_content_sha256` values were refreshed from the published files. The governed relationship-evidence fingerprints remained exactly unchanged, confirming no database-role, database-object, scheduler-trigger or deployment-surface classification drift.

The synchronized `EDGE_SYSTEM_RUNTIME_MAP.md` was regenerated from the reconciled inventory, after which `npm run control:runtime` passed with 233 inventory surfaces, 224 discovered surfaces and zero warnings.
