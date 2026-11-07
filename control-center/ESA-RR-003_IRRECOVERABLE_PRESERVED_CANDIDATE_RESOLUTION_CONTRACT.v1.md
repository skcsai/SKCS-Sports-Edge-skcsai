# ESA-RR-003 Irrecoverable Preserved-Candidate Resolution Contract

## Status

**ESA-RR-003 STATUS: IN_PROGRESS — CONTRACT-ONLY**

This contract is an additive governance resolution to the TESTED ESA-RR-002 Option A reproducibility law. It does **not** implement runtime repair.

## 1. Architectural boundary

ESA-RR-003 governs only the eight historical preserved candidates listed below. It does not authorize runtime application changes, prediction work, Scout/FIP activation, database or Supabase mutation, provider removal, deployment, publication, or marriage-gate clearance.

Scout remains the governed evidence provider. Edge runtime/prediction implementation remains separately governed.

## 2. Exact incident set ? no wildcard expansion

The only paths governed by the irrecoverable resolution are:

1. `scratch/inspect_edge_external_sources.js`
2. `scripts/inspect_secondary.js`
3. `scripts/seed_acca_test_data.js`
4. `scripts/seed_final.js`
5. `supabase/migrations/20260616_scout_signal_mirror.sql`
6. `supabase/migrations/20260617000000_setup_accas.sql`
7. `temp_migrate.js`
8. `try_regions.js`

No prefix, suffix, glob, directory, similarity, or future path is implicitly included. Any ninth path requires a separate governed decision.

## 3. Preserved truths

For each exact path, governance may assert only what is evidenced:

- it was previously observed as `PRE_EXISTING_UNTRACKED`;
- its candidate disposition is `PRESERVED_CANDIDATE`;
- its discovery record is governed by EPR-001;
- historical runtime-inventory revisions recorded the path;
- the path is absent from the current governed workspace;
- the real source bytes are unavailable;
- valid relationship-evidence provenance is unavailable.

The candidate remains a governed historical discovery fact. It does **not** become a runtime authority, active implementation, tracked source asset, or trusted relationship record.

## 4. Recovery exhaustion proof

### RCP-1 ? real source bytes

RCP-1 is recorded **EXHAUSTED** for the exact incident set based on the governed 2026-11-07 inspection:

- current Edge workspace: all eight absent;
- exact relative-path inspection across 161 SKCS/local project roots: zero hits;
- connected Google Drive exact-filename searches: zero hits for all eight;
- GitHub full repository path history: zero commits for each of the eight source paths.

No source file may be recreated from memory, filename, inferred purpose, old relationship notes, AI output, or a similar file. Such content would be reconstructed, not recovered.

### RCP-2 ? trusted prior provenance

RCP-2 is recorded **EXHAUSTED** for the exact incident set:

- GitHub exposes 13 committed revisions of `control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json` relevant to the governed history review;
- the eight incident paths appear in historical revisions `f6ac94957a9ea6bce72b2a08530bb622070ada57` and `3bc0b267cb95fb64cbdb6f40c2de2f0e70a8574f`;
- for every incident path in those revisions: `relationship_evidence_provenance` is absent, `source_content_sha256` is absent, and `relationship_evidence` is absent.

No provenance may be inferred from filename, directory, project name, prior description, or current neighboring code.

## 5. Source-presence law

ESA-RR-003 does **not** create a fourth source-presence state. The eight paths remain:

`ABSENT_PRESERVED_CANDIDATE`

This preserves ESA-RR-002's three-state source-presence model. Irrecoverability is a separate governed resolution, not a claim that the source is present.

## 6. Exact resolution value

A future ESA-RR-004 implementation may assign only the following resolution to these exact eight paths:

`IRRECOVERABLE_EVIDENCE_ONLY`

Meaning:

> The path's historical discovery is retained as governed evidence, but source bytes and relationship provenance are irrecoverable. No runtime relationship or source-content fact may be synthesized.

This value is not equivalent to KEEP, CURRENT, ACTIVE, LEGACY-runtime, RETIRE, DELETE, MERGE, EXCLUDE, or runtime authority.

## 7. Evidence-only tombstone schema

A future generated runtime inventory may retain an evidence-only tombstone for each exact path with only these governed semantic fields:

- `asset_path` ? exact incident path;
- `source_presence_state` ? exactly `ABSENT_PRESERVED_CANDIDATE`;
- `candidate_disposition` ? exactly `PRESERVED_CANDIDATE`;
- `resolution` ? exactly `IRRECOVERABLE_EVIDENCE_ONLY`;
- `governed_by_control_task_id` ? source candidate governance identity already present in the asset-register snapshot;
- `source_bytes_available` ? exactly `false`;
- `relationship_provenance_available` ? exactly `false`;
- `recovery_rcp1` ? exactly `EXHAUSTED`;
- `recovery_rcp2` ? exactly `EXHAUSTED`;
- `runtime_relationship_status` ? exactly `UNKNOWABLE_FROM_GOVERNED_EVIDENCE`;
- `resolution_contract` ? exactly `ESA-RR-003`.

The tombstone must not populate or synthesize:

- `source_content_sha256`;
- `relationship_evidence`;
- `relationship_evidence_provenance`;
- imports or importers;
- route/controller/service consumers;
- database/Supabase read or write roles;
- provider roles;
- scheduler/background roles;
- deployment roles;
- Scout/FIP roles;
- prediction roles;
- authority/canonical status.

If the future checker requires any of those fields for an evidence-only tombstone, implementation must fail closed until the contract is explicitly amended.

## 8. No silent omission law

The eight paths must remain visible in governed accounting. A future implementation may not make validation pass by:

- deleting their workspace-candidate records;
- removing them from the governed candidate universe;
- converting them to explicit exclusions merely because the source is absent;
- fabricating empty source bytes;
- fabricating empty relationship evidence;
- inventing hashes or provenance;
- silently treating them as recovered.

## 9. Returning-source law

If real bytes for any exact incident path are later recovered from a trusted source:

1. `IRRECOVERABLE_EVIDENCE_ONLY` must cease to be sufficient for that path;
2. the path becomes a normal PRESENT candidate under ESA-RR-002;
3. the real bytes must be hashed and relationship evidence re-extracted from those same bytes;
4. any mismatch with historical assumptions is reported as governed drift;
5. no previous tombstone relationship claim exists to override the recovered evidence.

## 10. Future implementation boundary

ESA-RR-003 performs **no implementation**. A separately authorized ESA-RR-004 may modify only:

- `control-center/check_edge_system_runtime_inventory.js`;
- `tests/edge-system-runtime-inventory.test.js`;
- generated `control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json`;
- generated `control-center/EDGE_SYSTEM_RUNTIME_MAP.md`.

ESA-RR-004 must preserve the ESA-RR-T01..T16 identity rule. It may update proof logic inside those sixteen tests but must not create T17.

## 11. Fail-closed acceptance law

A future implementation passes only if:

- the exception set is exactly eight paths;
- RCP-1/RCP-2 exhaustion is contract-bound;
- no source SHA/provenance/relationship evidence is invented;
- all eight remain governed/accounted;
- any ninth absent candidate without valid provenance still fails under ESA-RR-002;
- returning real source bytes automatically re-enter normal provenance validation;
- validation mode remains read-only;
- bootstrap writes no canonical output if any non-exempt absent candidate violates ESA-RR-002;
- No runtime application code changes.

## 12. Gate preservation

This contract does not clear or activate:

- Scout?Edge marriage gate;
- E2E-001;
- ESEC-001;
- EPRV-001;
- Supabase storage gate;
- prediction execution or publication;
- provider retirement;
- deployment.

## 13. Definition of Done

ESA-RR-003 closes TESTED only when this contract and its focused tests prove the exact-path, no-invention, evidence-only law; project/register/asset/classification/governor regression remains green; and the runtime checker/inventory/map remain unchanged by this contract packet.
