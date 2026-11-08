# ESEC-001-I6 — RLS-001 Server-Only Table Boundary and Privilege Hardening

Date: 8 November 2026
Status: **TESTED / HOLD — SOURCE CLOSED; LIVE APPLY DEFERRED**

## Objective

Resolve the source/security design behind RLS-001 for the eight internal lifecycle and proof tables without restoring the inactive Supabase project or starting Azure Stage B.

The selected repair is the option already allowed by the ESEC-001-C1 finding: **seal server-only ownership/access** rather than invent subscriber policies for tables that are not subscriber-facing.

## Exact tables

1. fixture_lifecycle_current
2. fixture_identity_aliases
3. fixture_lifecycle_transition_events
4. fixture_lifecycle_rollover_events
5. lifecycle_daily_admission_counters
6. lifecycle_admission_idempotency
7. fixture_display_metadata
8. fip_intake_evidence

SEM-GOV-001D-UI3-I10 previously proved these eight tables were applied with RLS enabled, zero policies and zero rows, while runtime activation remained blocked.

## Runtime evidence

Repository inspection found:

- zero references to these table names under public browser assets;
- no target-table supabase-js Data API calls;
- database consumers are backend persistence/resolver services using injected database query/transaction dependencies;
- no production intake route is currently activated.

Therefore these are internal server data surfaces, not subscriber-owned row stores.

## Supabase rule

Current Supabase documentation states that service_role / secret-key access bypasses RLS. A CREATE POLICY ... TO service_role rule would therefore not create the protection RLS-001 needs.

The meaningful controls are:

- RLS remains enabled so ordinary non-bypass roles remain deny-by-default without a policy;
- PUBLIC receives no direct table privileges;
- anon receives no direct table privileges when that role exists;
- authenticated receives no direct table privileges when that role exists;
- service_role receives only SELECT, INSERT, UPDATE and DELETE when that Supabase role exists;
- no permissive RLS policy is created;
- no new BYPASSRLS role is created;
- FORCE ROW LEVEL SECURITY is not silently disabled. If a target table is already FORCE RLS, the migration fails closed for governance review.

This is portable: on a non-Supabase PostgreSQL target, the anon/authenticated/service_role clauses are skipped when those roles do not exist.

## Migration creation

The migration file was created by the installed Supabase CLI, version 2.104.0:

supabase/migrations/20261108065612_esec_001_i6_server_only_rls_boundary.sql

The CLI generated the timestamp/name. SKCS did not invent the migration filename.

## Inactive Supabase boundary

Connected Supabase reports the project as INACTIVE. A read-only table listing is unavailable while it remains inactive.

I6 will **not restore the project** merely to apply this hardening because SKCS is moving the storage/database workload toward Azure. Restoring or mutating that inactive project is outside I6.

Accordingly, I6 can provide a governed source migration and verification candidate, but it must not claim live execution. Live application/metadata proof must occur against the next authorized active database target.

## Hard boundaries

No Supabase restore. No live DDL. No Azure Stage B. No Container App deployment. No runtime route activation. No Render, Vercel or DNS mutation.

## Supabase verification

- Security advisors: PASS, zero current security lints returned.
- Local migration list: unavailable because no local Supabase PostgreSQL instance is running on 127.0.0.1:54322.
- Local database started by I6: NO.
- Hosted inactive Supabase project restored by I6: NO.

This is an intentional boundary. I6 does not start extra local infrastructure or wake the hosted project merely to manufacture execution evidence.

## Pre-publication validation

Pre-publication validation: focused I6 proof **6/6 PASS**; full Edge Control Center **381/381 PASS**; 1,081/1,081 assets classified; runtime 234 inventory / 225 discovered / 0 warnings.

## Formal closure

ESEC-001-I6 is TESTED and CLOSED / HOLD for source/security design.

Proven:

- exactly eight internal lifecycle/proof tables are governed by the hardening migration;
- no public browser asset directly references those tables;
- no target-table supabase-js Data API caller exists;
- RLS remains enabled;
- PUBLIC, anon and authenticated direct table privileges are revoked by the migration where those roles exist;
- service_role CRUD is conditional and server-only; no service_role RLS policy is invented;
- no CREATE POLICY statement is added;
- no BYPASSRLS role is created;
- no broad ALTER DEFAULT PRIVILEGES change is made;
- missing expected tables fail closed;
- FORCE RLS fails closed for governance review rather than being silently disabled;
- Supabase security advisors returned zero current security lints;
- inactive Supabase was not restored;
- no live migration was applied;
- focused I6 proof is permanently included in the Control Center suite;
- final suite: 387/387 PASS;
- Control Center/projects/assets/classification/runtime: PASS;
- governed assets: 1,081/1,081 classified;
- runtime inventory: 234 / 225 / 0 warnings.

### Remaining live proof

The source/security design is closed, but live execution is deliberately not claimed. The migration must be applied and table role/grant behavior verified in a separately governed stage against the next authorized active database target.

Parent ESEC-001 therefore remains PARTIAL. Azure Stage B remains blocked.
