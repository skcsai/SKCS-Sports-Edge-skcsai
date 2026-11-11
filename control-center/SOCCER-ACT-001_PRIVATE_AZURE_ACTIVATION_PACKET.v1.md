# SOCCER-ACT-001: private Premier League Azure activation

Date: 11 November 2026 (SAST)

Status: IN_PROGRESS. Activation is blocked pending the live catalog and access proof below.

## Start, scope and objective

Stephen authorized continuation from the paired SOCCER-REL-001 source release into controlled Azure activation. Begin from published Edge commit `11d0c435af696657a9cf2e356630242ace6fd3cb`, source tree `423b272f6ac05076cd7f5331563a49a7cbbdced0`, and published Scout commit `7e5e69178c68271d71f0ca128860951c968d21ba`, source tree `fbd77d675cdba2d72a51592ad8349c0e5fecf99c`.

The existing local Edge release commit is `73a5d7068ecd1d2e6a31e98619d94a49a2b2df40`. Its tree is identical to the published Edge tree; commit identity differs because publication metadata was assigned by GitHub. This activation branch starts from that local content-equivalent commit. Do not confuse it with an unverified code variant.

Objective: connect the already-tested independent forecasts and Soccer Governor to fresh, verified Premier League fixture evidence, then persist one immutable official Pending recommendation only after GREEN agreement and a final pre-kickoff check. Initial access is private/operator controlled. Subscription plans, customer sign-in, website appearance, public traffic, DNS and payment flows stay deferred. C14 public authentication cutover is a separate project.

## Read-only cloud evidence obtained

- Azure subscription `a62a614c-efbc-4fa2-bfc1-b5894e0e0ad2` is enabled and is the connected account's default subscription.
- Current C14 trial: `ca-skcs-edge-c14-zan-002` in `rg-skcs-edge-verification-zan-001`. Latest and latest-ready revision: `ca-skcs-edge-c14-zan-002--0000006`. Its traffic rule is 100% latest revision, and minimum replicas is 1. These are configuration observations; they are not a new signed-in health or prediction test.
- Image: `acrskcsedgec8a62a614c.azurecr.io/edge-c14@sha256:ddf8a498e2135fd7db3b246a8a70b49c3f318e18eec48ce64ff958c6fc58a94b`. This is the earlier C14 digest in the November 10 handover. No source-commit tag was returned. A verified mapping from this image to the new release source has not been established.
- Current C14 FQDN: `ca-skcs-edge-c14-zan-002.orangesea-246b1d5f.southafricanorth.azurecontainerapps.io`.
- Scout collector job: `caj-skcs-nscs020-pl-daily` in `rg-skcs-nscs-collector-zan-001`. Image tag: `scout-collector:df966d4a632b06a9ddb889632552c5836cf2124c`. Trigger: Schedule, expression `0 4 * * *`, equivalent to 06:00 SAST daily. This establishes schedule configuration, not evidence that today's execution succeeded or produced a current package.
- The four Edge jobs returned by Resource Graph are Manual. This does not establish ownership of external/Vercel/Render schedules. No schedule was enabled or changed.
- Azure Edge server `pg-skcs-edge-zan-a62a614c` and Scout server `pg-skcs-scout-zan-a62a614c` are Ready. Both have public network access Disabled. Edge reports PostgreSQL 17, Standard_B1ms, 32 GB storage and seven-day backup retention. The existing Edge server is the intended catalog inspection target, not an automatically approved production cutover.
- DeskMCP returned `tunnel_client_not_seen` (client unseen for 300 seconds). Desktop Commander lists `LAPTOP-MS05OD76` offline. Neither desktop execution channel is presently available.

No image, revision, traffic, database, permissions, secrets, schedules, main branch or live service was changed during this preflight.

## Code evidence and exact first repair

`backend/services/edgeD1Proof.js:runEdgeD1Proof` explicitly requires `PROOF_FIXTURE`. `backend/services/governedFipIntakeAdapter.js` likewise accepts the context manifest only for the isolated proof. `runPendingEdgeD1Proof` returns an in-memory product and leaves actual final IDs and transactional publication to a governed writer. Consequently the source release alone does not provide a live fixture intake, private Shadow transport, final writer or scheduler.

The first executable checkpoint is the live catalog query below through an existing approved private-network connection. Verify the exact database, role, final prediction table, Pending table, compatibility view, keys, indexes and trigger behavior before authoring a writer. The older SQL migration and the legacy `predictions_final` name are references, not proof of the deployed relationship. Do not deploy the proof module and simply disable its guard.

After the catalog checkpoint:

1. Bind current fixture evidence and its timestamp, package hash, canonical fixture identity and source authority. Prove scheduled status and the SAST today-plus-seven-days admission window. Never use the historical November 8 replay as a current forecast.
2. Reuse the approved model and settlement laws without changing parameters. Keep Edge and Scout calculations independent. Edge must seal its own exact recommendation before requesting the private Shadow result; no private result enters the ordinary Scout FIP or public response.
3. Provide an authenticated private production adapter with explicit mode and caller authority. Preserve ordinary proof tests, feature-off behavior, unsupported-market review and every existing runtime/storage gate. Runtime clearance must be bounded and recorded, rather than globally inferred from this packet.
4. Use an explicit eligible recommendation choice. Do not invent a new automatic Direct-versus-Double-Chance selection rule. AMBER, RED, missing Shadow, wrong source/fixture/model/governor, post-kickoff or stale evidence must produce a held decision and zero publication writes.
5. Implement the final recommendation and linked Pending record in one transaction against the proven deployed schema. Recheck kickoff within that transaction. Require the original seal, source and Governor fingerprints, a replay/idempotency key, and exactly one official recommendation. A replay must not create another final or Pending record.
6. Build an identifiable image from the exact verified activation source, retain the accepted prior image and recovery settings, run a bounded private canary, and verify persistence/readback and a zero-write replay before any wider routing or scheduling decision. Keep customer-facing C14/subscription work separate.

## Read-only catalog packet

Run only against the verified Edge target and an already-approved role through the existing private connection. Resolve credentials at runtime without printing them. This packet reads catalog metadata only and returns no fixture, prediction or customer rows. Retain complete output and exit status; a connection error or missing relation is a blocker, not permission to create a table.

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '10s';
SET LOCAL lock_timeout = '2s';
SET LOCAL search_path = pg_catalog;

SELECT current_database() AS database_name,
       current_user AS execution_role,
       current_setting('transaction_read_only') AS transaction_read_only;

WITH targets AS (
  SELECT c.oid, n.nspname, c.relname, c.relkind, c.relrowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('direct1x2_prediction_final', 'predictions_final',
                     'predictions_accuracy', 'fixtures',
                     'fixture_lifecycle_current', 'fixture_identity_aliases')
)
SELECT nspname, relname, relkind, relrowsecurity,
       has_table_privilege(current_user, oid, 'SELECT') AS can_select,
       has_table_privilege(current_user, oid, 'INSERT') AS can_insert,
       has_table_privilege(current_user, oid, 'UPDATE') AS can_update
FROM targets ORDER BY relname;

SELECT c.relname, a.attnum, a.attname,
       format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull, a.attidentity, a.attgenerated
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE n.nspname = 'public' AND a.attnum > 0 AND NOT a.attisdropped
  AND c.relname IN ('direct1x2_prediction_final', 'predictions_final',
                   'predictions_accuracy', 'fixtures',
                   'fixture_lifecycle_current', 'fixture_identity_aliases')
ORDER BY c.relname, a.attnum;

SELECT c.relname, k.conname, k.contype,
       k.confrelid::regclass::text AS referenced_relation,
       pg_get_constraintdef(k.oid, true) AS constraint_definition
FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND k.contype IN ('p', 'u', 'f', 'c')
  AND c.relname IN ('direct1x2_prediction_final', 'predictions_accuracy',
                   'fixture_lifecycle_current', 'fixture_identity_aliases')
ORDER BY c.relname, k.conname;

SELECT c.relname, i.indexrelid::regclass::text AS index_name,
       i.indisunique, i.indisprimary, pg_get_indexdef(i.indexrelid) AS index_definition
FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('direct1x2_prediction_final', 'predictions_accuracy',
                   'fixture_lifecycle_current', 'fixture_identity_aliases')
ORDER BY c.relname, index_name;

SELECT c.relname, pg_get_viewdef(c.oid, true) AS compatibility_view_definition
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'predictions_final'
  AND c.relkind IN ('v', 'm');

SELECT c.relname, t.tgname, t.tgenabled,
       pn.nspname AS function_schema, p.proname AS function_name
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace pn ON pn.oid = p.pronamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname IN ('direct1x2_prediction_final', 'predictions_accuracy')
ORDER BY c.relname, t.tgname;

ROLLBACK;
```

## Definition of Done

Packet verification: 97 Control Center, project-register and asset-register tests passed with zero failures or skips. Control Center, project, asset and classification checks passed; every pre-existing Register/Ledger record was preserved. The SQL text was statically checked for READ ONLY, bounded timeouts, catalog-only reads and final ROLLBACK. It has not been run against a live database. This packet changes no application, infrastructure, public configuration or package code.

The private production input, independent comparison and immutable final/Pending transaction have passed focused fail-closed and replay tests against the verified schema; the exact source/image identity and restricted runtime authority are recorded; a private Azure canary has a real current pre-kickoff fixture, one persisted official Pending recommendation and a zero-write replay; monitoring and recovery are verified; both Control Centers record accurate evidence. Until all requirements pass, SOCCER-ACT-001 remains IN_PROGRESS and no live readiness or gate clearance is claimed.

## Continuation while access is unavailable

Restore the laptop's existing DeskMCP client connection. Resume with the catalog packet through the existing approved private-network path. Do not reopen subscriptions, change public database access, grant a wider role or alter the current C14 trial as a workaround. The original SOCCER-GOV-001 candidates, published SOCCER-REL-001 branches and current Azure revisions remain preserved.
