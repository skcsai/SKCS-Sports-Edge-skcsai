-- ESEC-001-I6 / RLS-001
-- Seal the eight internal lifecycle/proof tables as server-only.
-- This migration intentionally creates NO RLS policies.
-- Supabase service_role bypasses RLS; browser roles must have no direct table privileges.
-- On non-Supabase PostgreSQL targets, role-specific statements are skipped when the role does not exist.

DO $esec_i6$
DECLARE
    v_table text;
    v_force_rls boolean;
    v_tables constant text[] := ARRAY[
        'fixture_lifecycle_current',
        'fixture_identity_aliases',
        'fixture_lifecycle_transition_events',
        'fixture_lifecycle_rollover_events',
        'lifecycle_daily_admission_counters',
        'lifecycle_admission_idempotency',
        'fixture_display_metadata',
        'fip_intake_evidence'
    ];
BEGIN
    FOREACH v_table IN ARRAY v_tables
    LOOP
        IF to_regclass(format('public.%I', v_table)) IS NULL THEN
            RAISE EXCEPTION 'ESEC-001-I6 expected table public.% is missing', v_table;
        END IF;

        EXECUTE format(
            'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
            v_table
        );

        SELECT c.relforcerowsecurity
          INTO v_force_rls
          FROM pg_catalog.pg_class c
          JOIN pg_catalog.pg_namespace n
            ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = v_table;

        IF v_force_rls IS TRUE THEN
            RAISE EXCEPTION
                'ESEC-001-I6 refuses FORCE ROW LEVEL SECURITY on server-only table public.%',
                v_table;
        END IF;

        EXECUTE format(
            'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC',
            v_table
        );

        IF EXISTS (
            SELECT 1
              FROM pg_catalog.pg_roles
             WHERE rolname = 'anon'
        ) THEN
            EXECUTE format(
                'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon',
                v_table
            );
        END IF;

        IF EXISTS (
            SELECT 1
              FROM pg_catalog.pg_roles
             WHERE rolname = 'authenticated'
        ) THEN
            EXECUTE format(
                'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated',
                v_table
            );
        END IF;

        IF EXISTS (
            SELECT 1
              FROM pg_catalog.pg_roles
             WHERE rolname = 'service_role'
        ) THEN
            EXECUTE format(
                'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role',
                v_table
            );
        END IF;
    END LOOP;
END
$esec_i6$;
