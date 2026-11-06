# SKCS Edge Control Center

**Generated:** 2026-07-05
**Ledger:** `control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json`
**Check command:** `npm run control:center`

---

> **Scout â†” Edge marriage remains BLOCKED. Edge Control Center v1 exists to govern the deferred integration, Supabase storage, security, prediction integrity, and external-provider removal before the two systems are connected.**

---

## 1. Edge architectural law

| System | Canonical responsibility |
|---|---|
| **Scout** | Governed sports truth, acquisition, evidence, history, weather truth, availability truth, sports context, H2H evidence, FIP assembly and FIP validation |
| **Edge/Test** | FIP consumption, prediction analysis, probability/scoring, contextual adjustment, market interpretation, filtering, direct prediction logic, ACCA construction, explanation, publication, users and subscribers |
| **Scout database** | Neon |
| **Edge/Test database** | Supabase |
| **Sports truth direction** | Scout â†’ validated FIP boundary â†’ Edge |
| **Subscriber/commercial direction** | Remains inside Edge/Supabase |
| **Raw Scout evidence mirror in Supabase** | Forbidden by default |
| **Full FIP permanent retention in Supabase** | Gated |
| **FIP reference/hash with derived Edge outputs** | Preferred design subject to EST-001 |

Scout and Edge are intentionally separate systems.

The integration bridge was deliberately deferred while Scout's governance, builders, FIP contract, validation, evidence archive, routing, and project-control foundations were stabilized.

The current project is not the discovery of a forgotten bridge.

It is the governed resumption of the intentionally deferred Scout â†” Edge integration.

---

## 2. Current Edge state

| Dimension | Status |
|---|---|
| **Edge Control Center v1** | DONE |
| **Edge Master Project Register** | TESTED |
| **Full Edge system/runtime inventory** | TESTED |
| **Scout â†” Edge marriage gate** | BLOCKED |
| **Supabase storage gate** | BLOCKED |
| **External sports provider removal** | PARTIAL (inspection contract sealed; removal not implemented) |
| **FIP intake handshake** | PROPOSED |
| **Subscriber/security boundary inventory** | PROPOSED |
| **Prediction pipeline integrity inventory** | TESTED (contract sealed; runtime unchanged) |
| **Scout â†’ Edge end-to-end proof** | BLOCKED |

---

## 3. Why the marriage gate is blocked

The following technical prerequisites must be satisfied:

| ID | Prerequisite | Current state |
|---|---|---|
| EMG-001 | Scout-Edge Marriage Gate Contract | APPROVED (contract sealed; gate remains BLOCKED) |
| EFI-001 | FIP Intake Handshake | APPROVED (contract sealed; implementation forbidden) |
| EST-001 | Supabase Storage and FIP Retention Contract | APPROVED (contract sealed; storage gate remains BLOCKED) |
| ESEC-001 | Subscriber and Security Boundary | PARTIAL (I1 source/test remediation passed; RLS and runtime proof open) |
| EPI-001 | Prediction Pipeline Integrity | TESTED (contract sealed; runtime unchanged) |
| EPRV-001 | External Sports Provider Removal | PARTIAL (inspection contract sealed; removal not implemented) |
| E2E-001 | Scout to Edge End-to-End Proof | BLOCKED |

Even when all technical prerequisites are TESTED, COMMITTED, or DONE, `scout_edge_marriage_gate` requires separate explicit approval.

The gate does not auto-clear.

---

## 4. Current provider-removal state

Phase 1 removed selected public/direct provider surfaces and provider-heartbeat startup.

However Edge still has reachable direct sports-acquisition origins.

Known evidence includes:

`backend/services/aiPipeline.js`
â†’ `getPredictionInputs()`
â†’ `backend/services/dataProvider.js`
â†’ `buildLiveData()`
â†’ external provider acquisition

Additional acquisition surfaces have been identified in:

- `backend/services/contextIngestionService.js`
- `backend/services/contextEnrichmentService.js`
- `backend/services/footballHighlightsService.js`
- `scripts/import-today-snapshot-pipeline.js`

Therefore:

**SCOUT-SOLE-PROVIDER STATE: PARTIAL**

Provider removal must not resume by blindly deleting mixed analysis/acquisition files.

EFI-001 must first define the governed FIP input origin.

---

## 5. Supabase storage law

Edge/Test operates under a constrained Supabase storage budget of approximately 0.5 GB.

The Scout â†” Edge bridge must not create a second Scout evidence database inside Supabase.

The following distinction is mandatory:

### Transport

What intelligence crosses from Scout to Edge for processing?

### Retention

What subset of that intelligence must Edge permanently retain?

These are separate architecture decisions.

Preferred direction:

Scout FIP
â†’ Edge intake validation
â†’ transient analysis input
â†’ Edge prediction/scoring/explanation
â†’ Supabase retains derived Edge state plus canonical FIP reference/provenance/hash

Do not permanently copy Scout raw evidence, historical evidence, source archives, or full intelligence history into Supabase by default.

EST-001 owns the final contract.

---

## 6. Protected Edge workstreams

1. **Control Center**
   - Edge ledger
   - Master Project Register
   - project sequencing
   - proof requirements

2. **Architecture Foundation**
   - runtime inventory
   - active/legacy/dead classification
   - reader/writer ownership

3. **Scout Handoff**
   - marriage gate
   - canonical FIP intake
   - idempotency
   - provenance
   - end-to-end proof

4. **Provider Boundary**
   - direct fixture acquisition
   - weather acquisition
   - news/context acquisition
   - H2H acquisition
   - provider fallbacks
   - historical snapshot acquisition

5. **Prediction Pipeline**
   - raw input
   - normalization
   - scoring
   - probability adjustment
   - filtering
   - direct markets
   - secondary markets
   - same-match logic
   - ACCA construction
   - publication

6. **Data and Storage**
   - Supabase capacity
   - retention
   - FIP transport versus storage
   - prediction output retention
   - audit retention

7. **Security and Commercial Boundary**
   - authentication
   - users
   - subscribers
   - service role
   - RLS
   - admin
   - secrets

8. **Prediction Lifecycle**
   - settlement
   - grading
   - accuracy
   - audits
   - backfills

9. **AI and Inference**
   - OpenAI
   - Gemini
   - EdgeMind
   - judge
   - fallback
   - explanation

10. **UI and Delivery**
    - public delivery
    - authenticated delivery
    - subscriber access
    - predictions
    - ACCAs
    - explanations
    - admin

11. **Deployment and Operations**
    - GitHub
    - Render
    - Vercel
    - Supabase
    - migrations
    - schedulers
    - operational workflows
    - environment configuration

---

## 7. Current execution rule

Do not resume architecture implementation from conversation memory alone.

The Control Center ledger determines the current state.

The Master Project Register will become the canonical inventory of Edge projects and subprojects.

Before implementation:

1. confirm the project exists in the register
2. confirm dependencies
3. inspect current state
4. approve the task separately when required
5. implement only the approved boundary
6. require proof
7. update project state

---

<!-- Deprecated sequencing note from the prior gate state.

## 8. Prior sequencing note

Previous allowed startable task snapshot:

EPR-001 closure state:

**EPR-001 â€” Edge Master Project Register [TESTED]**

Mode:

**IMPLEMENT EPR-001 TESTED PROMOTION ONLY**

Purpose:

Implement the approved Master Project Register + Repository Asset Register foundation only, without performing Scout/FIP intake implementation, provider removal, Supabase mutation, or prediction-rule changes.
Completion contract:
Current tracked coverage evidence is:
- 898 tracked paths
- 898 registered tracked assets
- 0 unclassified tracked paths

This is complete tracked repository coverage. It is not complete local workspace visibility.

Current discovery evidence also identified:
- 40 non-ignored pre-existing untracked workspace paths
- 0 currently registered or explicitly excluded in the asset register
- 40 outside the current asset register boundary

Pre-existing untracked workspace candidates must be discovered separately from tracked repository assets. The underlying untracked artifact does not need to be committed merely to preserve governed evidence that the path was observed. Every discovered pre-existing untracked candidate must be preserved as governed workspace candidate evidence or explicitly excluded with a reason.

Current rule/governance candidate evidence identified:
- 35 total candidate paths
- 34 tracked
- 1 pre-existing untracked

Known first-party rule and governance authority candidates remain identifiable by review role, but this proves inventory visibility rather than a connected authority-review graph:
- 34 tracked candidates currently authority UNKNOWN
- 34 tracked candidates currently owner UNRESOLVED
- 34 tracked candidates governed by EPR-001
- 34 tracked candidates currently have empty related_assets

Candidate status does not establish CURRENT_AUTHORITY. Candidate relationship edges are review relationships, not authority precedence. A candidate with no relationship edge must be explicitly identified as a standalone review candidate with a non-empty reason. Ignored dependency, environment, and cache paths are not first-party authority candidates merely because their names contain rule/governance terms. Final rule/governance authority remains subject to governed review.

UNRESOLVED final project ownership may remain as a non-fatal governed cleanup finding only when the asset remains bound to a valid Control Center task and has a non-empty `next_validation`. EPR-001 is closed and TESTED in this step.

Do not start FIP intake.

Do not resume provider removal.

Do not change Supabase schema.

Do not clear the marriage gate.

Startable tasks: 0

Previous gated task snapshot:
**EAC-001 â€” Edge Asset Classification and Repository Map [PROPOSED]**

Requires separate approval before start
-->

## 8. Stateful Control Center gate â€” Repository Cleanup Programme

All AI instructions are proposals.

ChatGPT, Codex, Cursor, and other AI instructions require Control Center GREEN before execution.

The gate is stateful. It does not use keyword or phrase detection to decide GREEN or HOLD.

### Governing principle

ONE QUESTION ACROSS THE REPOSITORY AT A TIME.

Complete one approved cleanup phase across all applicable governed assets and all applicable EAC-001 batches.

Close that phase.

Only then activate the next phase.

Do not mix cleanup questions.

Do not drift into another phase because an agent notices a different issue.

Any out-of-phase finding must be recorded as `FUTURE_PHASE_NOTE` and the active phase must continue.

### Existing EAC-001 evidence law

EAC-001 skim/classification is existing repository evidence and must be reused.

The Control Center must not require an implementation agent to rediscover every asset from zero or repeat full initial classification before a later cleanup phase.

A later phase may inspect additional evidence only for the exact question asked by that phase.

### Primary lifecycle (phase and batch oriented)

Required lifecycle states:

- PHASE_PENDING
- PHASE_ACTIVE
- BATCH_ACTIVE
- BATCH_COMPLETE
- PHASE_READY_TO_CLOSE
- PHASE_CLOSED

Required modes:

- PHASE_WORK
- COMPLETE_BATCH
- CLOSE_PHASE
- RECORD_FUTURE_PHASE_NOTE
- CONTROL

The old per-asset forensic lifecycle (`PENDING` â†’ `INSPECTING` â†’ `DISPOSITION_READY` â†’ `CLOSURE_READY` â†’ `CLOSED` with five evidence areas for every asset) is historical only.

It is no longer the mandatory primary lifecycle for the repository cleanup mission.

Per-asset evidence may still exist where useful.

It must not force a full forensic lifecycle for every file during Phase 1.

### Ordered cleanup phases

1. PHASE_0 â€” REPOSITORY BASELINE AND CONTROL
   Question: What exact repository state is the cleanup programme starting from?
   No cleanup. No repair. No duplicate removal.

2. PHASE_1 â€” EXACT DUPLICATE ELIMINATION
   Question: Are any governed files byte-for-byte identical?
   Preferred first-pass: local deterministic hashing (for example SHA-256).
   Exact duplicate means byte-for-byte identical content. Similar code, same purpose, same file name, or generated similarity are not exact duplicates.
   Phase 1 may remove only proven exact duplicates after a quick path/reference safety check.
   Phase 1 does not require purpose, runtime-use, dependency, overlap, reuse-value, merge, retirement, or replacement evidence for every unique file.

3. PHASE_2 â€” FILE PURPOSE IDENTIFICATION
   Question: What does each remaining governed file represent?
   Reuse EAC-001. No merge, deletion, retirement, repair, or refactoring.

4. PHASE_3 â€” ACTIVE USE IDENTIFICATION
   Question: Is each remaining governed file currently used?
   Outcomes: ACTIVE, INDIRECTLY_ACTIVE, MANUAL_USE, NO_CURRENT_USE_FOUND, UNKNOWN.
   NO_CURRENT_USE_FOUND does not authorise deletion.

5. PHASE_4 â€” LEGACY AND REPLACEMENT IDENTIFICATION
   Question: Has each applicable file been superseded or left behind by a newer implementation?
   Outcomes: CURRENT, LEGACY, REPLACED, HISTORICAL, UNCERTAIN.

6. PHASE_5 â€” FUNCTIONAL OVERLAP IDENTIFICATION
   Question: Are different remaining files doing the same or substantially overlapping job?
   Outcomes: NO_OVERLAP, PARTIAL_OVERLAP, MAJOR_OVERLAP, POTENTIAL_MERGE_GROUP.
   Identifies overlap only. No merge implementation.

7. PHASE_6 â€” CANONICAL AUTHORITY SELECTION
   Question: Which Phase 5 overlap candidate families should have canonical authority selected?
   Outcomes: CANONICAL_AUTHORITY_SELECTED, KEEP_SEPARATE, BLOCKED.
   Selects canonical authority only. No merge, deletion, retirement, refactor, or implementation.

8. PHASE_7 â€” MERGE AND CONSOLIDATION
   Question: Which confirmed canonical authority decisions should be implemented through merge and consolidation?
   Implementation phase for approved Phase 6 canonical authority decisions only.

9. PHASE_8 â€” FINAL REPOSITORY VALIDATION
   Question: Is the cleaned repository internally consistent?
   Do not start a new cleanup hunt.

### Phase order law

Allowed sequence: PHASE_0 â†’ PHASE_1 â†’ PHASE_2 â†’ PHASE_3 â†’ PHASE_4 â†’ PHASE_5 â†’ PHASE_6 â†’ PHASE_7 â†’ PHASE_8.

A later phase must not activate while an earlier phase is incomplete.

### Active phase law

The Control Center must expose exactly one active repository cleanup phase.

An implementation agent must be able to determine:

- active phase
- active phase question
- active phase scope
- active batch where applicable
- completed batches
- remaining batches
- phase status
- phase Definition of Done
- future phase notes

The Control Center must fail closed if an agent attempts work belonging to a different cleanup phase.

### Batch law

Reuse the existing deterministic EAC-001 batch manifest (`control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json`, B01â€“B29).

Do not invent a second arbitrary batch system.

Where a phase is batch-oriented, process deterministic EAC-001 batches in the existing defined order unless the Control Center records an explicit evidence-backed exception.

The next incomplete batch is the next default batch.

### Phase 1 forbidden questions

During PHASE_1 do not investigate as active work:

- What is this file for?
- Is this file old/legacy/unused/replaced?
- Can different files be merged?
- Do different files overlap?
- Is the code good / should it be refactored?
- Is there a defect / should it be repaired?
- Should the architecture be redesigned?

If noticed: record `FUTURE_PHASE_NOTE` with asset path(s), brief issue, and likely future phase. Continue Phase 1. Do not investigate the note during Phase 1.

### No cross-phase drift law

During an active phase: do the active phase only.

An agent noticing another problem must not investigate it deeply, repair it, refactor it, merge it, retire it, or change architecture because of it.

Record a `FUTURE_PHASE_NOTE` and continue the active phase.

### Standing Git authority

Stephen grants standing repository authority for approved Control Center cleanup phases to perform routine Git inspection, scoped staging, verified batch/phase commits, and push of successfully verified committed work without requesting separate approval from Stephen for each routine Git step.

Allowed without asking Stephen again when the work is inside the active approved phase, the batch/unit is complete, required focused verification passed, unrelated changes are preserved, staged changes contain only approved phase work, and scope is confirmed before commit:

- git status / git status --short
- git diff / git diff --check
- git log / git show / git rev-parse / git ls-files / git grep
- git add -- &lt;exact approved phase/batch paths&gt;
- git commit
- git push origin main

Git actions still requiring Stephen's explicit approval:

- git reset --hard
- git clean
- discarding local work with git checkout / git restore
- git rebase
- merging branches
- force push / git push --force
- branch deletion
- history rewriting
- mass repository rollback
- any Git action that would knowingly discard unrelated local changes

Repository standing Git authority does not override a mandatory IDE, sandbox, OS, or product security approval prompt.

### Gate mode rules

PHASE_WORK may receive GREEN only when the requested phase equals the active phase, the work matches the active phase question, and (for batch-oriented phases) the batch is the next incomplete deterministic EAC-001 batch or the recorded active batch.

COMPLETE_BATCH may receive GREEN only for the active batch of the active phase and must not require unique files to enter the old full forensic lifecycle.

CLOSE_PHASE may receive GREEN only when the active phase Definition of Done is met and phase status is PHASE_READY_TO_CLOSE.

RECORD_FUTURE_PHASE_NOTE may receive GREEN when it records an out-of-phase finding without changing the active phase.

CONTROL may receive GREEN only when:

- Stephen explicitly authorizes Control Center maintenance
- a proven Control Center defect or lifecycle gap is recorded
- scope is confined to Control Center gate, policy, and focused tests
- no product asset is changed

No instruction or missing state = HOLD.

Feature work, unrelated cleanup, broad repository work, premature mutation, or wrong-phase work = HOLD.

Startable ledger tasks remain informational only and do not authorize cleanup-phase execution by themselves.

Required state snapshot:

<!-- CONTROL_CENTER_STATE_START -->
```json
{
  "governance_model": "REPOSITORY_CLEANUP_PROGRAMME",
  "required_modes": [
    "PHASE_WORK",
    "COMPLETE_BATCH",
    "CLOSE_PHASE",
    "RECORD_FUTURE_PHASE_NOTE",
    "CONTROL"
  ],
  "required_lifecycle": [
    "PHASE_PENDING",
    "PHASE_ACTIVE",
    "BATCH_ACTIVE",
    "BATCH_COMPLETE",
    "PHASE_READY_TO_CLOSE",
    "PHASE_CLOSED"
  ],
  "cleanup_phase_order": [
    "PHASE_0",
    "PHASE_1",
    "PHASE_2",
    "PHASE_3",
    "PHASE_4",
    "PHASE_5",
    "PHASE_6",
    "PHASE_7",
    "PHASE_8"
  ],
  "eac_evidence_reusable": true,
  "eac_batch_manifest": "control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json",
  "total_governed_assets": 1048,
  "phase_0": {
    "status": "PHASE_CLOSED",
    "question": "What exact repository state is the cleanup programme starting from?",
    "evidence": {
      "repository_root": "C:/Users/user/Desktop/Stephen Fynn/SKCS-test",
      "active_branch": "main",
      "head_commit": "7d21fc276629bb6aec056299d70e1541b462934f",
      "working_tree_status": "dirty_unrelated_changes_preserved",
      "governed_asset_count": 1048,
      "eac_batch_manifest": "control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json",
      "eac_batch_count": 29,
      "already_completed_or_removal_work": "Partial external sports provider removal (PARTIAL); EAC-001 B01-B29 classification inventory complete; prior Control Center per-asset investigations preserved as historical evidence",
      "unrelated_local_changes_preserved": true
    }
  },
  "phase_5": {
    "status": "PHASE_CLOSED",
    "question": "Are different remaining files doing the same or substantially overlapping job?",
    "evidence": {
      "result": "PASS WITH OVERLAP CANDIDATES",
      "batches_reviewed": "B01-B29",
      "closure_commit": "b71b411d",
      "closure_note": "Phase 5 Functional Overlap Identification is evidence-complete. No canonical authority was selected during Phase 5."
    }
  },
  "phase_6": {
    "status": "PHASE_CLOSED",
    "question": "Which Phase 5 overlap candidate families should have canonical authority selected?",
    "evidence": {
      "result": "PASS WITH CANONICAL AUTHORITY DECISIONS",
      "batches_reviewed": "B02-B03,B04-B06,B07-B10,B11-B14,B15-B18,B19-B22,B23-B26,B27-B29",
      "closure_commit": "1bd3adad",
      "closure_note": "Phase 6 Canonical Authority Selection is closed. PHASE_7 activation does not authorize merge/consolidation implementation until a separate Phase 7 batch mini-project is approved."
    }
  },
  "phase_7": {
    "status": "PHASE_CLOSED",
    "question": "Which confirmed canonical authority decisions should be implemented through merge and consolidation?",
    "evidence": {
      "result": "PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS",
      "batches_reviewed": "B01-B03,B04-B06,B07-B10,B11-B14,B15-B18,B19-B22,B23-B26,B27-B29",
      "review_order_model": "GROUPED_REVIEW_UNITS",
      "closure_commit": "746a2231",
      "closure_note": "Phase 7 Merge and Consolidation is closed. PHASE_8 activation does not authorize a new cleanup hunt or individual EAC batch re-sequencing."
    }
  },
  "phase_8": {
    "status": "PHASE_CLOSED",
    "question": "Is the cleaned repository internally consistent?",
    "evidence": {
      "result": "PASS",
      "validation_start_commit": "900650e4",
      "validation_evidence_commit": "685018ed",
      "lifecycle_before_validation": "PHASE_ACTIVE",
      "phase_7_grouped_review_units_preserved": "B01-B03,B04-B06,B07-B10,B11-B14,B15-B18,B19-B22,B23-B26,B27-B29",
      "review_order_model": "NO_BATCH_MODEL",
      "classification_repair_commit": "26acdedc",
      "runtime_inventory_repair_commit": "900650e4",
      "control_verify": "PASS",
      "deferred_holds": "HOLD_NEEDS_RUNTIME_PROOF and HOLD_ABSENT_PATH remain deferred future work, not Phase 8 defects",
      "validation_note": "Phase 8 final repository validation evidence is complete.",
      "closure_note": "Phase 8 Final Repository Validation is closed. The repository cleanup programme is complete."
    }
  },
  "cleanup_programme_status": "PROGRAMME_CLOSED",
  "active_phase": "PHASE_8",
  "active_phase_question": "Is the cleaned repository internally consistent?",
  "lifecycle_state": "PHASE_CLOSED",
  "active_batch": null,
  "completed_batches": [],
  "remaining_batches": [],
  "next_deterministic_batch": null,
  "future_phase_notes": [],
  "standing_git_authority": true,
  "dangerous_git_actions_approval_gated": true,
  "historical_per_asset_forensic_lifecycle": "PRESERVED_AS_HISTORY_ONLY",
  "historical_closed_asset_paths": [
    "control-center/EDGE_CONTROL_CENTER.md",
    "control-center/check_control_center.js",
    "tests/edge-control-center-ledger.test.js",
    ".bat",
    ".dockerignore",
    ".env.example",
    ".gitignore",
    ".gcloudignore"
  ],
  "phase_1": {
    "status": "PHASE_CLOSED",
    "question": "Are any governed files byte-for-byte identical?",
    "evidence": {
      "result": "CLOSED",
      "duplicate_scan_executed": true,
      "final_repository_wide_check": "PASS",
      "closure_note": "Phase 1 Exact Duplicate Elimination is closed. Do not reopen without explicit Control Center approval."
    }
  },
  "phase_2": {
    "status": "PHASE_CLOSED",
    "question": "What does each remaining governed file represent?",
    "evidence": {
      "result": "PASS WITH CORRECTIONS",
      "batches_reviewed": "B01-B29",
      "final_manifest_count_check": "PASS",
      "closure_note": "Phase 2 Purpose Classification Review is closed. Do not reopen without explicit Control Center approval."
    }
  },
  "phase_3_outcomes": [
    "ACTIVE",
    "INDIRECTLY_ACTIVE",
    "MANUAL_USE",
    "NO_CURRENT_USE_FOUND",
    "UNKNOWN"
  ],
  "phase_3_no_deletion_law": "NO_CURRENT_USE_FOUND does not authorize deletion."
}
```
<!-- CONTROL_CENTER_STATE_END -->

### Historical Control Center evidence (preserved)

The following records are preserved historical evidence from the previous per-asset forensic investigation model. They are not the active cleanup lifecycle.

Investigation evidence:

- contents_and_purpose: the document defines the active Control Center policy and state, the checker enforces it, and the tests verify it.
- references_and_consumers: `check_control_center.js` loads this document; `tests/edge-control-center-ledger.test.js` and `backend/services/controlCenterReadService.js` consume the checker entrypoint; package scripts expose the control-center checks.
- runtime_use: `node control-center/check_control_center.js` and `node --test tests/edge-control-center-ledger.test.js` are active runtime verification paths.
- dependencies: the gate depends on the asset register, the build ledger, Node `fs`, `path`, and `assert`, plus the state JSON embedded above.
- overlap_or_duplication: the three files are tightly related but not duplicative; they serve distinct policy, gate, and verification roles.

Disposition recorded: USE
Closure status: CLOSED

Active investigation evidence: .bat

- contents_and_purpose: `.bat` is a Windows batch launcher created to start the local SKCS EdgeMind Dolphin/Llama server on port 8080 and open an ngrok tunnel to that local service.
- references_and_consumers: repository search found no code path that invokes `.bat`; governed references are the asset register, asset map, classification batches, and the active Control Center state. Runtime code consumes `DOLPHIN_URL` directly instead of invoking this script.
- runtime_use: no production runtime registration or package script calls `.bat`; if manually executed on the original Windows machine, it opens two command windows for `llama-server.exe` and `ngrok`.
- reads_and_writes: the script reads no repository files and writes no repository files; it starts external processes and binds local/network ports.
- dependencies: depends on Windows `cmd`, `timeout`, a machine-specific `C:\Users\skcsa\models\...` llama-server path, a Dolphin model file, and an installed `ngrok` CLI with a hard-coded tunnel URL.
- overlap_or_duplication: overlaps with `SKCS_START.bat`, which is another root batch launcher for Dolphin and ngrok; backend runtime assets such as `backend/services/aiProvider.js` and `backend/config.js` use `DOLPHIN_URL` rather than either batch file.
- reuse_value: retain the operational idea of a local Dolphin/ngrok launcher, but merge it with the duplicate launcher pattern into one governed, configurable operator script before relying on it.

Disposition recorded: MERGE
Closure status: CLOSED

Active investigation evidence: .dockerignore

- contents_and_purpose: `.dockerignore` is the repository-root Docker context exclusion policy, excluding Node artifacts, local secrets, Python caches/build outputs, OS/IDE files, Git metadata, local vendor folders, script result dumps, and chaos logs from container build context.
- references_and_consumers: Docker tooling consumes `.dockerignore` implicitly when building from the repository root; repository references are the asset register, asset map, classification batches, and current Control Center state.
- runtime_use: it affects container image build inputs, including the root `Dockerfile`; it is not executed at application runtime and has no server route or package-script caller.
- reads_and_writes: the file reads and writes nothing; Docker/build tooling reads it to decide which workspace paths to omit from build context transfer.
- dependencies: depends on Docker build semantics and the root build context; it also relates to local directories/files named in its patterns, including `.env`, `node_modules`, Python cache/build directories, `.git`, IDE folders, `backend/scripts/_vendor`, `backend/scripts/results`, and chaos log files.
- overlap_or_duplication: overlaps substantially with `.gitignore`, but the boundary is different: `.gitignore` governs source control tracking, while `.dockerignore` governs container build context and secret/artifact exclusion.
- reuse_value: keep as an active security and build hygiene configuration; its useful patterns should remain aligned with `.gitignore` and Dockerfile build requirements.

Disposition recorded: KEEP
Closure status: CLOSED

Active investigation evidence: .env.example

- contents_and_purpose: `.env.example` is the repository-root environment template documenting required and optional configuration for application runtime, database access, Supabase, auth, billing, sports providers, AI providers, Render hosts, ingestion limits, pipeline tuning, circuit breakers, and debug flags.
- references_and_consumers: setup docs instruct copying `.env.example` to `.env`; `.gitignore` explicitly keeps `.env.example` tracked while ignoring real env files; runtime code reads matching variables through `process.env`, `dotenv`, and Python `os.getenv`.
- runtime_use: the file itself is not loaded as runtime configuration, but its variable names mirror runtime dependencies used by backend services, scripts, cron triggers, Supabase clients, provider adapters, and deployment config.
- reads_and_writes: `.env.example` reads and writes nothing; developers/operators copy or consult it to create local or deployment environment values.
- dependencies: depends on the current runtime configuration contract across `backend/config.js`, database modules, middleware, provider clients, scripts, `render.yaml`, and docs. It must stay aligned with actual env-variable consumers.
- overlap_or_duplication: overlaps with deployment docs, data-ingestion docs, `.gitignore` env-file policy, and generated external-source inventory references, but it is the central tracked template and not replaced by those assets.
- reuse_value: keep as the canonical non-secret env template; reuse it as the governed source for onboarding and configuration audits, while separately correcting encoding artifacts in a future approved edit if needed.

Disposition recorded: KEEP
Closure status: CLOSED

Closed investigation evidence: .gitignore

- contents_and_purpose: `.gitignore` excludes local env files, dependency directories, build outputs, IDE/OS files, logs, caches, archive output, and local tool state from source control.
- references_and_consumers: Git consumes it directly; the repository governance files also reference the root ignore policy as a tracked configuration artifact. No application runtime code imports it.
- runtime_use: it has no runtime execution role; it only changes what Git tracks.
- reads_and_writes: the file reads and writes nothing.
- dependencies: depends on Git ignore semantics and the repo's local/generated paths such as `.env`, `node_modules`, Python caches, `.vercel`, `_archive/`, `backend/cache/*.json`, and log files.
- overlap_or_duplication: overlaps with `.dockerignore` and `.gcloudignore`, but those files govern different boundaries. The source-control boundary belongs in `.gitignore`.
- reuse_value: keep it as the canonical Git tracking policy for this repository.

Disposition recorded: KEEP
Closure status: CLOSED

Active investigation evidence: .gcloudignore

- contents_and_purpose: `.gcloudignore` is the repository-root Google Cloud CLI upload filter, excluding local secrets, dependency/build directories, IDE files, Git metadata, and large local artifacts from any gcloud-managed source upload.
- references_and_consumers: no application code imports or calls `.gcloudignore`; its direct consumer would be Google Cloud tooling when commands such as deploy or source upload run from the repository root. Current repository references are governance artifacts plus historical documentation traces like `phase2-cleanup.js`, `FULL_WORKSPACE_AUDIT_REPORT.md`, and a comment in `backend/server-express.js` pointing at a now-absent root `docs/google-cloud-soccer-refresh.md`.
- runtime_use: there is no proven current runtime or build path in package scripts, Vercel config, Render config, or live root docs that invokes Google Cloud deployment from this repository. The only Google Cloud operational trail left in-tree is archived or report-derived material, including `_archive/docs_legacy/google-cloud-soccer-refresh.md`; the current tracked root doc is absent.
- reads_and_writes: `.gcloudignore` does not read or write repository files; Google Cloud CLI tooling would read it implicitly to omit matching files from upload context.
- dependencies: depends on Google Cloud CLI ignore semantics and the paths it names, including `.env*`, `node_modules`, Python virtualenv/build outputs, IDE folders, `.git`, `backend/scripts/_vendor`, `backend/scripts/results`, and chaos log files.
- overlap_or_duplication: overlaps heavily with `.gitignore` and materially with `.dockerignore`; most exclusion patterns are already governed elsewhere, and the remaining Google Cloud-specific value only matters if this repository still uses gcloud source-upload workflows.
- reuse_value: retain the useful exclusion patterns, but merge or reconcile them into the surviving ignore-policy surfaces unless a current Google Cloud deployment path is re-established and proved active.

Disposition recorded: MERGE
Closure status: OPEN

Phase 1 batch evidence: B01

- batch_id: B01
- title: CONTROL_CENTER
- hash_method: SHA-256
- asset_count: 15
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B02
- note: every B01 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B02

- batch_id: B02
- title: BACKEND_DIRECT_FILES
- hash_method: SHA-256
- asset_count: 13
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B03
- note: every B02 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B03

- batch_id: B03
- title: BACKEND_ROUTES_AND_CONTROLLERS
- hash_method: SHA-256
- asset_count: 28
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B04
- note: every B03 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Future phase note: Control Center state persistence/display consistency

- observation: the persisted policy snapshot repeatedly displays `next_deterministic_batch = B01`, while deterministic checker transitions have already accepted B01, B02, and now B03 processing correctly.
- likely_future_work: Control Center state persistence/display consistency

B03 hash re-verification supersession

- previous_b03_evidence_status: superseded
- reason: the earlier B03 hash report failed evidence-integrity review because the reported hashes were not accepted as trustworthy raw PowerShell output.
- verification_method: actual local PowerShell Get-FileHash SHA256 rerun from manifest-derived B03 membership
- manifest_asset_count: 28
- raw_hash_result_count: 28
- count_match: YES
- note: this re-verification records the actual local hash output and supersedes the earlier B03 hash report without erasing the audit trail.

Phase 1 batch evidence: B04

- batch_id: B04
- title: BACKEND_UTILS_SEMANTIC_CORE_AND_TEST
- hash_method: SHA-256
- asset_count: 46
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B05
- note: every B04 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B05

- batch_id: B05
- title: BACKEND_SCRIPTS
- hash_method: SHA-256
- asset_count: 15
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B06
- note: every B05 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B06

- batch_id: B06
- title: BACKEND_PROVIDERS_FOOTBALL
- hash_method: SHA-256
- asset_count: 10
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B07
- note: every B06 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B07

- batch_id: B07
- title: BACKEND_SRC_SERVICES_CONTEXT_INTELLIGENCE_AND_MARKET_ROUTER
- hash_method: SHA-256
- asset_count: 9
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B08
- note: every B07 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B08

- batch_id: B08
- title: BACKEND_ADAPTERS_AND_CONFIG
- hash_method: SHA-256
- asset_count: 13
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B09
- note: every B08 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B09

- batch_id: B09
- title: BACKEND_SERVICES
- hash_method: SHA-256
- asset_count: 86
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B10
- note: every B09 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B10

- batch_id: B10
- title: SCRIPTS_AUDIT_GOV
- hash_method: SHA-256
- asset_count: 27
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B11
- note: every B10 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B11

- batch_id: B11
- title: SCRIPTS_CHECK_VALIDATE_VERIFY
- hash_method: SHA-256
- asset_count: 59
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B12
- note: every B11 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B12

- batch_id: B12
- title: SCRIPTS_TEST_DIAG_TRACE
- hash_method: SHA-256
- asset_count: 66
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B13
- note: every B12 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B13

- batch_id: B13
- title: SCRIPTS_RUN_TRIGGER_SCHED
- hash_method: SHA-256
- asset_count: 20
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B14
- note: every B13 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B14

- batch_id: B14
- title: SCRIPTS_INGEST_ENRICH_SYNC_IMPORT
- hash_method: SHA-256
- asset_count: 31
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B15
- note: four stale manifest paths were removed after confirming they were deleted in commit 659e7f710ff578b088a3fc7d2a25d9767190ec78; corrected B14 assets hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B15

- batch_id: B15
- title: SCRIPTS_MAINT_FIX_CLEANUP_MIGRATE
- hash_method: SHA-256
- asset_count: 52
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B16
- note: every B15 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B16

- batch_id: B16
- title: DOCS_ROOT_MD_TXT
- hash_method: SHA-256
- asset_count: 36
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B17
- note: every B16 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B17

- batch_id: B17
- title: DOCS_DIR
- hash_method: SHA-256
- asset_count: 24
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B18
- note: every B17 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B18

- batch_id: B18
- title: SKCS_KNOWLEDGE_GOV_AND_AUDIT
- hash_method: SHA-256
- asset_count: 23
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B19
- note: every B18 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B19

- batch_id: B19
- title: SKCS_KNOWLEDGE_KNOWLEDGE
- hash_method: SHA-256
- asset_count: 17
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B20
- note: every B19 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.

Phase 1 batch evidence: B20

- batch_id: B20
- title: SKCS_KNOWLEDGE_PROVIDERS
- hash_method: SHA-256
- asset_count: 18
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B21
- note: every B20 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.
- sha256_inventory:
  - SKCS-KNOWLEDGE/providers/bigballs_discovery_audit.md => FF8CA06654D0F3C902883BC2B70565E6601CC7CBA8E6E983B6BC26A082E36DB5
  - SKCS-KNOWLEDGE/providers/bigballs_endpoint_catalog.md => E58906235D4189789C0182784C1530E09DB5A19CA5348B841413AC17C7EF24B0
  - SKCS-KNOWLEDGE/providers/bigballs_primary_assessment.md => 6480B86A9ADD56556601BF717A5E46BF9B1520C3BD3E5DF1BF925032E9E9474B
  - SKCS-KNOWLEDGE/providers/bigballs_provider_health.md => 5309D88182A72EBD27A6A86EFC6B433B18CC6786C3A4C09CF04E0A531343B68F
  - SKCS-KNOWLEDGE/providers/bigballs_semantic_mapping.md => BE17A754CF1F0042DD078E2B7A549AB70563C41FB020C4687897817E0AC3BB85
  - SKCS-KNOWLEDGE/providers/bsd_coverage_audit.md => CA864F9F102B54487F6FFA8208FEE95C82BD340090FD2F54FB376FDFF743F753
  - SKCS-KNOWLEDGE/providers/bsd_endpoint_catalog.md => 31C46E233BF08C7DE3EEC9EBEBB02261F9FB27A1D09ECD7CBADBE2263DB3F960
  - SKCS-KNOWLEDGE/providers/bsd_league_inventory.md => 922F49F31426CD399907596EB6017C0CDD27897C5B9BF598F039753600991E2C
  - SKCS-KNOWLEDGE/providers/bsd_provider_health.md => 98CF8C77253F8C84094D38433CDEE92DAF8D1F7B32A85D8276CE82C599F12F49
  - SKCS-KNOWLEDGE/providers/bsd_readiness_assessment.md => C6176F9F2205D87EC4D8B0BF9D1C60627972B21DD4044A360FCC32E304B5CF20
  - SKCS-KNOWLEDGE/providers/bsd_semantic_mapping.md => 086DB6C592C1FDA95443F3131B194F841DB1E3147D70D9B70FA47DD6C52AE63A
  - SKCS-KNOWLEDGE/providers/bzzoiro_discovery_audit.md => 08FF69907E5F124CC967623B14F37C299635A26DA8214A5513D5424A8EAB0422
  - SKCS-KNOWLEDGE/providers/bzzoiro_field_audit.md => B1A7A93A94065BB29ACA35BE9FA9D2BF031AE95131F3015031CB675845595670
  - SKCS-KNOWLEDGE/providers/bzzoiro_provider_mapping.md => 939BDD1DEFCBE0171CB395F8BBBFAB7336E8BFFE1413D47CD96E5BD80A76FA6F
  - SKCS-KNOWLEDGE/providers/soccerdata_call_restrictions.md => 952A7BC5D45E67520805A02184CD0845A22081B2A8E20FF373DBBECE572C0734
  - SKCS-KNOWLEDGE/providers/soccerdata_endpoint_catalog.md => F1006740882260AEB8046591FBF14466B31BAC1E24BE057DD5944D27A00482FD
  - SKCS-KNOWLEDGE/providers/soccerdata_notebooklm_synthesis.md => 7AC593F2A79AD48967E0D57A9D1FA2507C44319979467A774A15F9FD93DF4B98
  - SKCS-KNOWLEDGE/providers/soccerdata_provider_health.md => 5CCF69D18625B81862C97853979FA775524349262D2E12CFB3D687A9DEC808A4

Phase 1 batch evidence: B21

- batch_id: B21
- title: PUBLIC_UI
- hash_method: SHA-256
- asset_count: 64
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B22
- note: public/data/venue-cache.json was deleted after confirming public/data/standings-cache.json as the keeper.
- sha256_inventory:
  - public/about-bg.jpg => 83E5C4F5046D501FFD72823F2C2094A90675BEB6F5A64EB07BAAE449823575E4
  - public/about-bg.webp => C016BA913AECDF542EDD8923BBB94B8F32058975BC045B7FF6985C30903CE0EC
  - public/accuracy.html => F296970750EA0C222738BE6F1F07C45E4C39BCD117F47829511646D93F65652E
  - public/admin-sync.html => 48FE0034BC93B25222230FCC3B7A504CB600D1354970921F87606C75BDAC86D9
  - public/components/HeroCarousel.jsx => 7F2F95AE5CC47DE6BF89C43364BF85FFDF2CD20F19E001F9A9B4A09F1F3F8B3E
  - public/components/TrendDashboard.jsx => DB2E9742110DD217BC1B4DA9C0EA4DC4C20033F12BF061F4FAAB6871E0D24A78
  - public/control-center.html => 5A95706BC5CDA42102A0EE0FBF8D129867C0253FBE79FF6FC38AA2447E552BCB
  - public/css/control-center.css => C083C138C33EFF0F1007E920D9E1451C85C2F4220A9FD306F2093C9659C26B3E
  - public/css/hero-carousel.css => 4FB9258934D71C1358D3A1C73B73C1CB5EB2985013276579D63CB82E3B403556
  - public/css/input.css => CC1A7AD0D019DDB1D32D0ECB588BA0AC26CE41D8625DD6C366348B25F83A28EC
  - public/css/output.css => C60F81494E5B155BFE19DC2BDBD939388796C94EE382B3D83F4118515C2EBDD0
  - public/css/react-components.css => B9C0E2A76471B7484D7E11432D792824ADF872F986B5C97ABE514275DBD5701B
  - public/data/all_leagues_raw.json => BF596259F739C976101D97EF57279C001B171FE4C6CA8792DCFEE54EB927FE5F
  - public/data/all_sports_raw.json => FFFE838108C71823BE16FA7BD2F87030BF82558C45F3390910322653A1A8B1C9
  - public/data/context-pack-2026-05-17.json => 16751F102D2F40E7723EE3B76A051C7AE1D38685D4C7DEE0A90AA9841CDEA617
  - public/data/event-details-cache.json => 64F64D61121A1E31B6ADA3FE0DCB02119A05CBDB0A96B978EC225C29FFF75237
  - public/data/h2h-2026-05-17.json => 068CB187A8977E81B80BCDCD9663DD2886240EBFC25D16F4E14E73CA4A778C92
  - public/data/importance-2026-05-17.json => 9DB600A2B08E3D0ADD85E88A83C1A2430E4F1A96C4F066AEADEB2598D16DE6C2
  - public/data/injuries-2026-05-17.json => 1E9C9349798FA8FDA0921FA1ADE4D9C8C97A3CCD8224FFFC930ACC7D9E0F8690
  - public/data/news-injury-cache.json => 65CEBEA09804CC5B326CA2D497070FFC937371715D89C8CC6B7B39C34E3B331D
  - public/data/pipeline-dry-2026-05-17.json => 34A4D5C395C27ABC22EAA19E1ED7015E958EEE6A481DB34A7645D291FBDC2F23
  - public/data/standings-cache.json => 44136FA355B3678A1146AD16F7E8649E94FB4FC21FE77E8310C060F61CAAFF8A
  - public/data/team-form-2026-05-17.json => E40690CBC02F2604EF3CC8C8D830589867E34EB258A9EC7FF2BD63DF0720AC3E
  - public/data/team-form-cache.json => 8B8FC30CCA476447C2B40C1053F6DC2E78506895DE0142E6F8CD4D0DAA6A22C3
  - public/data/travel-2026-05-17.json => 7171BB59BF8E7D59A1D1695CD1E6DE24D19FA7857A1509B28A3E63D83120760F
  - public/data/tsdb-coverage-2026-05-17.json => DAF5402A33ECBA88CDB98B247B136D56DCB75A97CBA996BBCC312AA5F6AA8643
  - public/data/tsdb-coverage-2026-05-18.json => 524848C5492BED018341FA1B3D9EDE2A5B9BE57C90D50082326120412499CA2F
  - public/data/tsdb-coverage-2026-05-19.json => F46D6D2741C8CB9BFD7CF2BC8BC6880C695DE7738E0651F0507C4AB02DF49047
  - public/data/tsdb-day-2026-05-17.json => FDCA7983EDAF8A61CBE77EF7068EA589CEB0827DD97C8B7D04BF3A52AE01DD7A
  - public/data/vip-stress-saturday.json => 9168B0286DB4B2BBBE62339FC4C190101C257E406E58322893C58AC7A3F9997D
  - public/direct-markets.html => 5147A1927E4D89A081B439F15D9F527A7A8205C9CBBDF5EA193F548D38430434
  - public/experience.html => 773CAE7014F0843E921B63B9601AA915812CF349519C1F074A77808DD7DA0A00
  - public/favicon.ico => E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855
  - public/hero-page.jpg => 77FE0A775C8FF0FA961C1C4D58A1BA8E252F711FB1A65B7F7EC295929207C5D9
  - public/hero-page.webp => D9715B9AA10DE739CDEAF13D2409DEF7426B54E1AA47CC2B23D20CC6F28ED34E
  - public/index.html => 10C546E8C7606712FD30CD5856F070326077FD6C2091E62F3913113F0C511F8D
  - public/js/acca-builder.js => 3DA46A7EB7ACF2EE696A4A03F0D97B64E3796BD4B4F2B7E95F0118D120C1D307
  - public/js/ai-reasoning-display.js => 96678779EEC3C48297035F77A90242E1FD32834E08C34B0F263A2586946A1025
  - public/js/config.js => D492E1E4BB3273B7B998E5AE23EE4B31AAB9EC6C34F3CA25CE5FF3A9D14B63F4
  - public/js/control-center.js => 36BA37A3E4E82775E0923709CA68709CE492A327CFA3944E2AA6F68F85C71D73
  - public/js/doubleChanceCombos.js => 90F4D5AA7D85CD55C22238FAF39D85D13BBBE97CEF7B0784571848F6BEA1B4FF
  - public/js/hero-carousel.js => A6531B339E10DEBAD5469765BC0BC55956A3C6F88B5C9A59EB8AEB4F11E11222
  - public/js/semantic-drift-dashboard.js => EACE876EB730F5D2C9E7AAB112918CF9E183CBF1AC81DFC2BA811878D7A6AF59
  - public/js/smh-hub-master-rulebook.js => 1E6298F18116E951DCE7B9FA8473125C7DC4614415C548B0598BEAF8C23C2722
  - public/js/smh-hub.js => 9FD306EFA43CEC84C90701BD50EF18C35A458534D691A4DA2736E1421C6A3FC6
  - public/js/supabase-bundle.js => DCE7D2E5CB3220886E16E4C151DA813B7B35581B9CD4B40B7B7ECD4AFE31D1A8
  - public/js/supabase-init.js => A994E58F086C4C9D44107C307F44951917ECFF0AE079CADAEA63EA01BD757B37
  - public/js/system-health-banner.js => 1CBFE520C0E6349A894F1E9841DA3ACDB27379BE3F119D5B7FA28F482765C695
  - public/js/user-experience-feedback.js => 892076C3377EAF49D54213EE12A1A414D297EEC5326DF4B6DDE055E9F14E659C
  - public/js/vip-stress-dashboard.js => 5AED949E490306E7434BBC3DBEEA6EDD9E0B7DE1493AFDACD8078B314F3CD2EB
  - public/language-switch.html => E322683B9EB80D15CD9EFD616070D90396C881B8D0C30E2DA0C7D9AFCBC4DAE2
  - public/language.jpg => C42A824A603DD0DD415DBD1953F97B2BB893E9BAE89EBA8249C1088CA15E5B61
  - public/login.html => 7E85E9B3E5DC820FEE6BCD6917DDFE9E5614ABD662B6E780B111AF5C0048BDAA
  - public/login.jpg => 58CE581C5702B91BD77B83893B91D9B76E5384BFD5D7DB9A8948D33B4C0B8B17
  - public/market-explorer.html => 8F58176D76DF8A962DFF36759F8F915EE3D2293723C8BDAF5AA2C49C58F4F394
  - public/payment.html => B2FECCA9BFDAEBE1E195B33D4889BD50C0F99A6F737E04D1136F638636936CFE
  - public/privacy.html => 78BBA69AB80B61F90B69D9D432BD7B70AD2E91014689B61A63F94314501EEA89
  - public/robots.txt => 16CEB5EE3E0DC13AA9ADF31A3EBBE45A1D965B8C2B9F72EAF84E5911E140ED95
  - public/style.css => EA133FA575DE6CB332D6E6F9D27E35777C6F6701FAE84C39E22CFBA4D088CAEB
  - public/subscribe/index.html => 61A98F414270D6DB35D57A3C5753D2676A9DBF3A83E681A32400AF9E2863DC97
  - public/subscription.html => 06B33E20F7C85B24357D8C41D3CDE0FDFEEBB77E7185AFE487C85100E9DDBC05
  - public/terms.html => C475529AEA712BAFCEBC977982C7C774D89234906ECBAC99C6859A44517B4F8E
  - public/vip-stress-dashboard.html => 1FDC9F44CE59E3701DA0795F730C7193728678BC7F6C1BCAF4DD71D0B577C6EC
  - public/windrawwin.jpg => 087836C549CE76A862CB5A90572B40B9BE46C529A2458BC4BC71CA9B0B71DF1F

Phase 1 batch evidence: B20

- batch_id: B20
- title: SKCS_KNOWLEDGE_PROVIDERS
- hash_method: SHA-256
- asset_count: 18
- exact_duplicate_groups: 0
- batch_outcome: BATCH_COMPLETE
- next_deterministic_batch: B21
- note: every B20 asset hashed uniquely; no duplicate removal, reference rewrite, or path-safety escalation was required.
- sha256_inventory:
  - SKCS-KNOWLEDGE/providers/bigballs_discovery_audit.md => FF8CA06654D0F3C902883BC2B70565E6601CC7CBA8E6E983B6BC26A082E36DB5
  - SKCS-KNOWLEDGE/providers/bigballs_endpoint_catalog.md => E58906235D4189789C0182784C1530E09DB5A19CA5348B841413AC17C7EF24B0
  - SKCS-KNOWLEDGE/providers/bigballs_primary_assessment.md => 6480B86A9ADD56556601BF717A5E46BF9B1520C3BD3E5DF1BF925032E9E9474B
  - SKCS-KNOWLEDGE/providers/bigballs_provider_health.md => 5309D88182A72EBD27A6A86EFC6B433B18CC6786C3A4C09CF04E0A531343B68F
  - SKCS-KNOWLEDGE/providers/bigballs_semantic_mapping.md => BE17A754CF1F0042DD078E2B7A549AB70563C41FB020C4687897817E0AC3BB85
  - SKCS-KNOWLEDGE/providers/bsd_coverage_audit.md => CA864F9F102B54487F6FFA8208FEE95C82BD340090FD2F54FB376FDFF743F753
  - SKCS-KNOWLEDGE/providers/bsd_endpoint_catalog.md => 31C46E233BF08C7DE3EEC9EBEBB02261F9FB27A1D09ECD7CBADBE2263DB3F960
  - SKCS-KNOWLEDGE/providers/bsd_league_inventory.md => 922F49F31426CD399907596EB6017C0CDD27897C5B9BF598F039753600991E2C
  - SKCS-KNOWLEDGE/providers/bsd_provider_health.md => 98CF8C77253F8C84094D38433CDEE92DAF8D1F7B32A85D8276CE82C599F12F49
  - SKCS-KNOWLEDGE/providers/bsd_readiness_assessment.md => C6176F9F2205D87EC4D8B0BF9D1C60627972B21DD4044A360FCC32E304B5CF20
  - SKCS-KNOWLEDGE/providers/bsd_semantic_mapping.md => 086DB6C592C1FDA95443F3131B194F841DB1E3147D70D9B70FA47DD6C52AE63A
  - SKCS-KNOWLEDGE/providers/bzzoiro_discovery_audit.md => 08FF69907E5F124CC967623B14F37C299635A26DA8214A5513D5424A8EAB0422
  - SKCS-KNOWLEDGE/providers/bzzoiro_field_audit.md => B1A7A93A94065BB29ACA35BE9FA9D2BF031AE95131F3015031CB675845595670
  - SKCS-KNOWLEDGE/providers/bzzoiro_provider_mapping.md => 939BDD1DEFCBE0171CB395F8BBBFAB7336E8BFFE1413D47CD96E5BD80A76FA6F
  - SKCS-KNOWLEDGE/providers/soccerdata_call_restrictions.md => 952A7BC5D45E67520805A02184CD0845A22081B2A8E20FF373DBBECE572C0734
  - SKCS-KNOWLEDGE/providers/soccerdata_endpoint_catalog.md => F1006740882260AEB8046591FBF14466B31BAC1E24BE057DD5944D27A00482FD
  - SKCS-KNOWLEDGE/providers/soccerdata_notebooklm_synthesis.md => 7AC593F2A79AD48967E0D57A9D1FA2507C44319979467A774A15F9FD93DF4B98
  - SKCS-KNOWLEDGE/providers/soccerdata_provider_health.md => 5CCF69D18625B81862C97853979FA775524349262D2E12CFB3D687A9DEC808A4

### PHASE 2 - B04 PURPOSE CLASSIFICATION REVIEW

STATUS: CLOSED
RESULT: PASS
BATCH: B04 - BACKEND_UTILS_SEMANTIC_CORE_AND_TEST
ASSET COUNT: 46
REGISTER COVERAGE: 46/46
PURPOSE CLASSIFICATION CORRECTIONS REQUIRED: 0
JSON PATCHED: NO
REGISTER MODIFIED: NO
BATCH MANIFEST MODIFIED: NO
EVIDENCE: Local read-only PowerShell inspection confirmed all B04 assets exist in the register, review flags returned no rows, and final git status was clean.

### PHASE 2 - B05 PURPOSE CLASSIFICATION REVIEW

STATUS: CLOSED
RESULT: PASS
BATCH: B05 - BACKEND_SCRIPTS
ASSET COUNT: 15
REGISTER COVERAGE: 15/15
PURPOSE CLASSIFICATION CORRECTIONS REQUIRED: 0
JSON PATCHED: NO
REGISTER MODIFIED: NO
BATCH MANIFEST MODIFIED: NO
EVIDENCE: Local read-only PowerShell inspection confirmed all B05 assets exist in the register, review flags returned no rows, and final git status was clean.

### PHASE 2 - B06 PURPOSE CLASSIFICATION REVIEW

STATUS: CLOSED
RESULT: PASS
BATCH: B06 - BACKEND_PROVIDERS
ASSET COUNT: 10
REGISTER COVERAGE: 10/10
PURPOSE CLASSIFICATION CORRECTIONS REQUIRED: 0
JSON PATCHED: NO
REGISTER MODIFIED: NO
BATCH MANIFEST MODIFIED: NO
EVIDENCE: Local read-only PowerShell inspection confirmed all B06 assets exist in the register, all are classified as PROVIDER_INTEGRATION, review flags returned no rows, and final git status was clean.

### PHASE 2 - B07 PURPOSE CLASSIFICATION REVIEW

STATUS: CLOSED
RESULT: PASS
BATCH: B07 - BACKEND_SRC_SERVICES
ASSET COUNT: 9
REGISTER COVERAGE: 9/9
PURPOSE CLASSIFICATION CORRECTIONS REQUIRED: 0
JSON PATCHED: NO
REGISTER MODIFIED: NO
BATCH MANIFEST MODIFIED: NO
EVIDENCE: Local read-only PowerShell inspection confirmed all B07 assets exist in the register, all functional groups are valid for backend source services, review flags returned no rows, and final git status was clean.

### PHASE 2 - B08 PURPOSE CLASSIFICATION REVIEW

STATUS: CLOSED
RESULT: PASS
BATCH: B08 - BACKEND_ADAPTERS_AND_CONFIG
ASSET COUNT: 13
REGISTER COVERAGE: 13/13
PURPOSE CLASSIFICATION CORRECTIONS REQUIRED: 0
JSON PATCHED: NO
REGISTER MODIFIED: NO
BATCH MANIFEST MODIFIED: NO
EVIDENCE: Local read-only PowerShell inspection confirmed all B08 assets exist in the register, all have functional groups and purpose descriptions, review flags returned no rows, and final git status was clean.

### PHASE 2 - B09 PURPOSE CLASSIFICATION REVIEW

STATUS: CLOSED
RESULT: PASS
BATCH: B09 - BACKEND_SERVICES
ASSET COUNT: 86
REGISTER COVERAGE: 86/86
PURPOSE CLASSIFICATION CORRECTIONS REQUIRED: 0
JSON PATCHED: NO
REGISTER MODIFIED: NO
BATCH MANIFEST MODIFIED: NO
EVIDENCE: Local read-only PowerShell inspection confirmed all B09 assets exist in the register, all have functional groups and purpose descriptions, review flags returned no rows, and final git status was clean.

### PHASE 2 - B10 PURPOSE CLASSIFICATION REVIEW

STATUS: CLOSED
RESULT: PASS WITH CORRECTION
BATCH: B10 - SCRIPTS_AUDIT_GOV
ASSET COUNT: 27
REGISTER COVERAGE: 27/27
PURPOSE CLASSIFICATION CORRECTIONS REQUIRED: 1
JSON PATCHED: YES
REGISTER MODIFIED: YES
BATCH MANIFEST MODIFIED: NO
CORRECTION: scripts/audit-v2-provider-coverage.js functional_group changed from DATABASE_MIGRATION to SCRIPT_TOOL because its purpose_description and relationship_tags identify it as an audit script, not a migration runner.
EVIDENCE: Local PowerShell inspection confirmed all B10 assets exist in the register, one purpose classification mismatch was found and corrected, and final review scope remained limited to B10.


Phase 2 purpose classification evidence: B11

- batch_id: B11
- title: SCRIPTS_CHECK_VALIDATE_VERIFY
- asset_count: 59
- register_coverage: 59/59
- result: PASS WITH CORRECTION
- corrections:
  - scripts/setup-rls.js functional_group changed from SCRIPT_TOOL to DATABASE_MIGRATION because it enables RLS and creates DB policies through ALTER TABLE / CREATE POLICY SQL, not only generic setup/config.
  - scripts/task1-schema-update.js functional_group changed from SCRIPT_TOOL to DATABASE_MIGRATION because it runs ALTER TABLE ADD COLUMN statements on predictions_final and verifies resulting columns.
  - scripts/verify_dom_structure.js functional_group changed from SCRIPT_TOOL to FRONTEND_UI; relationship_tags changed from SQL/SCRIPT_TOOL to UI/SCRIPT_TOOL/TEST_PROOF because it checks browser DOM containers/functions and contains no SQL/database behavior.
- batch_manifest_modified: NO
- evidence: Read-only B11 manifest/register/source inspection confirmed B11 membership and the three purpose mismatches above; scope stayed limited to B11 purpose classification.

Phase 2 purpose classification evidence: B12

- batch_id: B12
- title: SCRIPTS_TEST_DIAG_TRACE
- asset_count: 66
- register_coverage: 66/66
- result: PASS WITH NO CORRECTION
- corrections: NONE
- batch_manifest_modified: NO
- register_modified: NO
- evidence: Local PowerShell read-only B12 manifest/register/source inspection confirmed all 66 B12 assets exist, all 66 are present in the register, all current functional_group values are TEST_PROOF, and focused review of the five heuristic candidates confirmed they are test/diagnostic proof scripts rather than production migrations, runtime services, or frontend assets. Scope stayed limited to B12 purpose classification.


Phase 2 purpose classification evidence: B13

- batch_id: B13
- title: SCRIPTS_RUN_TRIGGER_SCHED
- asset_count: 20
- register_coverage: 20/20
- result: PASS WITH NO CORRECTION
- corrections: NONE
- batch_manifest_modified: NO
- register_modified: NO
- evidence: Local PowerShell read-only B13 manifest/register/source inspection confirmed all 20 B13 assets exist, all 20 are present in the register, and focused review of _trigger-sync.js, run-master-pipeline.js, run-test.js, and trigger-publication.js confirmed their current purpose classifications are acceptable. Scope stayed limited to B13 purpose classification.


Phase 2 purpose classification evidence: B14

- batch_id: B14
- title: SCRIPTS_INGEST_ENRICH_SYNC_IMPORT
- asset_count: 31
- register_coverage: 31/31
- result: PASS WITH CORRECTION
- batch_manifest_modified: YES
  - asset_count corrected from 35 to 31 because B14 contained 31 listed asset_paths, all 31 source files exist, all 31 are present in the register, and no missing B14-like tracked scripts were found.
- register_modified: YES
- corrections:
  - scripts/backfill-direct1x2-final-fields.js functional_group changed from SCRIPT_TOOL to GENERATED_OUTPUT.
  - scripts/backfill-fixture-ids.js functional_group changed from SCRIPT_TOOL to GENERATED_OUTPUT.
  - scripts/backfill-provider-event-id.js functional_group changed from SCRIPT_TOOL to PROVIDER_INTEGRATION.
  - scripts/compose-context-pack.js functional_group changed from SCRIPT_TOOL to GENERATED_OUTPUT.
  - scripts/cricapi-cache-refresh.js functional_group changed from SCRIPT_TOOL to PROVIDER_INTEGRATION.
  - scripts/force-enrich-match.js functional_group changed from SCRIPT_TOOL to AI_EDGEMIND.
  - scripts/rebuild-canonical-from-api-sports.js functional_group changed from SCRIPT_TOOL to PROVIDER_INTEGRATION.
- evidence: Local PowerShell B14 manifest/register/source inspection confirmed B14 membership, repaired stale B14 asset_count metadata, and corrected seven proven purpose mismatches based on focused source review. Scope stayed limited to B14 purpose classification.


Phase 2 purpose classification evidence: B15

- batch_id: B15
- title: SCRIPTS_MAINT_FIX_CLEANUP_MIGRATE
- asset_count: 52
- register_coverage: 52/52
- result: PASS WITH CORRECTION
- batch_manifest_modified: NO
- register_modified: YES
- corrections:
  - scripts/_bsd_league_inventory.json functional_group changed from SCRIPT_TOOL to GENERATED_OUTPUT.
  - scripts/_local-rebuild.js functional_group changed from SCRIPT_TOOL to PREDICTION.
  - scripts/add-event-columns.js functional_group changed from SCRIPT_TOOL to DATABASE_MIGRATION.
  - scripts/build-sportsdb-config.js functional_group changed from SCRIPT_TOOL to PROVIDER_INTEGRATION.
  - scripts/cleanup-predictions.js functional_group changed from DEPLOYMENT_OPERATIONS to DATABASE.
  - scripts/cleanup-unknown-teams.js functional_group changed from DEPLOYMENT_OPERATIONS to DATABASE.
  - scripts/cleanup.js functional_group changed from DEPLOYMENT_OPERATIONS to DATABASE.
  - scripts/fix-json-simple.js functional_group changed from DEPLOYMENT_OPERATIONS to GENERATED_OUTPUT.
  - scripts/fix-remaining-json-issues.js functional_group changed from DEPLOYMENT_OPERATIONS to GENERATED_OUTPUT.
  - scripts/fix-sport-data.js functional_group changed from DEPLOYMENT_OPERATIONS to GENERATED_OUTPUT.
  - scripts/gulf_in_class_simulation.js functional_group changed from SCRIPT_TOOL to ACCA.
  - scripts/render-api-deploy.js functional_group changed from SCRIPT_TOOL to DEPLOYMENT_OPERATIONS.
- evidence: Local PowerShell B15 manifest/register/source inspection confirmed B15 membership, verified all 52 source files exist, verified 52/52 register coverage, and corrected twelve proven purpose mismatches based on focused source review. Scope stayed limited to B15 purpose classification.


Phase 2 purpose classification evidence: B16

- batch_id: B16
- title: DOCS_ROOT_MD_TXT
- asset_count: 36
- register_coverage: 36/36
- result: PASS WITH CORRECTION
- batch_manifest_modified: NO
- register_modified: YES
- corrections:
  - AGENTS.md functional_group changed from PROVIDER_INTEGRATION to DOCUMENTATION_KNOWLEDGE.
  - DEEPSEEK_STATE.md functional_group changed from PROVIDER_INTEGRATION to DOCUMENTATION_KNOWLEDGE.
  - GEMINI.md functional_group changed from PROVIDER_INTEGRATION to DOCUMENTATION_KNOWLEDGE.
  - Purpose descriptions corrected for proven B16 documentation assets based on focused source inspection.
- evidence: Local PowerShell B16 manifest/register/source inspection confirmed 36/36 source files exist, verified 36/36 register coverage, corrected three proven functional_group mismatches, corrected proven B16 purpose-description mismatches, and kept scope limited to B16 purpose classification.


Phase 2 purpose classification evidence: B17

- batch_id: B17
- title: DOCS_DIR
- asset_count: 24
- register_coverage: 24/24
- result: PASS WITH CORRECTION
- batch_manifest_modified: NO
- register_modified: YES
- corrections:
  - docs/api_quota_router.md functional_group changed from DEPLOYMENT_OPERATIONS to DOCUMENTATION_KNOWLEDGE.
  - docs/blueprint-semantic-drift-control-plane.md functional_group changed from DEPLOYMENT_OPERATIONS to DOCUMENTATION_KNOWLEDGE.
  - docs/README.md functional_group changed from DEPLOYMENT_OPERATIONS to DOCUMENTATION_KNOWLEDGE.
  - docs/SKCS_ENGINE_V2_PHASE05_INGEST_MAP.md functional_group changed from DEPLOYMENT_OPERATIONS to DOCUMENTATION_KNOWLEDGE.
  - Purpose descriptions corrected for proven B17 documentation assets based on focused source inspection.
- evidence: Local PowerShell B17 manifest/register/source inspection confirmed 24/24 source files exist, verified 24/24 register coverage, corrected four proven functional_group mismatches, corrected proven B17 purpose-description mismatches, and kept scope limited to B17 purpose classification.


Phase 2 purpose classification evidence: B18

- batch_id: B18
- title: SKCS_KNOWLEDGE_GOV_AND_AUDIT
- asset_count: 23
- register_coverage: 23/23
- result: PASS WITH CORRECTION
- batch_manifest_modified: NO
- register_modified: YES
- corrections:
  - No functional_group corrections required; all B18 assets remained DOCUMENTATION_KNOWLEDGE.
  - Purpose descriptions corrected for proven B18 audit/governance knowledge assets based on focused source inspection.
- evidence: Local PowerShell B18 manifest/register/source inspection confirmed 23/23 source files exist, verified 23/23 register coverage, confirmed functional_group alignment, corrected proven B18 purpose-description mismatches, and kept scope limited to B18 purpose classification.


Phase 2 purpose classification evidence: B19

- batch_id: B19
- title: SKCS_KNOWLEDGE_KNOWLEDGE
- asset_count: 17
- register_coverage: 17/17
- result: PASS WITH CORRECTION
- batch_manifest_modified: NO
- register_modified: YES
- corrections:
  - No functional_group corrections required; all B19 assets remained DOCUMENTATION_KNOWLEDGE.
  - Purpose descriptions corrected for proven B19 knowledge-layer registry/reference assets based on focused source inspection.
- evidence: Local PowerShell B19 manifest/register/source inspection confirmed 17/17 source files exist, verified 17/17 register coverage, confirmed functional_group alignment, corrected proven B19 purpose-description mismatches, and kept scope limited to B19 purpose classification.

## PHASE 2 - B20 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B20
- Title: SKCS_KNOWLEDGE_PROVIDERS
- Assets inspected: 18/18
- Start HEAD: 97b821b2

Read-only inspection findings:
- All B20 assets exist.
- All B20 assets are present in the repository asset register.
- All B20 assets are correctly classified as PROVIDER_INTEGRATION.
- Source skim confirms B20 assets are provider audits, endpoint catalogs, health reports, semantic mappings, readiness assessments, call restrictions, and synthesis notes.

Correction:
- SKCS-KNOWLEDGE/providers/soccerdata_provider_health.md purpose_description corrected from NotebookLM/workflow synthesis notes to provider health verification and probe notes.

Out of scope:
- GitHub vulnerability notices were not inspected or changed.

## PHASE 2 - B21 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B21 / PUBLIC_UI
- Assets reviewed: 64
- Files corrected: 18
- Changed files:
  - control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json

Correction:
- public/data/*.json functional_group changed from FRONTEND_UI to GENERATED_OUTPUT.

Reason:
- Source inspection confirmed the public/data JSON files are generated/static sports data and cache outputs, including league data, sports data, event details, team form, injury/news, coverage, and VIP stress data.
- Reference inspection confirmed these files are consumed as data/cache outputs from frontend fetch paths and scripts, not maintained as UI pages/components/styles.
- Existing taxonomy supports GENERATED_OUTPUT for generated JSON/data/report artifacts.

Validation:
- B21 manifest count confirmed: 64.
- B21 post-correction group counts: FRONTEND_UI 38, GENERATED_OUTPUT 18, PUBLIC_ASSET 8.
- Scope limited to B21 purpose classification correction.

## PHASE 2 - B22 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS - NO CORRECTION

Scope:
- Batch: B22 / SUPABASE_MIGRATIONS
- Manifest declared asset_count: 60
- Actual asset paths reviewed: 61
- Files corrected: 0
- Changed files:
  - control-center/EDGE_CONTROL_CENTER.md

Inspection:
- Confirmed B22 manifest title is SUPABASE_MIGRATIONS.
- Confirmed B22 manifest path list contains 61 actual asset paths under supabase/migrations/, despite declared asset_count being 60.
- Confirmed B22 register entries are classified as DATABASE_MIGRATION.
- Confirmed purpose evidence aligns with Supabase SQL migration files creating or altering database tables, indexes, functions, triggers, views, RLS policies, and related schema objects.

Validation:
- B22 post-inspection group counts: DATABASE_MIGRATION 61.
- No proven B22 purpose classification mismatches found.
- Count discrepancy recorded as a manifest metadata issue for later governance cleanup, not a B22 purpose classification mismatch.
- Scope limited to B22 purpose classification review.

## PHASE 2 - B23 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B23 / DB_SQL_AND_SUPABASE_OTHER
- Manifest declared asset_count: 20
- Actual asset paths reviewed: 20
- Existing source files found: 19
- Register coverage found: 19/20

Corrections:
- 11 SQL/schema assets changed from DATABASE to DATABASE_MIGRATION after source inspection confirmed schema-changing SQL behaviour.
- supabase/functions/semantic-drift-summary/index.ts changed from SCHEDULER_BACKGROUND to API_ROUTE because it serves HTTP requests, reads URL parameters, invokes get_semantic_violation_summary RPC, and returns JSON.
- control-center/EDGE_ASSET_REPOSITORY_MAP.md regenerated after register correction.

Governance/path drift recorded only:
- supabase/functions/sync-sports-data/index.ts is listed in B23 but is absent from the working tree and absent from the repository asset register.
- No deletion, manifest repair, or path removal was performed in B23.

Changed files:
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
- control-center/EDGE_ASSET_REPOSITORY_MAP.md
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- B23 focused validation PASS.
- B23 post-correction counts: DATABASE_MIGRATION 11, DATABASE 4, SCHEDULER_BACKGROUND 3, API_ROUTE 1, REGISTER_MISSING 1.
- Full npm run control:classification remains blocked by pre-existing non-B23 issues: B22 manifest asset_count drift plus invalid relationship tags from earlier B21/B15 corrections.
- Scope limited to B23 purpose classification corrections.

## PHASE 2 - B24 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS - NO CORRECTION

Scope:
- Batch: B24 / TESTS
- Manifest declared asset_count: 6
- Actual asset paths reviewed: 6
- Register coverage found: 6/6
- Files corrected: 0

Inspection:
- Confirmed B24 manifest title is TESTS.
- Confirmed B24 manifest path list contains 6 test assets under tests/.
- Confirmed all 6 B24 register entries are classified as TEST_PROOF.
- Source evidence scan confirmed each asset is a test or contract-proof file using node:test, assert, checker imports, route/UI checks, register checks, or runtime inventory validation helpers.

Validation:
- B24 post-inspection group counts: TEST_PROOF 6.
- No proven B24 purpose classification mismatches found.
- No register, map, source, manifest, merge, deletion, repair, or refactor was performed.
- Scope limited to B24 purpose classification review.


## PHASE 2 - B25 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B25 / SCRATCH
- Manifest declared asset_count: 2
- Actual asset paths reviewed: 2
- Register coverage found: 2/2

Correction:
- scratch/db_normalize.js functional_group changed from DATABASE_MIGRATION to DATABASE.
- scratch/db_normalize.js relationship_tags changed from ["DATABASE","MIGRATION","SQL","SCRIPT_TOOL"] to ["DATABASE","SQL","SCRIPT_TOOL"].

Reason:
- Source inspection confirmed scratch/db_normalize.js runs UPDATE statements to normalize sport labels in existing predictions_raw, leagues, and optional match_context_data rows.
- It does not create, alter, drop, index, trigger, function, or policy schema objects.
- Therefore it is database data-maintenance/normalization work, not a database migration.
- scratch/db_sync.js remains DATABASE because it only runs SELECT DISTINCT diagnostics against predictions_raw and leagues.

Changed files:
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
- control-center/EDGE_ASSET_REPOSITORY_MAP.md
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- B25 post-correction group counts: DATABASE 2.
- No source, manifest, merge, deletion, retirement, or refactor was performed.
- Scope limited to B25 purpose classification correction.

## PHASE 2 - B26 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B26 / DEPLOYMENT_CI
- Manifest declared asset_count before correction: 5
- Actual tracked/on-disk asset paths reviewed: 3
- Register coverage found: 3/3
- Map coverage found: 3/3

Correction:
- Removed stale B26 manifest asset_paths:
  - .github/workflows/daily-insights.yml
  - .github/workflows/lineups-insights.yml
- Corrected B26 manifest asset_count from 5 to 3.

Reason:
- Local evidence confirmed both workflow files are not tracked by git.
- Local evidence confirmed both workflow files are missing on disk.
- Local evidence confirmed both workflow files are absent from EDGE_REPOSITORY_ASSET_REGISTER.v1.json.
- Local evidence confirmed both workflow files are absent from EDGE_ASSET_REPOSITORY_MAP.md.
- Therefore B26 manifest membership was stale; this was not missing purpose-classification work.

Inspection:
- Dockerfile remains DEPLOYMENT_OPERATIONS: container build recipe for backend Express server deployment.
- render.yaml remains DEPLOYMENT_OPERATIONS: Render web service and cron/scheduler configuration.
- vercel.json remains DEPLOYMENT_OPERATIONS: Vercel build, function, cron, header, and rewrite configuration.

Changed files:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- B26 post-correction manifest asset_count: 3.
- B26 post-correction group counts: DEPLOYMENT_OPERATIONS 3.
- No source, register, map, merge, deletion, retirement, or refactor was performed.
- Scope limited to B26 manifest stale-entry correction and purpose classification closure.
## PHASE 2 - B27 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B27 / ARCHIVE
- Manifest declared asset_count before correction: 59
- Actual manifest asset_paths reviewed: 58
- Map rows reviewed: 58
- Register/map/tracked/disk coverage: PASS

Correction:
- Corrected B27 manifest asset_count from 59 to 58.

Reason:
- Local validation confirmed B27 manifest asset_paths count is 58.
- Local validation confirmed B27 map row count is 58.
- Local validation confirmed all B27 manifest paths are tracked, on disk, in the register, and in the map.
- Therefore the B27 asset_count value was stale; this was not missing archive purpose-classification work.

Inspection:
- All B27 reviewed assets are under _archive/.
- Current state count: STALE_OR_SUPERSEDED 58.
- Functional group counts: DATABASE_MIGRATION 6, GENERATED_OUTPUT 3, SCRIPT_TOOL 49.
- No non-archive rows found.
- No non-stale rows found.

Changed files:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- B27 post-correction manifest asset_count: 58.
- B27 post-correction purpose classification review result: PASS WITH CORRECTION.
- No source, register, map, merge, deletion, retirement, or refactor was performed.
- Scope limited to B27 manifest asset_count correction and purpose classification closure.
## PHASE 2 - B28 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B28 / ROOT_NON_MD_TXT_FILES
- Manifest asset_count: 55
- Manifest asset_paths reviewed: 55
- Map rows reviewed: 55
- Register/map/tracked/disk coverage: PASS

Correction:
- Updated kabaddiPy purpose/evidence/next_validation.
- Updated sportbook purpose/evidence/next_validation.
- Functional group remains UNCATEGORIZED because current EAC functional_group enums do not include a dedicated SUBMODULE/GITLINK category.

Reason:
- Local validation confirmed both kabaddiPy and sportbook are Gitlink entries: git ls-tree reports mode 160000 commit.
- Local validation confirmed .gitmodules is missing.
- Local validation confirmed git submodule status fails because no submodule mapping exists.
- Therefore they are orphan Gitlink/submodule pointers, not normal readable folders/files.
- This phase records purpose only; restoration, deletion, retirement, or replacement belongs to later phases.

Inspection:
- B28 manifest count/path count/map row count: 55/55/55.
- B28 coverage: PASS.
- Functional group counts before correction: DATABASE_MIGRATION 1, DEPLOYMENT_OPERATIONS 8, DOCUMENTATION_KNOWLEDGE 1, GENERATED_OUTPUT 16, PUBLIC_ASSET 1, SCRIPT_TOOL 15, TEST_PROOF 11, UNCATEGORIZED 2.
- Current state count: UNKNOWN 55.

Changed files:
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
- control-center/EDGE_ASSET_REPOSITORY_MAP.md
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- B28 purpose classification review result: PASS WITH CORRECTION.
- No source, manifest, merge, deletion, retirement, submodule repair, or refactor was performed.
- Scope limited to B28 purpose evidence correction and purpose classification closure.
## PHASE 2 - B28 REGISTER SCOPE REPAIR - CLOSED

Result: PASS

Scope:
- Batch: B28 / ROOT_NON_MD_TXT_FILES
- Repair target: EDGE_REPOSITORY_ASSET_REGISTER.v1.json over-broad text replacement from prior B28 closure commit.
- Intended B28 target assets: kabaddiPy and sportbook only.

Correction:
- Reverted over-broad orphan Gitlink/submodule next_validation, purpose, and evidence text from non-target B28 register entries.
- Preserved the orphan Gitlink/submodule purpose/evidence/next_validation correction only for kabaddiPy and sportbook.
- No map correction was required; the map already had only the two intended B28 row corrections.

Reason:
- Post-push verification showed the B28 register replacement was broader than intended.
- The correct B28 purpose correction applies only to kabaddiPy and sportbook.
- This repair restores Phase 2 scope discipline before B29 starts.

Changed files:
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- Register orphan Gitlink/submodule purpose count: 2.
- Register orphan Gitlink/submodule evidence count: 2.
- Register orphan Gitlink/submodule next_validation count: 2.
- No source, manifest, map, merge, deletion, retirement, submodule repair, or refactor was performed.
- B29 was not started before this repair.
## PHASE 2 - B29 PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTION

Scope:
- Batch: B29 / DOT_TOOL_DIRS_AND_SMALL_DIRS
- Manifest asset_count: 26
- Manifest asset_paths reviewed: 26
- Map rows reviewed: 26
- Register/map/tracked/disk coverage: PASS

Correction:
- Updated .qwen/settings.json from UNCATEGORIZED to DOCUMENTATION_KNOWLEDGE.
- Updated .qwen/settings.json.orig from UNCATEGORIZED to DOCUMENTATION_KNOWLEDGE.
- Updated both Qwen purpose descriptions to identify them as local AI-assistant command-permission settings.

Reason:
- Local validation confirmed both files are readable JSON configuration files.
- Their content defines Qwen allowed Bash command permissions.
- They are not source runtime files, generated outputs, deployments, tests, or executable scripts.
- Therefore DOCUMENTATION_KNOWLEDGE is the closest valid current EAC functional group.

Inspection:
- B29 manifest count/path count/map row count: 26/26/26.
- B29 coverage: PASS.
- Functional group counts before correction: API_ROUTE 1, BACKEND_RUNTIME 2, DEPLOYMENT_OPERATIONS 1, DOCUMENTATION_KNOWLEDGE 9, GENERATED_OUTPUT 8, PROVIDER_INTEGRATION 1, PUBLIC_ASSET 1, SCRIPT_TOOL 1, UNCATEGORIZED 2.
- Current state count: UNKNOWN 26.

Changed files:
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
- control-center/EDGE_ASSET_REPOSITORY_MAP.md
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- B29 purpose classification review result: PASS WITH CORRECTION.
- No source, manifest, merge, deletion, retirement, runtime repair, or refactor was performed.
- Scope limited to B29 Qwen purpose classification correction and closure.
## PHASE 2 - B22 MANIFEST COUNT REPAIR - CLOSED

Result: PASS

Scope:
- Batch: B22 / SUPABASE_MIGRATIONS
- Repair target: EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json stale asset_count only.

Correction:
- Corrected B22 manifest asset_count from 60 to 61.

Reason:
- Phase 2 final closure control found B22 asset_count 60 but asset_paths.Count 61.
- Read-only B22 inspection confirmed B22 map row count is 61.
- The first and last manifest paths matched the B22 migration range.
- This was a stale manifest count, not missing purpose-classification work.

Changed files:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json
- control-center/EDGE_CONTROL_CENTER.md

Validation:
- B22 post-repair asset_count: 61.
- B22 post-repair asset_paths.Count: 61.
- Repository-wide manifest count check: PASS.
- No source, register, map, merge, deletion, retirement, runtime repair, or refactor was performed.
- Scope limited to B22 manifest count correction before Phase 2 closure.
## PHASE 2 - PURPOSE CLASSIFICATION REVIEW - CLOSED

Result: PASS WITH CORRECTIONS

Scope:
- Phase: PHASE_2 / Purpose Classification Review
- Batches reviewed under Phase 2 closure controls: B01-B29
- Final closure control HEAD before closure: 50f80ca1
- Final manifest count check: PASS

Corrections completed during late Phase 2 closure:
- B22 manifest asset_count corrected from 60 to 61.
- B25 scratch database-normalization purpose corrected.
- B26 stale manifest workflow entries removed and asset_count corrected to 3.
- B27 archive manifest asset_count corrected to 58.
- B28 orphan Gitlink/submodule purpose evidence corrected for kabaddiPy and sportbook.
- B28 register scope drift repaired after post-push verification.
- B29 Qwen settings files corrected from UNCATEGORIZED to DOCUMENTATION_KNOWLEDGE.

Final validation:
- Working tree clean before closure.
- Local branch synced with origin/main before closure.
- All batch asset_count values match asset_paths.Count.
- Control Center closure notes exist for late Phase 2 corrections and repairs.
- No source deletion, merge, retirement, runtime repair, submodule repair, or refactor was performed as part of final closure.
- Phase 2 is closed; do not reopen without a new explicit Control Center task.

## CONTROL CENTER PHASE-STATE REPAIR - PHASE 3 ACTIVATED

Result: PASS

Scope:
- Repair target: Control Center cleanup programme machine-readable state and checker alignment.
- Prior completed phases preserved: PHASE_1 Exact Duplicate Elimination, PHASE_2 Purpose Classification Review.
- New active phase: PHASE_3 / Active Use Identification.

Phase 3 rule:
- Active question: Is each remaining governed file currently used?
- Outcomes: ACTIVE, INDIRECTLY_ACTIVE, MANUAL_USE, NO_CURRENT_USE_FOUND, UNKNOWN.
- NO_CURRENT_USE_FOUND does not authorize deletion.

Validation boundary:
- No Phase 3 asset-use review was started.
- No product/source/runtime files were changed.
- No deletion, merge, retirement, refactor, Supabase mutation, or classification reopen was performed.

## PHASE 3 â€” B01 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B01 / CONTROL_CENTER
- Question: Is each B01 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 13
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 2
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B01 outcomes:
1. control-center/check_control_center.js â€” ACTIVE
2. control-center/check_edge_asset_classification.js â€” ACTIVE
3. control-center/check_edge_project_register.js â€” ACTIVE
4. control-center/check_edge_repository_asset_register.js â€” ACTIVE
5. control-center/check_edge_system_runtime_inventory.js â€” ACTIVE
6. control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json â€” ACTIVE
7. control-center/EDGE_ASSET_REPOSITORY_MAP.md â€” ACTIVE
8. control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json â€” ACTIVE
9. control-center/EDGE_CONTROL_CENTER.md â€” ACTIVE
10. control-center/EDGE_MASTER_PROJECT_REGISTER.v1.json â€” ACTIVE
11. control-center/EDGE_PROJECT_BACKLOG.md â€” MANUAL_USE
12. control-center/EDGE_PROJECT_DEPENDENCY_MAP.md â€” MANUAL_USE
13. control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json â€” ACTIVE
14. control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json â€” ACTIVE
15. control-center/EDGE_SYSTEM_RUNTIME_MAP.md â€” ACTIVE

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B01 batch state not advanced in this patch.

## PHASE 3 â€” B02 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B02 / BACKEND_DIRECT_FILES
- Question: Is each B02 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 8
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 4
- NO_CURRENT_USE_FOUND: 1
- UNKNOWN: 0

B02 outcomes:
1. backend/.gitignore â€” ACTIVE
   Evidence: Backend Git operational ignore file excluding backend node_modules, env files, local DB/log/form artifacts, and backend.local-backup.

2. backend/apiClients.js â€” ACTIVE
   Evidence: Imported by active backend data-provider service and exports provider clients/helper functions used by backend ingestion/provider flows.

3. backend/checkCanonicalEvents.js â€” MANUAL_USE
   Evidence: Standalone Supabase diagnostic script for canonical_events counts, sport distribution, and future event inspection. No active runtime caller found.

4. backend/config.js â€” ACTIVE
   Evidence: Runtime configuration module loaded by server, database modules, api clients, and services.

5. backend/database.js â€” ACTIVE
   Evidence: Runtime PostgreSQL/Supabase database module used by server startup, routes, subscription/profile helpers, query helpers, and transaction helpers.

6. backend/db.js â€” ACTIVE
   Evidence: Runtime DB helper imported by EdgeMind controller path and active backend code.

7. backend/dbBootstrap.js â€” ACTIVE
   Evidence: Imported and executed by backend/server-express.js during startup to verify tables, compatibility views, cleanup, and bootstrap state.

8. backend/deploy-trigger-cricket.js â€” ACTIVE
   Evidence: Render cricket cron start command points to node backend/deploy-trigger-cricket.js; script exits safely unless cricket ingestion is enabled.

9. backend/deploy-trigger.js â€” ACTIVE
   Evidence: Render weekly global scrape cron start command points to node backend/deploy-trigger.js.

10. backend/edgemind_inference.py â€” MANUAL_USE
    Evidence: Standalone Python EdgeMind/Antigravity inference bridge with CLI entrypoint requiring python edgemind_inference.py <event_id>. No active Node/server caller found.

11. backend/package-lock.json â€” NO_CURRENT_USE_FOUND
    Evidence: Minimal backend lockfile with only empty backend package entry. Root install/build uses root package.json; no backend package script caller found.

12. backend/server-express.js â€” ACTIVE
    Evidence: Root package main/start/dev target and Render backend web start command. Mounts backend API routes and server runtime.

13. backend/test-ultra-slim.js â€” MANUAL_USE
    Evidence: Standalone local Dolphin inference test script. No active package/runtime caller found.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B02 batch state not advanced in this patch.

## PHASE 3 - B03 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE 3 - Active Use Identification
- Batch: B03 / BACKEND_ROUTES_AND_CONTROLLERS
- Question: Is each B03 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 28
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 0
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B03 outcomes:
1. backend/controllers/edgeMindController.js - ACTIVE
   Evidence: backend/routes/chat.js imports generateBotResponse from this controller, and backend/server-express.js mounts the chat router at /api/chat and /api/edgemind.

2. backend/routes/accuracy.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/accuracy.

3. backend/routes/antigravity.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/antigravity.

4. backend/routes/chat.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/chat and /api/edgemind.

5. backend/routes/controlCenter.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/control-center.

6. backend/routes/cricketCache.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/cricket/cache.

7. backend/routes/cricketCount.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/cricket/count.

8. backend/routes/cricketCron.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/cron.

9. backend/routes/cricketInsights.js - ACTIVE
   Evidence: Imported by backend/server-express.js and mounted at /api/cricket/insights.

10. backend/routes/debug.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/debug.

11. backend/routes/direct1x2.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/direct-1x2.

12. backend/routes/divanscore.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api.

13. backend/routes/feedback.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/feedback.

14. backend/routes/metrics.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/metrics.

15. backend/routes/pipeline.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/pipeline.

16. backend/routes/predictions.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/predictions.

17. backend/routes/refresh-ai.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/admin.

18. backend/routes/scheduler.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/scheduler.

19. backend/routes/semanticDrift.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/semantic-drift-summary.

20. backend/routes/skcsGrading.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/skcs.

21. backend/routes/sportsEdge.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /.

22. backend/routes/tier1.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/tier1.

23. backend/routes/user.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/user.

24. backend/routes/v1/acca.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted under /api/v1.

25. backend/routes/v1/predictions.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted under /api/v1.

26. backend/routes/v1/sameMatchBuilder.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/v1/smb.

27. backend/routes/v1/secondaryMarkets.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/v1/markets/secondary.

28. backend/routes/vip.js - ACTIVE
    Evidence: Imported by backend/server-express.js and mounted at /api/vip.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B03 batch state not advanced in this patch.


## PHASE 3 â€” B04 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B04 / BACKEND_UTILS_SEMANTIC_CORE_AND_TEST
- Question: Is each B04 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 37
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 6
- NO_CURRENT_USE_FOUND: 3
- UNKNOWN: 0

B04 outcomes:
1. backend/audit/system_integrity_audit.md â€” MANUAL_USE
   Evidence: System integrity audit document retained as human/governance evidence. No runtime, package script, or tooling caller found.

2. backend/core/executionPipeline.js â€” ACTIVE
   Evidence: Referenced by active backend routes, server runtime, cron jobs, sync services, heartbeat service, and pipeline/direct builder services.

3. backend/core/verificationController.js â€” ACTIVE
   Evidence: Referenced by backend/server-express.js, active prediction route, semantic-layer controllers, AI/context/pipeline services, sync service, and TheSportsDB pipeline.

4. backend/core/verificationSignalContract.js â€” ACTIVE
   Evidence: Imported by backend/core/verificationController.js and used through the active verification controller path.

5. backend/errors/ProviderQuotaExceededError.js â€” ACTIVE
   Evidence: Imported by backend/apiClients.js and backend/services/dataProvider.js for active provider quota handling.

6. backend/logic/edgeMind_manifest.json â€” NO_CURRENT_USE_FOUND
   Evidence: Logic manifest file exists and documents EdgeMind scoring, but no runtime, package script, manual tooling, or documentation consumer was found beyond governance/report registration.

7. backend/middleware/supabaseJwt.js â€” ACTIVE
   Evidence: Imported by active auth-protected backend routes and backend/server-express.js.

8. backend/parsers/base_sport_parser.py â€” NO_CURRENT_USE_FOUND
   Evidence: Parser module exists, but no current runtime, package script, manual tooling, or documentation consumer was found beyond governance/report registration.

9. backend/semantic-layer/controlPlaneEvaluator.js â€” ACTIVE
   Evidence: Referenced by active execution pipeline, verification controller, semantic drift summary service, runtime maps, and audit tooling.

10. backend/semantic-layer/decisionFingerprintService.js â€” ACTIVE
    Evidence: Referenced by backend/core/executionPipeline.js and execution-spine audit tooling.

11. backend/semantic-layer/enforcementGuard.js â€” ACTIVE
    Evidence: Referenced by active backend/services/aiPipeline.js and semantic control-plane documentation/runtime maps.

12. backend/semantic-layer/errorMemoryLayer.js â€” ACTIVE
    Evidence: Referenced by backend/core/executionPipeline.js and execution-spine audit tooling.

13. backend/semantic-layer/gatekeeperAdapter.js â€” ACTIVE
    Evidence: Referenced by backend/core/executionPipeline.js and execution-spine audit tooling.

14. backend/semantic-layer/governanceGatekeeper.js â€” ACTIVE
    Evidence: Referenced by active cricket cron route, cron jobs service, gatekeeper adapter, runtime maps, and execution-spine audit tooling.

15. backend/semantic-layer/normalizer.js â€” ACTIVE
    Evidence: Referenced by enforcementGuard.js, provider normalizer paths, AI/sync service context, and boundary audit tooling.

16. backend/semantic-layer/preflightSimulator.js â€” ACTIVE
    Evidence: Referenced by backend/core/executionPipeline.js and execution-spine audit tooling.

17. backend/semantic-layer/registry.js â€” ACTIVE
    Evidence: Referenced by football provider normalizers, semantic normalizer, sportsdataio contract helpers, and provider mapping documentation.

18. backend/semantic-layer/sportsdataioContractHelpers.js â€” MANUAL_USE
    Evidence: Referenced by scripts/sync-ucl-context.js and provider mapping documentation. No active runtime caller found.

19. backend/semantic-layer/verificationController.js â€” ACTIVE
    Evidence: Referenced by backend/core/executionPipeline.js, runtime maps, and execution-spine audit tooling.

20. backend/semantic-layer/violationLogger.js â€” ACTIVE
    Evidence: Referenced by enforcementGuard.js and runtime/compliance maps.

21. backend/test/smoke-test-insight-engine.js â€” MANUAL_USE
    Evidence: Standalone smoke test file with Node execution instructions and imports from backend/utils/insightEngine.js. No active runtime caller found.

22. backend/test/smoke-test-skcs-law.js â€” MANUAL_USE
    Evidence: Standalone law-compliance smoke test file with Node execution instructions; referenced by smoke-test-insight-engine.js. No active runtime caller found.

23. backend/utils/accaLogicEngine.js â€” ACTIVE
    Evidence: Referenced by accaBuilder, acca math utilities, market scoring engine, smoke tests, patch scripts, and football-rules audit tooling.

24. backend/utils/apiCache.js â€” ACTIVE
    Evidence: Referenced by backend/utils/rapidApiWaterfall.js and cache/provider service paths.

25. backend/utils/apiQueue.js â€” ACTIVE
    Evidence: Referenced by active cron jobs, enhanced match details service, hybrid sports data service, and TheSportsDB pipeline.

26. backend/utils/apiUsageLimiter.js â€” MANUAL_USE
    Evidence: Referenced by scripts/import-today-snapshot-pipeline.js. No active runtime caller found.

27. backend/utils/auth.js â€” ACTIVE
    Evidence: Referenced by active backend routes, backend/server-express.js, runtime inventory, and control-center routes.

28. backend/utils/availability.js â€” ACTIVE
    Evidence: Referenced by active predictions route and live fixture fetch tooling.

29. backend/utils/conflictResolver.js â€” ACTIVE
    Evidence: Referenced by backend/services/accaBuilder.js and runtime maps.

30. backend/utils/contextInsights.js â€” ACTIVE
    Evidence: Referenced by active predictions and VIP routes.

31. backend/utils/dateNormalization.js â€” ACTIVE
    Evidence: Referenced by backend/server-express.js and active predictions route.

32. backend/utils/db.js â€” ACTIVE
    Evidence: Runtime re-export to backend/db.js; referenced by active backend routes, server runtime, providers, services, semantic-layer modules, scripts, and system runtime inventory.

33. backend/utils/insightEngine.js â€” ACTIVE
    Evidence: Referenced by active predictions route, accaBuilder service, patch scripts, and smoke tests.

34. backend/utils/insightValidationMatrix.js â€” ACTIVE
    Evidence: Referenced by active VIP route and accaBuilder service.

35. backend/utils/jobLogger.js â€” ACTIVE
    Evidence: Referenced by backend/server-express.js, scheduler/test logger scripts, runtime maps, and AGENTS.md.

36. backend/utils/keyPool.js â€” ACTIVE
    Evidence: Referenced by backend/apiClients.js, data provider services, rapidApiWaterfall.js, live fixture fetch tooling, and import snapshot tooling.

37. backend/utils/marketConsistency.js â€” ACTIVE
    Evidence: Referenced by active predictions route and accaBuilder service.

38. backend/utils/pipelineLogger.js â€” ACTIVE
    Evidence: Referenced by active debug/predictions routes, accaBuilder, aiPipeline, market intelligence, sync service, and insight engine paths.

39. backend/utils/providerCircuitBreaker.js â€” ACTIVE
    Evidence: Referenced by backend/apiClients.js, api cache service, live fixture fetch tooling, and runtime maps.

40. backend/utils/purgeStaleData.js â€” MANUAL_USE
    Evidence: One-off CLI utility with explicit usage `node backend/utils/purgeStaleData.js`; no active runtime caller found.

41. backend/utils/rapidApiWaterfall.js â€” ACTIVE
    Evidence: Referenced by backend/server-express.js, live fixture fetch tooling, cache test tooling, and runtime maps.

42. backend/utils/secondaryMarketSelector.js â€” ACTIVE
    Evidence: Referenced by backend/services/direct1x2Builder.js and football-rules audit tooling.

43. backend/utils/sportsrcNormalizer.js â€” ACTIVE
    Evidence: Referenced by backend/services/dataProvider.js.

44. backend/utils/validation.js â€” ACTIVE
    Evidence: Referenced by accaBuilder, aiPipeline, filterEngine, and runtime inventory.

45. backend/utils/weather.js â€” ACTIVE
    Evidence: Referenced by active predictions route and live fixture fetch tooling.

46. backend/workers/now_api_pulse.py â€” NO_CURRENT_USE_FOUND
    Evidence: Background worker module exists, but no current runtime, package script, manual tooling, or documentation consumer was found beyond governance/report registration.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B04 batch state not advanced in this patch.


## PHASE 3 â€” B05 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B05 / BACKEND_SCRIPTS
- Question: Is each B05 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 1
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 14
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B05 outcomes:
1. backend/scripts/add-avg-total-log.js â€” MANUAL_USE
   Evidence: Standalone repository patch/diagnostic insertion script targeting backend/services/accaBuilder.js. No runtime, package script, or external tooling caller found.

2. backend/scripts/add-diagnostics.js â€” MANUAL_USE
   Evidence: Standalone repository patch/diagnostic insertion script targeting backend/services/accaBuilder.js. No runtime, package script, or external tooling caller found.

3. backend/scripts/bridge_frontend.py â€” MANUAL_USE
   Evidence: Standalone Python Supabase bridge script with environment loading and direct Supabase client usage. Referenced only by runtime consumer audit documentation and governance/report files.

4. backend/scripts/generate_vip_master.py â€” MANUAL_USE
   Evidence: Standalone Python VIP generation script using Supabase and AI provider clients. Referenced only by runtime consumer audit documentation and governance/report files.

5. backend/scripts/ingest_football.py â€” MANUAL_USE
   Evidence: Standalone Python football ingestion script using API-Sports and Supabase. Referenced by ingest-map documentation and governance/report files.

6. backend/scripts/patch-acca-builder.js â€” MANUAL_USE
   Evidence: Standalone repository patch script targeting backend/services/accaBuilder.js. No runtime, package script, or external tooling caller found.

7. backend/scripts/patch-card-uniqueness.js â€” MANUAL_USE
   Evidence: Standalone repository patch script targeting backend/services/accaBuilder.js for card uniqueness/team-lock logic. No runtime, package script, or external tooling caller found.

8. backend/scripts/patch-final-flow.js â€” MANUAL_USE
   Evidence: Standalone repository patch script targeting backend/services/accaBuilder.js and insight-engine flow. No runtime, package script, or external tooling caller found.

9. backend/scripts/patch-row-cleanup.js â€” MANUAL_USE
   Evidence: Standalone repository patch script targeting backend/services/accaBuilder.js to insert stale-row cleanup logic. No runtime, package script, or external tooling caller found.

10. backend/scripts/patch-skcs-law.js â€” MANUAL_USE
    Evidence: Standalone repository patch script targeting ACCA/SKCS law imports and logic. No runtime, package script, or external tooling caller found.

11. backend/scripts/populate_sports_data.py â€” MANUAL_USE
    Evidence: Standalone Python data population script with direct provider keys and Supabase client usage; manually referenced from scripts/populate_sports_data.py. No active runtime caller found.

12. backend/scripts/requirements.txt â€” MANUAL_USE
    Evidence: Python dependency manifest for backend scripts/tooling; referenced by documentation and tooling contexts. No package/runtime execution caller found.

13. backend/scripts/sync-sportsrc-fixtures.js â€” ACTIVE
    Evidence: Referenced from package.json and implemented as a Supabase-backed SportsRC fixture sync script.

14. backend/scripts/test_ai_providers.py â€” MANUAL_USE
    Evidence: Standalone Python AI-provider test script with local/OpenAI-style provider configuration. No runtime, package script, or external tooling caller found.

15. backend/scripts/test_ai_real_matches.py â€” MANUAL_USE
    Evidence: Standalone Python AI real-match test script using Supabase and provider clients. No runtime, package script, or external tooling caller found.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B05 batch state not advanced in this patch.


## PHASE 3 â€” B06 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B06 / BACKEND_PROVIDERS
- Question: Is each B06 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 10
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B06 outcomes:
1. backend/providers/football/bigBallsDataNormalizer.js â€” MANUAL_USE
   Evidence: Referenced by backend/providers/football/bigBallsDataProvider.js and provider documentation. No active runtime or package caller found.

2. backend/providers/football/bigBallsDataProvider.js â€” MANUAL_USE
   Evidence: Referenced by scripts/verify-bigballs-provider.js and provider documentation. No active runtime or package caller found.

3. backend/providers/football/bsdNormalizer.js â€” MANUAL_USE
   Evidence: Referenced by backend/providers/football/bsdProvider.js and provider documentation. No active runtime or package caller found.

4. backend/providers/football/bsdProvider.js â€” MANUAL_USE
   Evidence: Referenced by scripts/verify-bsd-provider.js and provider documentation. No active runtime or package caller found.

5. backend/providers/football/bzzoiroNormalizer.js â€” MANUAL_USE
   Evidence: Referenced by backend/providers/football/bsdNormalizer.js, backend/providers/football/bzzoiroProvider.js, and provider documentation. No active runtime or package caller found.

6. backend/providers/football/bzzoiroProvider.js â€” MANUAL_USE
   Evidence: Referenced by scripts/sync-bsd-enrichment.js, scripts/verify-bsd-enrichment.js, and provider documentation. No active runtime or package caller found.

7. backend/providers/football/soccerDataApiNormalizer.js â€” MANUAL_USE
   Evidence: Referenced by backend/providers/football/soccerDataApiProvider.js, SoccerData audit scripts, and provider documentation. No active runtime or package caller found.

8. backend/providers/football/soccerDataApiProvider.js â€” MANUAL_USE
   Evidence: Referenced by scripts/verify-soccerdata-provider.js and provider documentation. No active runtime or package caller found.

9. backend/providers/football/sportsApiProFootballAdapter.js â€” MANUAL_USE
   Evidence: Referenced by scripts/test-sportsapi-pro-football-adapter.js. No active runtime or package caller found.

10. backend/providers/football/sportsApiProFootballNormalizer.js â€” MANUAL_USE
    Evidence: Referenced by backend/providers/football/sportsApiProFootballAdapter.js. No active runtime or package caller found.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B06 batch state not advanced in this patch.

## PHASE 3 â€” B07 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B07 / BACKEND_SRC_SERVICES
- Question: Is each B07 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 7
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 0
- NO_CURRENT_USE_FOUND: 2
- UNKNOWN: 0

B07 outcomes:
1. backend/src/services/contextIntelligence/adjustProbability.js â€” ACTIVE
   Evidence: Imported by backend/services/aiPipeline.js and used by the active prediction pipeline to adjust baseline probabilities and apply market-level context adjustments.

2. backend/src/services/contextIntelligence/aiPipeline_core.js â€” ACTIVE
   Evidence: Imported by backend/src/services/contextIntelligence/aiPipeline.js and used as the core enrichment pipeline for weather, availability, discipline, stability, and extended context signals.

3. backend/src/services/contextIntelligence/aiPipeline.js â€” ACTIVE
   Evidence: Imported by backend/services/aiPipeline.js; runtime map records it as consumed by backend/services/aiPipeline.js and using fixture_context_cache.

4. backend/src/services/contextIntelligence/availabilitySignal.js â€” ACTIVE
   Evidence: Imported by backend/src/services/contextIntelligence/aiPipeline_core.js and used in the active context enrichment path to compute availability_risk.

5. backend/src/services/contextIntelligence/cacheService.js â€” NO_CURRENT_USE_FOUND
   Evidence: Exports context_intelligence_cache helper functions, but no current runtime, package script, or active service caller was found for the exported helper names.

6. backend/src/services/contextIntelligence/disciplineSignal.js â€” ACTIVE
   Evidence: Imported by backend/src/services/contextIntelligence/aiPipeline_core.js and used in the active context enrichment path to compute discipline_risk.

7. backend/src/services/contextIntelligence/stabilitySignal.js â€” ACTIVE
   Evidence: Imported by backend/src/services/contextIntelligence/aiPipeline_core.js and used in the active context enrichment path to compute stability_risk.

8. backend/src/services/contextIntelligence/weatherSignal.js â€” ACTIVE
   Evidence: Imported by backend/src/services/contextIntelligence/aiPipeline_core.js; runtime map records it as consumed by that core pipeline and tied to api.weatherapi.com.

9. backend/src/services/marketRouter/waterfall.js â€” NO_CURRENT_USE_FOUND
   Evidence: Exports resolveDecision for market waterfall selection, but no current runtime, package script, or active service caller was found for resolveDecision or the marketRouter waterfall module.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B07 batch state not advanced in this patch.
## PHASE 3 â€” B08 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B08 / BACKEND_ADAPTERS_AND_CONFIG
- Question: Is each B08 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 9
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 3
- NO_CURRENT_USE_FOUND: 1
- UNKNOWN: 0

B08 outcomes:
1. backend/adapters/f1Adapter.js â€” NO_CURRENT_USE_FOUND
   Evidence: File exports a disabled F1 adapter that throws "F1 adapter is disabled in this deployment"; repository search found no current caller beyond governance/manifest references.

2. backend/adapters/footballAdapter.js â€” ACTIVE
   Evidence: Imported by backend/adapters/index.js. The Supabase scheduledFixtureSync function imports loadAdapter from backend/adapters/index.js and dynamically loads configured adapters for enabled sport sync records.

3. backend/adapters/index.js â€” ACTIVE
   Evidence: Imported by supabase/edge-functions/scheduledFixtureSync/index.ts and used to load configured sport adapters before fixture fetch.

4. backend/adapters/tennisAdapter.js â€” ACTIVE
   Evidence: Imported by backend/adapters/index.js, which is consumed by scheduledFixtureSync for configured adapter loading.

5. backend/config/activeSports.js â€” ACTIVE
   Evidence: Imported by active backend scheduler, sync service, AI pipeline, ACCA builder, and EdgeMind controller paths to resolve enabled deployment sports.

6. backend/config/apiEndpoints.js â€” MANUAL_USE
   Evidence: Imported by backend/utils/apiUsageLimiter.js for API-Sports daily hard-cap constants; current evidence points to utility/script usage rather than a proven active server/runtime path.

7. backend/config/bigBallsLeagueMap.js â€” ACTIVE
   Evidence: Imported by backend/services/bigBallsFootballBridge.js, which is imported by backend/services/dataProvider.js in the active data-provider path.

8. backend/config/footballRules.js â€” ACTIVE
   Evidence: Imported by backend/services/accaBuilder.js for active ACCA/football rule thresholds and constraints.

9. backend/config/predictionOutcomes.js â€” ACTIVE
   Evidence: Imported by backend/services/marketScoringEngine.js and used by scoreMarkets() to resolve the sport market/outcome universe.

10. backend/config/soccerDataLeagueMap.js â€” MANUAL_USE
    Evidence: Referenced by backend/providers/football/soccerDataApiProvider.js and SoccerData audit/discovery tooling; no active runtime caller was proven for the SoccerData provider path in this phase.

11. backend/config/sportRules.js â€” MANUAL_USE
    Evidence: Imported by scripts/run-stage2-context.js for staged context math, and that stage is invoked by scripts/run-master-pipeline.js; no active server/package runtime caller was proven.

12. backend/config/subscriptionMatrix.js â€” ACTIVE
    Evidence: Imported by backend/server-express.js, backend/routes/predictions.js, and backend/controllers/edgeMindController.js for plan capabilities, prediction filtering, daily allocations, and subscription access shaping.

13. backend/config/subscriptionPlans.js â€” ACTIVE
    Evidence: Imported by backend/routes/user.js, backend/routes/predictions.js, backend/server-express.js, subscriptionMatrix.js, and EdgeMind controller paths for plan normalization and tier-key resolution.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B08 batch state not advanced in this patch.
## PHASE 3 â€” B09 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B09 / BACKEND_SERVICES
- Question: Is each B09 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 63
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 6
- NO_CURRENT_USE_FOUND: 17
- UNKNOWN: 0

B09 ACTIVE assets:
- backend/services/accaBuilder.js
- backend/services/aiPipeline.js
- backend/services/aiPipelineOrchestrator.js
- backend/services/aiProvider.js
- backend/services/aiScoring.js
- backend/services/aiTelemetryService.js
- backend/services/antigravity/WorkflowEngine.js
- backend/services/apiCacheService.js
- backend/services/apiQuotaRouter.js
- backend/services/apiQuotaRouterProviders.js
- backend/services/bigBallsDataApiClient.js
- backend/services/bigBallsFootballBridge.js
- backend/services/blockedApiCallsLog.js
- backend/services/canonicalEvents.js
- backend/services/canonicalIngestFirewall.js
- backend/services/conflictEngine.js
- backend/services/contextEnrichmentService.js
- backend/services/contextIngestionService.js
- backend/services/contradictionGovernance.js
- backend/services/controlCenterReadService.js
- backend/services/cricApiCacheService.js
- backend/services/cricbuzzService.js
- backend/services/cricketLiveEnrichmentService.js
- backend/services/cricketLiveMatchResolver.js
- backend/services/cricketRulesEngine.js
- backend/services/cronJobs.js
- backend/services/dataProvider.js
- backend/services/dataProviders.js
- backend/services/direct1x2Builder.js
- backend/services/direct1x2Engine.js
- backend/services/divanscoreService.js
- backend/services/enhancedMatchDetailsService.js
- backend/services/espnHiddenApiService.js
- backend/services/filterEngine.js
- backend/services/footballH2HExtractor.js
- backend/services/footballHighlightsService.js
- backend/services/footballRankExtractor.js
- backend/services/freeLivescoreApiService.js
- backend/services/gradingAccuracyCore.js
- backend/services/gradingSnapshotService.js
- backend/services/hybridSportsDataService.js
- backend/services/marketIntelligence.js
- backend/services/marketScoringEngine.js
- backend/services/masterRulebookRiskClassification.js
- backend/services/metrxFactoryService.js
- backend/services/normalizerService.js
- backend/services/oddsBudgetService.js
- backend/services/pipelineMetricsService.js
- backend/services/proFootballDataService.js
- backend/services/providerQuotaService.js
- backend/services/quotaPlanner.js
- backend/services/safeHavenSelector.js
- backend/services/saveContextData.js
- backend/services/saveDirectInsights.js
- backend/services/semanticDriftSummaryService.js
- backend/services/skcsHeartbeat.js
- backend/services/sportsrcHealthService.js
- backend/services/subscriptionTiming.js
- backend/services/syncService.js
- backend/services/systemTruthLogger.js
- backend/services/thesportsdbPipeline.js
- backend/services/tier1BootstrapService.js
- backend/services/tier1SchemaProfile.js

Evidence for ACTIVE group:
Runtime map records confirmed reachability and active consumers through backend routes, server startup, active pipeline services, metrics routes, scheduler routes, cricket routes, control-center routes, semantic drift routes, and service-to-service runtime chains.

B09 MANUAL_USE assets:
- backend/services/bzzoiroApiClient.js
  Evidence: Referenced through the sandboxed Bzzoiro football provider path. That provider path was previously classified as manual/provider-evaluation use, not active runtime use.
- backend/services/bzzoiroCrosswalk.js
  Evidence: Supports Bzzoiro/API-Sports crosswalk and verification-lane logic; no active runtime caller was proven in B09.
- backend/services/freeLivescoreApiExtractor.js
  Evidence: Referenced by test/discovery tooling for Free Livescore payload extraction; no active runtime caller was proven.
- backend/services/soccerDataApiClient.js
  Evidence: Referenced by SoccerData provider/evaluation tooling; no active runtime caller was proven for the SoccerData provider path.
- backend/services/sportsApiProFootballExtractor.js
  Evidence: Supports SportsAPI Pro football provider/evaluation tooling; no active runtime caller was proven.
- backend/services/sportsApiProFootballService.js
  Evidence: Supports SportsAPI Pro football provider/evaluation tooling; no active runtime caller was proven.

B09 NO_CURRENT_USE_FOUND assets:
- backend/services/accaMathUtils.js
- backend/services/aiProvider_odds_update.js
- backend/services/comboEngine.js
- backend/services/football536Extractor.js
- backend/services/football536Service.js
- backend/services/footballRiskTierMapper.js
- backend/services/liveFootballApiExtractor.js
- backend/services/liveFootballApiService.js
- backend/services/metrxFactoryExtractor.js
- backend/services/oddsApiPipeline.js
- backend/services/rateLimitsAnalysis.js
- backend/services/reEvaluationEngine.js
- backend/services/sportsLiveScoresExtractor.js
- backend/services/sportsLiveScoresService.js
- backend/services/unifiedFixturesService.js
- backend/services/unifiedPredictionsService.js
- backend/services/unifiedRulesService.js

Evidence for NO_CURRENT_USE_FOUND group:
Repository search and runtime-map inspection did not prove current backend route, server startup, service-to-service, package script, or active manual-tool consumers for these files during B09 inspection.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B09 batch state not advanced in this patch.
## PHASE 3 â€” B10 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B10 / SCRIPTS_AUDIT_GOV
- Question: Is each B10 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 27
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B10 MANUAL_USE assets:
- scripts/apply-db-governance.js
- scripts/apply-migrations.js
- scripts/audit-api-call-map.js
- scripts/audit-api-sports-usage.js
- scripts/audit-bigballs-discovery.js
- scripts/audit-bsd-discovery.js
- scripts/audit-bsd-league-inventory.js
- scripts/audit-cricket-final-tables.js
- scripts/audit-cricket-rules.js
- scripts/audit-cricket-storage.js
- scripts/audit-cricket-tables.js
- scripts/audit-database.js
- scripts/audit-execution-spine.js
- scripts/audit-football-rules-alignment.js
- scripts/audit-grading-pipeline.js
- scripts/audit-placeholders-and-insights.js
- scripts/audit-soccerdata-discovery.js
- scripts/audit-soccerdata-summer-coverage.js
- scripts/audit-sport-values.js
- scripts/audit-sportsdataio-boundary.ps1
- scripts/audit-table-usage.js
- scripts/audit-v2-foundation.js
- scripts/audit-v2-identity-deep.js
- scripts/audit-v2-provider-coverage.js
- scripts/gatekeeper-pipeline.js
- scripts/master-qa.js
- scripts/secondary-market-gatekeeper.js

Evidence:
- B10 is defined as the SCRIPTS_AUDIT_GOV batch.
- B10 manifest rule selects scripts/audit-* plus exact governance script names: apply-db-governance.js, apply-migrations.js, master-qa.js, gatekeeper-pipeline.js, and secondary-market-gatekeeper.js.
- package.json exposes several B10 scripts as npm operator commands: accuracy:audit, audit:api, audit:execution-spine, audit:bsd-discovery, audit:bsd-league-inventory, audit:bigballs-discovery, audit:soccerdata-discovery, and audit:soccerdata-summer.
- The exact governance scripts are manual/operator tools: database governance application, migration application, master QA, and gatekeeper/secondary-market governance.
- No B10 file is classified as active runtime/product code in this phase.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B10 batch state not advanced in this patch.
## PHASE 3 â€” B11 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B11 / SCRIPTS_CHECK_VALIDATE_VERIFY
- Question: Is each B11 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 59
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B11 MANUAL_USE assets:
- scripts/_check-db.js
- scripts/_check-final-table.js
- scripts/_check-match-dates.js
- scripts/_check-plan-visibility.js
- scripts/_check-team-locks.js
- scripts/_check-tier.js
- scripts/check-acca-data.js
- scripts/check-accuracy-schema.js
- scripts/check-accuracy-time.js
- scripts/check-all-fixtures.js
- scripts/check-cache-schema.js
- scripts/check-cache.js
- scripts/check-canonical-events-schema.js
- scripts/check-cricket-rows.js
- scripts/check-db-schema.js
- scripts/check-events-schema.js
- scripts/check-events-status.js
- scripts/check-events.js
- scripts/check-filtered-schema.js
- scripts/check-final-table-columns.js
- scripts/check-final-table-schema.js
- scripts/check-fixtures-structure.js
- scripts/check-french-league.js
- scripts/check-graded.js
- scripts/check-match-details.js
- scripts/check-match-id-mapping.js
- scripts/check-match-prediction.js
- scripts/check-old-events.js
- scripts/check-predictions.js
- scripts/check-publication-state.js
- scripts/check-raw-json.js
- scripts/check-raw-prediction-structure.js
- scripts/check-scheduler-schema.js
- scripts/check-schema.js
- scripts/check-stages-schema.js
- scripts/check-supabase-vs-pg-tiers.js
- scripts/check-tables.js
- scripts/check-timestamp-cols.js
- scripts/migration1-plan-visibility.js
- scripts/schema-introspection.js
- scripts/setup-rls.js
- scripts/task1-schema-update.js
- scripts/validate-backfill-accuracy.js
- scripts/validate-keys.js
- scripts/validate-relational-migration.js
- scripts/verify_dom_structure.js
- scripts/verify-acca-legs.js
- scripts/verify-accas.js
- scripts/verify-bigballs-provider.js
- scripts/verify-bsd-crosswalk.js
- scripts/verify-bsd-enrichment.js
- scripts/verify-bsd-provider.js
- scripts/verify-db-rule-alignment.js
- scripts/verify-end-to-end-loop.js
- scripts/verify-master-rulebook-alignment.js
- scripts/verify-new-predictions.js
- scripts/verify-soccerdata-provider.js
- scripts/verify-sportsdb-coverage.js
- scripts/verify-vercel-build.js

Evidence:
- B11 is defined as the SCRIPTS_CHECK_VALIDATE_VERIFY batch.
- B11 manifest rule selects scripts/check-*, scripts/_check-*, scripts/validate-*, scripts/verify-*, plus exact operator scripts: setup-rls.js, schema-introspection.js, task1-schema-update.js, migration1-plan-visibility.js, and verify_dom_structure.js.
- package.json exposes several B11 verification scripts as npm operator commands: verify:vercel, verify:bsd, verify:bsd-provider, verify:bsd-crosswalk, verify:bigballs-provider, verify:soccerdata-provider, db:verify:rules, and verify:rulebook.
- setup-rls.js and schema-introspection.js are database operator tools, not runtime product modules.
- No B11 file is classified as active runtime/product code in this phase.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B11 batch state not advanced in this patch.
## PHASE 3 â€” B12 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 â€” Active Use Identification
- Batch: B12 / SCRIPTS_TEST_DIAG_TRACE
- Question: Is each B12 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 66
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B12 MANUAL_USE assets:
- scripts/browser_console_test.js
- scripts/debug-cricket-ai-predictions.js
- scripts/debug-cricket-insights-schema.js
- scripts/debug-cricket-simple.js
- scripts/debug-key.js
- scripts/debug-matches-content.js
- scripts/debug-matches-json.js
- scripts/diagnose-filtering.js
- scripts/diagnostic-espn-fixed.js
- scripts/diagnostic-espn.js
- scripts/diagnostic-thesportsdb.js
- scripts/examine-prediction-76412.js
- scripts/examine-tier-rules.js
- scripts/simulate-filtering.js
- scripts/smoke-test.js
- scripts/test_full_fallback_flow.js
- scripts/test-ai-predictions-542703.js
- scripts/test-ai-predictions-endpoint.js
- scripts/test-all-rapid-hosts.js
- scripts/test-antigravity.js
- scripts/test-api.js
- scripts/test-api2.js
- scripts/test-cache.js
- scripts/test-corrected-endpoint.js
- scripts/test-cricbuzz.js
- scripts/test-cricket-live-line-advance-provider.js
- scripts/test-cricket-live-line-provider.js
- scripts/test-cron.js
- scripts/test-divanscore-rankings-fallback.js
- scripts/test-fetch.js
- scripts/test-final-endpoint.js
- scripts/test-fixed-ai-predictions.js
- scripts/test-fixed-endpoint.js
- scripts/test-fixed-pipeline.js
- scripts/test-football-h2h-pipeline-integration.js
- scripts/test-football-highlights-h2h.js
- scripts/test-football-risk-tier-mapper.js
- scripts/test-football536-endpoints.js
- scripts/test-football536-fixtures-normalizer.js
- scripts/test-free-livescore-fixtures.js
- scripts/test-free-livescore-search.js
- scripts/test-live-football-api-priority.js
- scripts/test-livescore6-cricket-provider.js
- scripts/test-logger.js
- scripts/test-metrx-factory-top-metrics.js
- scripts/test-metrx-top-metrics.js
- scripts/test-network.js
- scripts/test-odds-integration.js
- scripts/test-optimized-endpoints.js
- scripts/test-pipeline-integration.js
- scripts/test-pro-football-api.js
- scripts/test-rank-calibration.js
- scripts/test-rank-injection.js
- scripts/test-sports-live-rankings.js
- scripts/test-sportsapi-pro-football-adapter.js
- scripts/test-sportsapi-pro-football-joinability.js
- scripts/test-sportsapi-pro-football.js
- scripts/test-sportsrc-fixtures.js
- scripts/test-sportsrc-health.js
- scripts/test-sportsrc-odds.js
- scripts/test-telemetry-integration.js
- scripts/test-thesportsdb-endpoints.js
- scripts/test-weather-pipeline.js
- scripts/trace-data-flow.js
- scripts/trace-filtering-rules.js
- scripts/trace-filtering-timestamp.js

Evidence:
- B12 is defined as the SCRIPTS_TEST_DIAG_TRACE batch with 66 governed assets.
- B12 manifest rule selects scripts whose basename starts with test-, debug-, diagnose-, diagnostic-, examine-, or trace-, plus exact files: simulate-filtering.js, browser_console_test.js, smoke-test.js, and test_full_fallback_flow.js.
- Tracked-reference scan found package.json command exposure for scripts/smoke-test.js through npm test / test:smoke and scripts/test-antigravity.js through antigravity:test.
- AGENTS.md documents smoke/API testing as operator workflows, including scripts/smoke-test.js and scripts/test-api.js.
- Other B12 references found by tracked scan are governance/report/dependency-map references, not runtime/product imports.
- No B12 file is classified as active runtime/product code in this phase.
- B12 files are test, debug, diagnostic, examination, simulation, smoke, or trace operator assets; current-use outcome is MANUAL_USE.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B12 batch state not advanced in this patch.

## PHASE 3 - B13 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B13 / SCRIPTS_RUN_TRIGGER_SCHED
- Question: Is each B13 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 1
- INDIRECTLY_ACTIVE: 4
- MANUAL_USE: 15
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B13 ACTIVE assets:
- scripts/run-master-pipeline.js

B13 INDIRECTLY_ACTIVE assets:
- scripts/run-edgemind-judge.js
- scripts/run-stage1-math.js
- scripts/run-stage2-context.js
- scripts/run-stage3-volatility.js

B13 MANUAL_USE assets:
- scripts/_trigger-sync.js
- scripts/external-scheduler.js
- scripts/run-migration.js
- scripts/run-pipeline-from-context-pack.js
- scripts/run-pipeline.js
- scripts/run-scheduled-sync.js
- scripts/run-test.js
- scripts/scheduler.js
- scripts/start-rapidapi-cricket-mcp.js
- scripts/trigger-grade.js
- scripts/trigger-pipeline-sync.js
- scripts/trigger-publication.js
- scripts/trigger-refresh.js
- scripts/trigger-settlement.js
- scripts/wake-and-sync.js

Evidence:
- B13 is defined as the SCRIPTS_RUN_TRIGGER_SCHED batch with 20 governed assets.
- B13 manifest rule selects scripts whose basename starts with run- or trigger-, plus exact files: _trigger-sync.js, scheduler.js, external-scheduler.js, wake-and-sync.js, and start-rapidapi-cricket-mcp.js.
- Tracked-reference scan found backend/server-express.js references scripts/run-master-pipeline.js; therefore run-master-pipeline.js is currently active through backend runtime.
- scripts/run-master-pipeline.js invokes scripts/run-stage1-math.js, scripts/run-stage2-context.js, scripts/run-stage3-volatility.js, and scripts/run-edgemind-judge.js; therefore those four scripts are indirectly active through the active pipeline orchestrator.
- package.json exposes scripts/run-migration.js, scripts/run-pipeline-from-context-pack.js, scripts/trigger-grade.js, scripts/trigger-refresh.js, and scripts/trigger-settlement.js as npm operator commands.
- SKCS-KNOWLEDGE scheduled jobs documentation references scripts/external-scheduler.js and scripts/scheduler.js, but no active runtime/process-manager caller was proven in this phase.
- Remaining B13 references found by tracked scan are governance, report, dependency-map, archived-comparison, or operator documentation references.
- No deletion, merge, retirement, dependency/security, or source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B13 batch state not advanced in this patch.

## PHASE 3 - B14 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B14 / SCRIPTS_INGEST_ENRICH_SYNC_IMPORT
- Question: Is each B14 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO

Outcome summary:
- ACTIVE: 2
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 29
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B14 ACTIVE assets:
- scripts/fetch-live-fixtures.js
- scripts/populate_sports_data.py

B14 MANUAL_USE assets:
- scripts/backfill-direct1x2-final-fields.js
- scripts/backfill-fixture-ids.js
- scripts/backfill-football-context.js
- scripts/backfill-prediction-grading.js
- scripts/backfill-predictions-accuracy.js
- scripts/backfill-provider-event-id.js
- scripts/bridge-raw-predictions-for-grading.js
- scripts/bridge-to-final.sql
- scripts/brute-force-ingest.js
- scripts/compose-context-pack.js
- scripts/cricapi-cache-refresh.js
- scripts/discover-free-livescore-endpoints.js
- scripts/enrich-lineups.js
- scripts/enrich-team-form.js
- scripts/fetch-thesportsdb-day.js
- scripts/force-enrich-match.js
- scripts/import-f1-formula1db.js
- scripts/import-today-snapshot-pipeline.js
- scripts/investigate-football536-current-fixtures.js
- scripts/normalize-frontend-sports.js
- scripts/normalize-sport-values.js
- scripts/publish-cricbuzz-cricket.js
- scripts/publish-cricbuzz-direct-fixtures.js
- scripts/publish-prediction-76412.js
- scripts/py_verify_thesportsdb_coverage.py
- scripts/rebuild-canonical-from-api-sports.js
- scripts/simple-sync.js
- scripts/sync-bsd-enrichment.js
- scripts/sync-ucl-context.js

Evidence:
- B14 is defined as the SCRIPTS_INGEST_ENRICH_SYNC_IMPORT batch with 31 governed assets.
- B14 manifest rule selects scripts whose basename starts with backfill-, bridge-, brute-force, compose-, cricapi-, discover-, enrich-, fetch-, force-enrich-, import-, investigate-, normalize-, publish-, rebuild-, simple-sync, sync-, plus selected exact provider/verification assets.
- Tracked-reference scan found backend/server-express.js references scripts/fetch-live-fixtures.js for full pipeline sync; therefore scripts/fetch-live-fixtures.js is currently active through backend runtime.
- Tracked-reference scan found render.yaml startCommand uses python scripts/populate_sports_data.py; therefore scripts/populate_sports_data.py is currently active through deployment/process configuration.
- package.json exposes operator commands for scripts/backfill-football-context.js, scripts/backfill-prediction-grading.js, scripts/bridge-raw-predictions-for-grading.js, scripts/compose-context-pack.js, scripts/cricapi-cache-refresh.js, scripts/enrich-lineups.js, scripts/enrich-team-form.js, scripts/fetch-thesportsdb-day.js, scripts/sync-bsd-enrichment.js, and scripts/sync-ucl-context.js.
- scripts/backfill-prediction-grading.js invokes scripts/bridge-raw-predictions-for-grading.js, but the parent script is package/operator-driven rather than proven active runtime in this phase.
- Remaining B14 references found by tracked scan are governance, report, dependency-map, audit, documentation, archived-comparison, or operator references.
- No deletion, merge, retirement, dependency/security, or source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B14 batch state not advanced in this patch.

## PHASE 3 - B15 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B15 / SCRIPTS_MAINT_FIX_CLEANUP_MIGRATE
- Question: Is each B15 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 1
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 51
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B15 ACTIVE assets:
- scripts/requirements.txt

B15 MANUAL_USE assets:
- scripts/_bsd_league_inventory.json
- scripts/_local-rebuild.js
- scripts/add-cricket-rls-policies.sql
- scripts/add-event-columns.js
- scripts/analyze-postgres-tables.js
- scripts/analyze-supabase-tables-full.js
- scripts/analyze-supabase-tables.js
- scripts/analyze-supabase-visual.js
- scripts/build-acca.js
- scripts/build-sportsdb-config.js
- scripts/cleanup-competition-allowlists.js
- scripts/cleanup-duplicate-fallbacks.js
- scripts/cleanup-live-direct-duplicates.js
- scripts/cleanup-predictions.js
- scripts/cleanup-unknown-teams.js
- scripts/cleanup.js
- scripts/complete-phase1-testing.js
- scripts/complete-phase2-rules.js
- scripts/complete-phase3-predictions.js
- scripts/create-indexes.js
- scripts/create-migration-plan.js
- scripts/db-cleanup.js
- scripts/deployment_verification.js
- scripts/deployment-status.md
- scripts/fix-ai-predictions-endpoint.js
- scripts/fix-frontend-placeholders.js
- scripts/fix-json-simple.js
- scripts/fix-matches-structure.js
- scripts/fix-placeholders-and-insights.js
- scripts/fix-prediction-76412.js
- scripts/fix-remaining-json-issues.js
- scripts/fix-sport-data.js
- scripts/gulf_in_class_simulation.js
- scripts/hotfix-acca-rules.js
- scripts/implement-phase1-fixtures-corrected.js
- scripts/implement-phase1-fixtures.js
- scripts/implement-phase2-rules-conservative.js
- scripts/implement-phase2-rules.js
- scripts/implement-phase3-predictions.js
- scripts/install-local-git-hooks.js
- scripts/manual-grade.js
- scripts/map-table-dependencies.js
- scripts/purge-fallback-data.js
- scripts/quarantine-database.js
- scripts/render-api-deploy.js
- scripts/repair-unknown-team-names.js
- scripts/resolve-results.js
- scripts/safe-migration-plan.js
- scripts/supabase_health_check.js
- scripts/supabase-diagnostics.js
- scripts/track-prediction-accuracy.js

Evidence:
- B15 is defined as the SCRIPTS_MAINT_FIX_CLEANUP_MIGRATE batch with 52 governed assets.
- B15 manifest rule selects maintenance/fix/migration script basenames beginning with cleanup-, purge-, quarantine-, repair-, fix-, hotfix-, implement-, complete-phase, and add-, plus selected exact maintenance assets.
- Tracked deployment configuration in render.yaml uses scripts/requirements.txt through `pip install -r scripts/requirements.txt`; therefore scripts/requirements.txt is currently active through deployment/build configuration.
- package.json exposes scripts/build-sportsdb-config.js, scripts/track-prediction-accuracy.js, and scripts/install-local-git-hooks.js as npm operator commands.
- scripts/track-prediction-accuracy.js is an executable grading/accuracy utility with `require.main === module` entrypoint and exported functions, but no active runtime caller was proven in this phase.
- scripts/build-sportsdb-config.js is an executable configuration-generation utility that writes generated sports configuration output, but no active runtime caller was proven in this phase.
- scripts/install-local-git-hooks.js is explicitly local-machine setup tooling and says it is run once per clone through npm run install:hooks.
- Remaining B15 references found by tracked scan are governance, report, dependency-map, archived-comparison, or operator/maintenance references.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B15 batch state not advanced in this patch.
- GitHub vulnerability notice remains future dependency/security work and was not touched.

## PHASE 3 - B16 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B16 / DOCS_ROOT_MD_TXT
- Question: Is each B16 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 36
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B16 MANUAL_USE assets:
- AGENTS.md
- ARCHITECTURE_OVERVIEW.md
- COMPREHENSIVE_AUDIT_REPORT.md
- COMPREHENSIVE_FOOTBALL_RULES_REPORT.md
- CRON_SETUP.md
- DASHBOARD_QUICK_START.md
- DASHBOARD_REFACTOR_GUIDE.md
- DEEPSEEK_SESSION_SKCSTEST.txt
- DEEPSEEK_STATE.md
- DEPLOYMENT_STATUS.md
- DEPLOYMENT_VERIFICATION_GUIDE.md
- football-ecosystem-report.md
- FRONTEND_FIXES_SUMMARY.md
- FRONTEND_INVESTIGATION_REPORT.md
- FULL_WORKSPACE_AUDIT_REPORT.md
- GEMINI.md
- IMPLEMENTATION_GAP_ANALYSIS.md
- IMPLEMENTATION_SUMMARY.md
- MASTER_RULEBOOK_IMPLEMENTATION_GUIDE.md
- MIGRATION_FREEZE.md
- PRIVACY_POLICY.md
- README_DASHBOARD_REFACTOR.md
- README_DATA_INGESTION.md
- README.md
- requirements.txt
- runtime.txt
- SINGLE_USE_AUDIT_REPORT.md
- SKCS_MASTER_RULEBOOK.md
- SMB_WINDSURF_FINAL_IMPLEMENTATION.md
- SMB_WINDSURF_IMPLEMENTATION_PROMPT.md
- SPORT_CONSISTENCY_AUDIT_REPORT.md
- STRICT_RULES.md
- SUPABASE_DIAGNOSTIC_REPORT.md
- SUPABASE_TABLE_ANALYSIS.md
- SUPABASE_TABLES_SUMMARY.md
- TERMS_OF_SERVICE.md

Evidence:
- B16 is defined as the DOCS_ROOT_MD_TXT batch with 36 governed root documentation/text assets.
- B16 manifest rule selects root files with .md and .txt extensions, and the governed B16 asset list also includes root requirements.txt and runtime.txt.
- package.json starts the application through backend/server-express.js and exposes build/test/control/script commands, not B16 root documentation files.
- render.yaml starts the web service with node backend/server-express.js.
- render.yaml uses scripts/requirements.txt for the sports-fixture-population Python cron, not root requirements.txt.
- Root requirements.txt and runtime.txt exist as repository-level Python environment documents, but no active deployment, runtime, package-script, or process-manager caller was proven for them in this phase.
- PRIVACY_POLICY.md and TERMS_OF_SERVICE.md are root policy documents; public delivery uses separate public HTML surfaces, so the root markdown documents are manual/reference assets in this phase.
- AGENTS.md, GEMINI.md, DEEPSEEK_STATE.md, DEEPSEEK_SESSION_SKCSTEST.txt, SMB_WINDSURF_FINAL_IMPLEMENTATION.md, and SMB_WINDSURF_IMPLEMENTATION_PROMPT.md are operator/AI-assistant guidance or session/reference documents, not proven runtime assets.
- Remaining B16 references found by tracked scan are governance, report, documentation, audit, repository-index, or operator references.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence text and UTF-8 preservation repair only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B16 batch state not advanced in this patch.
- GitHub vulnerability notice remains future dependency/security work and was not touched.

## PHASE 3 - B17 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B17 / DOCS_DIR
- Question: Is each B17 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 24
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B17 MANUAL_USE assets:
- docs/acca_rules_v2.1.md
- docs/alert-routing-degraded-state.md
- docs/api_quota_router.md
- docs/blueprint-semantic-drift-control-plane.md
- docs/canonical_ingest_firewall.spec.md
- docs/control-plane-operational-pack.md
- docs/cricket-providers.md
- docs/DATA_INGESTION.md
- docs/DEPLOYMENT_GUIDE.md
- docs/football-leagues-apisports.md
- docs/pipeline-health-feed.md
- docs/provider-discovery/free-livescore-api.md
- docs/providers/live-football-api-policy.md
- docs/README.md
- docs/runbook_degraded_states.md
- docs/SKCS_ENGINE_V2_ADR.md
- docs/SKCS_ENGINE_V2_PHASE0_DESIGN.md
- docs/SKCS_ENGINE_V2_PHASE05_INGEST_MAP.md
- docs/SKCS_ENGINE_V2_PHASE0B5_REPLAY.md
- docs/skcs_grading_snapshot_v1.spec.md
- docs/sportsdataio-pre-match-directive.md
- docs/supabase-tier-display-requirements.md
- docs/VERCEL_DEPLOY_TROUBLESHOOTING.md
- docs/weekly-global-scrape-scheduler.md

Evidence:
- B17 is defined as the DOCS_DIR batch with 24 governed assets under docs/.
- package.json starts the application through backend/server-express.js and exposes build, test, control, audit, sync, trigger, verification, and script commands outside docs/.
- render.yaml starts the web service through backend/server-express.js and cron services through backend/scripts paths, not docs/.
- Repository search found docs/ references as documentation, specification, governance, runtime-map, audit, or reference links rather than active runtime process targets.
- No B17 asset is a deployment entrypoint, package-script target, server import target, cron command, build command, or active runtime dependency proven in this phase.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B17 batch state not advanced in this patch.
- GitHub vulnerability notice remains future dependency/security work and was not touched.

## PHASE 3 - B18 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B18 / SKCS_KNOWLEDGE_GOV_AND_AUDIT
- Question: Is each B18 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 23
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B18 MANUAL_USE assets:
- SKCS-KNOWLEDGE/audit/column_dependency_matrix.md
- SKCS-KNOWLEDGE/audit/cron_provider_runtime_map.md
- SKCS-KNOWLEDGE/audit/gap_report.md
- SKCS-KNOWLEDGE/audit/knowledge_layer_completeness_audit.md
- SKCS-KNOWLEDGE/audit/migration_history.md
- SKCS-KNOWLEDGE/audit/observability_registry.md
- SKCS-KNOWLEDGE/audit/prediction_dependency_audit.md
- SKCS-KNOWLEDGE/audit/runtime_consumer_audit_v2.md
- SKCS-KNOWLEDGE/audit/runtime_consumer_audit.md
- SKCS-KNOWLEDGE/audit/schema_drift_log.md
- SKCS-KNOWLEDGE/audit/technical_debt.md
- SKCS-KNOWLEDGE/audit/undocumented_assets.md
- SKCS-KNOWLEDGE/audit/verification_runtime_audit.md
- SKCS-KNOWLEDGE/governance/ai_usage_policy.md
- SKCS-KNOWLEDGE/governance/bigballs_evaluation_focus.md
- SKCS-KNOWLEDGE/governance/bsd_governance_hold.md
- SKCS-KNOWLEDGE/governance/bsd_provider_suitability_scorecard.md
- SKCS-KNOWLEDGE/governance/documentation_policy.md
- SKCS-KNOWLEDGE/governance/feature_risk_registry.md
- SKCS-KNOWLEDGE/governance/naming_standards.md
- SKCS-KNOWLEDGE/governance/edge_asset_work_sequence_policy.md
- SKCS-KNOWLEDGE/governance/provider_scorecard_bsd.md
- SKCS-KNOWLEDGE/governance/verification_layer_spec.md

Evidence:
- B18 is defined as the SKCS_KNOWLEDGE_GOV_AND_AUDIT batch with 23 governed assets under SKCS-KNOWLEDGE/audit/ and SKCS-KNOWLEDGE/governance/.
- The B18 assets are audit, governance, policy, scorecard, registry, drift, runtime-audit, and documentation-control markdown records.
- package.json starts the application through backend/server-express.js and exposes build, test, control, audit, sync, trigger, verification, and script commands outside the B18 knowledge paths.
- render.yaml starts the web service through backend/server-express.js and cron services through backend/scripts or scripts paths, not B18 knowledge paths.
- Repository search found B18 references as documentation, governance, runtime-map, inventory, audit, or repository-index references rather than active runtime process targets.
- No B18 asset is a deployment entrypoint, package-script target, server import target, cron command, build command, or active runtime dependency proven in this phase.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B18 batch state not advanced in this patch.
- GitHub vulnerability notice remains future dependency/security work and was not touched.

## PHASE 3 - B19 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B19 / SKCS_KNOWLEDGE_KNOWLEDGE
- Question: Is each B19 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 17
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B19 MANUAL_USE assets:
- SKCS-KNOWLEDGE/knowledge/api_registry.md
- SKCS-KNOWLEDGE/knowledge/architecture_decisions.md
- SKCS-KNOWLEDGE/knowledge/business_rules.md
- SKCS-KNOWLEDGE/knowledge/cost_registry.md
- SKCS-KNOWLEDGE/knowledge/database_schema.md
- SKCS-KNOWLEDGE/knowledge/dependency_registry.md
- SKCS-KNOWLEDGE/knowledge/edge_functions.md
- SKCS-KNOWLEDGE/knowledge/formula_registry.md
- SKCS-KNOWLEDGE/knowledge/glossary.md
- SKCS-KNOWLEDGE/knowledge/pipeline_metrics_registry.md
- SKCS-KNOWLEDGE/knowledge/provider_registry.md
- SKCS-KNOWLEDGE/knowledge/scheduled_jobs.md
- SKCS-KNOWLEDGE/knowledge/semantic_field_mapping_registry.md
- SKCS-KNOWLEDGE/knowledge/semantic_violation_log.md
- SKCS-KNOWLEDGE/knowledge/system_topology.md
- SKCS-KNOWLEDGE/knowledge/views_and_materialized_views.md
- SKCS-KNOWLEDGE/README.md

Evidence:
- B19 is defined as the SKCS_KNOWLEDGE_KNOWLEDGE batch with 17 governed assets under SKCS-KNOWLEDGE/knowledge/ plus SKCS-KNOWLEDGE/README.md.
- The B19 assets are knowledge-layer registry, glossary, architecture, dependency, provider, schema, topology, scheduled-job, formula, semantic-mapping, semantic-violation, and README documentation records.
- package.json has no SKCS-KNOWLEDGE or knowledge-path entrypoint reference for B19.
- render.yaml has no SKCS-KNOWLEDGE or knowledge-path service, cron, or deployment command reference for B19.
- Repository search found B19 references mainly in Control Center governance files, the repository asset map/register, execution-spine reports, audit documents, provider directive documentation, and knowledge completeness references.
- No B19 asset is a deployment entrypoint, package-script target, server import target, cron command, build command, or active runtime dependency proven in this phase.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B19 batch state not advanced in this patch.
- GitHub Dependabot branch notice remains future dependency/security work and was not touched.

## PHASE 3 - B20 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B20 / SKCS_KNOWLEDGE_PROVIDERS
- Question: Is each B20 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 18
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B20 MANUAL_USE assets:
- SKCS-KNOWLEDGE/providers/bigballs_discovery_audit.md
- SKCS-KNOWLEDGE/providers/bigballs_endpoint_catalog.md
- SKCS-KNOWLEDGE/providers/bigballs_primary_assessment.md
- SKCS-KNOWLEDGE/providers/bigballs_provider_health.md
- SKCS-KNOWLEDGE/providers/bigballs_semantic_mapping.md
- SKCS-KNOWLEDGE/providers/bsd_coverage_audit.md
- SKCS-KNOWLEDGE/providers/bsd_endpoint_catalog.md
- SKCS-KNOWLEDGE/providers/bsd_league_inventory.md
- SKCS-KNOWLEDGE/providers/bsd_provider_health.md
- SKCS-KNOWLEDGE/providers/bsd_readiness_assessment.md
- SKCS-KNOWLEDGE/providers/bsd_semantic_mapping.md
- SKCS-KNOWLEDGE/providers/bzzoiro_discovery_audit.md
- SKCS-KNOWLEDGE/providers/bzzoiro_field_audit.md
- SKCS-KNOWLEDGE/providers/bzzoiro_provider_mapping.md
- SKCS-KNOWLEDGE/providers/soccerdata_call_restrictions.md
- SKCS-KNOWLEDGE/providers/soccerdata_endpoint_catalog.md
- SKCS-KNOWLEDGE/providers/soccerdata_notebooklm_synthesis.md
- SKCS-KNOWLEDGE/providers/soccerdata_provider_health.md

Evidence:
- B20 is defined as the SKCS_KNOWLEDGE_PROVIDERS batch with 18 governed provider knowledge assets under SKCS-KNOWLEDGE/providers/.
- The B20 assets are provider discovery, endpoint catalog, provider-health, readiness, coverage, league-inventory, field-audit, semantic-mapping, call-restriction, and synthesis documentation records.
- package.json has no application start, deployment start, build, cron, or production runtime command using the B20 markdown assets as runtime inputs.
- render.yaml has no SKCS-KNOWLEDGE/providers service, cron, or deployment command reference for B20.
- Repository search found B20 references mainly in Control Center governance files, the repository asset map/register, previous duplicate-hash evidence, and provider documentation references.
- SKCS-KNOWLEDGE/providers/bsd_league_inventory.md has a manual audit/update relationship with scripts/audit-bsd-league-inventory.js.
- package.json exposes scripts/audit-bsd-league-inventory.js through the manual command audit:bsd-league-inventory.
- scripts/audit-bsd-league-inventory.js describes itself as read-only and states that it does not touch prediction pipelines.
- No B20 asset is a deployment entrypoint, server import target, cron command, build command, or active runtime dependency proven in this phase.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B20 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B21 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B21 / PUBLIC_UI
- Question: Is each B21 governed file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- UI repair performed: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 64
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 0
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B21 ACTIVE assets:
- public/about-bg.jpg
- public/about-bg.webp
- public/accuracy.html
- public/admin-sync.html
- public/components/HeroCarousel.jsx
- public/components/TrendDashboard.jsx
- public/control-center.html
- public/css/control-center.css
- public/css/hero-carousel.css
- public/css/input.css
- public/css/output.css
- public/css/react-components.css
- public/data/all_leagues_raw.json
- public/data/all_sports_raw.json
- public/data/context-pack-2026-05-17.json
- public/data/event-details-cache.json
- public/data/h2h-2026-05-17.json
- public/data/importance-2026-05-17.json
- public/data/injuries-2026-05-17.json
- public/data/news-injury-cache.json
- public/data/pipeline-dry-2026-05-17.json
- public/data/standings-cache.json
- public/data/team-form-2026-05-17.json
- public/data/team-form-cache.json
- public/data/travel-2026-05-17.json
- public/data/tsdb-coverage-2026-05-17.json
- public/data/tsdb-coverage-2026-05-18.json
- public/data/tsdb-coverage-2026-05-19.json
- public/data/tsdb-day-2026-05-17.json
- public/data/vip-stress-saturday.json
- public/direct-markets.html
- public/experience.html
- public/favicon.ico
- public/hero-page.jpg
- public/hero-page.webp
- public/index.html
- public/js/acca-builder.js
- public/js/ai-reasoning-display.js
- public/js/config.js
- public/js/control-center.js
- public/js/doubleChanceCombos.js
- public/js/hero-carousel.js
- public/js/semantic-drift-dashboard.js
- public/js/smh-hub-master-rulebook.js
- public/js/smh-hub.js
- public/js/supabase-bundle.js
- public/js/supabase-init.js
- public/js/system-health-banner.js
- public/js/user-experience-feedback.js
- public/js/vip-stress-dashboard.js
- public/language-switch.html
- public/language.jpg
- public/login.html
- public/login.jpg
- public/market-explorer.html
- public/payment.html
- public/privacy.html
- public/robots.txt
- public/style.css
- public/subscribe/index.html
- public/subscription.html
- public/terms.html
- public/vip-stress-dashboard.html
- public/windrawwin.jpg

Evidence:
- B21 is defined as the PUBLIC_UI batch with 64 governed public UI, static asset, generated public data, frontend script, CSS, image, and route/page files under public/.
- All 64 B21 assets exist in the current working tree.
- backend/server-express.js defines PUBLIC_DIR as the repository public directory and serves it through express.static(PUBLIC_DIR).
- package.json starts the application through node backend/server-express.js.
- render.yaml starts the web service through node backend/server-express.js.
- package.json also builds public/js/supabase-bundle.js and public/css/output.css from tracked frontend sources.
- B21 includes HTML page entrypoints, browser-delivered JavaScript, CSS, images, generated public JSON/data cache files, robots.txt, and subscription/public route files.
- Repository reference inspection found direct UI/runtime/build/governance references across server static delivery, package scripts, render service startup, frontend links/scripts/fetches, Control Center governance files, execution-spine reports, and historical audit records.
- Static public serving proves these files are currently browser-deliverable from the active web service boundary.
- This phase does not determine whether any public route is desirable, current product UX, legacy, duplicated, or safe to retire; those are future phase questions.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B21 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B22 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B22 / SUPABASE_MIGRATIONS
- Question: Is each B22 governed Supabase migration file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Schema change performed: NO
- Migration execution performed: NO
- Supabase mutation performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 61
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B22 MANUAL_USE assets:
- supabase/migrations/20260415000001_create_insight_usage.sql
- supabase/migrations/20260418000002_update_predictions_final_risk_level_check.sql
- supabase/migrations/20260501_skcs_comprehensive_engine.sql
- supabase/migrations/20260512000001_create_canonical_bookmakers.sql
- supabase/migrations/20260512000002_add_odds_to_match_context.sql
- supabase/migrations/20260512000003_create_sport_sync_table.sql
- supabase/migrations/20260512000004_create_upsert_raw_fixture_rpc.sql
- supabase/migrations/20260512000005_create_context_enrichment_trigger.sql
- supabase/migrations/20260512000006_create_fixture_processing_log.sql
- supabase/migrations/20260512000007_create_admin_views.sql
- supabase/migrations/20260512000008_create_event_odds_snapshots.sql
- supabase/migrations/20260512000009_create_get_prediction_rpc.sql
- supabase/migrations/20260512000010_populate_sport_sync.sql
- supabase/migrations/20260512000012_create_get_prediction_function.sql
- supabase/migrations/20260512000013_disable_rls_match_context.sql
- supabase/migrations/20260522000001_add_watchlist_column.sql
- supabase/migrations/20260522000002_add_sport_to_tier_rules.sql
- supabase/migrations/20260523000001_drop_insight_usage.sql
- supabase/migrations/20260524000001_remove_dev_rls_policies.sql
- supabase/migrations/20260524000002_create_upsert_canonical_event_rpc.sql
- supabase/migrations/20260531000001_skcs_engine_v2_phase0_identity.sql
- supabase/migrations/20260531000002_skcs_engine_v2_phase0b_match_results.sql
- supabase/migrations/20260617_add_market_tier.sql
- supabase/migrations/20260619000001_rename_predictions_final_to_direct1x2.sql
- supabase/migrations/20260619000002_align_direct1x2_columns.sql
- supabase/migrations/20260619000003_direct1x2_risk_tier_and_secondary_markets.sql
- supabase/migrations/20260621000001_enforce_league_country_on_direct_matches.sql
- supabase/migrations/20260701000001_normalize_sport_names.sql
- supabase/migrations/20260717000001_create_f1_schema.sql
- supabase/migrations/20260718000001_db_rule_alignment_75_55_30.sql
- supabase/migrations/20260820000001_rename_risk_tiers_and_safe_haven.sql
- supabase/migrations/20260820000002_fix_secondary_governance_80_75.sql
- supabase/migrations/20260822000001_add_partitioning.sql
- supabase/migrations/20260822000002_create_relational_odds_tables.sql
- supabase/migrations/20260822000002a_create_relational_tables.sql
- supabase/migrations/20260822000002b_create_relational_indexes.sql
- supabase/migrations/20260822000002c_create_relational_functions_triggers.sql
- supabase/migrations/20260822000002d_create_relational_views.sql
- supabase/migrations/20260822000003_normalize_prediction_tables.sql
- supabase/migrations/20260822000003a_create_prediction_tables.sql
- supabase/migrations/20260822000003b_create_prediction_indexes.sql
- supabase/migrations/20260822000003c_create_prediction_functions_triggers.sql
- supabase/migrations/20260822000003d_create_prediction_views.sql
- supabase/migrations/20260822000004_create_materialized_admin_views.sql
- supabase/migrations/20260822000005_skcs_engine_v2_engine_core.sql
- supabase/migrations/20260822000006_ai_governance_telemetry.sql
- supabase/migrations/20260822000007_ai_governance_rls_policies.sql
- supabase/migrations/20260822000008_service_role_rls_policies.sql
- supabase/migrations/20260822000009_public_read_config_rls_policies.sql
- supabase/migrations/20260822000010_public_read_reference_rls.sql
- supabase/migrations/20260822000011_system_health_state.sql
- supabase/migrations/20260822000012_semantic_violations.sql
- supabase/migrations/20260822000013_semantic_violation_summary.sql
- supabase/migrations/20260822000014_system_health_state_contract.sql
- supabase/migrations/20260902000000_pipeline_health_feed.sql
- supabase/migrations/20261001000000_runtime_truth_mirror.sql
- supabase/migrations/20261005000000_runtime_truth_mirror_alignment.sql
- supabase/migrations/20261005000001_fix_calculate_team_strength_ambiguity.sql
- supabase/migrations/20261006000000_sportsdataio_contract_alignment.sql
- supabase/migrations/20261006000001_canonical_events.sql
- supabase/migrations/20261007000000_user_experience_feedback.sql

Evidence:
- B22 is defined as the SUPABASE_MIGRATIONS batch with 61 governed SQL migration assets under supabase/migrations/.
- The active application start path is package.json start -> node backend/server-express.js.
- Render web deployment starts node backend/server-express.js and does not execute B22 migrations as part of the web start command.
- Render cron commands in render.yaml do not execute B22 migration files.
- scripts/run-migration.js is a manual migration runner that reads SQL files from supabase/migrations by filename; it also has default migration names from B22.
- package.json exposes db:migrate:rules as a manual command for one B22 migration: 20260820000002_fix_secondary_governance_80_75.sql.
- scripts/apply-migrations.js is a manual migration application script that reads supabase/migrations and filters 20260822 migration files.
- SKCS-KNOWLEDGE/knowledge/database_schema.md treats supabase/migrations/ as schema inventory evidence.
- .githooks/pre-commit includes supabase/migrations/* in the local Master Rulebook guard scope.
- B22 migration files are database schema/change-history assets, not server runtime entrypoints, browser assets, active cron entrypoints, or deployed product code entrypoints.
- This phase does not determine whether any migration has already been applied, should be reapplied, is superseded, is safe to retire, or matches the live Supabase database. Those are future database/schema governance questions.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change, schema change, migration execution, or Supabase mutation is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B22 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B23 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS WITH ABSENT-PATH NOTE

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B23 / DB_SQL_AND_SUPABASE_OTHER
- Question: Is each B23 governed SQL / Supabase non-migration asset currently used?
- Deletion/merge/retirement/refactor performed: NO
- Schema execution performed: NO
- Supabase mutation performed: NO
- Function deployment performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 1
- MANUAL_USE: 18
- NO_CURRENT_USE_FOUND: 1
- UNKNOWN: 0

B23 INDIRECTLY_ACTIVE assets:
- supabase/edge-functions/scheduledFixtureSync/index.ts

B23 MANUAL_USE assets:
- sql/acca_rules.sql
- sql/day_zero_subscription.sql
- sql/extreme_smb_data.sql
- sql/fix_rls_policies.sql
- sql/market_correlations_schema.sql
- sql/master_rulebook_triggers.sql
- sql/monitoring_tables.sql
- sql/performance_optimizations.sql
- sql/rapidapi_cache.sql
- sql/schema_refactor.sql
- sql/supabase_test_user_reset_and_seed.sql
- sql/supabase_test_user_seed_access.sql
- sql/tables.sql
- sql/tier_rules.sql
- supabase/edge-functions/scheduled-fixture-sync/index.ts
- supabase/functions/scheduled-prediction-refresh/index.ts
- supabase/functions/semantic-drift-summary/index.ts
- supabase/schema/ai_pipeline_schema.sql

B23 NO_CURRENT_USE_FOUND assets:
- supabase/functions/sync-sports-data/index.ts

Evidence:
- B23 is defined as DB_SQL_AND_SUPABASE_OTHER with 20 governed SQL / Supabase non-migration assets.
- The 14 sql/*.sql files are manual database/schema/admin SQL assets, not active Node runtime imports, browser-delivered assets, Render start commands, or active cron entrypoints.
- sql/tier_rules.sql also has manual audit-tool evidence through scripts/audit-football-rules-alignment.js, which reads sql/tier_rules.sql for drift comparison.
- supabase/edge-functions/scheduledFixtureSync/index.ts is indirectly active because backend/routes/scheduler.js calls ${SUPABASE_URL}/functions/v1/scheduledFixtureSync, and backend/server-express.js mounts schedulerRouter at /api/scheduler.
- supabase/edge-functions/scheduled-fixture-sync/index.ts is manual/external-scheduler related: scripts/run-scheduled-sync.js builds a scheduled-fixture-sync function URL, but no active package start, Render start command, or mounted backend route was found executing that script during app startup.
- supabase/functions/scheduled-prediction-refresh/index.ts is a standalone Supabase function source describing scheduled prediction refresh behavior; no active package start, Render start command, or mounted backend route was found executing it during app startup.
- supabase/functions/semantic-drift-summary/index.ts is a standalone Supabase function source. The active backend semantic drift path is backend/routes/semanticDrift.js -> backend/services/semanticDriftSummaryService.js, mounted by backend/server-express.js at /api/semantic-drift-summary; that active path uses the backend service and database RPC rather than invoking the Supabase function file.
- supabase/functions/sync-sports-data/index.ts is still listed in the B23 manifest but is absent from GitHub main / current tracked source, so no current use can be found for that path in this phase.
- supabase/schema/ai_pipeline_schema.sql is manual schema reference material, not an active runtime entrypoint.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change, schema execution, Supabase mutation, or function deployment is authorized by this evidence.
- The absent sync-sports-data manifest/register condition is a future governance cleanup item only; it is not repaired during Phase 3 B23.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B23 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B24 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B24 / TESTS
- Question: Is each B24 governed test file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Test rewrite performed: NO
- Runtime/product change performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 6
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B24 MANUAL_USE assets:
- tests/edge-asset-classification.test.js
- tests/edge-control-center-ledger.test.js
- tests/edge-control-center-ui.test.js
- tests/edge-project-register.test.js
- tests/edge-repository-asset-register.test.js
- tests/edge-system-runtime-inventory.test.js

Evidence:
- B24 is defined as the TESTS batch with 6 governed test files under tests/.
- package.json exposes test:asset-classification for tests/edge-asset-classification.test.js.
- package.json exposes test:control-center for tests/edge-control-center-ledger.test.js, tests/edge-project-register.test.js, and tests/edge-repository-asset-register.test.js.
- package.json exposes test:control-center-ui for tests/edge-control-center-ui.test.js.
- tests/edge-system-runtime-inventory.test.js is a manual Node test file using node:test and importing control-center/check_edge_system_runtime_inventory.js.
- package.json control:verify runs the control-center validation suite, but does not make these test files runtime entrypoints for the deployed product.
- B24 files are validation/test assets, not active server startup files, browser-delivered assets, Render start commands, cron commands, schema execution files, or Supabase mutation files.
- No deletion, merge, retirement, dependency/security, vulnerability, test rewrite, source/runtime/product change, or test-suite restructuring is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B24 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B25 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B25 / SCRATCH
- Question: Is each B25 governed scratch file currently used?
- Deletion/merge/retirement/refactor performed: NO
- Script execution performed: NO
- Database mutation performed: NO
- Runtime/product change performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 2
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B25 MANUAL_USE assets:
- scratch/db_normalize.js
- scratch/db_sync.js

Evidence:
- B25 is defined as the SCRATCH batch with 2 governed scratch files: scratch/db_normalize.js and scratch/db_sync.js.
- scratch/db_normalize.js is a manual database normalization utility. It imports backend/database and performs UPDATE statements against predictions_raw, leagues, and match_context_data.
- scratch/db_sync.js is a manual database inspection utility. It imports backend/database and reads distinct sport values from predictions_raw and leagues.
- package.json active app startup is node backend/server-express.js; B25 scratch files are not active startup entrypoints.
- No package.json npm script was found that runs scratch/db_normalize.js or scratch/db_sync.js.
- B25 files are manual/admin scratch utilities, not deployed product runtime entrypoints, browser-delivered assets, Render start commands, cron commands, schema migration files, or Supabase function deployment files.
- Because scratch/db_normalize.js can mutate database rows, this phase does not execute either B25 file.
- No deletion, merge, retirement, dependency/security, vulnerability, source/runtime/product change, database mutation, or scratch cleanup is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No active-use outcome authorizes deletion.
- B25 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B26 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B26 / DEPLOYMENT_CI
- Question: Is each B26 governed deployment/CI asset currently used?
- Deletion/merge/retirement/refactor performed: NO
- Deployment config change performed: NO
- Render change performed: NO
- Vercel change performed: NO
- Docker build performed: NO
- Runtime/product change performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 2
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 1
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B26 ACTIVE assets:
- render.yaml
- vercel.json

B26 MANUAL_USE assets:
- Dockerfile

Evidence:
- B26 is defined as DEPLOYMENT_CI with 3 governed assets: Dockerfile, render.yaml, and vercel.json.
- render.yaml is active deployment configuration evidence. It defines the Render web service, Node environment, buildCommand, startCommand, healthCheckPath, autoDeploy setting, environment variables, and cron services.
- render.yaml starts the active web app with node backend/server-express.js and defines Render cron start commands for deploy-trigger jobs and fixture population.
- vercel.json is active deployment configuration evidence. It defines Vercel version/framework behavior, installCommand, buildCommand, outputDirectory, function duration config, headers, cron path, and rewrites.
- Dockerfile is container deployment material. It defines a Node 20 Alpine image, installs production dependencies, exposes PORT 8080, and starts node backend/server-express.js.
- Current repo deployment evidence does not show Render using Dockerfile: render.yaml declares env: node and startCommand: node backend/server-express.js.
- Dockerfile is therefore treated as MANUAL_USE / deployment-capable material in this phase, not as an active deployment entrypoint.
- No deletion, merge, retirement, dependency/security, vulnerability, deployment config change, Render change, Vercel change, Docker build, source/runtime/product change, or deployment cleanup is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No deployment configuration files changed.
- No active-use outcome authorizes deletion.
- B26 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B27 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B27 / ARCHIVE
- Question: Is each B27 governed archived asset currently used?
- Deletion/merge/retirement/refactor performed: NO
- Restore performed: NO
- Archived script execution performed: NO
- Database mutation performed: NO
- Deployment change performed: NO
- Runtime/product change performed: NO
- Phase 1 reopened: NO
- Phase 2 reopened: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 0
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 58
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B27 MANUAL_USE assets:
- _archive/root/cli_v1.1.0.exe
- _archive/root/render.zip
- _archive/scripts/analyze-routes.js
- _archive/scripts/analyze-table-usage.js
- _archive/scripts/check-confidence.js
- _archive/scripts/check-connectivity.js
- _archive/scripts/check-constraints.js
- _archive/scripts/check-deployment.js
- _archive/scripts/check-direct-predictions.js
- _archive/scripts/check-endpoints.js
- _archive/scripts/check-final-schema.js
- _archive/scripts/check-final-sports.js
- _archive/scripts/check-matches.js
- _archive/scripts/check-metadata-times.js
- _archive/scripts/check-risk-constraint.js
- _archive/scripts/check-schema.js
- _archive/scripts/check-stage-schemas.js
- _archive/scripts/check-supabase-tables.js
- _archive/scripts/check-team-names.js
- _archive/scripts/cors-test.sh
- _archive/scripts/debug-events.js
- _archive/scripts/debug-sport-filter.js
- _archive/scripts/deep-table-analysis.js
- _archive/scripts/definitive-cors-diagnosis.sh
- _archive/scripts/deploy-cloud-scheduler.sh
- _archive/scripts/deploy-render.sh
- _archive/scripts/file-walker.js
- _archive/scripts/files-report.json
- _archive/scripts/final-status.js
- _archive/scripts/final-verification.js
- _archive/scripts/fix-matches-timestamps.sql
- _archive/scripts/fix-sport-filter.js
- _archive/scripts/fix-tier-rules.js
- _archive/scripts/fix-view.js
- _archive/scripts/fix-view.sql
- _archive/scripts/full-nuke.js
- _archive/scripts/migration2-fix.js
- _archive/scripts/migration2-normalized-fixtures.js
- _archive/scripts/migration2-v2.js
- _archive/scripts/migration2-v3.js
- _archive/scripts/normalize-sports.sql
- _archive/scripts/patch-other-routes.js
- _archive/scripts/patch-predictions-visibility.js
- _archive/scripts/phase1-immediate-patch.js
- _archive/scripts/phase1-patch.js
- _archive/scripts/phase2-schema-refactor.js
- _archive/scripts/phase3-cleanup.js
- _archive/scripts/sql/create_event_context_tables.sql
- _archive/scripts/sql/create_prediction_publish_runs.sql
- _archive/scripts/sql/create_predictions_accuracy.sql
- _archive/scripts/test-scheduler-endpoint.sh
- _archive/scripts/trigger-grade.js
- _archive/scripts/trigger-refresh.js
- _archive/scripts/trigger-render-pipeline.js
- _archive/scripts/verify-deployment.sh
- _archive/scripts/verify-predictions.js
- _archive/scripts/verify-route-patches.js
- _archive/scripts/wipe-events-data.js

Evidence:
- B27 is defined as the ARCHIVE batch with 58 governed paths under _archive/.
- B27 assets include archived root artifacts, archived JavaScript utilities, archived shell scripts, archived SQL files, archived reports, and old trigger/verification utilities.
- package.json active app startup is node backend/server-express.js; B27 archive files are not package startup entrypoints.
- render.yaml active web startup is node backend/server-express.js; B27 archive files are not Render web start commands.
- Repository search evidence found _archive/ references in governance/audit files rather than active startup surfaces.
- B27 assets are treated as manual archive / historical reference material in this phase, not active runtime assets.
- Some B27 files appear to be old patch, migration, cleanup, wipe, deployment, and verification utilities. This phase does not execute any archived script or SQL file.
- No deletion, merge, retirement, dependency/security, vulnerability, restore, source/runtime/product change, database mutation, deployment change, archive cleanup, or historical-evidence cleanup is authorized by this evidence.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed.
- No archived file executed.
- No active-use outcome authorizes deletion.
- B27 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B28 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batch: B28 / ROOT_NON_MD_TXT_FILES
- Deletion/merge/retirement/refactor performed: NO
- Script execution performed: NO
- Database mutation performed: NO
- Deployment change performed: NO
- Runtime/product change performed: NO
- Dependency/security/vulnerability notice work performed: NO

Outcome summary:
- ACTIVE: 5
- INDIRECTLY_ACTIVE: 0
- MANUAL_USE: 50
- NO_CURRENT_USE_FOUND: 0
- UNKNOWN: 0

B28 ACTIVE assets:
- .gitignore
- .vercelignore
- package-lock.json
- package.json
- tailwind.config.js

B28 MANUAL_USE summary:
- Remaining 50 B28 root non-MD/TXT assets are manual utility, report, config, launcher, SQL/reference, standalone HTML, or diagnostic assets.

Evidence:
- B28 manifest validation confirmed 55 governed root non-MD/TXT assets.
- ACTIVE assets are limited to Git/Vercel/npm/Tailwind configuration currently used by repository, build, install, or deployment workflows.
- Root scripts, reports, diagnostics, launchers, SQL/reference files, and standalone root HTML are manual-use assets in this phase.
- No root script, SQL file, deployment action, database action, or cleanup action was executed.
- No active-use outcome authorizes deletion.

Validation boundary:
- Evidence only.
- No source/runtime/product files changed except this Control Center evidence append.
- B28 batch state not advanced in this patch.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

## PHASE 3 - B29 ACTIVE USE IDENTIFICATION EVIDENCE

Result: PASS

Scope: PHASE_3 / B29 / DOT_TOOL_DIRS_AND_SMALL_DIRS. Evidence only. No deletion, merge, refactor, script execution, SQL, deployment, database, runtime/product, dependency/security, or vulnerability work performed.

Outcome summary: ACTIVE 3; INDIRECTLY_ACTIVE 0; MANUAL_USE 23; NO_CURRENT_USE_FOUND 0; UNKNOWN 0.

B29 ACTIVE assets: .githooks/pre-commit; api/pipeline/run-full.js; js/supabase-client-src.js.

B29 MANUAL_USE summary: Remaining 23 assets are tool config, assistant/workflow config, local database/session material, Dolphin reference material, governance reports, placeholder/data files, temp snapshots, or non-startup JS/reference material.

Evidence: B29 manifest validation confirmed 26 governed assets. .githooks/pre-commit is active local commit-guard material. api/pipeline/run-full.js is active API route material. js/supabase-client-src.js is active build input for package.json build:supabase. No B29 cleanup or execution is authorized by this evidence.

Validation boundary: Evidence only. No active-use outcome authorizes deletion. B29 batch state not advanced. GitHub vulnerability and Dependabot notices remain future dependency/security work.

## PHASE 3 - ACTIVE USE IDENTIFICATION - CLOSED

Result: PASS

Scope:
- Phase: PHASE_3 - Active Use Identification
- Batches closed: B01-B29
- Closure HEAD before roll-up: 0a2fa88c
- Closure source: Control Center recorded batch evidence
- Deletion/merge/retirement/refactor performed: NO
- Script execution performed except approved guards/checks: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Runtime/product change performed: NO
- Dependency/security/vulnerability notice work performed: NO

Final outcome summary:
- ACTIVE: 244
- INDIRECTLY_ACTIVE: 5
- MANUAL_USE: 629
- NO_CURRENT_USE_FOUND: 25
- UNKNOWN: 0
- Total governed batch entries covered: 903

Closure evidence:
- Phase 3 reviewed active-use status across B01-B29.
- All batches have recorded Control Center evidence.
- ACTIVE and INDIRECTLY_ACTIVE outcomes identify current or derived use only.
- MANUAL_USE identifies operator, governance, documentation, archive, migration, test, scratch, deployment-capable, or reference use.
- NO_CURRENT_USE_FOUND does not authorize deletion.
- UNKNOWN is 0 at closure.
- B23 includes an absent-path note for supabase/functions/sync-sports-data/index.ts; this remains future governance cleanup only.
- GitHub vulnerability and Dependabot notices remain future dependency/security work and were not touched.

Validation boundary:
- Evidence-only closure roll-up.
- No active-use outcome authorizes deletion, merge, retirement, refactor, source change, runtime change, product change, SQL execution, deployment change, database mutation, Supabase mutation, dependency update, or vulnerability remediation.
- Phase 3 is closed.
- Do not begin Phase 4 without explicit Control Center activation.

## PHASE 4 - LEGACY AND REPLACEMENT IDENTIFICATION - ACTIVATED

Result: ACTIVE

Activation scope:
- Phase: PHASE_4 - Legacy and Replacement Identification
- Activation HEAD: e11785f9
- Previous phase: PHASE_3 - Active Use Identification
- Previous phase status: CLOSED
- Activation type: Control Center activation only
- Batch inspection begun by this activation: NO
- Deletion/merge/retirement/refactor authorized by this activation: NO
- Source/runtime/product change authorized by this activation: NO
- SQL execution authorized by this activation: NO
- Deployment change authorized by this activation: NO
- Database/Supabase mutation authorized by this activation: NO
- Dependency/security/vulnerability remediation authorized by this activation: NO

Objective:
Identify which governed assets are current, legacy, superseded, replaced, parallel, historical evidence, or unknown based on repository evidence only.

Allowed work:
- Inspect governed asset evidence.
- Record Phase 4 legacy/replacement findings in the Control Center.
- Run approved local guards/checks.
- Commit/push scoped governance evidence only.

Forbidden work:
- No deletion.
- No merge.
- No retirement.
- No refactor.
- No source file repair.
- No runtime behavior change.
- No product behavior change.
- No SQL execution.
- No deployment change.
- No database mutation.
- No Supabase mutation.
- No dependency update.
- No vulnerability remediation.

Phase 4 outcome vocabulary:
- CURRENT
- LEGACY
- SUPERSEDED
- REPLACED_BY
- PARALLEL
- HISTORICAL_EVIDENCE
- UNKNOWN

Batch plan:
- B01-B29 will be inspected in deterministic order.
- B01 is the next batch.
- Each batch must record evidence before outcome.
- UNKNOWN must be zero at closure or explicitly justified.

Definition of Done:
- B01-B29 have Phase 4 evidence recorded.
- Every governed batch entry has a legacy/replacement outcome.
- UNKNOWN is zero or explicitly justified.
- Final Phase 4 roll-up is recorded.
- Rulebook guard passes.
- Working tree is clean.
- Scoped commit is created and pushed.
- No cleanup/remediation work is performed.

Validation boundary:
- This activation creates the Phase 4 governance boundary only.
- No Phase 4 batch inspection is started by this activation.
- Stop after activation commit and report exact start point for B01 before beginning inspection.


## PHASE 4 - B01 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_4 - Legacy and Replacement Identification
- Batch: B01 - CONTROL_CENTER
- Evidence type: Current/legacy/replacement identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

B01 manifest evidence:
- B01 batch_id: B01
- B01 title: CONTROL_CENTER
- B01 asset_count: 15
- All 15 B01 asset paths exist locally.
- All 15 B01 asset paths are tracked by Git.

B01 outcome summary:
- CURRENT: 15
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B01 CURRENT assets:
1. control-center/check_control_center.js
2. control-center/check_edge_asset_classification.js
3. control-center/check_edge_project_register.js
4. control-center/check_edge_repository_asset_register.js
5. control-center/check_edge_system_runtime_inventory.js
6. control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json
7. control-center/EDGE_ASSET_REPOSITORY_MAP.md
8. control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json
9. control-center/EDGE_CONTROL_CENTER.md
10. control-center/EDGE_MASTER_PROJECT_REGISTER.v1.json
11. control-center/EDGE_PROJECT_BACKLOG.md
12. control-center/EDGE_PROJECT_DEPENDENCY_MAP.md
13. control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
14. control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json
15. control-center/EDGE_SYSTEM_RUNTIME_MAP.md

Evidence:
- package.json exposes active Control Center scripts for control:center, control:projects, control:assets, control:classification, control:classification:closure, and control:runtime.
- tests reference the B01 Control Center checkers and canonical governance artifacts.
- EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json declares B01 membership and governed asset source.
- EDGE_ASSET_REPOSITORY_MAP.md and EDGE_REPOSITORY_ASSET_REGISTER.v1.json describe the B01 assets as governance, checker, generated output, documentation, runtime inventory, and repository asset authority surfaces.
- EDGE_PROJECT_BACKLOG.md and EDGE_PROJECT_DEPENDENCY_MAP.md are generated from EDGE_MASTER_PROJECT_REGISTER.v1.json but remain current governed documentation outputs.
- EDGE_SYSTEM_RUNTIME_MAP.md is synchronized from EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json but remains a current governed runtime review output.
- Search terms found legacy/replacement vocabulary inside checker logic and governance policy text, but did not prove any B01 asset itself has been replaced, superseded, deprecated, obsolete, or archived.

Decision:
- All 15 B01 Control Center assets remain CURRENT for Phase 4.
- Generated or derived status does not make a B01 asset legacy when the source/checker relationship remains current and governed.
- No B01 replacement, supersession, parallel successor, or historical-only status is proven.

Validation boundary:
- Evidence only.
- No cleanup action is authorized by this B01 outcome.
- B01 Phase 4 evidence is closed.
- Next batch: B02 - BACKEND_DIRECT_FILES.


## PHASE 4 - B02 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_4 - Legacy and Replacement Identification
- Batch: B02 - BACKEND_DIRECT_FILES
- Evidence type: Current/legacy/replacement identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

B02 manifest evidence:
- B02 batch_id: B02
- B02 title: BACKEND_DIRECT_FILES
- B02 asset_count: 13
- All 13 B02 asset paths exist locally.
- All 13 B02 asset paths are tracked by Git.

B02 outcome summary:
- CURRENT: 12
- LEGACY: 0
- SUPERSEDED: 1
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B02 CURRENT assets:
1. backend/.gitignore
2. backend/apiClients.js
3. backend/checkCanonicalEvents.js
4. backend/config.js
5. backend/database.js
6. backend/db.js
7. backend/dbBootstrap.js
8. backend/deploy-trigger-cricket.js
9. backend/deploy-trigger.js
10. backend/edgemind_inference.py
11. backend/server-express.js
12. backend/test-ultra-slim.js

B02 SUPERSEDED assets:
1. backend/package-lock.json

Evidence:
- package.json starts the application through node backend/server-express.js.
- render.yaml starts backend/server-express.js, backend/deploy-trigger.js, and backend/deploy-trigger-cricket.js.
- AGENTS.md identifies backend/apiClients.js, backend/dbBootstrap.js, backend/db.js, backend/config.js, and backend/server-express.js as current backend architecture/runtime assets.
- backend/checkCanonicalEvents.js is a tracked manual Supabase canonical_events audit script. No replacement or superseding audit script was proven in this phase.
- backend/edgemind_inference.py is a tracked standalone EdgeMind/Antigravity inference bridge with a CLI entrypoint. No active Node/server caller was proven, but no replacement or superseding bridge was proven either.
- backend/test-ultra-slim.js is a tracked manual EdgeMind/Dolphin ultra-slim inference test harness. No replacement or superseding test harness was proven in this phase.
- backend/package-lock.json is a minimal backend lockfile with only an empty backend package entry.
- backend/package.json does not exist.
- root package.json exists and governs active start/build scripts.
- Therefore backend/package-lock.json is superseded as a backend dependency authority, but this Phase 4 outcome does not authorize deletion.

Decision:
- Twelve B02 backend direct files remain CURRENT for Phase 4.
- backend/package-lock.json is SUPERSEDED because its paired backend/package.json is absent and active dependency/startup authority is at the repository root.
- No B02 deletion, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

Validation boundary:
- Evidence only.
- No cleanup action is authorized by this B02 outcome.
- B02 Phase 4 evidence is closed.
- Next batch: B03 - BACKEND_ROUTES_AND_CONTROLLERS.


## PHASE 4 - B03-B06 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_4 - Legacy and Replacement Identification
- Batches: B03, B04, B05, B06
- Evidence type: Current/legacy/replacement identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- B03 title: BACKEND_ROUTES_AND_CONTROLLERS; asset_count: 28
- B04 title: BACKEND_UTILS_SEMANTIC_CORE_AND_TEST; asset_count: 46
- B05 title: BACKEND_SCRIPTS; asset_count: 15
- B06 title: BACKEND_PROVIDERS; asset_count: 10
- All B03-B06 asset paths exist locally.
- All B03-B06 asset paths are tracked by Git.
- Zero missing assets.
- Zero untracked assets.
- Zero zero-reference assets in compact reference scan.

B03 outcome summary:
- CURRENT: 28
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B04 outcome summary:
- CURRENT: 43
- LEGACY: 3
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B05 outcome summary:
- CURRENT: 15
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B06 outcome summary:
- CURRENT: 10
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B03 CURRENT assets:
- All 28 B03 backend route/controller assets are CURRENT.
- Evidence: backend/server-express.js imports and mounts the B03 route assets, and backend/routes/chat.js imports backend/controllers/edgeMindController.js.
- Previous Phase 3 active-use evidence also marked all B03 assets ACTIVE.

B04 LEGACY assets:
1. backend/logic/edgeMind_manifest.json
2. backend/parsers/base_sport_parser.py
3. backend/workers/now_api_pulse.py

B04 CURRENT assets:
- All remaining 43 B04 assets are CURRENT.
- Evidence: active B04 core, middleware, semantic-layer, utility, and test assets have direct runtime, service, route, script, or manual-use evidence.
- Manual-use B04 assets remain CURRENT manual/governance/test/operator assets unless replacement, supersession, or historical-only status is proven.

B05 CURRENT assets:
- All 15 B05 backend script assets are CURRENT.
- Evidence: backend/scripts/sync-sportsrc-fixtures.js is exposed by package.json as sync:sportsrc.
- Remaining B05 scripts retain manual-use status from previous active-use evidence, and no replacement or superseding script was proven in this phase.

B06 CURRENT assets:
- All 10 B06 backend provider assets are CURRENT manual provider/tooling assets for Phase 4.
- Evidence: provider and normalizer files are referenced by provider files and verification/audit scripts.
- No B06 replacement, supersession, parallel successor, or historical-only status was proven in this phase.

Decision:
- B03 closes with all assets CURRENT.
- B04 closes with 43 CURRENT and 3 LEGACY assets.
- B05 closes with all assets CURRENT.
- B06 closes with all assets CURRENT.
- UNKNOWN is 0 for B03-B06.
- No cleanup action is authorized by these outcomes.

Validation boundary:
- Evidence only.
- No file removal, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.
- B03-B06 Phase 4 evidence is closed.
- Next batch: B07 - BACKEND_SRC_SERVICES.


## PHASE 4 - B07-B10 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_4 - Legacy and Replacement Identification
- Batches: B07, B08, B09, B10
- Evidence type: Current/legacy/replacement identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- B07 title: BACKEND_SRC_SERVICES; asset_count: 9
- B08 title: BACKEND_ADAPTERS_AND_CONFIG; asset_count: 13
- B09 title: BACKEND_SERVICES; asset_count: 86
- B10 title: SCRIPTS_AUDIT_GOV; asset_count: 27
- All B07-B10 asset paths exist locally.
- All B07-B10 asset paths are tracked by Git.
- Zero missing assets.
- Zero untracked assets.

B07 outcome summary:
- CURRENT: 7
- LEGACY: 2
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B08 outcome summary:
- CURRENT: 12
- LEGACY: 1
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B09 outcome summary:
- CURRENT: 80
- LEGACY: 3
- SUPERSEDED: 2
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 1
- UNKNOWN: 0

B10 outcome summary:
- CURRENT: 27
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B07 LEGACY assets:
1. backend/src/services/contextIntelligence/cacheService.js
2. backend/src/services/marketRouter/waterfall.js

B07 CURRENT assets:
- All remaining 7 B07 assets are CURRENT.
- Evidence: B07 attention scan found the two listed files had no direct consumers and previous NO_CURRENT_USE_FOUND status. Remaining B07 assets retained active/manual current evidence from the compact scan.

B08 LEGACY assets:
1. backend/adapters/f1Adapter.js

B08 CURRENT assets:
- All remaining 12 B08 assets are CURRENT.
- Evidence: backend/adapters/f1Adapter.js explicitly throws "F1 adapter is disabled in this deployment" and had no direct consumers.
- backend/config/subscriptionMatrix.js is CURRENT because it is referenced by AGENTS.md, backend/controllers/edgeMindController.js, backend/routes/debug.js, backend/routes/predictions.js, backend/routes/vip.js, backend/server-express.js, and migration planning scripts.

B09 LEGACY assets:
1. backend/services/comboEngine.js
2. backend/services/rateLimitsAnalysis.js
3. backend/services/reEvaluationEngine.js

B09 SUPERSEDED assets:
1. backend/services/accaMathUtils.js
2. backend/services/aiProvider_odds_update.js

B09 HISTORICAL_EVIDENCE assets:
1. backend/services/aiProvider_odds_update.js

B09 CURRENT assets:
- All remaining 80 B09 assets are CURRENT.
- Evidence: backend/services/accaBuilder.js is used by backend/routes/v1/acca.js and active ACCA/service paths.
- backend/services/aiPipeline.js is documented in AGENTS.md and consumed by backend/routes/pipeline.js, backend/routes/predictions.js, backend/routes/scheduler.js, and active service paths.
- backend/services/antigravity/WorkflowEngine.js is consumed by backend/routes/antigravity.js.
- backend/services/contextIngestionService.js is documented in AGENTS.md and consumed by backend/services/aiPipeline.js.
- backend/services/dataProvider.js is consumed by backend/routes/scheduler.js, backend/services/accaBuilder.js, backend/services/aiPipeline.js, and provider paths.
- backend/services/skcsHeartbeat.js is consumed by backend/server-express.js.
- backend/services/syncService.js is documented in AGENTS.md and consumed by backend/routes/pipeline.js and backend/server-express.js.
- backend/services/accaMathUtils.js only re-exports backend/utils/accaLogicEngine.js and no direct consumers were proven; active ACCA logic consumption points to backend/utils/accaLogicEngine.js.
- backend/services/aiProvider_odds_update.js is an odds-update replacement snippet instructing a function replacement inside aiProvider.js, with no direct current consumer proven.

B10 CURRENT assets:
- All 27 B10 audit/governance script assets are CURRENT manual audit/governance tools.
- Evidence: attention-only check inspected audit/migration/governance scripts, all existed, all were tracked, and no replacement or superseding audit script was proven.
- Scripts that execute database reads or migration logic remain evidence-only/manual assets in this phase; this phase did not run them and does not authorize SQL execution.

Decision:
- B07 closes with 7 CURRENT and 2 LEGACY assets.
- B08 closes with 12 CURRENT and 1 LEGACY asset.
- B09 closes with 80 CURRENT, 3 LEGACY, 2 SUPERSEDED, and 1 HISTORICAL_EVIDENCE asset.
- B10 closes with 27 CURRENT assets.
- UNKNOWN is 0 for B07-B10.
- No cleanup action is authorized by these outcomes.

Validation boundary:
- Evidence only.
- No file removal, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.
- B07-B10 Phase 4 evidence is closed.
- Next batch: B11 - SCRIPTS_VERIFICATION_AND_MIGRATION.


## PHASE 4 - B11-B14 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_4 - Legacy and Replacement Identification
- Batches: B11, B12, B13, B14
- Evidence type: Current/legacy/replacement identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- B11 title: SCRIPTS_CHECK_VALIDATE_VERIFY; asset_count: 59
- B12 title: SCRIPTS_TEST_DIAG_TRACE; asset_count: 66
- B13 title: SCRIPTS_RUN_TRIGGER_SCHED; asset_count: 20
- B14 title: SCRIPTS_INGEST_ENRICH_SYNC_IMPORT; asset_count: 31
- All B11-B14 asset paths exist locally.
- All B11-B14 asset paths are tracked by Git.
- Zero missing assets.
- Zero untracked assets.
- Rulebook guard passed before and after inspection.

B11 outcome summary:
- CURRENT: 59
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B12 outcome summary:
- CURRENT: 66
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B13 outcome summary:
- CURRENT: 20
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B14 outcome summary:
- CURRENT: 31
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

Evidence:
- B11 check/validate/verify scripts are retained as CURRENT manual verification and governance-support tools. No replacement or superseding checker was proven in this phase.
- B12 test/debug/diagnostic/trace scripts are retained as CURRENT manual diagnostic and test tools. No replacement or superseding diagnostic/test harness was proven in this phase.
- B13 run/trigger/scheduler scripts are retained as CURRENT manual/operator trigger tools. No replacement or superseding trigger path was proven in this phase.
- B14 ingest/enrich/sync/import/backfill scripts are retained as CURRENT manual/operator data movement and inspection tools. No replacement or superseding ingest/enrichment/import tool was proven in this phase.
- Attention flags came from UNPROVEN prior status, direct-reference limitations for standalone scripts, and generic legacy/migration/backfill words inside script content.
- These attention flags are not proof that the files are legacy, superseded, replaced, parallel, or historical-only.
- Scripts that could execute database reads/writes, migrations, sync, import, or backfill remain evidence-only/manual assets in this phase; this phase did not run them and does not authorize SQL execution or database/Supabase mutation.

Decision:
- B11 closes with 59 CURRENT assets.
- B12 closes with 66 CURRENT assets.
- B13 closes with 20 CURRENT assets.
- B14 closes with 31 CURRENT assets.
- UNKNOWN is 0 for B11-B14.
- No cleanup action is authorized by these outcomes.

Validation boundary:
- Evidence only.
- No file removal, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.
- B11-B14 Phase 4 evidence is closed.
- Next batch: B15.


## Phase 4 B15-B18 Legacy and Replacement Identification Closure

Starting HEAD:
- a1b1b98f

Batch group:
- B15 SCRIPTS_MAINT_FIX_CLEANUP_MIGRATE
- B16 DOCS_ROOT_MD_TXT
- B17 DOCS_DIR
- B18 SKCS_KNOWLEDGE_GOV_AND_AUDIT

Scope:
- Phase 4 evidence-only legacy and replacement identification.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation was authorized or performed.

Membership:
- B15 declared asset count: 52; actual path count: 52; missing files: 0.
- B16 declared asset count: 36; actual path count: 36; missing files: 0.
- B17 declared asset count: 24; actual path count: 24; missing files: 0.
- B18 declared asset count: 23; actual path count: 23; missing files: 0.

Attention-only scan:
- B15 strong legacy/replacement markers: 0.
- B16 strong legacy/replacement markers: 5.
- B17 strong legacy/replacement markers: 4.
- B18 strong legacy/replacement markers: 0.

B16 strong marker disposition:
- DEEPSEEK_SESSION_SKCSTEST.txt remains CURRENT. The "replaced by" marker refers to pg_cron / pg_net replacement by Render cron / Node HTTP, not replacement of the document itself.
- DEEPSEEK_STATE.md remains CURRENT. The "replaced by" marker refers to pg_cron / pg_net replacement by Render cron / Node HTTP, not replacement of the document itself.
- SINGLE_USE_AUDIT_REPORT.md remains CURRENT. The "deprecated" marker refers to deprecated global single-use restriction logic being audited, not depreciation of the audit report itself.
- SKCS_MASTER_RULEBOOK.md remains CURRENT. The "replaced by" marker refers to an old secondary market allowlist replaced by Safe Haven list/categories, not replacement of the rulebook itself.
- TERMS_OF_SERVICE.md remains CURRENT. The "do not use" marker is user-facing legal wording inside the Terms, not an instruction that the file is unused or replaced.

B17 strong marker disposition:
- docs/provider-discovery/free-livescore-api.md remains CURRENT. The "do not use" marker limits provider use for final prediction logic; the document remains current provider discovery / resolver-use evidence.
- docs/providers/live-football-api-policy.md remains CURRENT. The "do not use" markers define provider usage restrictions; the policy document itself remains current.
- docs/SKCS_ENGINE_V2_PHASE05_INGEST_MAP.md remains CURRENT. The "do not use" marker limits fuzzy team matching as a schema-drift workaround; the ingest map itself remains current.
- docs/SKCS_ENGINE_V2_PHASE0B5_REPLAY.md remains CURRENT. The "do not use" marker limits TheSportsDB IDs in replay; the replay document itself remains current.

B15 outcome summary:
- CURRENT: 52
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B16 outcome summary:
- CURRENT: 36
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B17 outcome summary:
- CURRENT: 24
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B18 outcome summary:
- CURRENT: 23
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

Decision:
- B15 closes with 52 CURRENT assets.
- B16 closes with 36 CURRENT assets.
- B17 closes with 24 CURRENT assets.
- B18 closes with 23 CURRENT assets.
- UNKNOWN is 0 for B15-B18.
- No cleanup action is authorized by these outcomes.

Validation boundary:
- Evidence only.
- No file removal, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.
- B15-B18 Phase 4 evidence is closed.
- Next batch: B19.

## Phase 4 B19-B22 Legacy and Replacement Identification Closure

Starting HEAD:
- f89f1d8f

Batch group:
- B19 SKCS_KNOWLEDGE_KNOWLEDGE
- B20 SKCS_KNOWLEDGE_PROVIDERS
- B21 PUBLIC_UI
- B22 SUPABASE_MIGRATIONS

Scope:
- Phase 4 evidence-only legacy and replacement identification.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation was authorized or performed.

Membership:
- B19 declared asset count: 17; actual path count: 17; missing files: 0.
- B20 declared asset count: 18; actual path count: 18; missing files: 0.
- B21 declared asset count: 64; actual path count: 64; missing files: 0.
- B22 declared asset count: 61; actual path count: 61; missing files: 0.

Attention-only scan:
- B19 strong legacy/replacement markers: 2.
- B20 strong legacy/replacement markers: 0.
- B21 strong legacy/replacement markers: 2.
- B22 strong legacy/replacement markers: 2.

B19 strong marker disposition:
- SKCS-KNOWLEDGE/knowledge/provider_registry.md remains CURRENT. The "superseded by" marker refers to Bzzoiro provider evaluation being superseded by BBD focus, not replacement of the provider registry file.
- SKCS-KNOWLEDGE/knowledge/semantic_field_mapping_registry.md remains CURRENT. The "do not use" markers are anti-pattern and truth-layer boundary rules inside the registry, not instructions that the registry file is unused or replaced.

B21 strong marker disposition:
- public/js/supabase-bundle.js remains CURRENT. The "deprecated" markers are inside bundled Supabase library comments and warnings for specific API options/methods, not evidence that the bundle asset itself is replaced.
- public/terms.html remains CURRENT. The "do not use" marker is user-facing legal Terms wording, not an instruction that the file is unused or replaced.

B22 strong marker disposition:
- supabase/migrations/20260531000002_skcs_engine_v2_phase0b_match_results.sql remains CURRENT as a migration record. The "deprecated" marker refers to one SQL function path inside the migration, while the migration also defines the match_results spine and canonical ingest path.
- supabase/migrations/20261006000000_sportsdataio_contract_alignment.sql remains CURRENT as a migration record. The "deprecated" and "retired" markers are allowed values inside a data_contracts status CHECK constraint, not evidence that the migration file is deprecated or retired.

B19 outcome summary:
- CURRENT: 17
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B20 outcome summary:
- CURRENT: 18
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B21 outcome summary:
- CURRENT: 64
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B22 outcome summary:
- CURRENT: 61
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

Decision:
- B19 closes with 17 CURRENT assets.
- B20 closes with 18 CURRENT assets.
- B21 closes with 64 CURRENT assets.
- B22 closes with 61 CURRENT assets.
- UNKNOWN is 0 for B19-B22.
- No cleanup action is authorized by these outcomes.

Validation boundary:
- Evidence only.
- No file removal, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.
- B19-B22 Phase 4 evidence is closed.
- Next batch: B23.

## Phase 4 B23-B26 Legacy and Replacement Identification Closure

Starting HEAD:
- 4521f78e

Batch group:
- B23 DB_SQL_AND_SUPABASE_OTHER
- B24 TESTS
- B25 SCRATCH
- B26 DEPLOYMENT_CI

Scope:
- Phase 4 evidence-only legacy and replacement identification.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation was authorized or performed.

Membership:
- B23 declared asset count: 20; actual path count: 20; missing files: 1.
- B24 declared asset count: 6; actual path count: 6; missing files: 0.
- B25 declared asset count: 2; actual path count: 2; missing files: 0.
- B26 declared asset count: 3; actual path count: 3; missing files: 0.

Attention-only scan:
- B23 strong legacy/replacement markers: 0; missing path: 1.
- B24 strong legacy/replacement markers: 1.
- B25 strong legacy/replacement markers: 0.
- B26 strong legacy/replacement markers: 0.

B23 missing path disposition:
- supabase/functions/sync-sports-data/index.ts is absent from the working tree.
- Git history shows it was deleted in commit d869061e, subject "Retire unused Supabase pipeline trigger".
- Deletion evidence: delete mode 100644 supabase/functions/sync-sports-data/index.ts.
- Existing Control Center notes already record that the B23 manifest still lists the path while current tracked source does not, and that this remains future governance cleanup only.
- Phase 4 therefore treats this absent path as HISTORICAL_EVIDENCE / already-retired evidence, not CURRENT and not UNKNOWN.
- No deletion or governance cleanup is authorized by Phase 4.

B24 strong marker disposition:
- tests/edge-control-center-ledger.test.js remains CURRENT.
- The "retired" marker appears inside an assertion that legacy per-asset forensic modes are retired.
- The marker does not describe the test file itself as retired.
- The file is actively referenced by package.json test:control-center and governance/control-center references.

B23 outcome summary:
- CURRENT: 19
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 1
- UNKNOWN: 0

B24 outcome summary:
- CURRENT: 6
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B25 outcome summary:
- CURRENT: 2
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B26 outcome summary:
- CURRENT: 3
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

Decision:
- B23 closes with 19 CURRENT assets and 1 HISTORICAL_EVIDENCE absent retired path.
- B24 closes with 6 CURRENT assets.
- B25 closes with 2 CURRENT assets.
- B26 closes with 3 CURRENT assets.
- UNKNOWN is 0 for B23-B26.
- No cleanup action is authorized by these outcomes.
- Future governance cleanup remains: remove or reconcile the stale B23 manifest/report reference for supabase/functions/sync-sports-data/index.ts in a later approved phase.

Validation boundary:
- Evidence only.
- No file removal, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.
- B23-B26 Phase 4 evidence is closed.
- Next batch: B27.

## Phase 4 B27-B29 Legacy and Replacement Identification Closure

Starting HEAD:
- 3386d139

Batch group:
- B27 ARCHIVE
- B28 ROOT_NON_MD_TXT_FILES
- B29 DOT_TOOL_DIRS_AND_SMALL_DIRS

Scope:
- Phase 4 evidence-only legacy and replacement identification.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation was authorized or performed.

Membership:
- B27 declared asset count: 58; actual path count: 58; missing files: 0.
- B28 declared asset count: 55; actual path count: 55; missing files: 0.
- B29 declared asset count: 26; actual path count: 26; missing files: 0.

Attention-only scan:
- B27 strong legacy/replacement markers: 1.
- B28 strong legacy/replacement markers: 1.
- B29 strong legacy/replacement markers: 0.

B27 archive disposition:
- B27 is explicitly titled ARCHIVE.
- B27 manifest authority uses prefix rule _archive/.
- All B27 assets are under _archive/ and are retained as historical/archive evidence, not current operational source.
- _archive/scripts/analyze-table-usage.js contains a "DEPRECATED (no code, no data)" category inside the script output logic; this describes table classification inside the script, not an additional file-level replacement marker.
- Phase 4 therefore treats B27 as HISTORICAL_EVIDENCE.
- No deletion or cleanup action is authorized by this outcome.

B28 strong marker disposition:
- package-lock.json remains CURRENT.
- The "deprecated" marker appears inside the dependency graph for node_modules/prebuild-install, not as a marker that package-lock.json itself is deprecated.
- Root package.json is active and package-lock.json remains the root dependency lockfile for the active root package authority.
- The previously identified backend/package-lock.json supersession does not apply to the root package-lock.json.

B29 disposition:
- B29 has no strong legacy/replacement markers.
- Dot-tool, hook, JS config/source, small data, and local tool directory assets remain CURRENT for Phase 4 purposes unless later phases prove cleanup, merge, retirement, or deletion.

B27 outcome summary:
- CURRENT: 0
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 58
- UNKNOWN: 0

B28 outcome summary:
- CURRENT: 55
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

B29 outcome summary:
- CURRENT: 26
- LEGACY: 0
- SUPERSEDED: 0
- REPLACED_BY: 0
- PARALLEL: 0
- HISTORICAL_EVIDENCE: 0
- UNKNOWN: 0

Decision:
- B27 closes with 58 HISTORICAL_EVIDENCE archived assets.
- B28 closes with 55 CURRENT assets.
- B29 closes with 26 CURRENT assets.
- UNKNOWN is 0 for B27-B29.
- No cleanup action is authorized by these outcomes.

Validation boundary:
- Evidence only.
- No file removal, merge, retirement, refactor, source change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.
- B27-B29 Phase 4 evidence is closed.
- Phase 4 batch review is complete through B29.

## PHASE 5 - FUNCTIONAL OVERLAP IDENTIFICATION - ACTIVATED

Result: ACTIVE

Activation scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Activation HEAD: 48019118
- Previous phase: PHASE_4 - Legacy and Replacement Identification
- Previous phase status: CLOSED
- Activation type: Control Center activation only
- Batch inspection begun by this activation: NO
- Deletion/merge/retirement/refactor authorized by this activation: NO
- Source/runtime/product change authorized by this activation: NO
- SQL execution authorized by this activation: NO
- Deployment change authorized by this activation: NO
- Database/Supabase mutation authorized by this activation: NO
- Dependency/security/vulnerability remediation authorized by this activation: NO

Objective:
Identify whether different remaining governed files do the same or substantially overlapping job, based on repository evidence only.

Allowed work:
- Inspect governed asset evidence.
- Compare purpose, consumers, runtime role, dependency role, and governance role.
- Record Phase 5 functional-overlap findings in the Control Center.
- Run approved local guards/checks.
- Commit/push scoped governance evidence only.

Forbidden work:
- No deletion.
- No merge implementation.
- No retirement.
- No refactor.
- No source file repair.
- No runtime behavior change.
- No product behavior change.
- No SQL execution.
- No deployment change.
- No database mutation.
- No Supabase mutation.
- No dependency update.
- No vulnerability remediation.

Phase 5 outcome vocabulary:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Batch plan:
- B01-B29 will be inspected in deterministic order.
- B01 is the next batch.
- Each batch must record evidence before outcome.
- Overlap identification does not authorize cleanup.

Definition of Done:
- B01-B29 have Phase 5 evidence recorded.
- Functional overlap groups are identified where proven.
- Non-overlap is recorded where files have distinct responsibilities.
- Final Phase 5 roll-up is recorded.
- Rulebook guard passes.

Validation boundary:
- This activation creates the Phase 5 governance boundary only.
- No Phase 5 batch inspection is started by this activation.
- Stop after activation commit and report exact start point for B01 before beginning inspection.

## PHASE 5 - B01 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batch: B01 - CONTROL_CENTER
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

B01 manifest evidence:
- B01 batch_id: B01
- B01 title: CONTROL_CENTER
- B01 asset_count: 15
- Start HEAD: 82f32e2f
- All 15 B01 asset paths were inspected by compact reference scan.

B01 outcome summary:
- NO_OVERLAP: 0
- PARTIAL_OVERLAP: 15
- MAJOR_OVERLAP: 0
- POTENTIAL_MERGE_GROUP: 0

Functional-overlap groups:

1. Core Control Center governance group:
- control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json
- control-center/EDGE_CONTROL_CENTER.md
- control-center/check_control_center.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- EDGE_BUILD_CONTROL_LEDGER.v1.json is the machine ledger for tasks, statuses, proof requirements, gates, and sequencing.
- EDGE_CONTROL_CENTER.md is the operator-facing governance document and structured state surface.
- check_control_center.js validates the ledger and Control Center state.
- These files intentionally overlap on Control Center governance concepts but do not perform the same job.

Decision:
- Keep separate.
- No merge group is proven.

2. Asset classification and repository asset authority group:
- control-center/check_edge_asset_classification.js
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
- control-center/EDGE_ASSET_REPOSITORY_MAP.md

Outcome:
- PARTIAL_OVERLAP

Evidence:
- EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json defines deterministic B01-B29 batch membership.
- EDGE_REPOSITORY_ASSET_REGISTER.v1.json is the governed asset register.
- check_edge_asset_classification.js validates classification and can render EDGE_ASSET_REPOSITORY_MAP.md.
- EDGE_ASSET_REPOSITORY_MAP.md is the human-readable generated repository map.
- These files overlap because they describe the same governed asset universe from different control surfaces.

Decision:
- Keep separate.
- Generated-map overlap is expected and does not prove a merge candidate.

3. Project register projection group:
- control-center/check_edge_project_register.js
- control-center/EDGE_MASTER_PROJECT_REGISTER.v1.json
- control-center/EDGE_PROJECT_BACKLOG.md
- control-center/EDGE_PROJECT_DEPENDENCY_MAP.md

Outcome:
- PARTIAL_OVERLAP

Evidence:
- EDGE_MASTER_PROJECT_REGISTER.v1.json is the project register authority derived from the ledger.
- EDGE_PROJECT_BACKLOG.md is generated from EDGE_MASTER_PROJECT_REGISTER.v1.json.
- EDGE_PROJECT_DEPENDENCY_MAP.md is generated from EDGE_MASTER_PROJECT_REGISTER.v1.json.
- check_edge_project_register.js validates and synchronizes the project register projections.
- These files overlap because backlog and dependency documentation are projections of the master register.

Decision:
- Keep separate.
- Projection overlap is expected and does not prove a merge candidate.

4. Runtime inventory projection group:
- control-center/check_edge_system_runtime_inventory.js
- control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json
- control-center/EDGE_SYSTEM_RUNTIME_MAP.md

Outcome:
- PARTIAL_OVERLAP

Evidence:
- EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json is the machine-readable runtime inventory.
- EDGE_SYSTEM_RUNTIME_MAP.md is the synchronized human-readable runtime review surface.
- check_edge_system_runtime_inventory.js validates the runtime inventory and synchronizes the runtime map.
- These files overlap because the runtime map reflects the runtime inventory.

Decision:
- Keep separate.
- Runtime inventory projection overlap is expected and does not prove a merge candidate.

Batch decision:
- B01 has controlled PARTIAL_OVERLAP across governance source/checker/projection surfaces.
- No MAJOR_OVERLAP is proven.
- No POTENTIAL_MERGE_GROUP is proven.
- No cleanup action is authorized by this outcome.
- B01 Phase 5 evidence is closed.
- Next batch: B02 - BACKEND_DIRECT_FILES.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - B02-B03 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B02 - BACKEND_DIRECT_FILES; B03 - BACKEND_ROUTES_AND_CONTROLLERS
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- B02 asset_count: 13
- B03 asset_count: 28
- Combined reviewed assets: 41
- Start HEAD: a5999ceb
- Compact overlap scan inspected B02-B03 membership, route mounting, database exports, prediction route endpoints, and cricket route endpoints.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: database access authority

Assets:
- backend/database.js
- backend/db.js
- backend/dbBootstrap.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- backend/database.js creates a PostgreSQL pool, auto-converts Supabase direct URLs to pooler URLs, exposes query/transaction helpers, initializes tables, and exports broad database functions including getPredictionsByTier and getProfileById.
- backend/db.js also creates a PostgreSQL pool, auto-converts Supabase direct URLs to pooler URLs, and exports pool/query/withTransaction.
- backend/dbBootstrap.js also performs database compatibility/bootstrap work for prediction final tables and views.
- Multiple B03 routes consume either ../db or ../database, proving more than one database access surface remains active.

Decision:
- Functional overlap is proven.
- No canonical database access authority is selected in Phase 5.
- No merge, deletion, or refactor is authorized.
- Carry forward as a potential future merge/canonicalization group.

Candidate group 2: server inline endpoint versus route-module boundary

Assets:
- backend/server-express.js
- backend/routes/pipeline.js
- backend/routes/predictions.js
- backend/routes/debug.js
- backend/routes/scheduler.js
- backend/routes/cricketCron.js
- backend/routes/cricketInsights.js
- backend/routes/cricketCount.js
- backend/routes/sportsEdge.js
- backend/routes/v1/predictions.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- backend/server-express.js imports and mounts B03 route modules including predictions, pipeline, debug, user, chat, accuracy, vip, direct1x2, cricketInsights, cricketCount, cricketCron, scheduler, metrics, semanticDrift, divanscore, antigravity, controlCenter, and v1 routes.
- The same server file also still contains inline endpoint definitions for pipeline trigger, refresh-predictions scheduler paths, debug sync/test paths, cricket daily fixtures cron, master pipeline cron, AI predictions lookup, and cricket table health checks.
- This proves overlap between the main server bootstrap file and modular route files, especially for pipeline, prediction, scheduler, debug, and cricket responsibilities.

Decision:
- Functional overlap is proven.
- The current file arrangement may be intentional or legacy-mixed; Phase 5 does not decide replacement.
- No endpoint move, router extraction, deletion, or refactor is authorized.
- Carry forward as a future route-boundary/canonicalization candidate.

Candidate group 3: prediction delivery and prediction API surfaces

Assets:
- backend/routes/predictions.js
- backend/routes/v1/predictions.js
- backend/routes/user.js
- backend/routes/vip.js
- backend/routes/direct1x2.js
- backend/routes/v1/acca.js
- backend/routes/v1/sameMatchBuilder.js
- backend/routes/v1/secondaryMarkets.js
- backend/server-express.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- backend/routes/predictions.js exposes the main predictions API and reads direct1x2_prediction_final.
- backend/routes/v1/predictions.js exposes v1 match prediction, batch, and history endpoints and also reads direct1x2_prediction_final and secondary_market_predictions.
- backend/routes/user.js exposes subscription-gated user prediction access.
- backend/routes/vip.js exposes VIP/stress prediction payload access and reads direct1x2_prediction_final.
- backend/routes/direct1x2.js, v1/acca.js, v1/sameMatchBuilder.js, and v1/secondaryMarkets.js are related prediction/market/ACCA API surfaces.
- backend/server-express.js also contains an inline /api/ai-predictions/:matchId endpoint that falls back through prediction tables.

Decision:
- Major functional overlap is proven across prediction delivery surfaces.
- Different audiences and API contracts may justify separation, so a merge group is not selected yet.
- No route removal, API consolidation, refactor, or behavior change is authorized.
- Carry forward as a future API-boundary review candidate.

Candidate group 4: cricket count, cache, cron, and insight surfaces

Assets:
- backend/routes/cricketCache.js
- backend/routes/cricketCount.js
- backend/routes/cricketCron.js
- backend/routes/cricketInsights.js
- backend/deploy-trigger-cricket.js
- backend/server-express.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- backend/routes/cricketCache.js reads CricAPI cache.
- backend/routes/cricketCron.js builds/refreshes Cricbuzz and CricAPI cricket data through cron routes.
- backend/deploy-trigger-cricket.js triggers a cricket cron URL.
- backend/routes/cricketCount.js exposes a cricket count endpoint from cricket_insights_final.
- backend/routes/cricketInsights.js also defines a lightweight /count endpoint and an insights endpoint that counts and groups cricket insight rows.
- backend/server-express.js separately contains an inline cricket daily fixtures cron endpoint and an inline cricket table health/debug endpoint.

Decision:
- Functional overlap is proven, especially between cricketCount.js and cricketInsights.js count behavior, and between cricketCron.js and server-express.js inline cricket cron behavior.
- No consolidation or removal is authorized.
- Carry forward as a future cricket route-boundary/canonicalization candidate.

Candidate group 5: deploy trigger files and called route endpoints

Assets:
- backend/deploy-trigger.js
- backend/routes/pipeline.js
- backend/deploy-trigger-cricket.js
- backend/routes/cricketCron.js
- backend/server-express.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- backend/deploy-trigger.js calls /api/pipeline/run-full.
- backend/routes/pipeline.js owns pipeline route behavior.
- backend/deploy-trigger-cricket.js calls /api/cron/cricket-daily-fixtures.
- backend/routes/cricketCron.js owns cricket cron route behavior, while backend/server-express.js also contains an inline cricket daily fixtures endpoint.
- Trigger files and route files touch the same workflows but have different roles: caller/launcher versus HTTP route owner.

Decision:
- Partial functional overlap is proven.
- Keep separate for now.
- No deletion, merge, or refactor is authorized.

Distinct-role findings:
- backend/.gitignore: backend source-control ignore boundary; no B02-B03 functional overlap proven.
- backend/apiClients.js: provider/client and quota/circuit-breaker access surface; no same-job route/controller file proven in this batch.
- backend/checkCanonicalEvents.js: manual Supabase canonical_events audit script; no same-job B02-B03 asset proven.
- backend/config.js: environment/config authority; no same-job B02-B03 asset proven.
- backend/edgemind_inference.py and backend/test-ultra-slim.js: EdgeMind/manual inference bridge and test harness; related to EdgeMind work but no same-job B02-B03 merge group proven.
- backend/controllers/edgeMindController.js and backend/routes/chat.js: controller/route relationship; dependency relationship does not itself prove functional overlap.
- backend/routes/accuracy.js and backend/routes/skcsGrading.js: both relate to grading/accuracy reporting but current evidence proves related reporting surfaces, not a merge group.
- backend/routes/antigravity.js, controlCenter.js, divanscore.js, feedback.js, metrics.js, refresh-ai.js, semanticDrift.js, sportsEdge.js, and tier1.js: no same-job B02-B03 merge group proven by this scan.

Batch decision:
- B02-B03 contains proven functional overlap candidates.
- Potential future merge/canonicalization candidates are recorded for database access, server route boundary, cricket route boundary, and prediction API boundary.
- No cleanup action is authorized by this outcome.
- B02-B03 Phase 5 evidence is closed.
- Next batch group: B04-B06.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - B04-B06 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B04 - BACKEND_UTILS_SEMANTIC_CORE_AND_TEST; B05 - BACKEND_SCRIPTS; B06 - BACKEND_PROVIDERS
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- B04 asset_count: 46
- B05 asset_count: 15
- B06 asset_count: 10
- Combined reviewed assets: 71
- Start HEAD: cb368c49
- Compact overlap scan inspected B04-B06 membership, semantic/core utilities, backend utility helpers, backend scripts, and football provider/normalizer assets.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: verification controller boundary

Assets:
- backend/core/verificationController.js
- backend/semantic-layer/verificationController.js
- backend/core/verificationSignalContract.js
- backend/core/executionPipeline.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- backend/core/verificationController.js is a core verification controller and uses database query access plus verification signal contracts.
- backend/semantic-layer/verificationController.js imports the core verification controller and adapts semantic-layer context into verification signals.
- backend/core/verificationSignalContract.js defines verification signal types.
- backend/core/executionPipeline.js consumes semantic-layer verification, preflight, gatekeeper, control-plane, fingerprint, and error-memory components.
- These files overlap around verification and pipeline health concepts, but the current evidence shows layered roles rather than identical jobs.

Decision:
- Keep separate for now.
- No merge group is selected in Phase 5.
- Carry forward only as a boundary-review candidate.

Candidate group 2: semantic governance and control-plane pipeline

Assets:
- backend/core/executionPipeline.js
- backend/semantic-layer/controlPlaneEvaluator.js
- backend/semantic-layer/decisionFingerprintService.js
- backend/semantic-layer/enforcementGuard.js
- backend/semantic-layer/errorMemoryLayer.js
- backend/semantic-layer/gatekeeperAdapter.js
- backend/semantic-layer/governanceGatekeeper.js
- backend/semantic-layer/normalizer.js
- backend/semantic-layer/preflightSimulator.js
- backend/semantic-layer/registry.js
- backend/semantic-layer/sportsdataioContractHelpers.js
- backend/semantic-layer/violationLogger.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- These files share semantic governance, rule, violation, pipeline, provider, and verification vocabulary.
- backend/core/executionPipeline.js orchestrates the semantic-layer components.
- controlPlaneEvaluator, preflightSimulator, gatekeeperAdapter, governanceGatekeeper, normalizer, registry, and violationLogger each appear to handle separate parts of the pipeline-control chain.
- The evidence proves related layered control-plane responsibilities, not a single same-job implementation.

Decision:
- Keep separate.
- No merge, refactor, or consolidation is authorized.
- Carry forward as a semantic boundary review area only.

Candidate group 3: ACCA, market consistency, and insight-rule surfaces

Assets:
- backend/utils/accaLogicEngine.js
- backend/utils/insightEngine.js
- backend/utils/insightValidationMatrix.js
- backend/utils/marketConsistency.js
- backend/utils/conflictResolver.js
- backend/utils/secondaryMarketSelector.js
- backend/utils/validation.js
- backend/test/smoke-test-insight-engine.js
- backend/test/smoke-test-skcs-law.js
- backend/scripts/add-avg-total-log.js
- backend/scripts/add-diagnostics.js
- backend/scripts/patch-acca-builder.js
- backend/scripts/patch-card-uniqueness.js
- backend/scripts/patch-final-flow.js
- backend/scripts/patch-row-cleanup.js
- backend/scripts/patch-skcs-law.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- ACCA, market validation, market diversity, market consistency, conflict detection, and secondary-market selection logic appears across multiple utility files.
- backend/utils/insightEngine.js describes itself as SKCS ACCA core law and references the pipeline insightEngine -> accaLogicEngine -> accaBuilder -> routes -> client.
- backend/utils/accaLogicEngine.js contains ACCA math and leg-selection utilities.
- backend/utils/insightValidationMatrix.js validates insight leg groups.
- backend/utils/marketConsistency.js and backend/utils/conflictResolver.js both relate to market conflict/consistency governance.
- B05 patch scripts target accaBuilder.js and ACCA/card/final-flow/row-cleanup/SKCS-law behavior, creating overlap between runtime rule surfaces, smoke tests, and manual patch utilities.

Decision:
- Functional overlap is proven.
- No canonical ACCA/market rule authority is selected in Phase 5.
- No patch script is executed.
- No merge, deletion, retirement, or refactor is authorized.
- Carry forward as a future ACCA/rule-authority canonicalization candidate.

Candidate group 4: database/cache/job utility surfaces

Assets:
- backend/utils/db.js
- backend/utils/apiCache.js
- backend/utils/jobLogger.js
- backend/utils/purgeStaleData.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- backend/utils/db.js redirects to backend/db.js to prevent duplicate pools.
- backend/utils/apiCache.js creates its own pg Pool for API cache storage.
- backend/utils/jobLogger.js creates its own pg Pool for cron/job logging.
- backend/utils/purgeStaleData.js imports pool from backend/database.js and deletes stale prediction data.
- This creates proven overlap with the already-recorded B02-B03 database access authority candidate group.

Decision:
- Database/cache/job utility overlap is proven.
- No database authority is selected in Phase 5.
- No SQL is executed.
- No merge, deletion, refactor, or database mutation is authorized.
- Carry forward with the database access authority candidate group.

Candidate group 5: external provider access, quota, key, cache, and circuit-breaker utilities

Assets:
- backend/errors/ProviderQuotaExceededError.js
- backend/utils/apiCache.js
- backend/utils/apiQueue.js
- backend/utils/apiUsageLimiter.js
- backend/utils/keyPool.js
- backend/utils/providerCircuitBreaker.js
- backend/utils/rapidApiWaterfall.js
- backend/utils/availability.js
- backend/utils/weather.js
- backend/providers/football/bigBallsDataProvider.js
- backend/providers/football/bsdProvider.js
- backend/providers/football/bzzoiroProvider.js
- backend/providers/football/soccerDataApiProvider.js
- backend/providers/football/sportsApiProFootballAdapter.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple B04 utilities manage external API access concerns: cache, queueing, usage limiting, key pools, circuit breaking, provider quota errors, RapidAPI waterfall, availability, and weather enrichment.
- B06 provider files also implement external football provider access surfaces.
- The evidence proves broad provider-access overlap across utility and provider layers.
- Some overlap may be architectural layering, but the provider-access boundary is not singular.

Decision:
- Major provider-access overlap is proven.
- No provider retirement, deletion, dependency update, or security work is authorized.
- Carry forward as a future external-provider boundary/canonicalization candidate.

Candidate group 6: football provider and normalizer families

Assets:
- backend/providers/football/bigBallsDataProvider.js
- backend/providers/football/bigBallsDataNormalizer.js
- backend/providers/football/bsdProvider.js
- backend/providers/football/bsdNormalizer.js
- backend/providers/football/bzzoiroProvider.js
- backend/providers/football/bzzoiroNormalizer.js
- backend/providers/football/soccerDataApiProvider.js
- backend/providers/football/soccerDataApiNormalizer.js
- backend/providers/football/sportsApiProFootballAdapter.js
- backend/providers/football/sportsApiProFootballNormalizer.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- B06 contains repeated provider/normalizer pairs for multiple football providers.
- The files share provider, provider fixture ID, league ID, event ID, and normalization vocabulary.
- Several providers explicitly state disabled or not connected to prediction/canonical ingest behavior.
- This proves repeated pattern overlap, but each provider/normalizer pair handles a different external source.

Decision:
- Keep separate for now.
- No merge group is selected solely because provider adapter patterns repeat.
- Carry forward as provider-boundary review evidence.

Candidate group 7: sports normalization and ingestion scripts

Assets:
- backend/parsers/base_sport_parser.py
- backend/workers/now_api_pulse.py
- backend/scripts/bridge_frontend.py
- backend/scripts/generate_vip_master.py
- backend/scripts/ingest_football.py
- backend/scripts/populate_sports_data.py
- backend/scripts/sync-sportsrc-fixtures.js
- backend/scripts/requirements.txt
- backend/utils/sportsrcNormalizer.js
- backend/audit/system_integrity_audit.md

Outcome:
- PARTIAL_OVERLAP

Evidence:
- Python scripts and parser/worker files share ingestion, Supabase, football, provider, and prediction-context vocabulary.
- backend/audit/system_integrity_audit.md documents ingestion-to-frontend gaps and Supabase compatibility.
- backend/scripts/ingest_football.py and populate_sports_data.py use Supabase and external football/sports data workflows.
- backend/scripts/sync-sportsrc-fixtures.js and backend/utils/sportsrcNormalizer.js relate to SportsRC fixture synchronization/normalization.

Decision:
- Functional relationship is proven, but same-job overlap is not fully proven by this scan.
- Keep separate.
- No script execution, deletion, or consolidation is authorized.

Distinct-role findings:
- backend/errors/ProviderQuotaExceededError.js is a provider quota error class; related to provider utilities but not a same-job provider adapter.
- backend/logic/edgeMind_manifest.json is EdgeMind logic metadata; no same-job B04-B06 file proven.
- backend/middleware/supabaseJwt.js is authentication/subscription middleware; no same-job B04-B06 file proven.
- backend/utils/auth.js is request key/role helper logic; related to authentication but not proven duplicate of supabaseJwt.js.
- backend/utils/contextInsights.js, dateNormalization.js, pipelineLogger.js, sportsrcNormalizer.js, weather.js, and availability.js each provide domain utility roles with partial pipeline/provider relationships only.
- backend/scripts/test_ai_providers.py and backend/scripts/test_ai_real_matches.py are AI provider/manual test scripts; no same-job B04-B06 merge group proven.

Batch decision:
- B04-B06 contains proven functional overlap candidates.
- Potential future canonicalization candidates are recorded for ACCA/rule authority, database/cache/job utilities, provider-access utilities, semantic boundary, and provider adapter families.
- No cleanup action is authorized by this outcome.
- B04-B06 Phase 5 evidence is closed.
- Next batch group: B07-B10.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - B07-B10 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

## PHASE 6 - B07-B10 CANONICAL AUTHORITY SELECTION EVIDENCE

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Candidate group 1: pipeline, sync, scheduler, and execution orchestration

Phase 6 decisions:
- backend/services/syncService.js: CANONICAL_KEEP - distinct orchestration authority.
- backend/services/cronJobs.js: CANONICAL_KEEP - distinct scheduler authority.
- backend/services/thesportsdbPipeline.js: CANONICAL_KEEP - distinct pipeline authority.
- backend/services/pipelineMetricsService.js: CANONICAL_KEEP - distinct pipeline health authority.
- backend/services/systemTruthLogger.js: CANONICAL_KEEP - distinct execution truth/logging authority.
- scripts/gatekeeper-pipeline.js: NEEDS_RUNTIME_PROOF - audit/gatekeeper script, not canonical runtime authority.
- scripts/audit-execution-spine.js: NEEDS_RUNTIME_PROOF - audit script, not canonical runtime authority.

Candidate group 2: provider access, provider quota, RapidAPI, and cache boundaries

Phase 6 decisions:
- backend/services/dataProvider.js: CANONICAL_KEEP - provider acquisition boundary.
- backend/services/dataProviders.js: CANONICAL_KEEP - provider acquisition/cache boundary.
- backend/services/providerQuotaService.js: CANONICAL_KEEP - provider quota boundary.
- backend/services/quotaPlanner.js: CANONICAL_KEEP - quota planning boundary.
- backend/services/oddsBudgetService.js: CANONICAL_KEEP - provider budget boundary.
- backend/services/divanscoreService.js: CANONICAL_KEEP - provider-specific service authority.
- backend/services/metrxFactoryService.js: CANONICAL_KEEP - provider-specific service authority.
- backend/services/football536Service.js: CANONICAL_KEEP - provider-specific service authority.
- backend/services/freeLivescoreApiService.js: CANONICAL_KEEP - provider-specific service authority.
- backend/services/liveFootballApiService.js: CANONICAL_KEEP - provider-specific service authority.
- backend/services/sportsApiProFootballService.js: CANONICAL_KEEP - provider-specific service authority.
- backend/services/proFootballDataService.js: CANONICAL_KEEP - provider-specific service authority.
- backend/services/soccerDataApiClient.js: CANONICAL_KEEP - provider-boundary client authority.
- backend/services/sportsrcHealthService.js: CANONICAL_KEEP - provider health boundary.
- scripts/audit-api-call-map.js: NEEDS_RUNTIME_PROOF - audit/discovery script, not canonical authority.
- scripts/audit-api-sports-usage.js: NEEDS_RUNTIME_PROOF - audit/discovery script, not canonical authority.
- scripts/audit-bigballs-discovery.js: NEEDS_RUNTIME_PROOF - discovery script, not canonical authority.
- scripts/audit-bsd-discovery.js: NEEDS_RUNTIME_PROOF - discovery script, not canonical authority.
- scripts/audit-bsd-league-inventory.js: NEEDS_RUNTIME_PROOF - discovery script, not canonical authority.
- scripts/audit-soccerdata-discovery.js: NEEDS_RUNTIME_PROOF - discovery script, not canonical authority.

Direct-provider retirement remains blocked for later provider-boundary work.

Candidate group 3: cricket service boundary

Phase 6 decisions:
- backend/services/cricApiCacheService.js: CANONICAL_KEEP - cricket cache authority.
- backend/services/cricbuzzService.js: CANONICAL_KEEP - cricket feed authority.
- backend/services/cricketLiveEnrichmentService.js: CANONICAL_KEEP - cricket live-enrichment authority.
- backend/services/cricketLiveMatchResolver.js: CANONICAL_KEEP - cricket live resolver authority.
- backend/services/cricketRulesEngine.js: CANONICAL_KEEP - cricket rules authority.
- scripts/audit-cricket-final-tables.js: NEEDS_RUNTIME_PROOF - cricket audit script, not canonical authority.
- scripts/audit-cricket-rules.js: NEEDS_RUNTIME_PROOF - cricket audit script, not canonical authority.
- scripts/audit-cricket-storage.js: NEEDS_RUNTIME_PROOF - cricket audit script, not canonical authority.
- scripts/audit-cricket-tables.js: NEEDS_RUNTIME_PROOF - cricket audit script, not canonical authority.

Candidate group 4: football provider, extractor, ranking, and enrichment surfaces

Phase 6 decisions:
- backend/services/football536Extractor.js: CANONICAL_KEEP - football extractor authority.
- backend/services/football536Service.js: CANONICAL_KEEP - football provider service authority.
- backend/services/footballH2HExtractor.js: CANONICAL_KEEP - football extractor authority.
- backend/services/footballHighlightsService.js: CANONICAL_KEEP - football enrichment authority.
- backend/services/footballRankExtractor.js: CANONICAL_KEEP - football ranking authority.
- backend/services/footballRiskTierMapper.js: CANONICAL_KEEP - football ranking/risk authority.
- backend/services/freeLivescoreApiExtractor.js: CANONICAL_KEEP - football extractor authority.
- backend/services/freeLivescoreApiService.js: CANONICAL_KEEP - football provider service authority.
- backend/services/liveFootballApiExtractor.js: CANONICAL_KEEP - football extractor authority.
- backend/services/liveFootballApiService.js: CANONICAL_KEEP - football provider service authority.
- backend/services/sportsApiProFootballExtractor.js: CANONICAL_KEEP - football extractor authority.
- backend/services/sportsApiProFootballService.js: CANONICAL_KEEP - football provider service authority.
- backend/services/sportsLiveScoresExtractor.js: CANONICAL_KEEP - football extractor authority.
- backend/services/sportsLiveScoresService.js: CANONICAL_KEEP - football provider service authority.
- scripts/audit-bigballs-discovery.js: NEEDS_RUNTIME_PROOF - football discovery script, not canonical authority.
- scripts/audit-bsd-discovery.js: NEEDS_RUNTIME_PROOF - football discovery script, not canonical authority.
- scripts/audit-bsd-league-inventory.js: NEEDS_RUNTIME_PROOF - football discovery script, not canonical authority.
- scripts/audit-soccerdata-discovery.js: NEEDS_RUNTIME_PROOF - football discovery script, not canonical authority.

Candidate group 5: prediction, market, ACCA, rulebook, and scoring surfaces

Phase 6 decisions:
- backend/services/direct1x2Builder.js: CANONICAL_KEEP - direct prediction builder authority.
- backend/services/direct1x2Engine.js: CANONICAL_KEEP - direct prediction engine authority.
- backend/services/filterEngine.js: CANONICAL_KEEP - market filtering authority.
- backend/services/marketIntelligence.js: CANONICAL_KEEP - market intelligence authority.
- backend/services/marketScoringEngine.js: CANONICAL_KEEP - market scoring authority.
- backend/services/masterRulebookRiskClassification.js: CANONICAL_KEEP - rulebook risk authority.
- backend/services/reEvaluationEngine.js: CANONICAL_KEEP - re-evaluation authority.
- backend/services/safeHavenSelector.js: CANONICAL_KEEP - safe-haven selection authority.
- backend/services/saveDirectInsights.js: CANONICAL_KEEP - insight persistence authority.
- backend/services/unifiedPredictionsService.js: CANONICAL_KEEP - unified prediction access authority.
- backend/services/unifiedRulesService.js: CANONICAL_KEEP - unified rules access authority.
- scripts/audit-football-rules-alignment.js: NEEDS_RUNTIME_PROOF - rule audit script, not canonical authority.
- scripts/audit-sport-values.js: NEEDS_RUNTIME_PROOF - rule audit script, not canonical authority.
- scripts/secondary-market-gatekeeper.js: NEEDS_RUNTIME_PROOF - secondary-market gatekeeper script, not canonical authority.

Candidate group 6: grading, accuracy, semantic drift, and operational health

Phase 6 decisions:
- backend/services/gradingAccuracyCore.js: CANONICAL_KEEP - grading authority.
- backend/services/gradingSnapshotService.js: CANONICAL_KEEP - grading snapshot authority.
- backend/services/semanticDriftSummaryService.js: CANONICAL_KEEP - semantic drift authority.
- backend/services/pipelineMetricsService.js: CANONICAL_KEEP - operational health authority.
- backend/services/systemTruthLogger.js: CANONICAL_KEEP - execution truth logging authority.
- scripts/audit-grading-pipeline.js: NEEDS_RUNTIME_PROOF - grading audit script, not canonical authority.
- scripts/audit-placeholders-and-insights.js: NEEDS_RUNTIME_PROOF - QA audit script, not canonical authority.
- scripts/master-qa.js: NEEDS_RUNTIME_PROOF - QA script, not canonical authority.

Candidate group 7: unified data access surfaces

Phase 6 decisions:
- backend/services/unifiedFixturesService.js: CANONICAL_KEEP - unified fixture access authority.
- backend/services/unifiedPredictionsService.js: CANONICAL_KEEP - unified prediction access authority.
- backend/services/unifiedRulesService.js: CANONICAL_KEEP - unified rules access authority.
- backend/services/normalizerService.js: CANONICAL_KEEP - normalization authority.
- backend/services/saveContextData.js: CANONICAL_KEEP - context persistence authority.
- backend/services/saveDirectInsights.js: CANONICAL_KEEP - insight persistence authority.

Candidate group 8: Control Center read service bridge

Phase 6 decisions:
- backend/services/controlCenterReadService.js: CANONICAL_KEEP - backend read bridge authority.
- control-center/check_control_center.js: CANONICAL_KEEP - governance checker authority.
- control-center/check_edge_asset_classification.js: CANONICAL_KEEP - governance checker authority.
- control-center/check_edge_system_runtime_inventory.js: CANONICAL_KEEP - governance checker authority.

Operational holds:
- scripts/apply-db-governance.js: NEEDS_RUNTIME_PROOF - database mutation-capable script, not canonical authority.
- scripts/apply-migrations.js: NEEDS_RUNTIME_PROOF - database mutation-capable script, not canonical authority.
- These scripts must not be executed in this phase.

## PHASE 6 - B11-B14 CANONICAL AUTHORITY SELECTION EVIDENCE

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Existing runtime/service authorities from earlier B04-B06 and B07-B10 decisions remain CANONICAL_KEEP where already recorded.
This packet records the script-heavy B11-B14 overlap candidates only and does not replace earlier authorities with scripts.

Candidate group 1: AI prediction endpoint tests and traces

Phase 6 decisions:
- scripts/test-final-endpoint.js: NEEDS_RUNTIME_PROOF - diagnostic test surface, not canonical runtime authority.
- scripts/test-fixed-ai-predictions.js: NEEDS_RUNTIME_PROOF - diagnostic test surface, not canonical runtime authority.
- scripts/test-fixed-endpoint.js: NEEDS_RUNTIME_PROOF - diagnostic test surface, not canonical runtime authority.
- scripts/trace-data-flow.js: NEEDS_RUNTIME_PROOF - trace surface, not canonical runtime authority.
- scripts/trace-filtering-rules.js: NEEDS_RUNTIME_PROOF - trace surface, not canonical runtime authority.
- scripts/trace-filtering-timestamp.js: NEEDS_RUNTIME_PROOF - trace surface, not canonical runtime authority.

Candidate group 2: provider endpoint tests and discovery scripts

Phase 6 decisions:
- scripts/test-fetch.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-network.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-football536-endpoints.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-football536-fixtures-normalizer.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-free-livescore-fixtures.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-free-livescore-search.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-live-football-api-priority.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-metrx-factory-top-metrics.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-metrx-top-metrics.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-pro-football-api.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-optimized-endpoints.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-sportsapi-pro-football.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-sportsapi-pro-football-adapter.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-sportsapi-pro-football-joinability.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-sports-live-rankings.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-sportsrc-fixtures.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-sportsrc-health.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-sportsrc-odds.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/test-thesportsdb-endpoints.js: NEEDS_RUNTIME_PROOF - provider test surface, not canonical runtime authority.
- scripts/discover-free-livescore-endpoints.js: NEEDS_RUNTIME_PROOF - discovery script, not canonical runtime authority.

Candidate group 3: pipeline run, trigger, scheduler, and stage scripts

Phase 6 decisions:
- scripts/test-fixed-pipeline.js: NEEDS_RUNTIME_PROOF - pipeline test surface, not canonical runtime authority.
- scripts/test-pipeline-integration.js: NEEDS_RUNTIME_PROOF - pipeline test surface, not canonical runtime authority.
- scripts/test-weather-pipeline.js: NEEDS_RUNTIME_PROOF - pipeline test surface, not canonical runtime authority.
- scripts/run-pipeline.js: NEEDS_RUNTIME_PROOF - pipeline runner, not canonical runtime authority.
- scripts/run-master-pipeline.js: NEEDS_RUNTIME_PROOF - pipeline runner, not canonical runtime authority.
- scripts/run-pipeline-from-context-pack.js: NEEDS_RUNTIME_PROOF - pipeline runner, not canonical runtime authority.
- scripts/run-stage1-math.js: NEEDS_RUNTIME_PROOF - stage script, not canonical runtime authority.
- scripts/run-stage2-context.js: NEEDS_RUNTIME_PROOF - stage script, not canonical runtime authority.
- scripts/run-stage3-volatility.js: NEEDS_RUNTIME_PROOF - stage script, not canonical runtime authority.
- scripts/run-test.js: NEEDS_RUNTIME_PROOF - test runner, not canonical runtime authority.
- scripts/run-scheduled-sync.js: NEEDS_RUNTIME_PROOF - scheduler script, not canonical runtime authority.
- scripts/scheduler.js: NEEDS_RUNTIME_PROOF - scheduler script, not canonical runtime authority.
- scripts/external-scheduler.js: NEEDS_RUNTIME_PROOF - scheduler script, not canonical runtime authority.
- scripts/_trigger-sync.js: NEEDS_RUNTIME_PROOF - trigger script, not canonical runtime authority.
- scripts/trigger-pipeline-sync.js: NEEDS_RUNTIME_PROOF - trigger script, not canonical runtime authority.
- scripts/trigger-refresh.js: NEEDS_RUNTIME_PROOF - trigger script, not canonical runtime authority.
- scripts/wake-and-sync.js: NEEDS_RUNTIME_PROOF - trigger script, not canonical runtime authority.

Candidate group 4: grading, settlement, accuracy, and publication scripts

Phase 6 decisions:
- scripts/trigger-grade.js: NEEDS_RUNTIME_PROOF - grading trigger script, not canonical runtime authority.
- scripts/trigger-settlement.js: NEEDS_RUNTIME_PROOF - settlement trigger script, not canonical runtime authority.
- scripts/trigger-publication.js: NEEDS_RUNTIME_PROOF - publication trigger script, not canonical runtime authority.
- scripts/backfill-prediction-grading.js: NEEDS_RUNTIME_PROOF - accuracy backfill script, not canonical runtime authority.
- scripts/backfill-predictions-accuracy.js: NEEDS_RUNTIME_PROOF - accuracy backfill script, not canonical runtime authority.
- scripts/bridge-raw-predictions-for-grading.js: NEEDS_RUNTIME_PROOF - grading bridge script, not canonical runtime authority.
- scripts/test-final-endpoint.js: NEEDS_RUNTIME_PROOF - publication/endpoint validation script, not canonical runtime authority.
- scripts/test-fixed-endpoint.js: NEEDS_RUNTIME_PROOF - publication/endpoint validation script, not canonical runtime authority.

Candidate group 5: database migration, backfill, bridge, and governance scripts

Phase 6 decisions:
- scripts/apply-db-governance.js: NEEDS_RUNTIME_PROOF - mutation-capable script, not canonical runtime authority.
- scripts/apply-migrations.js: NEEDS_RUNTIME_PROOF - mutation-capable script, not canonical runtime authority.
- scripts/run-migration.js: NEEDS_RUNTIME_PROOF - migration runner, not canonical runtime authority.
- scripts/backfill-direct1x2-final-fields.js: NEEDS_RUNTIME_PROOF - backfill script, not canonical runtime authority.
- scripts/backfill-fixture-ids.js: NEEDS_RUNTIME_PROOF - backfill script, not canonical runtime authority.
- scripts/backfill-football-context.js: NEEDS_RUNTIME_PROOF - backfill script, not canonical runtime authority.
- scripts/backfill-provider-event-id.js: NEEDS_RUNTIME_PROOF - backfill script, not canonical runtime authority.
- scripts/bridge-to-final.sql: NEEDS_RUNTIME_PROOF - bridge SQL, not canonical runtime authority.
- scripts/brute-force-ingest.js: NEEDS_RUNTIME_PROOF - brute-force ingest script, not canonical runtime authority.

Candidate group 6: cricket and RapidAPI cricket scripts

Phase 6 decisions:
- scripts/cricapi-cache-refresh.js: NEEDS_RUNTIME_PROOF - cricket script, not canonical runtime authority.
- scripts/test-livescore6-cricket-provider.js: NEEDS_RUNTIME_PROOF - cricket provider test script, not canonical runtime authority.
- scripts/start-rapidapi-cricket-mcp.js: NEEDS_RUNTIME_PROOF - RapidAPI cricket launcher script, not canonical runtime authority.

Candidate group 7: context-pack, enrichment, and football context scripts

Phase 6 decisions:
- scripts/compose-context-pack.js: NEEDS_RUNTIME_PROOF - context-pack script, not canonical runtime authority.
- scripts/run-pipeline-from-context-pack.js: NEEDS_RUNTIME_PROOF - context-pack runner, not canonical runtime authority.
- scripts/enrich-lineups.js: NEEDS_RUNTIME_PROOF - enrichment script, not canonical runtime authority.
- scripts/enrich-team-form.js: NEEDS_RUNTIME_PROOF - enrichment script, not canonical runtime authority.
- scripts/sync-ucl-context.js: NEEDS_RUNTIME_PROOF - football-context sync script, not canonical runtime authority.
- scripts/sync-bsd-enrichment.js: NEEDS_RUNTIME_PROOF - football-context sync/persistence script, not canonical runtime authority.

B11-B14 outcome: script-heavy overlap recorded; all script candidates are held behind NEEDS_RUNTIME_PROOF unless already proven as a non-script governance helper in prior packets.

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B07-B10
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- Batch group: B07-B10
- Start HEAD: 427ccfce
- Compact overlap scan inspected backend service assets, provider-service assets, unified service assets, audit scripts, gatekeeper scripts, and rule/market/prediction scripts.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: pipeline, sync, scheduler, and execution orchestration

Assets:
- backend/services/syncService.js
- backend/services/cronJobs.js
- backend/services/thesportsdbPipeline.js
- backend/services/dataProvider.js
- backend/services/hybridSportsDataService.js
- backend/services/pipelineMetricsService.js
- backend/services/systemTruthLogger.js
- scripts/gatekeeper-pipeline.js
- scripts/audit-execution-spine.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- syncService.js coordinates aiPipeline, dataProvider, canonicalEvents, dataProviders cache wall, normalizerService, quotaPlanner, executionPipeline, verificationController, and pipelineLogger.
- cronJobs.js schedules automated pipeline tasks and uses thesportsdbPipeline, apiQueue, database access, governance gatekeeper, pipeline metrics, and executionPipeline.
- thesportsdbPipeline.js describes a data pipeline with fixture sync, context enrichment, and EdgeMind insight generation.
- pipelineMetricsService.js and systemTruthLogger.js inspect or log pipeline health and execution truth.
- scripts/gatekeeper-pipeline.js and audit-execution-spine.js overlap with execution-pipeline governance and audit boundaries.

Decision:
- Major functional overlap is proven across pipeline orchestration, scheduler, truth logging, and audit surfaces.
- No canonical pipeline authority is selected in Phase 5.
- No refactor, deletion, merge, or behavior change is authorized.
- Carry forward as a future pipeline-boundary/canonicalization candidate.

Candidate group 2: provider access, provider quota, RapidAPI, and cache boundaries

Assets:
- backend/services/dataProvider.js
- backend/services/dataProviders.js
- backend/services/providerQuotaService.js
- backend/services/quotaPlanner.js
- backend/services/oddsBudgetService.js
- backend/services/divanscoreService.js
- backend/services/metrxFactoryService.js
- backend/services/football536Service.js
- backend/services/freeLivescoreApiService.js
- backend/services/liveFootballApiService.js
- backend/services/sportsApiProFootballService.js
- backend/services/proFootballDataService.js
- backend/services/soccerDataApiClient.js
- backend/services/sportsrcHealthService.js
- scripts/audit-api-call-map.js
- scripts/audit-api-sports-usage.js
- scripts/audit-v2-provider-coverage.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple service files configure external provider hosts, keys, cache, quota, pacing, provider fallback, provider health, and RapidAPI access.
- providerQuotaService.js records rapidapi_quota_usage.
- quotaPlanner.js plans provider usage from provider quota state.
- oddsBudgetService.js manages odds/provider usage budget.
- dataProvider.js and dataProviders.js both represent provider acquisition/routing concerns.
- Audit scripts inspect API call maps, API-Sports usage, and provider coverage.

Decision:
- Major functional overlap is proven across provider access and quota governance surfaces.
- No provider retirement or dependency/security change is authorized.
- Carry forward as a future external-provider boundary/canonicalization candidate.

Candidate group 3: cricket service boundary

Assets:
- backend/services/cricApiCacheService.js
- backend/services/cricbuzzService.js
- backend/services/cricketLiveEnrichmentService.js
- backend/services/cricketLiveMatchResolver.js
- backend/services/cricketRulesEngine.js
- scripts/audit-cricket-final-tables.js
- scripts/audit-cricket-rules.js
- scripts/audit-cricket-storage.js
- scripts/audit-cricket-tables.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- cricApiCacheService.js writes and reads cricket_data.json cache material.
- cricbuzzService.js calls Cricbuzz RapidAPI feeds and validates cricket match data.
- cricketLiveEnrichmentService.js and cricketLiveMatchResolver.js both use cricket-live-line-advance RapidAPI and ingestion gates.
- cricketRulesEngine.js controls cricket market rules/confidence bands/risk tiers.
- Cricket audit scripts inspect cricket tables, storage, and rules.

Decision:
- Cricket functional overlap is proven across cache, live resolver, enrichment, rules, and audit surfaces.
- No consolidation, deletion, or database action is authorized.
- Carry forward as a future cricket-service boundary candidate.

Candidate group 4: football provider, extractor, ranking, and enrichment surfaces

Assets:
- backend/services/football536Extractor.js
- backend/services/football536Service.js
- backend/services/footballH2HExtractor.js
- backend/services/footballHighlightsService.js
- backend/services/footballRankExtractor.js
- backend/services/footballRiskTierMapper.js
- backend/services/freeLivescoreApiExtractor.js
- backend/services/freeLivescoreApiService.js
- backend/services/liveFootballApiExtractor.js
- backend/services/liveFootballApiService.js
- backend/services/sportsApiProFootballExtractor.js
- backend/services/sportsApiProFootballService.js
- backend/services/sportsLiveScoresExtractor.js
- backend/services/sportsLiveScoresService.js
- scripts/audit-bigballs-discovery.js
- scripts/audit-bsd-discovery.js
- scripts/audit-bsd-league-inventory.js
- scripts/audit-soccerdata-discovery.js
- scripts/audit-soccerdata-summer-coverage.js
- scripts/audit-sportsdataio-boundary.ps1

Outcome:
- MAJOR_OVERLAP

Evidence:
- Several services and extractors normalize football provider payloads, classify provider responses, extract fixture/ranking/odds/prediction-like data, and manage provider-specific RapidAPI configuration.
- Discovery/audit scripts inspect provider coverage, boundaries, and league inventories.
- Some repeated provider/extractor pattern is expected, but the number of provider-specific boundaries is high.

Decision:
- Major provider-boundary overlap is proven.
- No provider is selected as canonical in Phase 5.
- No provider deletion, merge, or retirement is authorized.
- Carry forward as a future football-provider boundary/canonicalization candidate.

Candidate group 5: prediction, market, ACCA, rulebook, and scoring surfaces

Assets:
- backend/services/direct1x2Builder.js
- backend/services/direct1x2Engine.js
- backend/services/filterEngine.js
- backend/services/marketIntelligence.js
- backend/services/marketScoringEngine.js
- backend/services/masterRulebookRiskClassification.js
- backend/services/reEvaluationEngine.js
- backend/services/safeHavenSelector.js
- backend/services/saveDirectInsights.js
- backend/services/unifiedPredictionsService.js
- backend/services/unifiedRulesService.js
- scripts/audit-football-rules-alignment.js
- scripts/audit-sport-values.js
- scripts/secondary-market-gatekeeper.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- direct1x2Builder.js builds and saves prediction output, uses secondary markets, AI provider, football rules, config, Supabase, and executionPipeline.
- direct1x2Engine.js evaluates 1X2 predictions and ACCA eligibility using football rules.
- marketIntelligence.js, marketScoringEngine.js, masterRulebookRiskClassification.js, safeHavenSelector.js, and secondary-market-gatekeeper.js all touch market/rule/scoring boundaries.
- unifiedPredictionsService.js and unifiedRulesService.js provide cross-sport prediction/rule access surfaces.
- audit-football-rules-alignment.js checks rule alignment across runtime services.

Decision:
- Major rule/prediction/market overlap is proven.
- No canonical rulebook or market-scoring authority is selected in Phase 5.
- No rule threshold, prediction behavior, or ACCA behavior is changed.
- Carry forward as a future prediction/rule-authority canonicalization candidate.

Candidate group 6: grading, accuracy, semantic drift, and operational health

Assets:
- backend/services/gradingAccuracyCore.js
- backend/services/gradingSnapshotService.js
- backend/services/semanticDriftSummaryService.js
- backend/services/pipelineMetricsService.js
- backend/services/systemTruthLogger.js
- scripts/audit-grading-pipeline.js
- scripts/audit-placeholders-and-insights.js
- scripts/master-qa.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- gradingAccuracyCore.js and gradingSnapshotService.js both support grading/accuracy surfaces.
- semanticDriftSummaryService.js summarizes semantic drift and pipeline/provider context.
- pipelineMetricsService.js and systemTruthLogger.js inspect execution/pipeline health.
- Audit and QA scripts inspect grading pipeline and quality surfaces.

Decision:
- Partial overlap is proven across operational health, grading, and QA/audit surfaces.
- No merge group is selected yet.
- Carry forward as operational-reporting boundary evidence.

Candidate group 7: unified data access surfaces

Assets:
- backend/services/unifiedFixturesService.js
- backend/services/unifiedPredictionsService.js
- backend/services/unifiedRulesService.js
- backend/services/normalizerService.js
- backend/services/saveContextData.js
- backend/services/saveDirectInsights.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- unifiedFixturesService.js, unifiedPredictionsService.js, and unifiedRulesService.js provide unified read surfaces over fixture, prediction, and rule tables.
- normalizerService.js normalizes provider data into match-context shape.
- saveContextData.js and saveDirectInsights.js persist context/insight data to Supabase.
- These files overlap around canonical data access and persistence boundaries.

Decision:
- Functional overlap is proven.
- No data-access architecture decision is made in Phase 5.
- No SQL or Supabase mutation is authorized.
- Carry forward as a future unified-data-access boundary candidate.

Candidate group 8: Control Center read service bridge

Assets:
- backend/services/controlCenterReadService.js
- control-center/check_edge_asset_classification.js
- control-center/check_control_center.js
- control-center/check_edge_system_runtime_inventory.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- controlCenterReadService.js reads and caches Control Center, EAC, and runtime checker outputs for backend/API consumption.
- It overlaps with Control Center checkers by consuming their outputs, but it is a backend read bridge rather than the governance checker authority.

Decision:
- Keep separate.
- No merge or refactor is authorized.
- Carry forward only as a backend/governance bridge boundary note.

Distinct-role findings:
- backend/services/subscriptionTiming.js is subscription timing/status logic; no B07-B10 same-job merge group proven.
- backend/services/tier1BootstrapService.js and backend/services/tier1SchemaProfile.js relate to Tier 1 schema/profile/provisioning and are not proven duplicates of the main provider services by this scan.
- backend/services/contradictionGovernance.js is market contradiction governance; it relates to market/rule surfaces but is not separately selected as a merge group in this packet.
- scripts/apply-db-governance.js and scripts/apply-migrations.js are database mutation-capable scripts but were not executed and are not remediated in Phase 5.
- scripts/audit-database.js, audit-table-usage.js, audit-v2-foundation.js, and audit-v2-identity-deep.js are database audit scripts; their overlap is recorded as audit/runtime evidence only.

Batch decision:
- B07-B10 contains proven functional overlap candidates.
- Potential future canonicalization candidates are recorded for pipeline orchestration, provider access/quota, cricket services, football provider/extractor surfaces, prediction/rule/market authority, operational reporting, unified data access, and Control Center backend bridge boundaries.
- No cleanup action is authorized by this outcome.
- B07-B10 Phase 5 evidence is closed.
- Next batch group: B11-B14.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - B11-B14 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B11-B14
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- Batch group: B11-B14
- Start HEAD: 6b4677d2
- Compact overlap scan inspected script-heavy check, validate, verify, test, diagnostic, trace, run, trigger, scheduler, sync, ingest, enrichment, and backfill assets.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: AI prediction endpoint tests and traces

Assets:
- scripts/test-final-endpoint.js
- scripts/test-fixed-ai-predictions.js
- scripts/test-fixed-endpoint.js
- scripts/trace-data-flow.js
- scripts/trace-filtering-rules.js
- scripts/trace-filtering-timestamp.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Multiple scripts test or trace AI prediction endpoint behavior.
- Several scripts query ai_predictions, direct1x2_prediction_final, predictions_raw, and predictions_filtered.
- The scripts overlap around endpoint validation, prediction-table lookup, fallback behavior, and data-flow diagnosis.

Decision:
- Functional overlap is proven.
- No test script is selected as canonical in Phase 5.
- No deletion, merge, or refactor is authorized.
- Carry forward as a future test/trace consolidation candidate.

Candidate group 2: provider endpoint tests and discovery scripts

Assets:
- scripts/test-fetch.js
- scripts/test-network.js
- scripts/test-football536-endpoints.js
- scripts/test-football536-fixtures-normalizer.js
- scripts/test-free-livescore-fixtures.js
- scripts/test-free-livescore-search.js
- scripts/test-live-football-api-priority.js
- scripts/test-metrx-factory-top-metrics.js
- scripts/test-metrx-top-metrics.js
- scripts/test-pro-football-api.js
- scripts/test-optimized-endpoints.js
- scripts/test-sportsapi-pro-football.js
- scripts/test-sportsapi-pro-football-adapter.js
- scripts/test-sportsapi-pro-football-joinability.js
- scripts/test-sports-live-rankings.js
- scripts/test-sportsrc-fixtures.js
- scripts/test-sportsrc-health.js
- scripts/test-sportsrc-odds.js
- scripts/test-thesportsdb-endpoints.js
- scripts/discover-free-livescore-endpoints.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- These scripts test, discover, or verify external provider endpoints and provider-specific extractors/adapters.
- Providers include API-Sports, Football536, Free Livescore, Live Football API, Metrx Factory, Pro Football, SportsAPI Pro Football, Sports Live Scores, SportSRC, and TheSportsDB.
- Several scripts load provider services/extractors and test fixture, ranking, odds, prediction, health, or search endpoint behavior.

Decision:
- Major provider-test overlap is proven.
- No provider test script is selected as canonical in Phase 5.
- No provider retirement, endpoint change, dependency update, or security work is authorized.
- Carry forward as a future provider-test/discovery consolidation candidate.

Candidate group 3: pipeline run, trigger, scheduler, and stage scripts

Assets:
- scripts/test-fixed-pipeline.js
- scripts/test-pipeline-integration.js
- scripts/test-weather-pipeline.js
- scripts/run-pipeline.js
- scripts/run-master-pipeline.js
- scripts/run-pipeline-from-context-pack.js
- scripts/run-stage1-math.js
- scripts/run-stage2-context.js
- scripts/run-stage3-volatility.js
- scripts/run-test.js
- scripts/run-scheduled-sync.js
- scripts/scheduler.js
- scripts/external-scheduler.js
- scripts/_trigger-sync.js
- scripts/trigger-pipeline-sync.js
- scripts/trigger-refresh.js
- scripts/wake-and-sync.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple scripts trigger, schedule, test, or run SKCS pipeline flows.
- Several scripts call pipeline sync/status endpoints, run staged pipeline logic, or schedule recurring sync/build/resolve operations.
- Several scripts overlap with earlier pipeline orchestration candidates recorded in B07-B10.

Decision:
- Major pipeline runner/trigger overlap is proven.
- No canonical runner or scheduler is selected in Phase 5.
- No script is executed.
- No deletion, merge, refactor, deployment, or runtime behavior change is authorized.
- Carry forward as a future pipeline-runner canonicalization candidate.

Candidate group 4: grading, settlement, accuracy, and publication scripts

Assets:
- scripts/trigger-grade.js
- scripts/trigger-settlement.js
- scripts/trigger-publication.js
- scripts/backfill-prediction-grading.js
- scripts/backfill-predictions-accuracy.js
- scripts/bridge-raw-predictions-for-grading.js
- scripts/test-final-endpoint.js
- scripts/test-fixed-endpoint.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Several scripts trigger grading, settlement, publication, or backfill prediction accuracy data.
- These scripts overlap around direct1x2_prediction_final, predictions_accuracy, grading endpoints, and publication process validation.
- Some scripts are active trigger utilities while others are one-off backfill or validation helpers.

Decision:
- Functional overlap is proven.
- No grading/publication script is selected as canonical in Phase 5.
- No SQL or database mutation is authorized.
- Carry forward as a future grading/publication script-boundary candidate.

Candidate group 5: database migration, backfill, bridge, and governance scripts

Assets:
- scripts/apply-db-governance.js
- scripts/apply-migrations.js
- scripts/run-migration.js
- scripts/backfill-direct1x2-final-fields.js
- scripts/backfill-fixture-ids.js
- scripts/backfill-football-context.js
- scripts/backfill-provider-event-id.js
- scripts/bridge-to-final.sql
- scripts/brute-force-ingest.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple scripts are database mutation-capable or bridge/backfill data between prediction tables.
- Several scripts use pg Pool, backend/database, backend/db, or Supabase service keys.
- bridge-to-final.sql directly describes predictions_filtered to predictions_final bridging.
- brute-force-ingest.js contains a warning that it should not be used for clean football-only data.

Decision:
- Major database/backfill/bridge overlap is proven.
- No database script is executed.
- No SQL, migration, data repair, merge, deletion, or refactor is authorized.
- Carry forward as a future database-script safety/canonicalization candidate.

Candidate group 6: cricket and RapidAPI cricket scripts

Assets:
- scripts/cricapi-cache-refresh.js
- scripts/test-livescore6-cricket-provider.js
- scripts/start-rapidapi-cricket-mcp.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- These scripts overlap around cricket provider access, CricAPI cache refresh, RapidAPI cricket keys/hosts, and cricket provider testing.
- The overlap relates to the cricket-service boundary already recorded in B07-B10.

Decision:
- Partial cricket-provider script overlap is proven.
- No script execution, provider change, or credential/key work is authorized.
- Carry forward as cricket script-boundary evidence.

Candidate group 7: context-pack, enrichment, and football context scripts

Assets:
- scripts/compose-context-pack.js
- scripts/run-pipeline-from-context-pack.js
- scripts/enrich-lineups.js
- scripts/enrich-team-form.js
- scripts/sync-ucl-context.js
- scripts/sync-bsd-enrichment.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- These scripts compose or consume context packs, enrich football lineups/team form, sync UCL context, or persist BSD enrichment bundles.
- Several scripts overlap around provider context, football enrichment, match context, and cache/persistence boundaries.

Decision:
- Functional overlap is proven.
- No enrichment path is selected as canonical in Phase 5.
- No sync, ingest, or enrichment script is executed.
- Carry forward as a future context/enrichment script-boundary candidate.

Distinct-role findings:
- Scripts in this packet are mostly manual test, trigger, trace, sync, backfill, and diagnostic tools.
- Repeated provider/test/trigger patterns alone do not authorize deletion.
- Mutation-capable scripts are recorded as overlap/risk evidence only.
- No production behavior is changed by this Phase 5 evidence.

Batch decision:
- B11-B14 contains proven functional overlap candidates.
- Potential future canonicalization candidates are recorded for AI endpoint tests, provider endpoint tests, pipeline runners/triggers, grading/publication scripts, database backfill/bridge scripts, cricket provider scripts, and context/enrichment scripts.
- No cleanup action is authorized by this outcome.
- B11-B14 Phase 5 evidence is closed.
- Next batch group: B15-B18.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 6 - B15-B18 CANONICAL AUTHORITY SELECTION EVIDENCE

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Existing runtime/service authorities from earlier B04-B06 and B07-B10 decisions remain CANONICAL_KEEP where already recorded.
This packet records the B15-B18 documentation and diagnostic candidates only and does not replace earlier authorities with scripts.

Candidate group 1: Supabase, database, migration, and accuracy diagnostic surfaces

Phase 6 decisions:
- scripts/safe-migration-plan.js: NEEDS_RUNTIME_PROOF - migration planning diagnostic, not canonical authority.
- scripts/supabase_health_check.js: NEEDS_RUNTIME_PROOF - Supabase health check, not canonical authority.
- scripts/supabase-diagnostics.js: NEEDS_RUNTIME_PROOF - database diagnostic script, not canonical authority.
- scripts/track-prediction-accuracy.js: NEEDS_RUNTIME_PROOF - accuracy diagnostic script, not canonical authority.
- SUPABASE_DIAGNOSTIC_REPORT.md: NEEDS_RUNTIME_PROOF - database/Supabase report evidence, not canonical database authority.
- SUPABASE_TABLE_ANALYSIS.md: NEEDS_RUNTIME_PROOF - database/Supabase report evidence, not canonical database authority.
- SUPABASE_TABLES_SUMMARY.md: NEEDS_RUNTIME_PROOF - database/Supabase report evidence, not canonical database authority.
- COMPREHENSIVE_AUDIT_REPORT.md: NEEDS_RUNTIME_PROOF - database/Supabase report evidence, not canonical database authority.

No canonical database report is selected.

Candidate group 2: Master Rulebook, football rules, ACCA, SMB, and market governance documents

Phase 6 decisions:
- SKCS_MASTER_RULEBOOK.md: CANONICAL_KEEP - current Master Rulebook reference authority.
- STRICT_RULES.md: NEEDS_RUNTIME_PROOF - rules implementation/report document, not canonical authority.
- COMPREHENSIVE_FOOTBALL_RULES_REPORT.md: NEEDS_RUNTIME_PROOF - rules report document, not canonical authority.
- MASTER_RULEBOOK_IMPLEMENTATION_GUIDE.md: NEEDS_RUNTIME_PROOF - implementation guide, not canonical authority.
- docs/acca_rules_v2.1.md: NEEDS_RUNTIME_PROOF - ACCA rules document, not canonical authority.
- docs/skcs_grading_snapshot_v1.spec.md: NEEDS_RUNTIME_PROOF - grading snapshot spec, not canonical authority.
- Related implementation and report documents remain NEEDS_RUNTIME_PROOF before replacement, consolidation, or retirement.

Candidate group 3: Architecture, agent, README, dashboard, and workspace overview documents

Phase 6 decisions:
- README.md: CANONICAL_KEEP - root repository overview.
- AGENTS.md: CANONICAL_KEEP - agent/developer orientation surface.
- GEMINI.md: CANONICAL_KEEP - agent/developer orientation surface.
- ARCHITECTURE_OVERVIEW.md: CANONICAL_KEEP - architecture overview evidence.
- DASHBOARD_QUICK_START.md: NEEDS_RUNTIME_PROOF - dashboard guidance document, not canonical authority.
- DASHBOARD_REFACTOR_GUIDE.md: NEEDS_RUNTIME_PROOF - dashboard refactor document, not canonical authority.
- README_DASHBOARD_REFACTOR.md: NEEDS_RUNTIME_PROOF - dashboard refactor document, not canonical authority.
- IMPLEMENTATION_SUMMARY.md: NEEDS_RUNTIME_PROOF - implementation summary document, not canonical authority.
- FULL_WORKSPACE_AUDIT_REPORT.md: NEEDS_RUNTIME_PROOF - workspace overview report, not canonical authority.
- DEEPSEEK_SESSION_SKCSTEST.txt: NEEDS_RUNTIME_PROOF - DeepSeek session record, not canonical authority.
- DEEPSEEK_STATE.md: NEEDS_RUNTIME_PROOF - DeepSeek state document, not canonical authority.

Candidate group 4: Provider, ingestion, API quota, and sports data documentation

Phase 6 decisions:
- docs/canonical_ingest_firewall.spec.md: CANONICAL_KEEP - canonical ingest/firewall specification evidence.
- docs/api_quota_router.md: NEEDS_RUNTIME_PROOF - API quota routing document, not canonical authority.
- docs/cricket-providers.md: NEEDS_RUNTIME_PROOF - provider documentation, not canonical authority.
- docs/football-leagues-apisports.md: NEEDS_RUNTIME_PROOF - sports data documentation, not canonical authority.
- docs/provider-discovery/free-livescore-api.md: NEEDS_RUNTIME_PROOF - provider discovery document, not canonical authority.
- docs/providers/live-football-api-policy.md: NEEDS_RUNTIME_PROOF - provider policy document, not canonical authority.
- docs/sportsdataio-pre-match-directive.md: NEEDS_RUNTIME_PROOF - sports data directive, not canonical authority.
- docs/SKCS_ENGINE_V2_PHASE05_INGEST_MAP.md: NEEDS_RUNTIME_PROOF - Engine V2 ingest map, not canonical authority.
- docs/SKCS_ENGINE_V2_PHASE0B5_REPLAY.md: NEEDS_RUNTIME_PROOF - Engine V2 replay document, not canonical authority.
- README_DATA_INGESTION.md: NEEDS_RUNTIME_PROOF - ingestion overview document, not canonical authority.
- docs/DATA_INGESTION.md: NEEDS_RUNTIME_PROOF - ingestion documentation, not canonical authority.
- docs/README.md: NEEDS_RUNTIME_PROOF - docs index/reference surface, not canonical authority.

Candidate group 5: Semantic drift, control plane, runtime health, and degraded-state documentation

Phase 6 decisions:
- docs/alert-routing-degraded-state.md: CANONICAL_KEEP - degraded-state reference document.
- docs/blueprint-semantic-drift-control-plane.md: CANONICAL_KEEP - semantic/control-plane reference document.
- docs/control-plane-operational-pack.md: CANONICAL_KEEP - control-plane operational reference document.
- docs/pipeline-health-feed.md: CANONICAL_KEEP - runtime health reference document.
- docs/runbook_degraded_states.md: CANONICAL_KEEP - degraded-state runbook reference document.
- docs/SKCS_ENGINE_V2_ADR.md: NEEDS_RUNTIME_PROOF - older V2 ADR, not canonical authority.
- docs/SKCS_ENGINE_V2_PHASE0_DESIGN.md: NEEDS_RUNTIME_PROOF - older V2 design doc, not canonical authority.

Candidate group 6: Legal/product policy and public-facing subscription documents

Phase 6 decisions:
- PRIVACY_POLICY.md: CANONICAL_KEEP - root legal/product policy document.
- TERMS_OF_SERVICE.md: CANONICAL_KEEP - root legal/product policy document.
- No legal, subscription, prediction-content, user-data, analytics, refund, or service-boundary text is changed.

Distinct policy/config/deployment artifacts:
- MIGRATION_FREEZE.md: NEEDS_RUNTIME_PROOF - distinct policy artifact, not selected for cleanup.
- requirements.txt: NEEDS_RUNTIME_PROOF - distinct configuration artifact, not selected for cleanup.
- runtime.txt: NEEDS_RUNTIME_PROOF - distinct configuration artifact, not selected for cleanup.
- CRON_SETUP.md: NEEDS_RUNTIME_PROOF - distinct deployment setup artifact, not selected for cleanup.
- docs/DEPLOYMENT_GUIDE.md: NEEDS_RUNTIME_PROOF - distinct deployment guide artifact, not selected for cleanup.

B15-B18 outcome: documentation overlap recorded; these evidence assets are held behind NEEDS_RUNTIME_PROOF unless already proven as a current reference authority.

## PHASE 6 - B19-B22 CANONICAL AUTHORITY SELECTION EVIDENCE

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Existing runtime/service authorities from earlier B04-B06, B07-B10, and B15-B18 decisions remain CANONICAL_KEEP where already recorded.
This packet records the B19-B22 documentation and migration candidates only and does not replace earlier authorities with scripts.

Candidate group 1: Public prediction, dashboard, market, and ACCA frontend surfaces

Phase 6 decisions:
- public/index.html: CANONICAL_KEEP - current public frontend delivery role.
- public/experience.html: CANONICAL_KEEP - current public frontend delivery role.
- public/market-explorer.html: CANONICAL_KEEP - current public frontend delivery role.
- public/direct-markets.html: CANONICAL_KEEP - current public frontend delivery role.
- public/vip-stress-dashboard.html: CANONICAL_KEEP - current public frontend delivery role.
- public/js/vip-stress-dashboard.js: CANONICAL_KEEP - current public frontend delivery role.
- public/js/smh-hub.js: CANONICAL_KEEP - current public frontend delivery role.
- public/js/smh-hub-master-rulebook.js: CANONICAL_KEEP - current public frontend delivery role.
- public/js/acca-builder.js: CANONICAL_KEEP - current public frontend delivery role.
- public/js/doubleChanceCombos.js: CANONICAL_KEEP - current public frontend delivery role.
- public/js/ai-reasoning-display.js: CANONICAL_KEEP - current public frontend delivery role.
- No frontend market, prediction, ACCA, Sports Market Hub, or dashboard authority is merged or replaced in this phase.

Candidate group 2: Public auth, subscription, payment, and account access surfaces

Phase 6 decisions:
- public/login.html: CANONICAL_KEEP - current public auth/subscription/account access role.
- public/payment.html: CANONICAL_KEEP - current public auth/subscription/account access role.
- public/subscription.html: CANONICAL_KEEP - current public auth/subscription/account access role.
- public/subscribe/index.html: CANONICAL_KEEP - current public auth/subscription/account access role.
- public/js/supabase-init.js: CANONICAL_KEEP - current public auth/subscription/account access role.
- public/js/supabase-bundle.js: CANONICAL_KEEP - current public auth/subscription/account access role.
- public/js/config.js: CANONICAL_KEEP - current public auth/subscription/account access role.
- public/js/user-experience-feedback.js: CANONICAL_KEEP - current public auth/subscription/account access role.
- No auth, payment, subscription, Supabase client, API routing, or account-access behavior is changed.

Candidate group 3: Public operator/control-plane and health dashboard surfaces

Phase 6 decisions:
- public/js/control-center.js: CANONICAL_KEEP - current public operator/control-plane/health display role.
- public/js/semantic-drift-dashboard.js: CANONICAL_KEEP - current public operator/control-plane/health display role.
- public/js/system-health-banner.js: CANONICAL_KEEP - current public operator/control-plane/health display role.

Candidate group 4: Public legal/product pages versus root legal documents

Phase 6 decisions:
- public/privacy.html: CANONICAL_KEEP - public legal delivery page.
- public/terms.html: CANONICAL_KEEP - public legal delivery page.
- Root legal policy authority from B15-B18 remains preserved.

Candidate group 5: Static media, styling, and presentation assets

Phase 6 decisions:
- public/favicon.ico: CANONICAL_KEEP - static/presentation asset.
- public/hero-page.jpg: CANONICAL_KEEP - static/presentation asset.
- public/hero-page.webp: CANONICAL_KEEP - static/presentation asset.
- public/language.jpg: CANONICAL_KEEP - static/presentation asset.
- public/login.jpg: CANONICAL_KEEP - static/presentation asset.
- public/windrawwin.jpg: CANONICAL_KEEP - static/presentation asset.
- public/style.css: CANONICAL_KEEP - static/presentation asset.
- public/robots.txt: CANONICAL_KEEP - static/presentation asset.
- public/language-switch.html: CANONICAL_KEEP - static/presentation asset.
- public/js/hero-carousel.js: CANONICAL_KEEP - static/presentation asset.

Candidate group 6: Supabase prediction, market, rulebook, and direct1x2 migrations

Phase 6 decisions:
- Supabase migration files in this packet are NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.
- Prediction, market, rulebook, and direct1x2 migrations remain historical/ordered database-change artifacts.
- No SQL, RPC, RLS, policy, migration, trigger, schema, table, index, sport-expansion, or database access change is authorized.

Candidate group 7: Supabase fixture, ingest, context, odds, admin, and telemetry migrations

Phase 6 decisions:
- Supabase migration files in this packet are NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.
- Fixture, ingest, context, odds, admin, and telemetry migrations remain historical/ordered database-change artifacts.
- No SQL, RPC, RLS, policy, migration, trigger, schema, table, index, sport-expansion, or database access change is authorized.

Candidate group 8: Supabase prediction lookup RPC and compatibility migrations

Phase 6 decisions:
- Supabase migration files in this packet are NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.
- Prediction lookup RPC and compatibility migrations remain historical/ordered database-change artifacts.
- No SQL, RPC, RLS, policy, migration, trigger, schema, table, index, sport-expansion, or database access change is authorized.

Candidate group 9: Engine V2 and sport-expansion migrations

Phase 6 decisions:
- Supabase migration files in this packet are NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.
- Engine V2 and sport-expansion migrations remain historical/ordered database-change artifacts.
- No SQL, RPC, RLS, policy, migration, trigger, schema, table, index, sport-expansion, or database access change is authorized.

No legal, subscription, prediction-content, or user-data text is changed.

## PHASE 5 - B15-B18 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B15-B18
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- Batch group: B15-B18
- Start HEAD: af595644
- Compact overlap scan inspected migration/diagnostic scripts, Supabase scripts, prediction accuracy scripts, root documentation, deployment reports, rulebook reports, frontend reports, provider docs, semantic/control-plane docs, and Supabase/database reports.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: Supabase, database, migration, and accuracy diagnostic surfaces

Assets:
- scripts/safe-migration-plan.js
- scripts/supabase_health_check.js
- scripts/supabase-diagnostics.js
- scripts/track-prediction-accuracy.js
- SUPABASE_DIAGNOSTIC_REPORT.md
- SUPABASE_TABLE_ANALYSIS.md
- SUPABASE_TABLES_SUMMARY.md
- COMPREHENSIVE_AUDIT_REPORT.md

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple scripts and reports inspect or describe Supabase/database structure, constraints, prediction tables, migration plans, and prediction accuracy.
- scripts/safe-migration-plan.js includes unified fixture migration planning.
- scripts/supabase-diagnostics.js performs full database diagnostics.
- scripts/track-prediction-accuracy.js uses PostgreSQL and tracks football prediction accuracy.
- Supabase reports describe overlapping table, trigger, rule, prediction, and duplicate-risk information.

Decision:
- Major database/Supabase diagnostic overlap is proven.
- No SQL, migration, table update, or database script execution is authorized.
- No canonical database report is selected in Phase 5.
- Carry forward as a future database-report/script canonicalization candidate.

Candidate group 2: Master Rulebook, football rules, ACCA, SMB, and market governance documents

Assets:
- SKCS_MASTER_RULEBOOK.md
- STRICT_RULES.md
- COMPREHENSIVE_FOOTBALL_RULES_REPORT.md
- MASTER_RULEBOOK_IMPLEMENTATION_GUIDE.md
- DEPLOYMENT_STATUS.md
- DEPLOYMENT_VERIFICATION_GUIDE.md
- FRONTEND_FIXES_SUMMARY.md
- FRONTEND_INVESTIGATION_REPORT.md
- IMPLEMENTATION_GAP_ANALYSIS.md
- SINGLE_USE_AUDIT_REPORT.md
- SPORT_CONSISTENCY_AUDIT_REPORT.md
- SMB_WINDSURF_FINAL_IMPLEMENTATION.md
- SMB_WINDSURF_IMPLEMENTATION_PROMPT.md
- docs/acca_rules_v2.1.md
- docs/skcs_grading_snapshot_v1.spec.md

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple documents describe Master Rulebook thresholds, direct 1X2 rules, secondary market governance, ACCA rules, SMB behavior, grading, deployment, frontend alignment, and historical rule gaps.
- Some documents explicitly mark older content as historical while others describe current rule authority.
- The documents overlap heavily around rulebook implementation, market governance, ACCA behavior, and frontend/backend rule alignment.

Decision:
- Major rulebook/documentation overlap is proven.
- No documentation is deleted, merged, or rewritten in Phase 5.
- No rule threshold or product behavior is changed.
- Carry forward as a future rulebook-document authority/canonicalization candidate.

Candidate group 3: Architecture, agent, README, dashboard, and workspace overview documents

Assets:
- AGENTS.md
- GEMINI.md
- README.md
- README_DATA_INGESTION.md
- ARCHITECTURE_OVERVIEW.md
- FULL_WORKSPACE_AUDIT_REPORT.md
- DASHBOARD_QUICK_START.md
- DASHBOARD_REFACTOR_GUIDE.md
- README_DASHBOARD_REFACTOR.md
- IMPLEMENTATION_SUMMARY.md
- DEEPSEEK_SESSION_SKCSTEST.txt
- DEEPSEEK_STATE.md

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Several root documents describe the same system at different abstraction levels: backend, Supabase, AI pipeline, dashboard, provider ingestion, control rules, and project state.
- AGENTS.md and GEMINI.md both provide agent/developer orientation.
- Dashboard quick-start/refactor docs and implementation summary overlap around portal, market, ACCA, controls, and state-update behavior.
- DeepSeek state/session files overlap with historical project-state memory.

Decision:
- Functional documentation overlap is proven.
- No canonical project overview document is selected in Phase 5.
- No documentation cleanup is authorized.
- Carry forward as a future documentation-index/canonicalization candidate.

Candidate group 4: Provider, ingestion, API quota, and sports data documentation

Assets:
- README_DATA_INGESTION.md
- docs/DATA_INGESTION.md
- docs/README.md
- docs/api_quota_router.md
- docs/cricket-providers.md
- docs/football-leagues-apisports.md
- docs/provider-discovery/free-livescore-api.md
- docs/providers/live-football-api-policy.md
- docs/sportsdataio-pre-match-directive.md
- docs/canonical_ingest_firewall.spec.md
- docs/SKCS_ENGINE_V2_PHASE05_INGEST_MAP.md
- docs/SKCS_ENGINE_V2_PHASE0B5_REPLAY.md

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple docs describe provider roles, ingestion rules, quota routing, football leagues, cricket providers, SportsDataIO boundaries, API-Sports boundaries, and canonical ingest firewall rules.
- Some docs describe canonical truth boundaries while others describe pre-match enrichment or provider discovery.
- This overlaps with B07-B10 and B11-B14 provider/access candidates.

Decision:
- Major provider/ingestion documentation overlap is proven.
- No provider policy is changed.
- No provider retirement, source change, or dependency update is authorized.
- Carry forward as a future provider/ingestion documentation authority candidate.

Candidate group 5: Semantic drift, control plane, runtime health, and degraded-state documentation

Assets:
- docs/alert-routing-degraded-state.md
- docs/blueprint-semantic-drift-control-plane.md
- docs/control-plane-operational-pack.md
- docs/pipeline-health-feed.md
- docs/runbook_degraded_states.md
- docs/SKCS_ENGINE_V2_ADR.md
- docs/SKCS_ENGINE_V2_PHASE0_DESIGN.md

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Several docs describe semantic drift, control-plane state, health feed, degraded/fail states, execution traces, and V2 design context.
- The docs repeatedly state control-plane authority and runtime-health separation.
- These overlap with the B04-B10 semantic/control-plane service candidates.

Decision:
- Functional documentation overlap is proven.
- No semantic/control-plane documentation is changed in Phase 5.
- No runtime health behavior is changed.
- Carry forward as a future control-plane documentation canonicalization candidate.

Candidate group 6: Legal/product policy and public-facing subscription documents

Assets:
- PRIVACY_POLICY.md
- TERMS_OF_SERVICE.md

Outcome:
- PARTIAL_OVERLAP

Evidence:
- These documents overlap with subscription, payment, prediction-content, user-data, analytics, and service-boundary language.
- They are legal/product-facing documents rather than engineering implementation files.

Decision:
- Keep separate.
- No legal text is changed in Phase 5.
- Carry forward only as product/legal documentation boundary evidence.

Distinct-role findings:
- MIGRATION_FREEZE.md, requirements.txt, and runtime.txt are distinct configuration/policy artifacts; no same-job merge group is selected by this scan.
- CRON_SETUP.md and docs/DEPLOYMENT_GUIDE.md overlap with scheduler/deployment setup but are not selected as a merge group in this packet.
- Documentation overlap is recorded as evidence only; it does not authorize cleanup.
- Mutation-capable scripts are recorded as overlap/risk evidence only and were not executed.

Batch decision:
- B15-B18 contains proven functional overlap candidates.
- Potential future canonicalization candidates are recorded for Supabase/database diagnostics, Master Rulebook/rule documents, root architecture docs, provider/ingestion docs, control-plane docs, and legal/product policy boundaries.
- No cleanup action is authorized by this outcome.
- B15-B18 Phase 5 evidence is closed.
- Next batch group: B19-B22.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - B19-B22 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B19-B22
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- Batch group: B19-B22
- Start HEAD: 1fa6aecd
- Compact overlap scan inspected public frontend pages, public JavaScript assets, static media, public legal/subscription pages, semantic/control-center widgets, and Supabase migration assets.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: public prediction, dashboard, market, and ACCA frontend surfaces

Assets:
- public/index.html
- public/experience.html
- public/market-explorer.html
- public/direct-markets.html
- public/vip-stress-dashboard.html
- public/js/vip-stress-dashboard.js
- public/js/smh-hub.js
- public/js/smh-hub-master-rulebook.js
- public/js/acca-builder.js
- public/js/doubleChanceCombos.js
- public/js/ai-reasoning-display.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple public pages and JavaScript files expose prediction, market, ACCA, direct market, VIP stress-dashboard, and Sports Market Hub behavior.
- public/js/acca-builder.js calls the ACCA builder endpoint.
- public/js/doubleChanceCombos.js handles Double Chance combo logic and contradiction-governance concepts.
- public/js/smh-hub-master-rulebook.js defines Master Rulebook secondary market category mapping.
- public/js/smh-hub.js wires Sports Market Hub market and ACCA selectors.
- public/js/vip-stress-dashboard.js manages portal, market, ACCA view state, prediction card registry, API base, and tier/dashboard behavior.

Decision:
- Major frontend market/prediction/ACCA overlap is proven.
- No frontend authority is selected in Phase 5.
- No UI, route, behavior, or JavaScript change is authorized.
- Carry forward as a future frontend market-dashboard canonicalization candidate.

Candidate group 2: public auth, subscription, payment, and account access surfaces

Assets:
- public/login.html
- public/payment.html
- public/subscription.html
- public/subscribe/index.html
- public/experience.html
- public/js/supabase-init.js
- public/js/supabase-bundle.js
- public/js/config.js
- public/js/user-experience-feedback.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Several public pages initialize or depend on Supabase auth and subscription/payment state.
- public/login.html, payment.html, subscription.html, and subscribe/index.html all interact with authentication, session, payment, or subscription flow concepts.
- public/js/supabase-init.js initializes the Supabase client.
- public/js/config.js defines API base routing and public user key behavior.
- public/js/user-experience-feedback.js uses API base, user API key, and Supabase session headers for feedback surfaces.
- public/experience.html links upgrade, subscription, logout, dashboard exploration, and live prediction preview.

Decision:
- Functional overlap is proven across public auth/subscription/account surfaces.
- No auth, payment, subscription, or Supabase client behavior is changed.
- Carry forward as a future auth/subscription frontend boundary candidate.

Candidate group 3: public operator/control-plane and health dashboard surfaces

Assets:
- public/js/control-center.js
- public/js/semantic-drift-dashboard.js
- public/js/system-health-banner.js
- public/js/config.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- public/js/control-center.js manages Control Center API reads and admin key handling.
- public/js/semantic-drift-dashboard.js reads semantic drift summary endpoint data.
- public/js/system-health-banner.js reads system health and control-plane reasons.
- public/js/config.js contributes API routing used by these frontend widgets.
- These files overlap around operator visibility and runtime health display, but each UI component has a distinct display role.

Decision:
- Partial overlap is proven.
- Keep separate for now.
- No UI refactor, merge, or behavior change is authorized.
- Carry forward as frontend operator-dashboard boundary evidence.

Candidate group 4: public legal/product pages versus root legal documents

Assets:
- public/privacy.html
- public/terms.html
- public/subscription.html

Outcome:
- PARTIAL_OVERLAP

Evidence:
- public/privacy.html mirrors public-facing privacy policy language.
- public/terms.html mirrors public-facing terms/service and prediction-content boundary language.
- public/subscription.html includes subscription, plan-access, accumulator, pro-rata, and no-refund product language.
- These overlap with prior root legal/product documents recorded in B15-B18.

Decision:
- Keep separate.
- No legal, subscription, refund, or product-policy text is changed.
- Carry forward only as public/legal documentation boundary evidence.

Candidate group 5: static media, styling, and presentation assets

Assets:
- public/favicon.ico
- public/hero-page.jpg
- public/hero-page.webp
- public/language.jpg
- public/login.jpg
- public/windrawwin.jpg
- public/style.css
- public/robots.txt
- public/language-switch.html
- public/js/hero-carousel.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- Several public image assets and styling files support website presentation.
- hero-page.jpg and hero-page.webp appear to be alternate formats for hero imagery.
- public/js/hero-carousel.js implements carousel display behavior and local carousel caching.
- public/style.css provides global public styling.

Decision:
- Presentation/static-asset relationship is proven, but no same-job cleanup is authorized.
- No image, CSS, SEO, or frontend presentation file is changed.
- Carry forward as static/frontend presentation boundary evidence only.

Candidate group 6: Supabase prediction, market, rulebook, and direct1x2 migrations

Assets:
- supabase/migrations/20260415000001_create_insight_usage.sql
- supabase/migrations/20260418000002_update_predictions_final_risk_level_check.sql
- supabase/migrations/20260501_skcs_comprehensive_engine.sql
- supabase/migrations/20260522000001_add_watchlist_column.sql
- supabase/migrations/20260522000002_add_sport_to_tier_rules.sql
- supabase/migrations/20260523000001_drop_insight_usage.sql
- supabase/migrations/20260617_add_market_tier.sql
- supabase/migrations/20260619000001_rename_predictions_final_to_direct1x2.sql
- supabase/migrations/20260619000002_align_direct1x2_columns.sql
- supabase/migrations/20260619000003_direct1x2_risk_tier_and_secondary_markets.sql
- supabase/migrations/20260621000001_enforce_league_country_on_direct_matches.sql
- supabase/migrations/20260701000001_normalize_sport_names.sql
- supabase/migrations/20260718000001_db_rule_alignment_75_55_30.sql

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple migrations modify prediction, market, risk, sport, tier, direct1x2, secondary-market, and rulebook-alignment structures.
- Some migrations create insight usage restrictions, later drop insight usage, and then rely on ACCA-specific restrictions elsewhere.
- Several migrations rename predictions_final to direct1x2_prediction_final, align direct1x2 columns, add risk tier/secondary markets, enforce league/country fields, normalize sport names, and align DB rule thresholds.

Decision:
- Major database migration overlap is proven.
- No SQL is executed.
- No database structure, trigger, rule, or migration is changed.
- Carry forward as a future Supabase migration canonicalization/safety candidate.

Candidate group 7: Supabase fixture, ingest, context, odds, admin, and telemetry migrations

Assets:
- supabase/migrations/20260512000002_add_odds_to_match_context.sql
- supabase/migrations/20260512000003_create_sport_sync_table.sql
- supabase/migrations/20260512000004_create_upsert_raw_fixture_rpc.sql
- supabase/migrations/20260512000005_create_context_enrichment_trigger.sql
- supabase/migrations/20260512000006_create_fixture_processing_log.sql
- supabase/migrations/20260512000007_create_admin_views.sql
- supabase/migrations/20260512000008_create_event_odds_snapshots.sql
- supabase/migrations/20260512000010_populate_sport_sync.sql
- supabase/migrations/20260524000002_create_upsert_canonical_event_rpc.sql

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Multiple migrations define or support fixture ingest, sport sync, raw fixture upsert, context enrichment, fixture processing logs, admin pipeline health views, odds snapshots, and canonical event upsert.
- These assets overlap around ingest, telemetry, odds, context, and canonical event database boundaries.

Decision:
- Functional overlap is proven.
- No database ingest authority is selected in Phase 5.
- No SQL, migration, trigger, RPC, or table change is authorized.
- Carry forward as a future Supabase ingest/telemetry migration boundary candidate.

Candidate group 8: Supabase prediction lookup RPC and compatibility migrations

Assets:
- supabase/migrations/20260512000009_create_get_prediction_rpc.sql
- supabase/migrations/20260512000012_create_get_prediction_function.sql
- supabase/migrations/20260512000013_disable_rls_match_context.sql
- supabase/migrations/20260524000001_remove_dev_rls_policies.sql

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Two migrations define prediction lookup functions for match IDs across direct1x2_prediction_final and ai_predictions.
- RLS-related migrations change access policy posture for match_context and development/public reads.
- These overlap with the prediction API and Supabase security/access surfaces already recorded in previous Phase 5 packets.

Decision:
- Functional overlap is proven.
- No RPC, RLS, policy, security, or access change is authorized.
- Carry forward as a future Supabase access/RPC boundary candidate.

Candidate group 9: Engine V2 and sport-expansion migrations

Assets:
- supabase/migrations/20260531000001_skcs_engine_v2_phase0_identity.sql
- supabase/migrations/20260531000002_skcs_engine_v2_phase0b_match_results.sql
- supabase/migrations/20260717000001_create_f1_schema.sql

Outcome:
- PARTIAL_OVERLAP

Evidence:
- Engine V2 identity and match-results migrations create football/team identity and result structures.
- F1 schema migration creates F1 teams, tracks, persons, races, rosters, and results.
- These relate to broader sport expansion and engine evolution rather than the current Direct 1X2 runtime only.

Decision:
- Partial overlap is proven around future engine/sport expansion database structures.
- No sport expansion or V2 migration action is authorized.
- Carry forward as database future-phase boundary evidence only.

Distinct-role findings:
- public/robots.txt is a public SEO/static control file; no same-job merge group is selected.
- Binary/static media assets are recorded as presentation assets only; no image processing or cleanup is authorized.
- Supabase migrations are historical/ordered database-change artifacts; overlap does not authorize merging, deleting, or rewriting migration history.
- Migration overlap is recorded as evidence only and no SQL was executed.

Batch decision:
- B19-B22 contains proven functional overlap candidates.
- Potential future canonicalization candidates are recorded for public frontend market/dashboard surfaces, auth/subscription frontend surfaces, operator health UI, legal public pages, static presentation assets, Supabase prediction/rule migrations, Supabase ingest/telemetry migrations, Supabase RPC/RLS migrations, and Engine V2/sport-expansion migrations.
- No cleanup action is authorized by this outcome.
- B19-B22 Phase 5 evidence is closed.
- Next batch group: B23-B26.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - B23-B26 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B23-B26
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- Batch group: B23-B26
- Start HEAD: 88ce49ae
- B23 DB_SQL_AND_SUPABASE_OTHER asset_count: 20
- B24 TESTS asset_count: 6
- B25 SCRATCH asset_count: 2
- B26 DEPLOYMENT_CI asset_count: 3
- Combined reviewed assets: 31
- Compact overlap scan inspected SQL scripts, Supabase Edge Function assets, Supabase Function assets, AI pipeline schema, Control Center tests, scratch database scripts, Dockerfile, render.yaml, and vercel.json.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: SQL prediction, ACCA, market, and rulebook surfaces

Assets:
- sql/acca_rules.sql
- sql/extreme_smb_data.sql
- sql/market_correlations_schema.sql
- sql/master_rulebook_triggers.sql
- sql/performance_optimizations.sql
- sql/schema_refactor.sql
- sql/tables.sql
- sql/tier_rules.sql
- supabase/schema/ai_pipeline_schema.sql

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple SQL assets define or modify prediction, ACCA, SMB, market correlation, tier, rulebook trigger, and pipeline schema structures.
- sql/acca_rules.sql seeds ACCA rules.
- sql/extreme_smb_data.sql defines an SMB correlation matrix.
- sql/market_correlations_schema.sql creates market correlation structures for ACCA conflict detection.
- sql/master_rulebook_triggers.sql defines database-level Master Rulebook trigger behavior.
- sql/performance_optimizations.sql optimizes trigger/rulebook-related tables.
- sql/schema_refactor.sql and sql/tables.sql define normalized fixtures and prediction pipeline tables.
- sql/tier_rules.sql seeds tier confidence and ACCA limits.
- supabase/schema/ai_pipeline_schema.sql defines raw fixtures, enriched match data, and AI prediction pipeline schema.

Decision:
- Major SQL rule/prediction/schema overlap is proven.
- No SQL is executed.
- No database schema, trigger, rule, or migration is changed.
- No canonical SQL authority is selected in Phase 5.
- Carry forward as a future SQL/rulebook/schema canonicalization candidate.

Candidate group 2: Supabase RLS, subscription, test-user, and access setup scripts

Assets:
- sql/day_zero_subscription.sql
- sql/fix_rls_policies.sql
- sql/supabase_test_user_reset_and_seed.sql
- sql/supabase_test_user_seed_access.sql

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- These SQL assets overlap around subscription setup, RLS policy repair, profile/subscription access, test-user reset, and seeded access state.
- sql/day_zero_subscription.sql creates subscription structures.
- sql/fix_rls_policies.sql enables RLS and creates authenticated read policies for prediction tables.
- test-user scripts seed or reset profiles, tiers, subscriptions, and access metadata.

Decision:
- Functional access/subscription overlap is proven.
- No SQL, RLS, auth, subscription, or profile change is authorized.
- Carry forward as a future Supabase access/test-user script-boundary candidate.

Candidate group 3: RapidAPI cache, monitoring, and operational SQL surfaces

Assets:
- sql/rapidapi_cache.sql
- sql/monitoring_tables.sql
- sql/performance_optimizations.sql
- supabase/schema/ai_pipeline_schema.sql

Outcome:
- PARTIAL_OVERLAP

Evidence:
- sql/rapidapi_cache.sql defines RapidAPI cache storage and indexes.
- sql/monitoring_tables.sql defines prediction request logging and monitoring indexes.
- sql/performance_optimizations.sql defines performance indexes and constraints.
- supabase/schema/ai_pipeline_schema.sql includes pipeline schema structures that relate to monitoring and operational data flow.

Decision:
- Partial SQL operational overlap is proven.
- No monitoring table, cache table, index, or constraint change is authorized.
- Carry forward as operational SQL boundary evidence.

Candidate group 4: Supabase scheduled sync, refresh, and semantic function surfaces

Assets:
- supabase/edge-functions/scheduled-fixture-sync/index.ts
- supabase/edge-functions/scheduledFixtureSync/index.ts
- supabase/functions/scheduled-prediction-refresh/index.ts
- supabase/functions/semantic-drift-summary/index.ts
- supabase/functions/sync-sports-data/index.ts

Outcome:
- MAJOR_OVERLAP

Evidence:
- scheduled-fixture-sync and scheduledFixtureSync both implement scheduled fixture sync concepts using Supabase service-role access.
- scheduled-prediction-refresh implements scheduled prediction refresh behavior.
- semantic-drift-summary implements semantic drift summary endpoint behavior.
- supabase/functions/sync-sports-data/index.ts is listed in the manifest but is missing on disk during this scan.
- These assets overlap with earlier scheduler, sync, cron, semantic drift, and provider-ingestion candidates.

Decision:
- Major Supabase Function/Edge Function overlap is proven.
- Missing manifest asset is recorded as evidence only.
- No function is executed, restored, deleted, renamed, deployed, or repaired in Phase 5.
- Carry forward as a future Supabase function boundary and missing-asset review candidate.

Candidate group 5: Control Center and governance test surfaces

Assets:
- tests/edge-asset-classification.test.js
- tests/edge-control-center-ledger.test.js
- tests/edge-control-center-ui.test.js
- tests/edge-project-register.test.js
- tests/edge-repository-asset-register.test.js
- tests/edge-system-runtime-inventory.test.js

Outcome:
- PARTIAL_OVERLAP

Evidence:
- All B24 test assets verify Control Center, repository asset register, project register, runtime inventory, UI, and ledger governance behavior.
- Tests share Control Center checker dependencies and governance artifact expectations.
- The tests overlap by governance domain, but each validates a separate Control Center contract.

Decision:
- Partial governance-test overlap is proven.
- Keep tests separate for now.
- No test refactor, merge, or deletion is authorized.
- Carry forward as governance-test boundary evidence.

Candidate group 6: scratch database scripts

Assets:
- scratch/db_normalize.js
- scratch/db_sync.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Both scratch scripts use backend/database query access.
- scratch/db_normalize.js mutates sport labels in predictions_raw and leagues.
- scratch/db_sync.js reads distinct sports from predictions_raw and leagues.
- Both overlap around ad hoc database normalization/sync inspection.

Decision:
- Functional overlap is proven.
- No scratch script is executed.
- No database mutation or cleanup is authorized.
- Carry forward as a future scratch/database script retirement-or-canonicalization candidate.

Candidate group 7: deployment and hosting configuration surfaces

Assets:
- Dockerfile
- render.yaml
- vercel.json

Outcome:
- PARTIAL_OVERLAP

Evidence:
- Dockerfile defines the container startup surface for the pipeline server.
- render.yaml defines Render build, health check, autoDeploy, and provider environment variables.
- vercel.json defines public output, API function configuration, cron configuration, and API routing.
- These files overlap around deployment/hosting behavior but target different hosting surfaces.

Decision:
- Partial deployment configuration overlap is proven.
- No deployment config, autoDeploy setting, cron, route, build command, or environment variable is changed.
- Carry forward as deployment-surface boundary evidence.

Distinct-role findings:
- B23 SQL files are database-change artifacts and must not be merged, rewritten, or executed during Phase 5.
- Supabase functions are runtime/deployment assets and must not be deployed or repaired during this evidence pass.
- B24 tests are governance protection assets and repeated Control Center vocabulary alone does not authorize consolidation.
- B25 scratch scripts are mutation-capable and were not executed.
- B26 deployment configs overlap by hosting responsibility but are not identical jobs.
- supabase/functions/sync-sports-data/index.ts was reported MISSING and is recorded only as a future review note.

Batch decision:
- B23-B26 contains proven functional overlap candidates.
- Potential future canonicalization candidates are recorded for SQL rulebook/schema authority, Supabase access/test-user scripts, operational SQL, Supabase scheduled/function surfaces, governance tests, scratch database scripts, and deployment configuration boundaries.
- No cleanup action is authorized by this outcome.
- B23-B26 Phase 5 evidence is closed.
- Next batch group: B27-B29.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - B27-B29 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Batches: B27-B29
- Evidence type: functional-overlap identification only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Batch manifest evidence:
- Batch group: B27-B29
- Start HEAD: 6ede2b52
- Compact overlap scan inspected final archive/root/config/report/script/data/workflow/temp assets.
- The scan included root scripts, package/build config, phase reports, Supabase/report JSON, Master Rulebook test scripts, AI/provider test scripts, agent workflow config, API pipeline config, JavaScript Supabase bundle/config files, execution-spine reports, provider/data dump files, and tmp validation JSON files.

Outcome vocabulary used:
- NO_OVERLAP
- PARTIAL_OVERLAP
- MAJOR_OVERLAP
- POTENTIAL_MERGE_GROUP

Candidate group 1: root manual scripts, AI diagnostics, provider tests, and pipeline utilities

Assets:
- find-active-files.js
- force-seed.js
- refresh-ai-insights.js
- run-final-test.js
- scratch_test_pipeline.js
- trigger_ai.js
- test_scenarios_master_rulebook.js
- test-ai-insights.js
- test-ai-simulation.js
- test-bigballs-direct.js
- test-espn-direct.js
- test-groq-debug.js
- test-groq-models.js
- test-sportsdb.js
- test-wc-id.js

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple root scripts test or trigger AI insight generation, provider access, rulebook scenarios, sports data access, and pipeline behavior.
- Several scripts overlap with earlier B11-B14 script-heavy test/trigger/trace evidence.
- force-seed.js uses backend dbBootstrap behavior.
- find-active-files.js inspects active file/startup behavior.
- AI/provider test scripts overlap around manual diagnostics rather than production runtime authority.

Decision:
- Major manual-script/test overlap is proven.
- No script is selected as canonical in Phase 5.
- No script is executed, deleted, merged, or refactored.
- Carry forward as a future root-script/test canonicalization or retirement candidate.

Candidate group 2: package, build, dependency, and frontend build config surfaces

Assets:
- package.json
- package-lock.json
- tailwind.config.js
- qodana.yaml
- LICENSE

Outcome:
- PARTIAL_OVERLAP

Evidence:
- package.json defines scripts for Supabase bundling, CSS build, build orchestration, live sync, smoke tests, coverage verification, and refresh triggers.
- package-lock.json locks dependency graph including Supabase, cache, cron, sqlite, and trace-mapping packages.
- tailwind.config.js scans public HTML/JS/JSX files for frontend build output.
- qodana.yaml is static-analysis configuration.
- LICENSE is a distinct legal/license artifact.

Decision:
- Partial config/build/dependency overlap is proven.
- Keep separate.
- No dependency, package, build, license, static-analysis, or frontend build config change is authorized.
- Carry forward as package/build/config boundary evidence only.

Candidate group 3: phase reports, Supabase reports, migration plans, and dependency maps

Assets:
- phase1-final-report.json
- phase2-conservative-summary.json
- phase2-final-summary.json
- phase3-comprehensive-summary.json
- phase3-migration-summary.json
- overall-project-completion.json
- placeholders-and-insights-audit.json
- safe-migration-plan.json
- supabase-diagnostics-report.json
- supabase-migration-plan.json
- supabase-table-analysis.json
- supabase-visual-analysis-report.json
- table-dependency-map.json
- reports/execution-spine-compliance-map.json
- reports/execution-spine-compliance-map.md

Outcome:
- MAJOR_OVERLAP

Evidence:
- Multiple JSON and markdown report artifacts describe project phases, migration progress, Supabase diagnostics, table analysis, visual database analysis, table dependencies, placeholders/insights, and execution-spine compliance.
- Several assets overlap with earlier B15-B18 documentation/report and B23-B26 SQL/database evidence.
- reports/execution-spine-compliance-map.json and reports/execution-spine-compliance-map.md are projection-style paired artifacts.

Decision:
- Major report/audit/map overlap is proven.
- No report is selected as canonical in Phase 5.
- No report, JSON map, or markdown projection is deleted, merged, regenerated, or edited.
- Carry forward as a future report/documentation authority candidate.

Candidate group 4: root/public frontend and Supabase client bundle surfaces

Assets:
- market-explorer.html
- js/config.js
- js/supabase-bundle.js
- js/supabase-client-src.js
- js/supabase-init.js

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- market-explorer.html overlaps with public market-explorer and Sports Market Hub frontend concepts already recorded in B19-B22.
- js/config.js defines frontend/API config behavior outside the public/js tree.
- js/supabase-client-src.js and js/supabase-bundle.js represent source/bundled Supabase client surfaces.
- js/supabase-init.js overlaps with earlier public Supabase initialization surfaces.

Decision:
- Functional frontend/Supabase-client overlap is proven.
- No frontend source/bundle authority is selected in Phase 5.
- No bundle, config, HTML, or Supabase client change is authorized.
- Carry forward as a future frontend/Supabase bundle boundary candidate.

Candidate group 5: local launch, model/runtime, and auxiliary project surfaces

Assets:
- SKCS_START.bat
- dolphin-server/Dockerfile
- dolphin-server/README.md
- sportbook
- kabaddiPy

Outcome:
- PARTIAL_OVERLAP

Evidence:
- SKCS_START.bat is a local/manual launch surface.
- dolphin-server Dockerfile and README represent local model/runtime support documentation and container setup.
- sportbook and kabaddiPy appear as auxiliary or provider/domain project surfaces in the scan.
- These overlap conceptually with runtime/provider/model support but are not proven same-job replacements.

Decision:
- Partial runtime/auxiliary overlap is proven.
- No local launcher, Dockerfile, README, or auxiliary project asset is changed.
- Carry forward as runtime/auxiliary boundary evidence only.

Candidate group 6: agent workflow, local tool config, and hook surfaces

Assets:
- .gemini/antigravity/README.md
- .gemini/antigravity/workflows/automated-data-sync.toml
- .gemini/antigravity/workflows/intelligent-alert-system.toml
- .gemini/antigravity/workflows/intelligent-pipeline-optimizer.toml
- .gemini/antigravity/workflows/smart-prediction-engine.toml
- .gemini/commands.toml
- .qwen/settings.json
- .qwen/settings.json.orig
- .windsurf/workflows/env.md
- .githooks/pre-commit
- .stakpak/data/local.db

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- Multiple agent/tool workflow files describe automation, alerting, pipeline optimization, prediction engine workflows, commands, Qwen settings, Windsurf environment notes, Git hook behavior, and local tool database state.
- These files overlap around developer-agent/tooling orchestration rather than SKCS product runtime.
- .githooks/pre-commit overlaps with validation/guard behavior but remains a distinct Git hook surface.

Decision:
- Functional tool/workflow overlap is proven.
- No agent workflow, hook, local DB, or tool config is changed.
- Carry forward as a future developer-tooling/workflow canonicalization candidate.

Candidate group 7: API pipeline route and execution-spine projections

Assets:
- api/pipeline/run-full.js
- reports/execution-spine-compliance-map.json
- reports/execution-spine-compliance-map.md

Outcome:
- PARTIAL_OVERLAP

Evidence:
- api/pipeline/run-full.js is an API pipeline execution surface.
- Execution-spine report artifacts describe or project compliance/execution-spine state.
- These overlap with earlier pipeline orchestration and execution-spine evidence, but runtime route and report projection have different roles.

Decision:
- Partial pipeline/report overlap is proven.
- No API route, report, or execution-spine projection is changed.
- Carry forward as pipeline/report boundary evidence only.

Candidate group 8: provider data dumps, sports catalog data, placeholder data, and temporary validation artifacts

Assets:
- src/data/placeholder.txt
- src/data/sportsdb-leagues.json
- tmp/key-validation-1776365488298.json
- tmp/key-validation-1776365827255.json
- tmp/key-validation-1776482624434.json
- tmp/today-fixture-pull-1776482706164.json

Outcome:
- POTENTIAL_MERGE_GROUP

Evidence:
- src/data/sportsdb-leagues.json contains large sports/league catalog-style provider data.
- tmp key-validation and fixture-pull JSON files are temporary validation/pull artifacts.
- src/data/placeholder.txt is placeholder data.
- These files overlap around provider-data snapshots, validation output, and temporary diagnostic artifacts.

Decision:
- Functional data-artifact overlap is proven.
- No data file is deleted, moved, regenerated, or edited in Phase 5.
- Carry forward as a future temp/provider-data retention review candidate.

Distinct-role findings:
- B27-B29 includes mixed final-surface assets: root scripts, package/config, reports, frontend bundle/config, agent workflow config, local runtime support, API route, data snapshots, and temporary validation files.
- Repeated testing, reporting, and provider-data patterns alone do not authorize deletion.
- Temp-looking assets are recorded as retention-review evidence only.
- Binary/local-tool/runtime-support assets are not modified.
- No cleanup action is authorized by this evidence pass.

Batch decision:
- B27-B29 contains proven functional overlap candidates.
- Potential future canonicalization candidates are recorded for root scripts/tests, package/build config, phase reports/audit maps, frontend Supabase bundle/config, local runtime/model support, developer-agent workflows, pipeline/report projections, and provider/temp data artifacts.
- No cleanup action is authorized by this outcome.
- B27-B29 Phase 5 evidence is closed.
- PHASE_5 batch-level functional overlap identification is complete across B01-B29.
- Next action after commit: perform a Phase 5 closure summary/control packet.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 5 - FUNCTIONAL OVERLAP IDENTIFICATION CLOSURE SUMMARY

Result: PASS WITH OVERLAP CANDIDATES

Scope:
- Phase: PHASE_5 - Functional Overlap Identification
- Phase question: Are different remaining files doing the same or substantially overlapping job?
- Batch coverage: B01-B29
- Evidence type: repository-wide functional-overlap identification by deterministic batch group
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Closed Phase 5 batch packets:
- B01 closed at a5999ceb
- B02-B03 closed at cb368c49
- B04-B06 closed at 427ccfce
- B07-B10 closed at 6b4677d2
- B11-B14 closed at af595644
- B15-B18 closed at 1fa6aecd
- B19-B22 closed at 88ce49ae
- B23-B26 closed at 6ede2b52
- B27-B29 closed at 3c87a5e4

Phase 5 outcome summary:
- Functional overlap candidates were found across backend routes, backend services, provider surfaces, pipeline runners, schedulers, scripts, SQL/database assets, Supabase functions, public frontend surfaces, documentation/report assets, deployment config, root scripts, agent workflow files, and provider/temp data artifacts.
- Findings are evidence-only.
- No canonical replacement authority was selected during Phase 5.
- No cleanup action was authorized during Phase 5.

Major carry-forward candidate families:
- Database access authority and Supabase schema/script boundaries.
- Pipeline orchestration, scheduler, sync, trigger, and execution-spine boundaries.
- Provider access, quota, cache, discovery, and provider-specific test boundaries.
- Cricket service/provider/script boundaries.
- Football provider, extractor, enrichment, ranking, and fixture-context boundaries.
- Prediction, market, ACCA, Master Rulebook, grading, settlement, and publication boundaries.
- Frontend market/dashboard/auth/subscription/operator-health boundaries.
- Rulebook, provider, ingestion, semantic drift, control-plane, and project-state documentation boundaries.
- Supabase migration, RPC, RLS, scheduled function, Edge Function, and missing-function review boundaries.
- Governance test boundaries.
- Deployment/hosting config boundaries.
- Root manual script, AI diagnostic, provider test, agent workflow, local runtime, and temporary data artifact boundaries.

Important non-actions:
- No file was deleted.
- No file was merged.
- No file was retired.
- No runtime code was changed.
- No UI behavior was changed.
- No SQL was executed.
- No Supabase/database state was changed.
- No deployment or hosting config was changed.
- No dependency/security/vulnerability remediation was performed.

Phase 5 closure decision:
- PHASE_5 batch-level functional overlap identification is complete across all deterministic batches B01-B29.
- Phase 5 should now be treated as evidence-complete.
- Future cleanup must be opened as a separate approved phase or mini-project before any merge, deletion, retirement, refactor, SQL, deployment, provider, dependency, or security action occurs.

Next recommended control action:
- Open the next approved cleanup phase only after explicit scope selection.
- Do not act on Phase 5 overlap candidates directly without a new phase-specific decision gate.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 6 - B02-B03 CANONICAL AUTHORITY SELECTION EVIDENCE

Result: PASS WITH CANONICAL AUTHORITY DECISIONS AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_6 - Canonical Authority Selection
- Batches: B02 - BACKEND_DIRECT_FILES; B03 - BACKEND_ROUTES_AND_CONTROLLERS
- Source evidence: PHASE 5 - B02-B03 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- Start HEAD: d71adbe9
- Evidence type: canonical authority decision only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Candidate group 1: database access authority

Assets:
- backend/database.js
- backend/db.js
- backend/dbBootstrap.js

Phase 6 decisions:
- backend/db.js: CANONICAL_KEEP - general database access helper.
- backend/database.js: NEEDS_RUNTIME_PROOF - broad legacy/compatibility database surface.
- backend/dbBootstrap.js: CANONICAL_KEEP - database bootstrap/schema/seed authority only.

Evidence:
- backend/db.js is the focused database helper and exports pool, query, and withTransaction.
- backend/db.js has broad active use across controllers, routes, services, semantic-layer code, and backend/utils/db.js.
- backend/database.js is also active and is used by server-express.js, middleware, routes, utilities, and services.
- backend/database.js exports broader helper functions beyond basic database access, including prediction, profile, subscription, and accuracy helpers.
- backend/dbBootstrap.js imports query from backend/database.js and exports bootstrap.
- backend/dbBootstrap.js is used by server-express.js and force-seed.js as bootstrap/schema/seed authority, not as general database access authority.

Control decision:
- Keep backend/db.js as canonical general database helper.
- Keep backend/dbBootstrap.js as canonical bootstrap/schema/seed authority.
- Hold backend/database.js behind NEEDS_RUNTIME_PROOF before any replacement, merge, or retirement.

Candidate group 2: server inline endpoint versus route-module boundary

Assets:
- backend/server-express.js
- backend/routes/pipeline.js
- backend/routes/predictions.js
- backend/routes/debug.js
- backend/routes/scheduler.js
- backend/routes/cricketCron.js
- backend/routes/cricketInsights.js
- backend/routes/cricketCount.js
- backend/routes/sportsEdge.js
- backend/routes/v1/predictions.js

Phase 6 decisions:
- backend/server-express.js: CANONICAL_KEEP - server bootstrap, middleware, router mounting, and legacy inline endpoint host.
- backend/routes/pipeline.js: CANONICAL_KEEP - modular pipeline route authority.
- backend/routes/predictions.js: CANONICAL_KEEP - modular predictions route authority.
- backend/routes/debug.js: CANONICAL_KEEP - modular debug route authority.
- backend/routes/scheduler.js: CANONICAL_KEEP - modular scheduler route authority.
- backend/routes/cricketCron.js: CANONICAL_KEEP - modular cricket cron route authority.
- backend/routes/cricketInsights.js: CANONICAL_KEEP - modular cricket insights route authority.
- backend/routes/cricketCount.js: CANONICAL_KEEP - modular cricket count route authority pending caller proof.
- backend/routes/sportsEdge.js: CANONICAL_KEEP - modular sports edge public API route authority.
- backend/routes/v1/predictions.js: CANONICAL_KEEP - modular v1 predictions route authority.
- Inline server endpoints: NEEDS_RUNTIME_PROOF before any move, deletion, or replacement.

Evidence:
- server-express.js imports and mounts modular route files.
- server-express.js also still defines inline endpoints for pipeline trigger, refresh-predictions, debug sync-test, cron routes, cricket daily fixtures, master pipeline, AI predictions, and cricket table debug behavior.
- Candidate route modules all exist, define router endpoints, and export routers.
- Route-module overlap is therefore controlled but not safe to consolidate without live caller and route-contract proof.

Control decision:
- Keep server-express.js as bootstrap/mounting/legacy inline endpoint authority.
- Keep modular route files as canonical authorities for their mounted route domains.
- No inline endpoint may be moved, deleted, or replaced until frontend callers, scheduler URLs, deployment references, cron references, and route contracts are proven.

Candidate group 3: prediction delivery and prediction API surfaces

Assets:
- backend/routes/predictions.js
- backend/routes/v1/predictions.js
- backend/routes/user.js
- backend/routes/vip.js
- backend/routes/direct1x2.js
- backend/routes/v1/acca.js
- backend/routes/v1/sameMatchBuilder.js
- backend/routes/v1/secondaryMarkets.js
- backend/server-express.js

Phase 6 decisions:
- backend/routes/predictions.js: CANONICAL_KEEP - primary subscriber-facing prediction delivery route.
- backend/routes/v1/predictions.js: CANONICAL_KEEP - v1 contract prediction API route.
- backend/routes/user.js: CANONICAL_KEEP - user/subscription account prediction access route.
- backend/routes/vip.js: CANONICAL_KEEP - VIP/stress payload prediction route.
- backend/routes/direct1x2.js: CANONICAL_KEEP - direct 1X2 market route authority.
- backend/routes/v1/acca.js: CANONICAL_KEEP - v1 ACCA builder/history route authority.
- backend/routes/v1/sameMatchBuilder.js: CANONICAL_KEEP - v1 same match builder route authority.
- backend/routes/v1/secondaryMarkets.js: CANONICAL_KEEP - v1 secondary markets route authority.
- backend/server-express.js /api/ai-predictions/:matchId: NEEDS_RUNTIME_PROOF - inline legacy/public prediction endpoint.

Evidence:
- backend/routes/predictions.js is mounted at /api/predictions and handles subscription/auth-controlled prediction delivery, plan allocation, ACCA/mega-ACCA logic, and admin rebuild/clear operations.
- backend/routes/v1/predictions.js is mounted under /api/v1 and exposes match, batch, and history prediction endpoints.
- backend/routes/user.js owns user/subscription-specific prediction access and insight consumption routes.
- backend/routes/vip.js owns VIP/stress prediction payload delivery.
- backend/routes/direct1x2.js and v1 market routes expose specialized market, ACCA, same-match-builder, and secondary-market contracts.
- server-express.js still owns an inline /api/ai-predictions/:matchId endpoint with fallback prediction-table logic.

Control decision:
- Keep separate prediction API authorities by audience and API contract.
- Hold the inline /api/ai-predictions/:matchId endpoint behind NEEDS_RUNTIME_PROOF before any replacement or retirement.

Candidate group 4: cricket count, cache, cron, and insight surfaces

Assets:
- backend/routes/cricketCache.js
- backend/routes/cricketCount.js
- backend/routes/cricketCron.js
- backend/routes/cricketInsights.js
- backend/deploy-trigger-cricket.js
- backend/server-express.js

Phase 6 decisions:
- backend/routes/cricketCache.js: CANONICAL_KEEP - cricket cache read route.
- backend/routes/cricketCron.js: CANONICAL_KEEP - modular cricket cron/cache refresh route.
- backend/routes/cricketInsights.js: CANONICAL_KEEP - main cricket insights delivery route.
- backend/routes/cricketCount.js: NEEDS_RUNTIME_PROOF - dedicated compatibility count endpoint.
- backend/deploy-trigger-cricket.js: CANONICAL_KEEP - external trigger caller, not route authority.
- backend/server-express.js inline cricket endpoints: NEEDS_RUNTIME_PROOF - legacy inline cricket cron/debug host.

Evidence:
- backend/routes/cricketCache.js owns the cricket cache read route and reads CricAPI cache through cricApiCacheService.
- backend/routes/cricketCron.js owns mounted modular cricket cron/cache endpoints for Cricbuzz and CricAPI.
- backend/routes/cricketInsights.js owns cricket insights delivery and also exposes a lightweight /count endpoint.
- backend/routes/cricketCount.js duplicates count-like behavior but is separately mounted at /api/cricket/count.
- backend/deploy-trigger-cricket.js calls /api/cron/cricket-daily-fixtures and is a launcher/caller, not route implementation authority.
- server-express.js still owns inline /api/cron/cricket-daily-fixtures and /api/debug/cricket-tables endpoints.

Control decision:
- Keep modular cricket route authorities separate.
- Hold cricketCount.js and server-express.js inline cricket endpoints behind NEEDS_RUNTIME_PROOF before any consolidation or retirement.

Candidate group 5: deploy trigger files and called route endpoints

Assets:
- backend/deploy-trigger.js
- backend/routes/pipeline.js
- backend/deploy-trigger-cricket.js
- backend/routes/cricketCron.js
- backend/server-express.js

Phase 6 decisions:
- backend/deploy-trigger.js: CANONICAL_KEEP - external pipeline trigger caller, not route authority.
- backend/routes/pipeline.js: CANONICAL_KEEP - /api/pipeline/run-full route authority.
- backend/deploy-trigger-cricket.js: CANONICAL_KEEP - external cricket trigger caller, not route authority.
- backend/routes/cricketCron.js: CANONICAL_KEEP - modular cricket cron/cache route authority.
- backend/server-express.js /api/cron/cricket-daily-fixtures: NEEDS_RUNTIME_PROOF - inline cricket-daily-fixtures route host.

Evidence:
- backend/deploy-trigger.js calls /api/pipeline/run-full.
- backend/routes/pipeline.js defines GET and POST /run-full and is mounted at /api/pipeline.
- backend/deploy-trigger-cricket.js calls /api/cron/cricket-daily-fixtures.
- backend/routes/cricketCron.js defines modular /cricket/cricbuzz, /cricket/cricapi/daily, and /cricket/cricapi/live endpoints under /api/cron.
- server-express.js still owns the inline /api/cron/cricket-daily-fixtures endpoint and mounts both /api/pipeline and /api/cron route modules.

Control decision:
- Keep trigger files as external callers.
- Keep route files as route authorities for their mounted route domains.
- Hold server-express.js inline cricket-daily-fixtures behind NEEDS_RUNTIME_PROOF before any route replacement or retirement.

B02-B03 Phase 6 decision summary:
- Candidate groups reviewed: 5
- CANONICAL_KEEP decisions recorded: YES
- NEEDS_RUNTIME_PROOF holds recorded: YES
- DEFER decisions recorded: NO
- Merge, deletion, retirement, refactor, SQL, deployment, provider, dependency, security, or runtime action authorized: NO
- B02-B03 Phase 6 canonical authority selection is evidence-complete.

Next batch group:
- B04-B06

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 6 - B04-B06 CANONICAL AUTHORITY SELECTION EVIDENCE

Result: PASS WITH CANONICAL AUTHORITY DECISIONS AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_6 - Canonical Authority Selection
- Batches: B04 - BACKEND_UTILS_SEMANTIC_CORE_AND_TEST; B05 - BACKEND_SCRIPTS; B06 - BACKEND_PROVIDERS
- Source evidence: PHASE 5 - B04-B06 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- Start HEAD: 1e6bb1ba
- Evidence type: canonical authority decision only
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Candidate group 1: verification controller boundary

Assets:
- backend/core/verificationController.js
- backend/semantic-layer/verificationController.js
- backend/core/verificationSignalContract.js
- backend/core/executionPipeline.js

Phase 6 decisions:
- backend/core/verificationController.js: CANONICAL_KEEP - core verification controller authority.
- backend/semantic-layer/verificationController.js: CANONICAL_KEEP - semantic-layer verification adapter authority.
- backend/core/verificationSignalContract.js: CANONICAL_KEEP - canonical verification signal contract.
- backend/core/executionPipeline.js: NEEDS_RUNTIME_PROOF - orchestration bridge needs live caller proof before any replacement.

Control decision:
- Keep the verification controller, semantic adapter, and signal contract as canonical authorities.
- Hold executionPipeline behind NEEDS_RUNTIME_PROOF before any replacement or retirement.

Candidate group 2: semantic governance and control-plane pipeline

Assets:
- backend/semantic-layer/controlPlaneEvaluator.js
- backend/semantic-layer/decisionFingerprintService.js
- backend/semantic-layer/enforcementGuard.js
- backend/semantic-layer/errorMemoryLayer.js
- backend/semantic-layer/gatekeeperAdapter.js
- backend/semantic-layer/governanceGatekeeper.js
- backend/semantic-layer/normalizer.js
- backend/semantic-layer/preflightSimulator.js
- backend/semantic-layer/registry.js
- backend/semantic-layer/sportsdataioContractHelpers.js
- backend/semantic-layer/violationLogger.js

Phase 6 decisions:
- backend/semantic-layer/controlPlaneEvaluator.js: CANONICAL_KEEP - semantic control-plane evaluator authority.
- backend/semantic-layer/decisionFingerprintService.js: CANONICAL_KEEP - decision fingerprint authority.
- backend/semantic-layer/enforcementGuard.js: CANONICAL_KEEP - enforcement boundary authority.
- backend/semantic-layer/errorMemoryLayer.js: CANONICAL_KEEP - error-memory authority.
- backend/semantic-layer/gatekeeperAdapter.js: CANONICAL_KEEP - gatekeeper adapter authority.
- backend/semantic-layer/governanceGatekeeper.js: CANONICAL_KEEP - governance gatekeeper authority.
- backend/semantic-layer/normalizer.js: CANONICAL_KEEP - semantic normalization authority.
- backend/semantic-layer/preflightSimulator.js: CANONICAL_KEEP - preflight simulation authority.
- backend/semantic-layer/registry.js: CANONICAL_KEEP - semantic registry authority.
- backend/semantic-layer/sportsdataioContractHelpers.js: CANONICAL_KEEP - SportsDataIO contract helper authority.
- backend/semantic-layer/violationLogger.js: CANONICAL_KEEP - semantic violation logging authority.

Control decision:
- Keep each semantic-layer file as the canonical authority for its own control-plane boundary.
- No consolidation is authorized.

Candidate group 3: ACCA, market consistency, and insight-rule surfaces

Assets:
- backend/utils/accaLogicEngine.js
- backend/utils/insightEngine.js
- backend/utils/insightValidationMatrix.js
- backend/utils/marketConsistency.js
- backend/utils/conflictResolver.js
- backend/utils/secondaryMarketSelector.js
- backend/utils/validation.js
- backend/test/smoke-test-insight-engine.js
- backend/test/smoke-test-skcs-law.js
- backend/scripts/add-avg-total-log.js
- backend/scripts/add-diagnostics.js
- backend/scripts/patch-acca-builder.js
- backend/scripts/patch-card-uniqueness.js
- backend/scripts/patch-final-flow.js
- backend/scripts/patch-row-cleanup.js
- backend/scripts/patch-skcs-law.js

Phase 6 decisions:
- backend/utils/accaLogicEngine.js: CANONICAL_KEEP - ACCA math and leg-selection authority.
- backend/utils/insightEngine.js: CANONICAL_KEEP - ACCA core law authority.
- backend/utils/insightValidationMatrix.js: CANONICAL_KEEP - insight-leg validation authority.
- backend/utils/marketConsistency.js: CANONICAL_KEEP - market consistency authority.
- backend/utils/conflictResolver.js: CANONICAL_KEEP - market conflict resolution authority.
- backend/utils/secondaryMarketSelector.js: CANONICAL_KEEP - secondary-market selection authority.
- backend/utils/validation.js: CANONICAL_KEEP - rule validation authority.
- backend/test/smoke-test-insight-engine.js: NEEDS_RUNTIME_PROOF - proof artifact, not authority.
- backend/test/smoke-test-skcs-law.js: NEEDS_RUNTIME_PROOF - proof artifact, not authority.
- backend/scripts/add-avg-total-log.js: NEEDS_RUNTIME_PROOF - manual patch helper, not canonical runtime authority.
- backend/scripts/add-diagnostics.js: NEEDS_RUNTIME_PROOF - manual patch helper, not canonical runtime authority.
- backend/scripts/patch-acca-builder.js: NEEDS_RUNTIME_PROOF - patch helper, not canonical runtime authority.
- backend/scripts/patch-card-uniqueness.js: NEEDS_RUNTIME_PROOF - patch helper, not canonical runtime authority.
- backend/scripts/patch-final-flow.js: NEEDS_RUNTIME_PROOF - patch helper, not canonical runtime authority.
- backend/scripts/patch-row-cleanup.js: NEEDS_RUNTIME_PROOF - patch helper, not canonical runtime authority.
- backend/scripts/patch-skcs-law.js: NEEDS_RUNTIME_PROOF - patch helper, not canonical runtime authority.

Control decision:
- Keep runtime utility files as canonical authorities.
- Hold tests and patch helpers behind NEEDS_RUNTIME_PROOF.

Candidate group 4: database/cache/job utility surfaces

Assets:
- backend/utils/db.js
- backend/utils/apiCache.js
- backend/utils/jobLogger.js
- backend/utils/purgeStaleData.js

Phase 6 decisions:
- backend/utils/db.js: CANONICAL_KEEP - general database helper authority.
- backend/utils/apiCache.js: CANONICAL_KEEP - API cache authority.
- backend/utils/jobLogger.js: CANONICAL_KEEP - job logging authority.
- backend/utils/purgeStaleData.js: NEEDS_RUNTIME_PROOF - stale-data purge helper is not the canonical database authority.

Control decision:
- Keep the helper, cache, and job logger surfaces.
- Hold purgeStaleData.js behind NEEDS_RUNTIME_PROOF.

Candidate group 5: external provider access, quota, key, cache, and circuit-breaker utilities

Assets:
- backend/errors/ProviderQuotaExceededError.js
- backend/utils/apiQueue.js
- backend/utils/apiUsageLimiter.js
- backend/utils/keyPool.js
- backend/utils/providerCircuitBreaker.js
- backend/utils/rapidApiWaterfall.js
- backend/utils/availability.js
- backend/utils/weather.js
- backend/providers/football/bigBallsDataProvider.js
- backend/providers/football/bsdProvider.js
- backend/providers/football/bzzoiroProvider.js
- backend/providers/football/soccerDataApiProvider.js
- backend/providers/football/sportsApiProFootballAdapter.js

Phase 6 decisions:
- backend/errors/ProviderQuotaExceededError.js: CANONICAL_KEEP - provider quota error authority.
- backend/utils/apiQueue.js: CANONICAL_KEEP - provider request queue authority.
- backend/utils/apiUsageLimiter.js: CANONICAL_KEEP - usage limiter authority.
- backend/utils/keyPool.js: CANONICAL_KEEP - provider key pool authority.
- backend/utils/providerCircuitBreaker.js: CANONICAL_KEEP - provider circuit-breaker authority.
- backend/utils/rapidApiWaterfall.js: CANONICAL_KEEP - RapidAPI fallback/access authority.
- backend/utils/availability.js: CANONICAL_KEEP - provider availability authority.
- backend/utils/weather.js: CANONICAL_KEEP - weather enrichment authority.
- backend/providers/football/bigBallsDataProvider.js: CANONICAL_KEEP - external football provider authority.
- backend/providers/football/bsdProvider.js: CANONICAL_KEEP - external football provider authority.
- backend/providers/football/bzzoiroProvider.js: CANONICAL_KEEP - external football provider authority.
- backend/providers/football/soccerDataApiProvider.js: CANONICAL_KEEP - external football provider authority.
- backend/providers/football/sportsApiProFootballAdapter.js: NEEDS_RUNTIME_PROOF - adapter boundary needs live caller proof before any replacement.

Control decision:
- Keep the provider-access utilities and provider implementations as canonical authorities.
- Hold the adapter boundary behind NEEDS_RUNTIME_PROOF.

Candidate group 6: football provider and normalizer families

Assets:
- backend/providers/football/bigBallsDataProvider.js
- backend/providers/football/bigBallsDataNormalizer.js
- backend/providers/football/bsdProvider.js
- backend/providers/football/bsdNormalizer.js
- backend/providers/football/bzzoiroProvider.js
- backend/providers/football/bzzoiroNormalizer.js
- backend/providers/football/soccerDataApiProvider.js
- backend/providers/football/soccerDataApiNormalizer.js
- backend/providers/football/sportsApiProFootballAdapter.js
- backend/providers/football/sportsApiProFootballNormalizer.js

Phase 6 decisions:
- backend/providers/football/bigBallsDataProvider.js: CANONICAL_KEEP - BigBalls provider authority.
- backend/providers/football/bigBallsDataNormalizer.js: CANONICAL_KEEP - BigBalls normalizer authority.
- backend/providers/football/bsdProvider.js: CANONICAL_KEEP - BSD provider authority.
- backend/providers/football/bsdNormalizer.js: CANONICAL_KEEP - BSD normalizer authority.
- backend/providers/football/bzzoiroProvider.js: CANONICAL_KEEP - Bzzoiro provider authority.
- backend/providers/football/bzzoiroNormalizer.js: CANONICAL_KEEP - Bzzoiro normalizer authority.
- backend/providers/football/soccerDataApiProvider.js: CANONICAL_KEEP - SoccerDataAPI provider authority.
- backend/providers/football/soccerDataApiNormalizer.js: CANONICAL_KEEP - SoccerDataAPI normalizer authority.
- backend/providers/football/sportsApiProFootballAdapter.js: NEEDS_RUNTIME_PROOF - shared adapter boundary.
- backend/providers/football/sportsApiProFootballNormalizer.js: CANONICAL_KEEP - SportsApiPro normalizer authority.

Control decision:
- Keep each provider/normalizer pair as canonical for its source.
- Hold the shared adapter behind NEEDS_RUNTIME_PROOF.

Candidate group 7: sports normalization and ingestion scripts

Assets:
- backend/parsers/base_sport_parser.py
- backend/workers/now_api_pulse.py
- backend/scripts/bridge_frontend.py
- backend/scripts/generate_vip_master.py
- backend/scripts/ingest_football.py
- backend/scripts/populate_sports_data.py
- backend/scripts/sync-sportsrc-fixtures.js
- backend/scripts/requirements.txt
- backend/utils/sportsrcNormalizer.js
- backend/audit/system_integrity_audit.md

Phase 6 decisions:
- backend/parsers/base_sport_parser.py: NEEDS_RUNTIME_PROOF - parser support surface, not canonical runtime authority.
- backend/workers/now_api_pulse.py: NEEDS_RUNTIME_PROOF - worker support surface, not canonical runtime authority.
- backend/scripts/bridge_frontend.py: NEEDS_RUNTIME_PROOF - script bridge, not canonical runtime authority.
- backend/scripts/generate_vip_master.py: NEEDS_RUNTIME_PROOF - script support surface, not canonical runtime authority.
- backend/scripts/ingest_football.py: NEEDS_RUNTIME_PROOF - ingestion script, not canonical runtime authority.
- backend/scripts/populate_sports_data.py: NEEDS_RUNTIME_PROOF - ingestion script, not canonical runtime authority.
- backend/scripts/sync-sportsrc-fixtures.js: NEEDS_RUNTIME_PROOF - sync script, not canonical runtime authority.
- backend/scripts/requirements.txt: NEEDS_RUNTIME_PROOF - script environment support, not canonical runtime authority.
- backend/utils/sportsrcNormalizer.js: CANONICAL_KEEP - SportsRC normalization authority.
- backend/audit/system_integrity_audit.md: NEEDS_RUNTIME_PROOF - audit evidence, not canonical runtime authority.

Control decision:
- Keep sportsrcNormalizer.js as canonical authority.
- Hold script and audit surfaces behind NEEDS_RUNTIME_PROOF.

B04-B06 Phase 6 decision summary:
- Candidate groups reviewed: 7
- CANONICAL_KEEP decisions recorded: YES
- NEEDS_RUNTIME_PROOF holds recorded: YES
- Merge, deletion, retirement, refactor, SQL, deployment, provider, dependency, security, or runtime action authorized: NO
- B04-B06 Phase 6 canonical authority selection is evidence-complete.

Next batch group:
- B07-B10

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 6 - B23-B26 CANONICAL AUTHORITY SELECTION EVIDENCE

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Existing runtime/service authorities from earlier B04-B06, B07-B10, B15-B18, and B19-B22 decisions remain CANONICAL_KEEP where already recorded.
This packet records the B23-B26 Phase 5 overlap candidate families only and does not replace earlier authorities with SQL, function, scratch, or deployment artifacts.

Candidate group 1: SQL prediction, ACCA, market, and rulebook surfaces

Phase 6 decisions:
- sql/acca_rules.sql: NEEDS_RUNTIME_PROOF - historical SQL seed artifact, not canonical runtime authority.
- sql/extreme_smb_data.sql: NEEDS_RUNTIME_PROOF - historical SQL schema artifact, not canonical runtime authority.
- sql/market_correlations_schema.sql: NEEDS_RUNTIME_PROOF - historical SQL schema artifact, not canonical runtime authority.
- sql/master_rulebook_triggers.sql: NEEDS_RUNTIME_PROOF - historical SQL trigger artifact, not canonical runtime authority.
- sql/performance_optimizations.sql: NEEDS_RUNTIME_PROOF - historical SQL optimization artifact, not canonical runtime authority.
- sql/schema_refactor.sql: NEEDS_RUNTIME_PROOF - historical SQL schema artifact, not canonical runtime authority.
- sql/tables.sql: NEEDS_RUNTIME_PROOF - historical SQL schema artifact, not canonical runtime authority.
- sql/tier_rules.sql: NEEDS_RUNTIME_PROOF - historical SQL seed artifact, not canonical runtime authority.
- supabase/schema/ai_pipeline_schema.sql: NEEDS_RUNTIME_PROOF - historical pipeline schema artifact, not canonical runtime authority.

No canonical SQL rulebook/schema authority is selected.
These assets remain historical/ordered database-change artifacts held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 2: Supabase RLS, subscription, test-user, and access setup scripts

Phase 6 decisions:
- sql/day_zero_subscription.sql: NEEDS_RUNTIME_PROOF - subscription setup SQL, not canonical access authority.
- sql/fix_rls_policies.sql: NEEDS_RUNTIME_PROOF - RLS repair SQL, not canonical access authority.
- sql/supabase_test_user_reset_and_seed.sql: NEEDS_RUNTIME_PROOF - test-user reset/seed SQL, not canonical access authority.
- sql/supabase_test_user_seed_access.sql: NEEDS_RUNTIME_PROOF - test-user access seed SQL, not canonical access authority.

No canonical Supabase access/test-user script is selected.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 3: RapidAPI cache, monitoring, and operational SQL surfaces

Phase 6 decisions:
- sql/rapidapi_cache.sql: NEEDS_RUNTIME_PROOF - operational SQL artifact, not canonical cache authority.
- sql/monitoring_tables.sql: NEEDS_RUNTIME_PROOF - operational SQL artifact, not canonical monitoring authority.
- sql/performance_optimizations.sql: NEEDS_RUNTIME_PROOF - operational SQL artifact, not canonical monitoring authority.
- supabase/schema/ai_pipeline_schema.sql: NEEDS_RUNTIME_PROOF - pipeline schema artifact, not canonical operational authority.

No canonical operational SQL authority is selected.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 4: Supabase scheduled sync, refresh, and semantic function surfaces

Phase 6 decisions:
- supabase/edge-functions/scheduled-fixture-sync/index.ts: NEEDS_RUNTIME_PROOF - scheduled sync function surface, not canonical authority until overlap with scheduledFixtureSync is resolved.
- supabase/edge-functions/scheduledFixtureSync/index.ts: NEEDS_RUNTIME_PROOF - scheduled sync function surface, not canonical authority until overlap with scheduled-fixture-sync is resolved.
- supabase/functions/scheduled-prediction-refresh/index.ts: NEEDS_RUNTIME_PROOF - scheduled refresh function surface, not canonical authority.
- supabase/functions/semantic-drift-summary/index.ts: NEEDS_RUNTIME_PROOF - semantic drift function surface, not canonical authority.
- supabase/functions/sync-sports-data/index.ts: NEEDS_RUNTIME_PROOF - manifest-listed path absent from working tree; recorded as evidence only. No restore, delete, deploy, or repair is authorized.

No canonical Supabase function authority is selected among overlapping scheduled/sync surfaces.
Missing manifest asset is recorded only as future governance evidence.

Candidate group 5: Control Center and governance test surfaces

Phase 6 decisions:
- tests/edge-asset-classification.test.js: CANONICAL_KEEP - distinct asset-classification governance contract.
- tests/edge-control-center-ledger.test.js: CANONICAL_KEEP - distinct Control Center ledger governance contract.
- tests/edge-control-center-ui.test.js: CANONICAL_KEEP - distinct Control Center UI governance contract.
- tests/edge-project-register.test.js: CANONICAL_KEEP - distinct project-register governance contract.
- tests/edge-repository-asset-register.test.js: CANONICAL_KEEP - distinct repository asset-register governance contract.
- tests/edge-system-runtime-inventory.test.js: CANONICAL_KEEP - distinct system runtime inventory governance contract.

Governance tests remain separate canonical authorities for their distinct Control Center contracts.

Candidate group 6: scratch database scripts

Phase 6 decisions:
- scratch/db_normalize.js: NEEDS_RUNTIME_PROOF - mutation-capable scratch script, not canonical authority.
- scratch/db_sync.js: NEEDS_RUNTIME_PROOF - mutation-capable scratch script, not canonical authority.

No scratch database script is selected as canonical authority.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 7: deployment and hosting configuration surfaces

Phase 6 decisions:
- Dockerfile: CANONICAL_KEEP - distinct container hosting authority.
- render.yaml: CANONICAL_KEEP - distinct Render hosting authority.
- vercel.json: CANONICAL_KEEP - distinct Vercel hosting authority.

Deployment configuration surfaces remain separate canonical authorities for their distinct hosting surfaces.

B23-B26 Phase 6 decision summary:
- Candidate groups reviewed: 7
- CANONICAL_KEEP decisions recorded: YES
- NEEDS_RUNTIME_PROOF holds recorded: YES
- Merge, deletion, retirement, refactor, SQL execution, Supabase mutation, deployment change, dependency, security, or runtime action authorized: NO
- B23-B26 Phase 6 canonical authority selection is evidence-complete.

Next batch group:
- B27-B29

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 6 - B27-B29 CANONICAL AUTHORITY SELECTION EVIDENCE

Decision vocabulary used:
- CANONICAL_KEEP
- NEEDS_RUNTIME_PROOF

Existing runtime/service, frontend, deployment, and governance authorities from earlier B04-B06, B07-B10, B11-B14, B15-B18, B19-B22, and B23-B26 decisions remain CANONICAL_KEEP where already recorded.
This packet records the B27-B29 Phase 5 overlap candidate families only and does not replace earlier authorities with root scripts, reports, duplicate frontend surfaces, agent workflows, or temporary data artifacts.

Candidate group 1: root manual scripts, AI diagnostics, provider tests, and pipeline utilities

Phase 6 decisions:
- find-active-files.js: NEEDS_RUNTIME_PROOF - manual inspection script, not canonical runtime authority.
- force-seed.js: NEEDS_RUNTIME_PROOF - manual seed script, not canonical runtime authority.
- refresh-ai-insights.js: NEEDS_RUNTIME_PROOF - AI refresh script, not canonical runtime authority.
- run-final-test.js: NEEDS_RUNTIME_PROOF - manual test script, not canonical runtime authority.
- scratch_test_pipeline.js: NEEDS_RUNTIME_PROOF - pipeline test script, not canonical runtime authority.
- trigger_ai.js: NEEDS_RUNTIME_PROOF - AI trigger script, not canonical runtime authority.
- test_scenarios_master_rulebook.js: NEEDS_RUNTIME_PROOF - rulebook test script, not canonical runtime authority.
- test-ai-insights.js: NEEDS_RUNTIME_PROOF - AI diagnostic script, not canonical runtime authority.
- test-ai-simulation.js: NEEDS_RUNTIME_PROOF - AI simulation script, not canonical runtime authority.
- test-bigballs-direct.js: NEEDS_RUNTIME_PROOF - provider test script, not canonical runtime authority.
- test-espn-direct.js: NEEDS_RUNTIME_PROOF - provider test script, not canonical runtime authority.
- test-groq-debug.js: NEEDS_RUNTIME_PROOF - provider diagnostic script, not canonical runtime authority.
- test-groq-models.js: NEEDS_RUNTIME_PROOF - provider diagnostic script, not canonical runtime authority.
- test-sportsdb.js: NEEDS_RUNTIME_PROOF - provider test script, not canonical runtime authority.
- test-wc-id.js: NEEDS_RUNTIME_PROOF - provider test script, not canonical runtime authority.

No root manual script, AI diagnostic, provider test, or pipeline utility is selected as canonical authority.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 2: package, build, dependency, and frontend build config surfaces

Phase 6 decisions:
- package.json: CANONICAL_KEEP - distinct npm/build orchestration authority.
- package-lock.json: CANONICAL_KEEP - distinct dependency lock authority.
- tailwind.config.js: CANONICAL_KEEP - distinct frontend build config authority.
- qodana.yaml: NEEDS_RUNTIME_PROOF - static-analysis configuration, not canonical runtime authority.
- LICENSE: CANONICAL_KEEP - distinct legal/license artifact.

Package and build configuration surfaces remain separate canonical authorities for their distinct configuration roles.
Static-analysis configuration remains held behind NEEDS_RUNTIME_PROOF.

Candidate group 3: phase reports, Supabase reports, migration plans, and dependency maps

Phase 6 decisions:
- phase1-final-report.json: NEEDS_RUNTIME_PROOF - historical phase report artifact, not canonical runtime authority.
- phase2-conservative-summary.json: NEEDS_RUNTIME_PROOF - historical phase report artifact, not canonical runtime authority.
- phase2-final-summary.json: NEEDS_RUNTIME_PROOF - historical phase report artifact, not canonical runtime authority.
- phase3-comprehensive-summary.json: NEEDS_RUNTIME_PROOF - historical phase report artifact, not canonical runtime authority.
- phase3-migration-summary.json: NEEDS_RUNTIME_PROOF - historical phase report artifact, not canonical runtime authority.
- overall-project-completion.json: NEEDS_RUNTIME_PROOF - historical project report artifact, not canonical runtime authority.
- placeholders-and-insights-audit.json: NEEDS_RUNTIME_PROOF - historical audit report artifact, not canonical runtime authority.
- safe-migration-plan.json: NEEDS_RUNTIME_PROOF - historical migration-plan artifact, not canonical runtime authority.
- supabase-diagnostics-report.json: NEEDS_RUNTIME_PROOF - historical Supabase diagnostic artifact, not canonical runtime authority.
- supabase-migration-plan.json: NEEDS_RUNTIME_PROOF - historical migration-plan artifact, not canonical runtime authority.
- supabase-table-analysis.json: NEEDS_RUNTIME_PROOF - historical table-analysis artifact, not canonical runtime authority.
- supabase-visual-analysis-report.json: NEEDS_RUNTIME_PROOF - historical visual-analysis artifact, not canonical runtime authority.
- table-dependency-map.json: NEEDS_RUNTIME_PROOF - historical dependency-map artifact, not canonical runtime authority.
- reports/execution-spine-compliance-map.json: NEEDS_RUNTIME_PROOF - execution-spine projection artifact, not canonical runtime authority.
- reports/execution-spine-compliance-map.md: NEEDS_RUNTIME_PROOF - execution-spine projection artifact, not canonical runtime authority.

No report, audit map, or markdown projection is selected as canonical authority.
These assets remain preserved historical evidence held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 4: root/public frontend and Supabase client bundle surfaces

Phase 6 decisions:
- market-explorer.html: NEEDS_RUNTIME_PROOF - root duplicate frontend surface; public/market-explorer.html remains the recorded public delivery authority from B19-B22.
- js/config.js: NEEDS_RUNTIME_PROOF - root duplicate config surface; public/js/config.js remains the recorded public config authority from B19-B22.
- js/supabase-bundle.js: NEEDS_RUNTIME_PROOF - root duplicate bundle surface; public/js/supabase-bundle.js remains the recorded public bundle authority from B19-B22.
- js/supabase-client-src.js: CANONICAL_KEEP - distinct Supabase client source/build-input authority referenced by package.json build:supabase.
- js/supabase-init.js: NEEDS_RUNTIME_PROOF - root duplicate init surface; public/js/supabase-init.js remains the recorded public init authority from B19-B22.

No root duplicate frontend or bundle surface replaces the earlier public frontend authorities.
The Supabase client source/build-input remains a separate canonical build authority.

Candidate group 5: local launch, model/runtime, and auxiliary project surfaces

Phase 6 decisions:
- SKCS_START.bat: NEEDS_RUNTIME_PROOF - local/manual launch surface, not canonical runtime authority.
- dolphin-server/Dockerfile: NEEDS_RUNTIME_PROOF - local model/runtime container surface, not canonical product runtime authority.
- dolphin-server/README.md: NEEDS_RUNTIME_PROOF - local model/runtime documentation, not canonical product runtime authority.
- sportbook: NEEDS_RUNTIME_PROOF - auxiliary project surface, not canonical runtime authority.
- kabaddiPy: NEEDS_RUNTIME_PROOF - auxiliary project surface, not canonical runtime authority.

No local launcher, Dockerfile, README, or auxiliary project asset is selected as canonical authority.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 6: agent workflow, local tool config, and hook surfaces

Phase 6 decisions:
- .gemini/antigravity/README.md: NEEDS_RUNTIME_PROOF - agent workflow documentation, not canonical product authority.
- .gemini/antigravity/workflows/automated-data-sync.toml: NEEDS_RUNTIME_PROOF - agent workflow config, not canonical product authority.
- .gemini/antigravity/workflows/intelligent-alert-system.toml: NEEDS_RUNTIME_PROOF - agent workflow config, not canonical product authority.
- .gemini/antigravity/workflows/intelligent-pipeline-optimizer.toml: NEEDS_RUNTIME_PROOF - agent workflow config, not canonical product authority.
- .gemini/antigravity/workflows/smart-prediction-engine.toml: NEEDS_RUNTIME_PROOF - agent workflow config, not canonical product authority.
- .gemini/commands.toml: NEEDS_RUNTIME_PROOF - agent command config, not canonical product authority.
- .qwen/settings.json: NEEDS_RUNTIME_PROOF - local tool settings, not canonical product authority.
- .qwen/settings.json.orig: NEEDS_RUNTIME_PROOF - local tool settings backup, not canonical product authority.
- .windsurf/workflows/env.md: NEEDS_RUNTIME_PROOF - local tool workflow note, not canonical product authority.
- .githooks/pre-commit: NEEDS_RUNTIME_PROOF - local Git hook surface, not canonical runtime authority.
- .stakpak/data/local.db: NEEDS_RUNTIME_PROOF - local tool database artifact, not canonical runtime authority.

No agent workflow, hook, local DB, or tool config is selected as canonical authority.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 7: API pipeline route and execution-spine projections

Phase 6 decisions:
- api/pipeline/run-full.js: NEEDS_RUNTIME_PROOF - Vercel API pipeline route surface overlapping backend/routes/pipeline.js; not canonical authority until runtime proof resolves the route boundary.
- reports/execution-spine-compliance-map.json: NEEDS_RUNTIME_PROOF - execution-spine projection artifact, not canonical runtime authority.
- reports/execution-spine-compliance-map.md: NEEDS_RUNTIME_PROOF - execution-spine projection artifact, not canonical runtime authority.

No API route or execution-spine projection is selected as canonical authority over the existing backend pipeline route authority.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

Candidate group 8: provider data dumps, sports catalog data, placeholder data, and temporary validation artifacts

Phase 6 decisions:
- src/data/placeholder.txt: NEEDS_RUNTIME_PROOF - placeholder data artifact, not canonical runtime authority.
- src/data/sportsdb-leagues.json: NEEDS_RUNTIME_PROOF - provider catalog snapshot, not canonical runtime authority.
- tmp/key-validation-1776365488298.json: NEEDS_RUNTIME_PROOF - temporary validation artifact, not canonical runtime authority.
- tmp/key-validation-1776365827255.json: NEEDS_RUNTIME_PROOF - temporary validation artifact, not canonical runtime authority.
- tmp/key-validation-1776482624434.json: NEEDS_RUNTIME_PROOF - temporary validation artifact, not canonical runtime authority.
- tmp/today-fixture-pull-1776482706164.json: NEEDS_RUNTIME_PROOF - temporary fixture-pull artifact, not canonical runtime authority.

No provider-data snapshot, placeholder file, or temporary validation artifact is selected as canonical authority.
These assets remain held behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.

B27-B29 Phase 6 decision summary:
- Candidate groups reviewed: 8
- CANONICAL_KEEP decisions recorded: YES
- NEEDS_RUNTIME_PROOF holds recorded: YES
- Merge, deletion, retirement, refactor, SQL execution, Supabase mutation, deployment change, dependency, security, or runtime action authorized: NO
- B27-B29 Phase 6 canonical authority selection is evidence-complete.
- PHASE_6 canonical authority selection is complete across B02-B03 through B27-B29.
- Next action: close PHASE_6 and activate PHASE_7 when separately authorized.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 6 CLOSURE SUMMARY

Result: PASS WITH CANONICAL AUTHORITY DECISIONS

Scope:
- Phase: PHASE_6 - Canonical Authority Selection
- Phase question: Which Phase 5 overlap candidate families should have canonical authority selected?
- Closure commit: 1bd3adad
- Pre-closure lifecycle state: PHASE_READY_TO_CLOSE
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Closed Phase 6 batch packets:
- B02-B03 complete
- B04-B06 complete
- B07-B10 complete
- B11-B14 complete
- B15-B18 complete
- B19-B22 complete
- B23-B26 complete
- B27-B29 complete

Phase 6 outcome summary:
- Canonical authority decisions were recorded across all eight Phase 6 review units using CANONICAL_KEEP and NEEDS_RUNTIME_PROOF only.
- Phase 5 overlap candidate families were reviewed without merge, deletion, retirement, refactor, SQL execution, deployment change, or runtime action.
- NEEDS_RUNTIME_PROOF holds remain in force until separately resolved through approved future work.
- No cleanup implementation was authorized during Phase 6.

Important non-actions:
- No file was deleted.
- No file was merged.
- No file was retired.
- No runtime code was changed.
- No UI behavior was changed.
- No SQL was executed.
- No Supabase/database state was changed.
- No deployment or hosting config was changed.
- No dependency/security/vulnerability remediation was performed.

Phase 6 closure decision:
- PHASE_6 canonical authority selection is complete across B02-B03 through B27-B29.
- PHASE_6 is now closed.
- PHASE_7 is activated as the next cleanup phase.

PHASE_7 activation warning:
- PHASE_7 activation does not authorize implementation until a separate Phase 7 batch mini-project is approved.
- Activating PHASE_7 establishes merge-and-consolidation scope only; it does not authorize deletion, merge execution, retirement, refactor, SQL, Supabase mutation, deployment change, dependency update, or vulnerability remediation.

Next recommended control action:
- Open the first approved PHASE_7 batch mini-project at B01 when separately authorized.
- Do not begin merge/consolidation implementation without an explicit Phase 7 batch gate.

Validation boundary:
- Control Center state transition only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 7 - B01 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Batch: B01 - CONTROL_CENTER
- Start HEAD: a5abcfec
- Evidence type: merge/consolidation gate inspection only
- B02-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B01 membership
- PHASE 5 - B01 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 4 - B01 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 3 - B01 ACTIVE USE IDENTIFICATION EVIDENCE
- PHASE 6 canonical authority decisions for overlapping control-center checkers (B04-B06 candidate group 8)

B01 assets inspected (15):
1. control-center/check_control_center.js
2. control-center/check_edge_asset_classification.js
3. control-center/check_edge_project_register.js
4. control-center/check_edge_repository_asset_register.js
5. control-center/check_edge_system_runtime_inventory.js
6. control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json
7. control-center/EDGE_ASSET_REPOSITORY_MAP.md
8. control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json
9. control-center/EDGE_CONTROL_CENTER.md
10. control-center/EDGE_MASTER_PROJECT_REGISTER.v1.json
11. control-center/EDGE_PROJECT_BACKLOG.md
12. control-center/EDGE_PROJECT_DEPENDENCY_MAP.md
13. control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json
14. control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json
15. control-center/EDGE_SYSTEM_RUNTIME_MAP.md

Per-asset Phase 7 decisions:

Core Control Center governance group:
- control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json: NO_ACTION - machine ledger authority; Phase 5 partial overlap with policy/checker is intentional and no merge group was proven.
- control-center/EDGE_CONTROL_CENTER.md: NO_ACTION - operator governance document and structured state authority; consolidation would break active Control Center gate evidence.
- control-center/check_control_center.js: NO_ACTION - Phase 6 CANONICAL_KEEP governance checker; no safe consolidation path proven.

Asset classification and repository asset authority group:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json: NO_ACTION - deterministic batch manifest authority; must remain separate from register and checker surfaces.
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json: NO_ACTION - governed asset register authority; Phase 5 keep-separate decision stands.
- control-center/check_edge_asset_classification.js: NO_ACTION - Phase 6 CANONICAL_KEEP governance checker; regenerates map but is not replaceable by register or manifest alone.
- control-center/EDGE_ASSET_REPOSITORY_MAP.md: NO_ACTION - generated human-readable projection; intentional derived output, not a merge candidate.

Project register projection group:
- control-center/EDGE_MASTER_PROJECT_REGISTER.v1.json: NO_ACTION - project register authority derived from ledger; Phase 5 projection overlap is expected.
- control-center/check_edge_project_register.js: NO_ACTION - ACTIVE governance checker validating and synchronizing register projections; no Phase 6 NEEDS_RUNTIME_PROOF hold and no merge proof.
- control-center/EDGE_PROJECT_BACKLOG.md: NO_ACTION - generated backlog projection; MANUAL_USE documentation output, not canonical merge target.
- control-center/EDGE_PROJECT_DEPENDENCY_MAP.md: NO_ACTION - generated dependency projection; MANUAL_USE documentation output, not canonical merge target.

Repository asset register checker:
- control-center/check_edge_repository_asset_register.js: NO_ACTION - ACTIVE governance checker for asset register integrity; distinct from classification and project register checkers.

Runtime inventory projection group:
- control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json: NO_ACTION - machine-readable runtime inventory authority; Phase 5 keep-separate decision stands.
- control-center/check_edge_system_runtime_inventory.js: NO_ACTION - Phase 6 CANONICAL_KEEP governance checker; synchronizes map but remains distinct checker authority.
- control-center/EDGE_SYSTEM_RUNTIME_MAP.md: NO_ACTION - generated runtime review projection; intentional derived output, not a merge candidate.

Implementation actions performed:
- None.

No-action and hold summary:
- IMPLEMENT_CONSOLIDATION: 0 assets
- NO_ACTION: 15 assets
- HOLD_NEEDS_RUNTIME_PROOF: 0 assets

Why no B01 consolidation was authorized:
- Phase 5 recorded only controlled PARTIAL_OVERLAP across source/checker/projection surfaces and explicitly found no MAJOR_OVERLAP or POTENTIAL_MERGE_GROUP for B01.
- Phase 4 recorded all 15 B01 assets as CURRENT with no superseded or replaced authority.
- Phase 6 CANONICAL_KEEP decisions for three B01 checkers confirm they remain distinct governance authorities rather than merge targets.
- Merging ledger, register, manifest, checker, or generated projection surfaces would break active package.json control scripts, checker validation paths, and governed synchronization contracts without proven safety.

Explicit scope confirmation:
- B01 only.
- B02-B29 not inspected for implementation in this packet.
- No runtime/source files outside allowed governance evidence were changed.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 7 - B01-B03 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B01-B03
- Start HEAD: 48b935d2
- B01 evidence: carried forward from PHASE 7 - B01 MERGE AND CONSOLIDATION EVIDENCE (commit 48b935d2 predecessor); not reworked
- New inspection scope: B02 and B03 only
- B04-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B02 and B03 membership
- PHASE 3 - B02 and B03 ACTIVE USE IDENTIFICATION EVIDENCE
- PHASE 4 - B02 and B03-B06 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B02-B03 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B02-B03 CANONICAL AUTHORITY SELECTION EVIDENCE
- PHASE 7 - B01 MERGE AND CONSOLIDATION EVIDENCE (carried forward)

B01 carried-forward status:
- B01 assets inspected: 15
- B01 decision: NO_ACTION for all 15 control-center assets
- B01 implementation actions: none
- B01 evidence preserved without rewrite

B02 assets inspected (13):
1. backend/.gitignore
2. backend/apiClients.js
3. backend/checkCanonicalEvents.js
4. backend/config.js
5. backend/database.js
6. backend/db.js
7. backend/dbBootstrap.js
8. backend/deploy-trigger-cricket.js
9. backend/deploy-trigger.js
10. backend/edgemind_inference.py
11. backend/package-lock.json
12. backend/server-express.js
13. backend/test-ultra-slim.js

B02 per-asset Phase 7 decisions:
- backend/.gitignore: NO_ACTION - ACTIVE backend ignore boundary; Phase 5 found no B02-B03 functional overlap.
- backend/apiClients.js: NO_ACTION - ACTIVE provider client authority; Phase 5 distinct-role finding; no merge group proven.
- backend/checkCanonicalEvents.js: NO_ACTION - MANUAL_USE diagnostic script; Phase 4 CURRENT; no safe consolidation path.
- backend/config.js: NO_ACTION - ACTIVE environment/config authority; no merge candidate proven.
- backend/database.js: HOLD_NEEDS_RUNTIME_PROOF - Phase 6 NEEDS_RUNTIME_PROOF broad legacy/compatibility database surface; consolidation with backend/db.js not authorized without caller/runtime proof.
- backend/db.js: NO_ACTION - Phase 6 CANONICAL_KEEP general database access helper; remains authoritative as-is.
- backend/dbBootstrap.js: NO_ACTION - Phase 6 CANONICAL_KEEP bootstrap/schema/seed authority; remains authoritative as-is.
- backend/deploy-trigger-cricket.js: NO_ACTION - Phase 6 CANONICAL_KEEP external cricket trigger caller; distinct from route authority.
- backend/deploy-trigger.js: NO_ACTION - Phase 6 CANONICAL_KEEP external pipeline trigger caller; distinct from route authority.
- backend/edgemind_inference.py: NO_ACTION - MANUAL_USE EdgeMind inference bridge; no replacement or merge proof.
- backend/package-lock.json: HOLD_NEEDS_RUNTIME_PROOF - Phase 4 SUPERSEDED and Phase 3 NO_CURRENT_USE_FOUND; retirement or merge not authorized without runtime proof of safe removal.
- backend/server-express.js: NO_ACTION - Phase 6 CANONICAL_KEEP server bootstrap/mounting/legacy inline endpoint host; inline endpoint consolidation requires NEEDS_RUNTIME_PROOF holds to resolve first.
- backend/test-ultra-slim.js: NO_ACTION - MANUAL_USE inference test harness; no merge candidate proven.

B03 assets inspected (28):
1. backend/controllers/edgeMindController.js
2. backend/routes/accuracy.js
3. backend/routes/antigravity.js
4. backend/routes/chat.js
5. backend/routes/controlCenter.js
6. backend/routes/cricketCache.js
7. backend/routes/cricketCount.js
8. backend/routes/cricketCron.js
9. backend/routes/cricketInsights.js
10. backend/routes/debug.js
11. backend/routes/direct1x2.js
12. backend/routes/divanscore.js
13. backend/routes/feedback.js
14. backend/routes/metrics.js
15. backend/routes/pipeline.js
16. backend/routes/predictions.js
17. backend/routes/refresh-ai.js
18. backend/routes/scheduler.js
19. backend/routes/semanticDrift.js
20. backend/routes/skcsGrading.js
21. backend/routes/sportsEdge.js
22. backend/routes/tier1.js
23. backend/routes/user.js
24. backend/routes/v1/acca.js
25. backend/routes/v1/predictions.js
26. backend/routes/v1/sameMatchBuilder.js
27. backend/routes/v1/secondaryMarkets.js
28. backend/routes/vip.js

B03 per-asset Phase 7 decisions:
- backend/controllers/edgeMindController.js: NO_ACTION - ACTIVE controller consumed by chat route; controller/route dependency is not a merge candidate.
- backend/routes/accuracy.js: NO_ACTION - ACTIVE grading/accuracy route; Phase 5 related-surface note only; no merge group proven.
- backend/routes/antigravity.js: NO_ACTION - ACTIVE mounted route; Phase 5 no merge group proven.
- backend/routes/chat.js: NO_ACTION - ACTIVE chat/EdgeMind route; distinct from controller implementation authority.
- backend/routes/controlCenter.js: NO_ACTION - ACTIVE control-center API route; no merge group proven.
- backend/routes/cricketCache.js: NO_ACTION - Phase 6 CANONICAL_KEEP cricket cache read route.
- backend/routes/cricketCount.js: HOLD_NEEDS_RUNTIME_PROOF - Phase 6 NEEDS_RUNTIME_PROOF compatibility count endpoint overlapping cricketInsights count behavior; consolidation not authorized without caller/runtime proof.
- backend/routes/cricketCron.js: NO_ACTION - Phase 6 CANONICAL_KEEP modular cricket cron/cache route.
- backend/routes/cricketInsights.js: NO_ACTION - Phase 6 CANONICAL_KEEP main cricket insights delivery route.
- backend/routes/debug.js: NO_ACTION - Phase 6 CANONICAL_KEEP modular debug route authority.
- backend/routes/direct1x2.js: NO_ACTION - Phase 6 CANONICAL_KEEP direct 1X2 market route authority.
- backend/routes/divanscore.js: NO_ACTION - ACTIVE provider route; Phase 5 no merge group proven.
- backend/routes/feedback.js: NO_ACTION - ACTIVE feedback route; no merge group proven.
- backend/routes/metrics.js: NO_ACTION - ACTIVE metrics route; no merge group proven.
- backend/routes/pipeline.js: NO_ACTION - Phase 6 CANONICAL_KEEP /api/pipeline/run-full route authority.
- backend/routes/predictions.js: NO_ACTION - Phase 6 CANONICAL_KEEP primary subscriber-facing prediction delivery route.
- backend/routes/refresh-ai.js: NO_ACTION - ACTIVE AI refresh route; no merge group proven.
- backend/routes/scheduler.js: NO_ACTION - Phase 6 CANONICAL_KEEP modular scheduler route authority.
- backend/routes/semanticDrift.js: NO_ACTION - ACTIVE semantic drift route; no merge group proven.
- backend/routes/skcsGrading.js: NO_ACTION - ACTIVE grading route; Phase 5 related-surface note only.
- backend/routes/sportsEdge.js: NO_ACTION - Phase 6 CANONICAL_KEEP modular sports edge public API route authority.
- backend/routes/tier1.js: NO_ACTION - ACTIVE tier route; no merge group proven.
- backend/routes/user.js: NO_ACTION - Phase 6 CANONICAL_KEEP user/subscription account prediction access route.
- backend/routes/v1/acca.js: NO_ACTION - Phase 6 CANONICAL_KEEP v1 ACCA builder/history route authority.
- backend/routes/v1/predictions.js: NO_ACTION - Phase 6 CANONICAL_KEEP v1 contract prediction API route.
- backend/routes/v1/sameMatchBuilder.js: NO_ACTION - Phase 6 CANONICAL_KEEP v1 same match builder route authority.
- backend/routes/v1/secondaryMarkets.js: NO_ACTION - Phase 6 CANONICAL_KEEP v1 secondary markets route authority.
- backend/routes/vip.js: NO_ACTION - Phase 6 CANONICAL_KEEP VIP/stress payload prediction route.

Implementation actions performed:
- None.

Grouped decision summary (B02 and B03 only):
- IMPLEMENT_CONSOLIDATION: 0 assets
- NO_ACTION: 38 assets
- HOLD_NEEDS_RUNTIME_PROOF: 3 assets (backend/database.js, backend/package-lock.json, backend/routes/cricketCount.js)

Why no B02/B03 consolidation was authorized:
- Phase 5 recorded overlap candidates across database access, server/route boundaries, prediction APIs, and cricket surfaces but explicitly authorized no merge, deletion, or refactor.
- Phase 6 assigned CANONICAL_KEEP to distinct runtime authorities and NEEDS_RUNTIME_PROOF holds where consolidation would be unsafe without live caller and contract proof.
- Merging database.js into db.js, consolidating cricketCount.js into cricketInsights.js, retiring package-lock.json, or moving inline server endpoints would violate Phase 6 holds and active deployment/caller references without proven safety.

Explicit scope confirmation:
- Grouped unit B01-B03 closed with B01 evidence carried forward unchanged.
- B02 and B03 newly inspected; B04-B29 not touched.
- No runtime/source files changed.

Batch decision:
- B01-B03 merge/consolidation gate is evidence-complete with NO_ACTION across carried-forward B01 and newly inspected B02/B03 assets except explicit HOLD_NEEDS_RUNTIME_PROOF carries.
- Grouped unit B01-B03 is closed.
- Phase 7 sequencing is now grouped: B01-B03 complete; next deterministic group B04-B06.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 7 - B04-B06 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B04-B06
- Start HEAD: 12a887da
- Inspection scope: B04, B05, B06 only
- B07-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B04, B05, and B06 membership
- PHASE 4 - B03-B06 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B04-B06 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B04-B06 CANONICAL AUTHORITY SELECTION EVIDENCE

B04 assets inspected (46):
1. backend/audit/system_integrity_audit.md
2. backend/core/executionPipeline.js
3. backend/core/verificationController.js
4. backend/core/verificationSignalContract.js
5. backend/errors/ProviderQuotaExceededError.js
6. backend/logic/edgeMind_manifest.json
7. backend/middleware/supabaseJwt.js
8. backend/parsers/base_sport_parser.py
9. backend/semantic-layer/controlPlaneEvaluator.js
10. backend/semantic-layer/decisionFingerprintService.js
11. backend/semantic-layer/enforcementGuard.js
12. backend/semantic-layer/errorMemoryLayer.js
13. backend/semantic-layer/gatekeeperAdapter.js
14. backend/semantic-layer/governanceGatekeeper.js
15. backend/semantic-layer/normalizer.js
16. backend/semantic-layer/preflightSimulator.js
17. backend/semantic-layer/registry.js
18. backend/semantic-layer/sportsdataioContractHelpers.js
19. backend/semantic-layer/verificationController.js
20. backend/semantic-layer/violationLogger.js
21. backend/test/smoke-test-insight-engine.js
22. backend/test/smoke-test-skcs-law.js
23. backend/utils/accaLogicEngine.js
24. backend/utils/apiCache.js
25. backend/utils/apiQueue.js
26. backend/utils/apiUsageLimiter.js
27. backend/utils/auth.js
28. backend/utils/availability.js
29. backend/utils/conflictResolver.js
30. backend/utils/contextInsights.js
31. backend/utils/dateNormalization.js
32. backend/utils/db.js
33. backend/utils/insightEngine.js
34. backend/utils/insightValidationMatrix.js
35. backend/utils/jobLogger.js
36. backend/utils/keyPool.js
37. backend/utils/marketConsistency.js
38. backend/utils/pipelineLogger.js
39. backend/utils/providerCircuitBreaker.js
40. backend/utils/purgeStaleData.js
41. backend/utils/rapidApiWaterfall.js
42. backend/utils/secondaryMarketSelector.js
43. backend/utils/sportsrcNormalizer.js
44. backend/utils/validation.js
45. backend/utils/weather.js
46. backend/workers/now_api_pulse.py

B05 assets inspected (15):
1. backend/scripts/add-avg-total-log.js
2. backend/scripts/add-diagnostics.js
3. backend/scripts/bridge_frontend.py
4. backend/scripts/generate_vip_master.py
5. backend/scripts/ingest_football.py
6. backend/scripts/patch-acca-builder.js
7. backend/scripts/patch-card-uniqueness.js
8. backend/scripts/patch-final-flow.js
9. backend/scripts/patch-row-cleanup.js
10. backend/scripts/patch-skcs-law.js
11. backend/scripts/populate_sports_data.py
12. backend/scripts/requirements.txt
13. backend/scripts/sync-sportsrc-fixtures.js
14. backend/scripts/test_ai_providers.py
15. backend/scripts/test_ai_real_matches.py

B06 assets inspected (10):
1. backend/providers/football/bigBallsDataNormalizer.js
2. backend/providers/football/bigBallsDataProvider.js
3. backend/providers/football/bsdNormalizer.js
4. backend/providers/football/bsdProvider.js
5. backend/providers/football/bzzoiroNormalizer.js
6. backend/providers/football/bzzoiroProvider.js
7. backend/providers/football/soccerDataApiNormalizer.js
8. backend/providers/football/soccerDataApiProvider.js
9. backend/providers/football/sportsApiProFootballAdapter.js
10. backend/providers/football/sportsApiProFootballNormalizer.js

B04-B06 Phase 7 decision summary:
- IMPLEMENT_CONSOLIDATION: 0 assets
- NO_ACTION: 49 assets
- HOLD_NEEDS_RUNTIME_PROOF: 22 assets

HOLD_NEEDS_RUNTIME_PROOF assets:
1. backend/audit/system_integrity_audit.md
2. backend/core/executionPipeline.js
3. backend/logic/edgeMind_manifest.json
4. backend/parsers/base_sport_parser.py
5. backend/test/smoke-test-insight-engine.js
6. backend/test/smoke-test-skcs-law.js
7. backend/utils/purgeStaleData.js
8. backend/workers/now_api_pulse.py
9. backend/scripts/add-avg-total-log.js
10. backend/scripts/add-diagnostics.js
11. backend/scripts/bridge_frontend.py
12. backend/scripts/generate_vip_master.py
13. backend/scripts/ingest_football.py
14. backend/scripts/patch-acca-builder.js
15. backend/scripts/patch-card-uniqueness.js
16. backend/scripts/patch-final-flow.js
17. backend/scripts/patch-row-cleanup.js
18. backend/scripts/patch-skcs-law.js
19. backend/scripts/populate_sports_data.py
20. backend/scripts/requirements.txt
21. backend/scripts/sync-sportsrc-fixtures.js
22. backend/providers/football/sportsApiProFootballAdapter.js

NO_ACTION basis:
- Phase 6 selected canonical runtime/helper/provider/normalizer authorities that must remain separate.
- Phase 5 found functional overlap in several areas, but did not authorize merge, deletion, retirement, or refactor.
- Phase 4 identified three B04 LEGACY assets, but Phase 7 cannot remove or retire them without runtime proof and reference safety.
- Phase 6 placed scripts, audit/proof artifacts, parser/worker support surfaces, purge helper, and the shared provider adapter behind NEEDS_RUNTIME_PROOF.
- No safe B04-B06 consolidation path is proven in the current evidence.

Implementation actions performed:
- None.

Why no B04-B06 consolidation was authorized:
- Verification, semantic governance, ACCA/rule, database/cache/job, provider-access, provider/normalizer, and ingestion/script surfaces have layered or supporting roles.
- Canonical authority decisions keep core/runtime/provider/normalizer utilities separate.
- Runtime-proof holds prevent safe deletion, replacement, retirement, execution, or consolidation of support scripts, adapters, parser/worker surfaces, audit evidence, and purge helpers.
- Implementing consolidation now would risk breaking runtime callers, provider behavior, package scripts, database/cache paths, or manual/operator workflows without proof.

Explicit scope confirmation:
- B04-B06 only.
- B07-B29 not inspected for implementation in this packet.
- No runtime/source files changed.

Batch decision:
- B04-B06 merge/consolidation gate is evidence-complete with NO_ACTION for canonical/current assets and HOLD_NEEDS_RUNTIME_PROOF for held/legacy/support surfaces.
- Grouped unit B04-B06 is closed.
- Next deterministic group: B07-B10

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 7 - B07-B10 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B07-B10
- Start HEAD: 6162af97
- Inspection scope: B07, B08, B09, B10 only
- B11-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B07, B08, B09, and B10 membership
- PHASE 4 - B07-B10 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B07-B10 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B07-B10 CANONICAL AUTHORITY SELECTION EVIDENCE

B07 assets inspected (9):
1. backend/src/services/contextIntelligence/adjustProbability.js
2. backend/src/services/contextIntelligence/aiPipeline_core.js
3. backend/src/services/contextIntelligence/aiPipeline.js
4. backend/src/services/contextIntelligence/availabilitySignal.js
5. backend/src/services/contextIntelligence/cacheService.js
6. backend/src/services/contextIntelligence/disciplineSignal.js
7. backend/src/services/contextIntelligence/stabilitySignal.js
8. backend/src/services/contextIntelligence/weatherSignal.js
9. backend/src/services/marketRouter/waterfall.js

B08 assets inspected (13):
1. backend/adapters/f1Adapter.js
2. backend/adapters/footballAdapter.js
3. backend/adapters/index.js
4. backend/adapters/tennisAdapter.js
5. backend/config/activeSports.js
6. backend/config/apiEndpoints.js
7. backend/config/bigBallsLeagueMap.js
8. backend/config/footballRules.js
9. backend/config/predictionOutcomes.js
10. backend/config/soccerDataLeagueMap.js
11. backend/config/sportRules.js
12. backend/config/subscriptionMatrix.js
13. backend/config/subscriptionPlans.js

B09 assets inspected (86):
1. backend/services/accaBuilder.js
2. backend/services/accaMathUtils.js
3. backend/services/aiPipeline.js
4. backend/services/aiPipelineOrchestrator.js
5. backend/services/aiProvider_odds_update.js
6. backend/services/aiProvider.js
7. backend/services/aiScoring.js
8. backend/services/aiTelemetryService.js
9. backend/services/antigravity/WorkflowEngine.js
10. backend/services/apiCacheService.js
11. backend/services/apiQuotaRouter.js
12. backend/services/apiQuotaRouterProviders.js
13. backend/services/bigBallsDataApiClient.js
14. backend/services/bigBallsFootballBridge.js
15. backend/services/blockedApiCallsLog.js
16. backend/services/bzzoiroApiClient.js
17. backend/services/bzzoiroCrosswalk.js
18. backend/services/canonicalEvents.js
19. backend/services/canonicalIngestFirewall.js
20. backend/services/comboEngine.js
21. backend/services/conflictEngine.js
22. backend/services/contextEnrichmentService.js
23. backend/services/contextIngestionService.js
24. backend/services/contradictionGovernance.js
25. backend/services/controlCenterReadService.js
26. backend/services/cricApiCacheService.js
27. backend/services/cricbuzzService.js
28. backend/services/cricketLiveEnrichmentService.js
29. backend/services/cricketLiveMatchResolver.js
30. backend/services/cricketRulesEngine.js
31. backend/services/cronJobs.js
32. backend/services/dataProvider.js
33. backend/services/dataProviders.js
34. backend/services/direct1x2Builder.js
35. backend/services/direct1x2Engine.js
36. backend/services/divanscoreService.js
37. backend/services/enhancedMatchDetailsService.js
38. backend/services/espnHiddenApiService.js
39. backend/services/filterEngine.js
40. backend/services/football536Extractor.js
41. backend/services/football536Service.js
42. backend/services/footballH2HExtractor.js
43. backend/services/footballHighlightsService.js
44. backend/services/footballRankExtractor.js
45. backend/services/footballRiskTierMapper.js
46. backend/services/freeLivescoreApiExtractor.js
47. backend/services/freeLivescoreApiService.js
48. backend/services/gradingAccuracyCore.js
49. backend/services/gradingSnapshotService.js
50. backend/services/hybridSportsDataService.js
51. backend/services/liveFootballApiExtractor.js
52. backend/services/liveFootballApiService.js
53. backend/services/marketIntelligence.js
54. backend/services/marketScoringEngine.js
55. backend/services/masterRulebookRiskClassification.js
56. backend/services/metrxFactoryExtractor.js
57. backend/services/metrxFactoryService.js
58. backend/services/normalizerService.js
59. backend/services/oddsApiPipeline.js
60. backend/services/oddsBudgetService.js
61. backend/services/pipelineMetricsService.js
62. backend/services/proFootballDataService.js
63. backend/services/providerQuotaService.js
64. backend/services/quotaPlanner.js
65. backend/services/rateLimitsAnalysis.js
66. backend/services/reEvaluationEngine.js
67. backend/services/safeHavenSelector.js
68. backend/services/saveContextData.js
69. backend/services/saveDirectInsights.js
70. backend/services/semanticDriftSummaryService.js
71. backend/services/skcsHeartbeat.js
72. backend/services/soccerDataApiClient.js
73. backend/services/sportsApiProFootballExtractor.js
74. backend/services/sportsApiProFootballService.js
75. backend/services/sportsLiveScoresExtractor.js
76. backend/services/sportsLiveScoresService.js
77. backend/services/sportsrcHealthService.js
78. backend/services/subscriptionTiming.js
79. backend/services/syncService.js
80. backend/services/systemTruthLogger.js
81. backend/services/thesportsdbPipeline.js
82. backend/services/tier1BootstrapService.js
83. backend/services/tier1SchemaProfile.js
84. backend/services/unifiedFixturesService.js
85. backend/services/unifiedPredictionsService.js
86. backend/services/unifiedRulesService.js

B10 assets inspected (27):
1. scripts/apply-db-governance.js
2. scripts/apply-migrations.js
3. scripts/audit-api-call-map.js
4. scripts/audit-api-sports-usage.js
5. scripts/audit-bigballs-discovery.js
6. scripts/audit-bsd-discovery.js
7. scripts/audit-bsd-league-inventory.js
8. scripts/audit-cricket-final-tables.js
9. scripts/audit-cricket-rules.js
10. scripts/audit-cricket-storage.js
11. scripts/audit-cricket-tables.js
12. scripts/audit-database.js
13. scripts/audit-execution-spine.js
14. scripts/audit-football-rules-alignment.js
15. scripts/audit-grading-pipeline.js
16. scripts/audit-placeholders-and-insights.js
17. scripts/audit-soccerdata-discovery.js
18. scripts/audit-soccerdata-summer-coverage.js
19. scripts/audit-sport-values.js
20. scripts/audit-sportsdataio-boundary.ps1
21. scripts/audit-table-usage.js
22. scripts/audit-v2-foundation.js
23. scripts/audit-v2-identity-deep.js
24. scripts/audit-v2-provider-coverage.js
25. scripts/gatekeeper-pipeline.js
26. scripts/master-qa.js
27. scripts/secondary-market-gatekeeper.js

B07-B10 Phase 7 decision summary:
- IMPLEMENT_CONSOLIDATION: 0 assets
- NO_ACTION: 108 assets
- HOLD_NEEDS_RUNTIME_PROOF: 27 assets

HOLD_NEEDS_RUNTIME_PROOF assets:
1. backend/src/services/contextIntelligence/cacheService.js
2. backend/src/services/marketRouter/waterfall.js
3. backend/adapters/f1Adapter.js
4. backend/services/comboEngine.js
5. backend/services/rateLimitsAnalysis.js
6. backend/services/accaMathUtils.js
7. backend/services/aiProvider_odds_update.js
8. scripts/gatekeeper-pipeline.js
9. scripts/audit-execution-spine.js
10. scripts/audit-api-call-map.js
11. scripts/audit-api-sports-usage.js
12. scripts/audit-bigballs-discovery.js
13. scripts/audit-bsd-discovery.js
14. scripts/audit-bsd-league-inventory.js
15. scripts/audit-soccerdata-discovery.js
16. scripts/audit-cricket-final-tables.js
17. scripts/audit-cricket-rules.js
18. scripts/audit-cricket-storage.js
19. scripts/audit-cricket-tables.js
20. scripts/audit-football-rules-alignment.js
21. scripts/audit-sport-values.js
22. scripts/secondary-market-gatekeeper.js
23. scripts/audit-grading-pipeline.js
24. scripts/audit-placeholders-and-insights.js
25. scripts/master-qa.js
26. scripts/apply-db-governance.js
27. scripts/apply-migrations.js

NO_ACTION basis:
- Phase 6 selected many service, provider, config, route-support, normalization, prediction, grading, health, and Control Center read authorities as CANONICAL_KEEP.
- Phase 5 overlap evidence did not authorize merge, deletion, retirement, or refactor.
- Phase 4 legacy/superseded/historical findings do not authorize removal without runtime proof and reference safety.
- Phase 6 placed audit, discovery, migration-capable, QA, gatekeeper, and operational scripts behind NEEDS_RUNTIME_PROOF.
- No safe B07-B10 consolidation path is proven in the current evidence.

Implementation actions performed:
- None.

Why no B07-B10 consolidation was authorized:
- Pipeline, provider, cricket, football, prediction, grading, unified data access, and Control Center read surfaces have distinct service boundaries.
- Audit/discovery/QA/governance scripts are not canonical runtime authorities and may perform reads, audits, or mutation-capable actions, so they require separate runtime proof before execution, retirement, or consolidation.
- Legacy/superseded/historical assets remain held because Phase 7 has no live caller/reference proof authorizing removal.
- Implementing consolidation now would risk breaking runtime callers, provider behavior, prediction flows, scripts, database operations, or manual/operator workflows without proof.

Explicit scope confirmation:
- B07-B10 only.
- B11-B29 not inspected for implementation in this packet.
- No runtime/source files changed.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 7 - B11-B14 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B11-B14
- Start HEAD: 65882245
- Inspection scope: B11, B12, B13, B14 only
- B15-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B11, B12, B13, and B14 membership
- PHASE 4 - B11-B14 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B11-B14 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B11-B14 CANONICAL AUTHORITY SELECTION EVIDENCE

B11 assets inspected (59):
1. scripts/_check-db.js
2. scripts/_check-final-table.js
3. scripts/_check-match-dates.js
4. scripts/_check-plan-visibility.js
5. scripts/_check-team-locks.js
6. scripts/_check-tier.js
7. scripts/check-acca-data.js
8. scripts/check-accuracy-schema.js
9. scripts/check-accuracy-time.js
10. scripts/check-all-fixtures.js
11. scripts/check-cache-schema.js
12. scripts/check-cache.js
13. scripts/check-canonical-events-schema.js
14. scripts/check-cricket-rows.js
15. scripts/check-db-schema.js
16. scripts/check-events-schema.js
17. scripts/check-events-status.js
18. scripts/check-events.js
19. scripts/check-filtered-schema.js
20. scripts/check-final-table-columns.js
21. scripts/check-final-table-schema.js
22. scripts/check-fixtures-structure.js
23. scripts/check-french-league.js
24. scripts/check-graded.js
25. scripts/check-match-details.js
26. scripts/check-match-id-mapping.js
27. scripts/check-match-prediction.js
28. scripts/check-old-events.js
29. scripts/check-predictions.js
30. scripts/check-publication-state.js
31. scripts/check-raw-json.js
32. scripts/check-raw-prediction-structure.js
33. scripts/check-scheduler-schema.js
34. scripts/check-schema.js
35. scripts/check-stages-schema.js
36. scripts/check-supabase-vs-pg-tiers.js
37. scripts/check-tables.js
38. scripts/check-timestamp-cols.js
39. scripts/migration1-plan-visibility.js
40. scripts/schema-introspection.js
41. scripts/setup-rls.js
42. scripts/task1-schema-update.js
43. scripts/validate-backfill-accuracy.js
44. scripts/validate-keys.js
45. scripts/validate-relational-migration.js
46. scripts/verify_dom_structure.js
47. scripts/verify-acca-legs.js
48. scripts/verify-accas.js
49. scripts/verify-bigballs-provider.js
50. scripts/verify-bsd-crosswalk.js
51. scripts/verify-bsd-enrichment.js
52. scripts/verify-bsd-provider.js
53. scripts/verify-db-rule-alignment.js
54. scripts/verify-end-to-end-loop.js
55. scripts/verify-master-rulebook-alignment.js
56. scripts/verify-new-predictions.js
57. scripts/verify-soccerdata-provider.js
58. scripts/verify-sportsdb-coverage.js
59. scripts/verify-vercel-build.js

B12 assets inspected (66):
1. scripts/browser_console_test.js
2. scripts/debug-cricket-ai-predictions.js
3. scripts/debug-cricket-insights-schema.js
4. scripts/debug-cricket-simple.js
5. scripts/debug-key.js
6. scripts/debug-matches-content.js
7. scripts/debug-matches-json.js
8. scripts/diagnose-filtering.js
9. scripts/diagnostic-espn-fixed.js
10. scripts/diagnostic-espn.js
11. scripts/diagnostic-thesportsdb.js
12. scripts/examine-prediction-76412.js
13. scripts/examine-tier-rules.js
14. scripts/simulate-filtering.js
15. scripts/smoke-test.js
16. scripts/test_full_fallback_flow.js
17. scripts/test-ai-predictions-542703.js
18. scripts/test-ai-predictions-endpoint.js
19. scripts/test-all-rapid-hosts.js
20. scripts/test-antigravity.js
21. scripts/test-api.js
22. scripts/test-api2.js
23. scripts/test-cache.js
24. scripts/test-corrected-endpoint.js
25. scripts/test-cricbuzz.js
26. scripts/test-cricket-live-line-advance-provider.js
27. scripts/test-cricket-live-line-provider.js
28. scripts/test-cron.js
29. scripts/test-divanscore-rankings-fallback.js
30. scripts/test-fetch.js
31. scripts/test-final-endpoint.js
32. scripts/test-fixed-ai-predictions.js
33. scripts/test-fixed-endpoint.js
34. scripts/test-fixed-pipeline.js
35. scripts/test-football-h2h-pipeline-integration.js
36. scripts/test-football-highlights-h2h.js
37. scripts/test-football-risk-tier-mapper.js
38. scripts/test-football536-endpoints.js
39. scripts/test-football536-fixtures-normalizer.js
40. scripts/test-free-livescore-fixtures.js
41. scripts/test-free-livescore-search.js
42. scripts/test-live-football-api-priority.js
43. scripts/test-livescore6-cricket-provider.js
44. scripts/test-logger.js
45. scripts/test-metrx-factory-top-metrics.js
46. scripts/test-metrx-top-metrics.js
47. scripts/test-network.js
48. scripts/test-odds-integration.js
49. scripts/test-optimized-endpoints.js
50. scripts/test-pipeline-integration.js
51. scripts/test-pro-football-api.js
52. scripts/test-rank-calibration.js
53. scripts/test-rank-injection.js
54. scripts/test-sports-live-rankings.js
55. scripts/test-sportsapi-pro-football-adapter.js
56. scripts/test-sportsapi-pro-football-joinability.js
57. scripts/test-sportsapi-pro-football.js
58. scripts/test-sportsrc-fixtures.js
59. scripts/test-sportsrc-health.js
60. scripts/test-sportsrc-odds.js
61. scripts/test-telemetry-integration.js
62. scripts/test-thesportsdb-endpoints.js
63. scripts/test-weather-pipeline.js
64. scripts/trace-data-flow.js
65. scripts/trace-filtering-rules.js
66. scripts/trace-filtering-timestamp.js

B13 assets inspected (20):
1. scripts/_trigger-sync.js
2. scripts/external-scheduler.js
3. scripts/run-edgemind-judge.js
4. scripts/run-master-pipeline.js
5. scripts/run-migration.js
6. scripts/run-pipeline-from-context-pack.js
7. scripts/run-pipeline.js
8. scripts/run-scheduled-sync.js
9. scripts/run-stage1-math.js
10. scripts/run-stage2-context.js
11. scripts/run-stage3-volatility.js
12. scripts/run-test.js
13. scripts/scheduler.js
14. scripts/start-rapidapi-cricket-mcp.js
15. scripts/trigger-grade.js
16. scripts/trigger-pipeline-sync.js
17. scripts/trigger-publication.js
18. scripts/trigger-refresh.js
19. scripts/trigger-settlement.js
20. scripts/wake-and-sync.js

B14 assets inspected (31):
1. scripts/backfill-direct1x2-final-fields.js
2. scripts/backfill-fixture-ids.js
3. scripts/backfill-football-context.js
4. scripts/backfill-prediction-grading.js
5. scripts/backfill-predictions-accuracy.js
6. scripts/backfill-provider-event-id.js
7. scripts/bridge-raw-predictions-for-grading.js
8. scripts/bridge-to-final.sql
9. scripts/brute-force-ingest.js
10. scripts/compose-context-pack.js
11. scripts/cricapi-cache-refresh.js
12. scripts/discover-free-livescore-endpoints.js
13. scripts/enrich-lineups.js
14. scripts/enrich-team-form.js
15. scripts/fetch-live-fixtures.js
16. scripts/fetch-thesportsdb-day.js
17. scripts/force-enrich-match.js
18. scripts/import-f1-formula1db.js
19. scripts/import-today-snapshot-pipeline.js
20. scripts/investigate-football536-current-fixtures.js
21. scripts/normalize-frontend-sports.js
22. scripts/normalize-sport-values.js
23. scripts/populate_sports_data.py
24. scripts/publish-cricbuzz-cricket.js
25. scripts/publish-cricbuzz-direct-fixtures.js
26. scripts/publish-prediction-76412.js
27. scripts/py_verify_thesportsdb_coverage.py
28. scripts/rebuild-canonical-from-api-sports.js
29. scripts/simple-sync.js
30. scripts/sync-bsd-enrichment.js
31. scripts/sync-ucl-context.js

B11-B14 Phase 7 decision summary:
- IMPLEMENT_CONSOLIDATION: 0 assets
- NO_ACTION: 112 assets
- HOLD_NEEDS_RUNTIME_PROOF: 64 assets

HOLD_NEEDS_RUNTIME_PROOF assets:
1. scripts/_trigger-sync.js
2. scripts/backfill-direct1x2-final-fields.js
3. scripts/backfill-fixture-ids.js
4. scripts/backfill-football-context.js
5. scripts/backfill-prediction-grading.js
6. scripts/backfill-predictions-accuracy.js
7. scripts/backfill-provider-event-id.js
8. scripts/bridge-raw-predictions-for-grading.js
9. scripts/bridge-to-final.sql
10. scripts/brute-force-ingest.js
11. scripts/compose-context-pack.js
12. scripts/cricapi-cache-refresh.js
13. scripts/discover-free-livescore-endpoints.js
14. scripts/enrich-lineups.js
15. scripts/enrich-team-form.js
16. scripts/external-scheduler.js
17. scripts/run-master-pipeline.js
18. scripts/run-migration.js
19. scripts/run-pipeline-from-context-pack.js
20. scripts/run-pipeline.js
21. scripts/run-scheduled-sync.js
22. scripts/run-stage1-math.js
23. scripts/run-stage2-context.js
24. scripts/run-stage3-volatility.js
25. scripts/run-test.js
26. scripts/scheduler.js
27. scripts/start-rapidapi-cricket-mcp.js
28. scripts/sync-bsd-enrichment.js
29. scripts/sync-ucl-context.js
30. scripts/test-fetch.js
31. scripts/test-final-endpoint.js
32. scripts/test-fixed-ai-predictions.js
33. scripts/test-fixed-endpoint.js
34. scripts/test-fixed-pipeline.js
35. scripts/test-football536-endpoints.js
36. scripts/test-football536-fixtures-normalizer.js
37. scripts/test-free-livescore-fixtures.js
38. scripts/test-free-livescore-search.js
39. scripts/test-live-football-api-priority.js
40. scripts/test-livescore6-cricket-provider.js
41. scripts/test-metrx-factory-top-metrics.js
42. scripts/test-metrx-top-metrics.js
43. scripts/test-network.js
44. scripts/test-optimized-endpoints.js
45. scripts/test-pipeline-integration.js
46. scripts/test-pro-football-api.js
47. scripts/test-sports-live-rankings.js
48. scripts/test-sportsapi-pro-football-adapter.js
49. scripts/test-sportsapi-pro-football-joinability.js
50. scripts/test-sportsapi-pro-football.js
51. scripts/test-sportsrc-fixtures.js
52. scripts/test-sportsrc-health.js
53. scripts/test-sportsrc-odds.js
54. scripts/test-thesportsdb-endpoints.js
55. scripts/test-weather-pipeline.js
56. scripts/trace-data-flow.js
57. scripts/trace-filtering-rules.js
58. scripts/trace-filtering-timestamp.js
59. scripts/trigger-grade.js
60. scripts/trigger-pipeline-sync.js
61. scripts/trigger-publication.js
62. scripts/trigger-refresh.js
63. scripts/trigger-settlement.js
64. scripts/wake-and-sync.js

NO_ACTION basis:
- Phase 4 classified all B11-B14 assets as CURRENT manual verification, diagnostic, trigger, scheduler, ingest, enrichment, sync, import, and backfill tools.
- Phase 5 found overlap candidates across tests, traces, provider discovery, pipeline runners, grading/publication, database/backfill/bridge, cricket, and context/enrichment scripts, but did not authorize merge, deletion, retirement, refactor, SQL, execution, or database mutation.
- Phase 6 placed script-heavy overlap candidates behind NEEDS_RUNTIME_PROOF and did not replace earlier canonical runtime/service authorities with scripts.
- B11-B14 manifest assets not explicitly named in the Phase 6 B11-B14 NEEDS_RUNTIME_PROOF list remain NO_ACTION because no safe consolidation path is proven for those current check/validate/verify surfaces.
- Phase 6 entries for scripts/apply-db-governance.js and scripts/apply-migrations.js are out of B11-B14 manifest scope (B10) and are not carried into this grouped unit.

Implementation actions performed:
- None.

Why no B11-B14 consolidation was authorized:
- These are script-heavy manual/operator and diagnostic surfaces.
- Many scripts may execute endpoint calls, database reads/writes, migrations, sync, import, enrichment, trigger, or backfill behavior.
- Phase 6 explicitly holds named script candidates behind NEEDS_RUNTIME_PROOF.
- Implementing consolidation now would risk breaking manual workflows, database state, provider diagnostics, pipeline triggers, migration/backfill paths, or operator evidence without proof.

Explicit scope confirmation:
- B11-B14 only.
- B15-B29 not inspected for implementation in this packet.
- No runtime/source files changed.

Batch decision:
- B11-B14 merge/consolidation gate is evidence-complete with NO_ACTION for non-held current/manual assets and HOLD_NEEDS_RUNTIME_PROOF for script-heavy overlap candidates.
- Grouped unit B11-B14 is closed.
- Next deterministic group: B15-B18

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 7 - B15-B18 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B15-B18
- Start HEAD: 86a508b1
- Inspection scope: B15, B16, B17, B18 only
- B19-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B15, B16, B17, and B18 membership
- PHASE 4 - B15-B18 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B15-B18 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B15-B18 CANONICAL AUTHORITY SELECTION EVIDENCE

B15 assets inspected (52):
1. scripts/_bsd_league_inventory.json
2. scripts/_local-rebuild.js
3. scripts/add-cricket-rls-policies.sql
4. scripts/add-event-columns.js
5. scripts/analyze-postgres-tables.js
6. scripts/analyze-supabase-tables-full.js
7. scripts/analyze-supabase-tables.js
8. scripts/analyze-supabase-visual.js
9. scripts/build-acca.js
10. scripts/build-sportsdb-config.js
11. scripts/cleanup-competition-allowlists.js
12. scripts/cleanup-duplicate-fallbacks.js
13. scripts/cleanup-live-direct-duplicates.js
14. scripts/cleanup-predictions.js
15. scripts/cleanup-unknown-teams.js
16. scripts/cleanup.js
17. scripts/complete-phase1-testing.js
18. scripts/complete-phase2-rules.js
19. scripts/complete-phase3-predictions.js
20. scripts/create-indexes.js
21. scripts/create-migration-plan.js
22. scripts/db-cleanup.js
23. scripts/deployment_verification.js
24. scripts/deployment-status.md
25. scripts/fix-ai-predictions-endpoint.js
26. scripts/fix-frontend-placeholders.js
27. scripts/fix-json-simple.js
28. scripts/fix-matches-structure.js
29. scripts/fix-placeholders-and-insights.js
30. scripts/fix-prediction-76412.js
31. scripts/fix-remaining-json-issues.js
32. scripts/fix-sport-data.js
33. scripts/gulf_in_class_simulation.js
34. scripts/hotfix-acca-rules.js
35. scripts/implement-phase1-fixtures-corrected.js
36. scripts/implement-phase1-fixtures.js
37. scripts/implement-phase2-rules-conservative.js
38. scripts/implement-phase2-rules.js
39. scripts/implement-phase3-predictions.js
40. scripts/install-local-git-hooks.js
41. scripts/manual-grade.js
42. scripts/map-table-dependencies.js
43. scripts/purge-fallback-data.js
44. scripts/quarantine-database.js
45. scripts/render-api-deploy.js
46. scripts/repair-unknown-team-names.js
47. scripts/requirements.txt
48. scripts/resolve-results.js
49. scripts/safe-migration-plan.js
50. scripts/supabase_health_check.js
51. scripts/supabase-diagnostics.js
52. scripts/track-prediction-accuracy.js

B16 assets inspected (36):
1. AGENTS.md
2. ARCHITECTURE_OVERVIEW.md
3. COMPREHENSIVE_AUDIT_REPORT.md
4. COMPREHENSIVE_FOOTBALL_RULES_REPORT.md
5. CRON_SETUP.md
6. DASHBOARD_QUICK_START.md
7. DASHBOARD_REFACTOR_GUIDE.md
8. DEEPSEEK_SESSION_SKCSTEST.txt
9. DEEPSEEK_STATE.md
10. DEPLOYMENT_STATUS.md
11. DEPLOYMENT_VERIFICATION_GUIDE.md
12. football-ecosystem-report.md
13. FRONTEND_FIXES_SUMMARY.md
14. FRONTEND_INVESTIGATION_REPORT.md
15. FULL_WORKSPACE_AUDIT_REPORT.md
16. GEMINI.md
17. IMPLEMENTATION_GAP_ANALYSIS.md
18. IMPLEMENTATION_SUMMARY.md
19. MASTER_RULEBOOK_IMPLEMENTATION_GUIDE.md
20. MIGRATION_FREEZE.md
21. PRIVACY_POLICY.md
22. README_DASHBOARD_REFACTOR.md
23. README_DATA_INGESTION.md
24. README.md
25. requirements.txt
26. runtime.txt
27. SINGLE_USE_AUDIT_REPORT.md
28. SKCS_MASTER_RULEBOOK.md
29. SMB_WINDSURF_FINAL_IMPLEMENTATION.md
30. SMB_WINDSURF_IMPLEMENTATION_PROMPT.md
31. SPORT_CONSISTENCY_AUDIT_REPORT.md
32. STRICT_RULES.md
33. SUPABASE_DIAGNOSTIC_REPORT.md
34. SUPABASE_TABLE_ANALYSIS.md
35. SUPABASE_TABLES_SUMMARY.md
36. TERMS_OF_SERVICE.md

B17 assets inspected (24):
1. docs/acca_rules_v2.1.md
2. docs/alert-routing-degraded-state.md
3. docs/api_quota_router.md
4. docs/blueprint-semantic-drift-control-plane.md
5. docs/canonical_ingest_firewall.spec.md
6. docs/control-plane-operational-pack.md
7. docs/cricket-providers.md
8. docs/DATA_INGESTION.md
9. docs/DEPLOYMENT_GUIDE.md
10. docs/football-leagues-apisports.md
11. docs/pipeline-health-feed.md
12. docs/provider-discovery/free-livescore-api.md
13. docs/providers/live-football-api-policy.md
14. docs/README.md
15. docs/runbook_degraded_states.md
16. docs/SKCS_ENGINE_V2_ADR.md
17. docs/SKCS_ENGINE_V2_PHASE0_DESIGN.md
18. docs/SKCS_ENGINE_V2_PHASE05_INGEST_MAP.md
19. docs/SKCS_ENGINE_V2_PHASE0B5_REPLAY.md
20. docs/skcs_grading_snapshot_v1.spec.md
21. docs/sportsdataio-pre-match-directive.md
22. docs/supabase-tier-display-requirements.md
23. docs/VERCEL_DEPLOY_TROUBLESHOOTING.md
24. docs/weekly-global-scrape-scheduler.md

B18 assets inspected (23):
1. SKCS-KNOWLEDGE/audit/column_dependency_matrix.md
2. SKCS-KNOWLEDGE/audit/cron_provider_runtime_map.md
3. SKCS-KNOWLEDGE/audit/gap_report.md
4. SKCS-KNOWLEDGE/audit/knowledge_layer_completeness_audit.md
5. SKCS-KNOWLEDGE/audit/migration_history.md
6. SKCS-KNOWLEDGE/audit/observability_registry.md
7. SKCS-KNOWLEDGE/audit/prediction_dependency_audit.md
8. SKCS-KNOWLEDGE/audit/runtime_consumer_audit_v2.md
9. SKCS-KNOWLEDGE/audit/runtime_consumer_audit.md
10. SKCS-KNOWLEDGE/audit/schema_drift_log.md
11. SKCS-KNOWLEDGE/audit/technical_debt.md
12. SKCS-KNOWLEDGE/audit/undocumented_assets.md
13. SKCS-KNOWLEDGE/audit/verification_runtime_audit.md
14. SKCS-KNOWLEDGE/governance/ai_usage_policy.md
15. SKCS-KNOWLEDGE/governance/bigballs_evaluation_focus.md
16. SKCS-KNOWLEDGE/governance/bsd_governance_hold.md
17. SKCS-KNOWLEDGE/governance/bsd_provider_suitability_scorecard.md
18. SKCS-KNOWLEDGE/governance/documentation_policy.md
19. SKCS-KNOWLEDGE/governance/feature_risk_registry.md
20. SKCS-KNOWLEDGE/governance/naming_standards.md
21. SKCS-KNOWLEDGE/governance/edge_asset_work_sequence_policy.md
22. SKCS-KNOWLEDGE/governance/provider_scorecard_bsd.md
23. SKCS-KNOWLEDGE/governance/verification_layer_spec.md

Evidence summary:
- Phase 4 B15-B18 closed all 135 assets as CURRENT with UNKNOWN 0 and authorized no cleanup action.
- Phase 5 B15-B18 proved functional overlap candidates but authorized no deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation.
- Phase 6 B15-B18 selected limited CANONICAL_KEEP reference authorities and held diagnostic, report, provider, ingestion, dashboard, deployment, configuration, and older design candidates behind NEEDS_RUNTIME_PROOF.
- No Phase 6 decision directly authorizes implementation-level merge/consolidation for B15-B18.

Merge/consolidation decision:
- B15 scripts and SQL-capable maintenance assets: HOLD_NEEDS_RUNTIME_PROOF.
- B16 root documentation/configuration assets: NO_ACTION where canonical/reference role is already proven; otherwise HOLD_NEEDS_RUNTIME_PROOF.
- B17 docs directory assets: NO_ACTION where canonical/reference role is already proven; otherwise HOLD_NEEDS_RUNTIME_PROOF.
- B18 SKCS-KNOWLEDGE audit/governance assets: HOLD_NEEDS_RUNTIME_PROOF unless a later phase proves a direct canonical merge target.

Implementation boundary:
- B15-B18 only.
- B19-B29 not inspected for implementation in this packet.
- No runtime/source files changed.
- No Supabase, database, deployment, dependency, security, legal, subscription, prediction-content, or user-data behavior changed.

Batch decision:
- B15-B18 merge/consolidation gate is evidence-complete with NO_ACTION for proven current reference assets and HOLD_NEEDS_RUNTIME_PROOF for overlap, diagnostic, report, migration, provider, ingestion, dashboard, deployment, configuration, and older design candidates.
- Grouped unit B15-B18 is closed.
- Next deterministic group: B19-B22

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized by this packet.

## PHASE 7 - B19-B22 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B19-B22
- Start HEAD: 32804a91
- Inspection scope: B19, B20, B21, B22 only
- B23-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B19, B20, B21, and B22 membership
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json B19, B20, B21, and B22 register coverage
- PHASE 4 - B19-B22 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B19-B22 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B19-B22 CANONICAL AUTHORITY SELECTION EVIDENCE

Corrected membership/register audit:
- B19 SKCS_KNOWLEDGE_KNOWLEDGE: declared 17, actual paths 17, on-disk missing 0, register missing 0, functional groups: DOCUMENTATION_KNOWLEDGE 17.
- B20 SKCS_KNOWLEDGE_PROVIDERS: declared 18, actual paths 18, on-disk missing 0, register missing 0, functional groups: PROVIDER_INTEGRATION 18.
- B21 PUBLIC_UI: declared 64, actual paths 64, on-disk missing 0, register missing 0, functional groups: FRONTEND_UI 38; GENERATED_OUTPUT 18; PUBLIC_ASSET 8.
- B22 SUPABASE_MIGRATIONS: declared 61, actual paths 61, on-disk missing 0, register missing 0, functional groups: DATABASE_MIGRATION 61.

B19 assets inspected (17):
1. SKCS-KNOWLEDGE/knowledge/api_registry.md
2. SKCS-KNOWLEDGE/knowledge/architecture_decisions.md
3. SKCS-KNOWLEDGE/knowledge/business_rules.md
4. SKCS-KNOWLEDGE/knowledge/cost_registry.md
5. SKCS-KNOWLEDGE/knowledge/database_schema.md
6. SKCS-KNOWLEDGE/knowledge/dependency_registry.md
7. SKCS-KNOWLEDGE/knowledge/edge_functions.md
8. SKCS-KNOWLEDGE/knowledge/formula_registry.md
9. SKCS-KNOWLEDGE/knowledge/glossary.md
10. SKCS-KNOWLEDGE/knowledge/pipeline_metrics_registry.md
11. SKCS-KNOWLEDGE/knowledge/provider_registry.md
12. SKCS-KNOWLEDGE/knowledge/scheduled_jobs.md
13. SKCS-KNOWLEDGE/knowledge/semantic_field_mapping_registry.md
14. SKCS-KNOWLEDGE/knowledge/semantic_violation_log.md
15. SKCS-KNOWLEDGE/knowledge/system_topology.md
16. SKCS-KNOWLEDGE/knowledge/views_and_materialized_views.md
17. SKCS-KNOWLEDGE/README.md

B20 assets inspected (18):
1. SKCS-KNOWLEDGE/providers/bigballs_discovery_audit.md
2. SKCS-KNOWLEDGE/providers/bigballs_endpoint_catalog.md
3. SKCS-KNOWLEDGE/providers/bigballs_primary_assessment.md
4. SKCS-KNOWLEDGE/providers/bigballs_provider_health.md
5. SKCS-KNOWLEDGE/providers/bigballs_semantic_mapping.md
6. SKCS-KNOWLEDGE/providers/bsd_coverage_audit.md
7. SKCS-KNOWLEDGE/providers/bsd_endpoint_catalog.md
8. SKCS-KNOWLEDGE/providers/bsd_league_inventory.md
9. SKCS-KNOWLEDGE/providers/bsd_provider_health.md
10. SKCS-KNOWLEDGE/providers/bsd_readiness_assessment.md
11. SKCS-KNOWLEDGE/providers/bsd_semantic_mapping.md
12. SKCS-KNOWLEDGE/providers/bzzoiro_discovery_audit.md
13. SKCS-KNOWLEDGE/providers/bzzoiro_field_audit.md
14. SKCS-KNOWLEDGE/providers/bzzoiro_provider_mapping.md
15. SKCS-KNOWLEDGE/providers/soccerdata_call_restrictions.md
16. SKCS-KNOWLEDGE/providers/soccerdata_endpoint_catalog.md
17. SKCS-KNOWLEDGE/providers/soccerdata_notebooklm_synthesis.md
18. SKCS-KNOWLEDGE/providers/soccerdata_provider_health.md

B21 assets inspected (64):
1. public/about-bg.jpg
2. public/about-bg.webp
3. public/accuracy.html
4. public/admin-sync.html
5. public/components/HeroCarousel.jsx
6. public/components/TrendDashboard.jsx
7. public/control-center.html
8. public/css/control-center.css
9. public/css/hero-carousel.css
10. public/css/input.css
11. public/css/output.css
12. public/css/react-components.css
13. public/data/all_leagues_raw.json
14. public/data/all_sports_raw.json
15. public/data/context-pack-2026-05-17.json
16. public/data/event-details-cache.json
17. public/data/h2h-2026-05-17.json
18. public/data/importance-2026-05-17.json
19. public/data/injuries-2026-05-17.json
20. public/data/news-injury-cache.json
21. public/data/pipeline-dry-2026-05-17.json
22. public/data/standings-cache.json
23. public/data/team-form-2026-05-17.json
24. public/data/team-form-cache.json
25. public/data/travel-2026-05-17.json
26. public/data/tsdb-coverage-2026-05-17.json
27. public/data/tsdb-coverage-2026-05-18.json
28. public/data/tsdb-coverage-2026-05-19.json
29. public/data/tsdb-day-2026-05-17.json
30. public/data/vip-stress-saturday.json
31. public/direct-markets.html
32. public/experience.html
33. public/favicon.ico
34. public/hero-page.jpg
35. public/hero-page.webp
36. public/index.html
37. public/js/acca-builder.js
38. public/js/ai-reasoning-display.js
39. public/js/config.js
40. public/js/control-center.js
41. public/js/doubleChanceCombos.js
42. public/js/hero-carousel.js
43. public/js/semantic-drift-dashboard.js
44. public/js/smh-hub-master-rulebook.js
45. public/js/smh-hub.js
46. public/js/supabase-bundle.js
47. public/js/supabase-init.js
48. public/js/system-health-banner.js
49. public/js/user-experience-feedback.js
50. public/js/vip-stress-dashboard.js
51. public/language-switch.html
52. public/language.jpg
53. public/login.html
54. public/login.jpg
55. public/market-explorer.html
56. public/payment.html
57. public/privacy.html
58. public/robots.txt
59. public/style.css
60. public/subscribe/index.html
61. public/subscription.html
62. public/terms.html
63. public/vip-stress-dashboard.html
64. public/windrawwin.jpg

B22 assets inspected (61):
1. supabase/migrations/20260415000001_create_insight_usage.sql
2. supabase/migrations/20260418000002_update_predictions_final_risk_level_check.sql
3. supabase/migrations/20260501_skcs_comprehensive_engine.sql
4. supabase/migrations/20260512000001_create_canonical_bookmakers.sql
5. supabase/migrations/20260512000002_add_odds_to_match_context.sql
6. supabase/migrations/20260512000003_create_sport_sync_table.sql
7. supabase/migrations/20260512000004_create_upsert_raw_fixture_rpc.sql
8. supabase/migrations/20260512000005_create_context_enrichment_trigger.sql
9. supabase/migrations/20260512000006_create_fixture_processing_log.sql
10. supabase/migrations/20260512000007_create_admin_views.sql
11. supabase/migrations/20260512000008_create_event_odds_snapshots.sql
12. supabase/migrations/20260512000009_create_get_prediction_rpc.sql
13. supabase/migrations/20260512000010_populate_sport_sync.sql
14. supabase/migrations/20260512000012_create_get_prediction_function.sql
15. supabase/migrations/20260512000013_disable_rls_match_context.sql
16. supabase/migrations/20260522000001_add_watchlist_column.sql
17. supabase/migrations/20260522000002_add_sport_to_tier_rules.sql
18. supabase/migrations/20260523000001_drop_insight_usage.sql
19. supabase/migrations/20260524000001_remove_dev_rls_policies.sql
20. supabase/migrations/20260524000002_create_upsert_canonical_event_rpc.sql
21. supabase/migrations/20260531000001_skcs_engine_v2_phase0_identity.sql
22. supabase/migrations/20260531000002_skcs_engine_v2_phase0b_match_results.sql
23. supabase/migrations/20260617_add_market_tier.sql
24. supabase/migrations/20260619000001_rename_predictions_final_to_direct1x2.sql
25. supabase/migrations/20260619000002_align_direct1x2_columns.sql
26. supabase/migrations/20260619000003_direct1x2_risk_tier_and_secondary_markets.sql
27. supabase/migrations/20260621000001_enforce_league_country_on_direct_matches.sql
28. supabase/migrations/20260701000001_normalize_sport_names.sql
29. supabase/migrations/20260717000001_create_f1_schema.sql
30. supabase/migrations/20260718000001_db_rule_alignment_75_55_30.sql
31. supabase/migrations/20260820000001_rename_risk_tiers_and_safe_haven.sql
32. supabase/migrations/20260820000002_fix_secondary_governance_80_75.sql
33. supabase/migrations/20260822000001_add_partitioning.sql
34. supabase/migrations/20260822000002_create_relational_odds_tables.sql
35. supabase/migrations/20260822000002a_create_relational_tables.sql
36. supabase/migrations/20260822000002b_create_relational_indexes.sql
37. supabase/migrations/20260822000002c_create_relational_functions_triggers.sql
38. supabase/migrations/20260822000002d_create_relational_views.sql
39. supabase/migrations/20260822000003_normalize_prediction_tables.sql
40. supabase/migrations/20260822000003a_create_prediction_tables.sql
41. supabase/migrations/20260822000003b_create_prediction_indexes.sql
42. supabase/migrations/20260822000003c_create_prediction_functions_triggers.sql
43. supabase/migrations/20260822000003d_create_prediction_views.sql
44. supabase/migrations/20260822000004_create_materialized_admin_views.sql
45. supabase/migrations/20260822000005_skcs_engine_v2_engine_core.sql
46. supabase/migrations/20260822000006_ai_governance_telemetry.sql
47. supabase/migrations/20260822000007_ai_governance_rls_policies.sql
48. supabase/migrations/20260822000008_service_role_rls_policies.sql
49. supabase/migrations/20260822000009_public_read_config_rls_policies.sql
50. supabase/migrations/20260822000010_public_read_reference_rls.sql
51. supabase/migrations/20260822000011_system_health_state.sql
52. supabase/migrations/20260822000012_semantic_violations.sql
53. supabase/migrations/20260822000013_semantic_violation_summary.sql
54. supabase/migrations/20260822000014_system_health_state_contract.sql
55. supabase/migrations/20260902000000_pipeline_health_feed.sql
56. supabase/migrations/20261001000000_runtime_truth_mirror.sql
57. supabase/migrations/20261005000000_runtime_truth_mirror_alignment.sql
58. supabase/migrations/20261005000001_fix_calculate_team_strength_ambiguity.sql
59. supabase/migrations/20261006000000_sportsdataio_contract_alignment.sql
60. supabase/migrations/20261006000001_canonical_events.sql
61. supabase/migrations/20261007000000_user_experience_feedback.sql

Evidence summary:
- Phase 4 B19-B22 closed B19 as 17 CURRENT assets, B20 as 18 CURRENT assets, B21 as 64 CURRENT assets, and B22 as 61 CURRENT assets, with UNKNOWN 0 and no cleanup action authorized.
- Phase 5 B19-B22 proved functional overlap candidates across public frontend surfaces, auth/subscription/account surfaces, operator/control-plane widgets, public legal/product pages, static presentation assets, and Supabase migration families, but authorized no deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation.
- Phase 6 B19-B22 kept public frontend, auth, subscription, operator, legal, static, style, generated public output, and public presentation assets as CANONICAL_KEEP where recorded.
- Phase 6 B19-B22 held Supabase migration files behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.
- No Phase 6 decision directly authorizes implementation-level merge/consolidation for B19-B22.

Merge/consolidation decision:
- B19 SKCS-KNOWLEDGE knowledge registry/reference assets: NO_ACTION; no merge target or replacement authority is proven in this phase.
- B20 provider knowledge assets: NO_ACTION where provider/reference role is preserved; HOLD_NEEDS_RUNTIME_PROOF before any provider-policy consolidation, replacement, or retirement.
- B21 public UI, generated public output, and public static/presentation assets: NO_ACTION for current public delivery assets; no UI, route, auth, subscription, legal, styling, generated-output, or browser-delivered behavior is changed.
- B22 Supabase migration assets: HOLD_NEEDS_RUNTIME_PROOF; migrations remain historical/ordered database-change artifacts and must not be executed, rewritten, merged, deleted, consolidated, or retired in this phase.

Implementation boundary:
- B19-B22 only.
- B23-B29 not inspected for implementation in this packet.
- No runtime/source files changed.
- No Supabase, database, SQL, deployment, dependency, security, legal, subscription, prediction-content, user-data, UI, route, generated-output, or public asset behavior changed.

Batch decision:
- B19-B22 merge/consolidation gate is evidence-complete with NO_ACTION for proven current knowledge/reference and public delivery assets, and HOLD_NEEDS_RUNTIME_PROOF for provider-policy and Supabase migration consolidation candidates.
- Grouped unit B19-B22 is closed.
- Next deterministic group: B23-B26

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, vulnerability remediation, legal text change, subscription behavior change, prediction-content change, user-data change, UI behavior change, route change, generated-output change, or public asset change is authorized by this packet.

## PHASE 7 - B23-B26 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION, RUNTIME-PROOF HOLDS, AND ABSENT-PATH HOLD

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B23-B26
- Start HEAD: 3aa6b581
- Inspection scope: B23, B24, B25, B26 only
- B27-B29 touched: NO
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Supabase function restore/deploy/repair performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B23, B24, B25, and B26 membership
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json B23, B24, B25, and B26 register coverage
- PHASE 4 - B23-B26 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B23-B26 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B23-B26 CANONICAL AUTHORITY SELECTION EVIDENCE

Corrected membership/register audit:
- B23 DB_SQL_AND_SUPABASE_OTHER: declared 20, actual paths 20, matched register rows 19, on-disk missing 1, register missing 1, functional groups: API_ROUTE 1; DATABASE 4; DATABASE_MIGRATION 11; SCHEDULER_BACKGROUND 3. Missing on disk: supabase/functions/sync-sports-data/index.ts. Missing in register: supabase/functions/sync-sports-data/index.ts.
- B24 TESTS: declared 6, actual paths 6, matched register rows 6, on-disk missing 0, register missing 0, functional groups: TEST_PROOF 6.
- B25 SCRATCH: declared 2, actual paths 2, matched register rows 2, on-disk missing 0, register missing 0, functional groups: DATABASE 2.
- B26 DEPLOYMENT_CI: declared 3, actual paths 3, matched register rows 3, on-disk missing 0, register missing 0, functional groups: DEPLOYMENT_OPERATIONS 3.

B23 assets inspected (20):
1. sql/acca_rules.sql
2. sql/day_zero_subscription.sql
3. sql/extreme_smb_data.sql
4. sql/fix_rls_policies.sql
5. sql/market_correlations_schema.sql
6. sql/master_rulebook_triggers.sql
7. sql/monitoring_tables.sql
8. sql/performance_optimizations.sql
9. sql/rapidapi_cache.sql
10. sql/schema_refactor.sql
11. sql/supabase_test_user_reset_and_seed.sql
12. sql/supabase_test_user_seed_access.sql
13. sql/tables.sql
14. sql/tier_rules.sql
15. supabase/edge-functions/scheduled-fixture-sync/index.ts
16. supabase/edge-functions/scheduledFixtureSync/index.ts
17. supabase/functions/scheduled-prediction-refresh/index.ts
18. supabase/functions/semantic-drift-summary/index.ts
19. supabase/functions/sync-sports-data/index.ts [MISSING_ON_DISK]
20. supabase/schema/ai_pipeline_schema.sql

B24 assets inspected (6):
1. tests/edge-asset-classification.test.js
2. tests/edge-control-center-ledger.test.js
3. tests/edge-control-center-ui.test.js
4. tests/edge-project-register.test.js
5. tests/edge-repository-asset-register.test.js
6. tests/edge-system-runtime-inventory.test.js

B25 assets inspected (2):
1. scratch/db_normalize.js
2. scratch/db_sync.js

B26 assets inspected (3):
1. Dockerfile
2. render.yaml
3. vercel.json

Evidence summary:
- Phase 4 B23-B26 closed with UNKNOWN 0 and authorized no cleanup action.
- Phase 4 recorded supabase/functions/sync-sports-data/index.ts as a future governance cleanup item, not a Phase 7 implementation target.
- Phase 5 B23-B26 proved functional overlap candidates across SQL rulebook/schema assets, Supabase access/test-user scripts, operational SQL, Supabase scheduled/function surfaces, governance tests, scratch database scripts, and deployment configuration boundaries, but authorized no deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation.
- Phase 6 B23-B26 held SQL, Supabase function, and scratch database script assets behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.
- Phase 6 B23-B26 kept governance tests as separate CANONICAL_KEEP authorities for distinct Control Center contracts.
- Phase 6 B23-B26 kept Dockerfile, render.yaml, and vercel.json as separate CANONICAL_KEEP authorities for distinct hosting surfaces.
- Phase 6 B23-B26 recorded supabase/functions/sync-sports-data/index.ts as manifest-listed but absent from the working tree, with no restore, delete, deploy, or repair authorized.
- No Phase 6 decision directly authorizes implementation-level merge/consolidation for B23-B26.

Merge/consolidation decision:
- B23 SQL and Supabase other assets: HOLD_NEEDS_RUNTIME_PROOF; no SQL, RLS, policy, RPC, trigger, schema, table, index, Supabase function, Edge Function, deployment, restore, repair, replacement, consolidation, deletion, or retirement is authorized.
- B23 absent supabase/functions/sync-sports-data/index.ts path: HOLD_ABSENT_PATH; record only as stale manifest/future governance evidence in this packet.
- B24 governance test assets: NO_ACTION; tests remain separate canonical authorities for distinct governance contracts, with no test merge, refactor, deletion, or rewrite authorized.
- B25 scratch database scripts: HOLD_NEEDS_RUNTIME_PROOF; mutation-capable scratch scripts must not be executed, replaced, consolidated, rewritten, deleted, or retired in this phase.
- B26 deployment and hosting configuration assets: NO_ACTION; Dockerfile, render.yaml, and vercel.json remain separate hosting authorities, with no deployment config, route, build command, cron, autoDeploy, or environment behavior changed.

Implementation boundary:
- B23-B26 only.
- B27-B29 not inspected for implementation in this packet.
- No runtime/source files changed.
- No Supabase, database, SQL, RLS, RPC, policy, trigger, schema, table, index, Edge Function, Supabase Function, deployment, dependency, security, test behavior, scratch script, hosting, route, cron, build, or environment behavior changed.

Batch decision:
- B23-B26 merge/consolidation gate is evidence-complete with NO_ACTION for proven governance-test and deployment/hosting authorities, HOLD_NEEDS_RUNTIME_PROOF for SQL, Supabase function, and scratch/database candidates, and HOLD_ABSENT_PATH for the stale manifest-listed sync-sports-data path.
- Grouped unit B23-B26 is closed.
- Next deterministic group: B27-B29

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, vulnerability remediation, Supabase function restore, Supabase function deploy, Supabase function repair, test refactor, deployment-config change, route change, cron change, build change, environment change, scratch-script execution, or stale manifest repair is authorized by this packet.

## PHASE 7 - B27-B29 MERGE AND CONSOLIDATION EVIDENCE

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Grouped review unit: B27-B29
- Start HEAD: e398a200
- Inspection scope: B27, B28, B29 only
- Post-B29 phase state: PHASE_READY_TO_CLOSE
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Authority sources reviewed:
- control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json B27, B28, and B29 membership
- control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json B27, B28, and B29 register coverage
- PHASE 4 - B27-B29 LEGACY AND REPLACEMENT IDENTIFICATION EVIDENCE
- PHASE 5 - B27-B29 FUNCTIONAL OVERLAP IDENTIFICATION EVIDENCE
- PHASE 6 - B27-B29 CANONICAL AUTHORITY SELECTION EVIDENCE

Corrected membership/register audit:
- B27 ARCHIVE: declared 58, actual paths 58, matched register rows 58, on-disk missing 0, register missing 0, functional groups: DATABASE_MIGRATION 6; GENERATED_OUTPUT 3; SCRIPT_TOOL 49.
- B28 ROOT_NON_MD_TXT_FILES: declared 55, actual paths 55, matched register rows 55, on-disk missing 0, register missing 0, functional groups: DATABASE_MIGRATION 1; DEPLOYMENT_OPERATIONS 8; DOCUMENTATION_KNOWLEDGE 1; GENERATED_OUTPUT 16; PUBLIC_ASSET 1; SCRIPT_TOOL 15; TEST_PROOF 11; UNCATEGORIZED 2.
- B29 DOT_TOOL_DIRS_AND_SMALL_DIRS: declared 26, actual paths 26, matched register rows 26, on-disk missing 0, register missing 0, functional groups: API_ROUTE 1; BACKEND_RUNTIME 2; DEPLOYMENT_OPERATIONS 1; DOCUMENTATION_KNOWLEDGE 11; GENERATED_OUTPUT 8; PROVIDER_INTEGRATION 1; PUBLIC_ASSET 1; SCRIPT_TOOL 1.

B27 assets inspected (58):
1. _archive/root/cli_v1.1.0.exe
2. _archive/root/render.zip
3. _archive/scripts/analyze-routes.js
4. _archive/scripts/analyze-table-usage.js
5. _archive/scripts/check-confidence.js
6. _archive/scripts/check-connectivity.js
7. _archive/scripts/check-constraints.js
8. _archive/scripts/check-deployment.js
9. _archive/scripts/check-direct-predictions.js
10. _archive/scripts/check-endpoints.js
11. _archive/scripts/check-final-schema.js
12. _archive/scripts/check-final-sports.js
13. _archive/scripts/check-matches.js
14. _archive/scripts/check-metadata-times.js
15. _archive/scripts/check-risk-constraint.js
16. _archive/scripts/check-schema.js
17. _archive/scripts/check-stage-schemas.js
18. _archive/scripts/check-supabase-tables.js
19. _archive/scripts/check-team-names.js
20. _archive/scripts/cors-test.sh
21. _archive/scripts/debug-events.js
22. _archive/scripts/debug-sport-filter.js
23. _archive/scripts/deep-table-analysis.js
24. _archive/scripts/definitive-cors-diagnosis.sh
25. _archive/scripts/deploy-cloud-scheduler.sh
26. _archive/scripts/deploy-render.sh
27. _archive/scripts/file-walker.js
28. _archive/scripts/files-report.json
29. _archive/scripts/final-status.js
30. _archive/scripts/final-verification.js
31. _archive/scripts/fix-matches-timestamps.sql
32. _archive/scripts/fix-sport-filter.js
33. _archive/scripts/fix-tier-rules.js
34. _archive/scripts/fix-view.js
35. _archive/scripts/fix-view.sql
36. _archive/scripts/full-nuke.js
37. _archive/scripts/migration2-fix.js
38. _archive/scripts/migration2-normalized-fixtures.js
39. _archive/scripts/migration2-v2.js
40. _archive/scripts/migration2-v3.js
41. _archive/scripts/normalize-sports.sql
42. _archive/scripts/patch-other-routes.js
43. _archive/scripts/patch-predictions-visibility.js
44. _archive/scripts/phase1-immediate-patch.js
45. _archive/scripts/phase1-patch.js
46. _archive/scripts/phase2-schema-refactor.js
47. _archive/scripts/phase3-cleanup.js
48. _archive/scripts/sql/create_event_context_tables.sql
49. _archive/scripts/sql/create_prediction_publish_runs.sql
50. _archive/scripts/sql/create_predictions_accuracy.sql
51. _archive/scripts/test-scheduler-endpoint.sh
52. _archive/scripts/trigger-grade.js
53. _archive/scripts/trigger-refresh.js
54. _archive/scripts/trigger-render-pipeline.js
55. _archive/scripts/verify-deployment.sh
56. _archive/scripts/verify-predictions.js
57. _archive/scripts/verify-route-patches.js
58. _archive/scripts/wipe-events-data.js

B28 assets inspected (55):
1. .bat
2. .dockerignore
3. .env.example
4. .gcloudignore
5. .gitignore
6. .gitmsg
7. .vercelignore
8. check-db.js
9. check-football-times.js
10. check-football.js
11. check-production-logs.js
12. check-recent-predictions.js
13. check-sync-timestamps.js
14. check-table-columns.js
15. check-tables.js
16. competitions.json
17. find-active-files.js
18. force-seed.js
19. kabaddiPy
20. LICENSE
21. market-explorer.html
22. monitoring_dashboard_queries.sql
23. overall-project-completion.json
24. package-lock.json
25. package.json
26. phase1-final-report.json
27. phase2-cleanup.js
28. phase2-conservative-summary.json
29. phase2-final-summary.json
30. phase3-comprehensive-summary.json
31. phase3-migration-summary.json
32. placeholders-and-insights-audit.json
33. qodana.yaml
34. refresh-ai-insights.js
35. run-final-test.js
36. safe-migration-plan.json
37. scratch_test_pipeline.js
38. SKCS_START.bat
39. sportbook
40. supabase-diagnostics-report.json
41. supabase-migration-plan.json
42. supabase-table-analysis.json
43. supabase-visual-analysis-report.json
44. table-dependency-map.json
45. tailwind.config.js
46. test_scenarios_master_rulebook.js
47. test-ai-insights.js
48. test-ai-simulation.js
49. test-bigballs-direct.js
50. test-espn-direct.js
51. test-groq-debug.js
52. test-groq-models.js
53. test-sportsdb.js
54. test-wc-id.js
55. trigger_ai.js

B29 assets inspected (26):
1. .gemini/antigravity/README.md
2. .gemini/antigravity/workflows/automated-data-sync.toml
3. .gemini/antigravity/workflows/intelligent-alert-system.toml
4. .gemini/antigravity/workflows/intelligent-pipeline-optimizer.toml
5. .gemini/antigravity/workflows/smart-prediction-engine.toml
6. .gemini/commands.toml
7. .githooks/pre-commit
8. .qwen/settings.json
9. .qwen/settings.json.orig
10. .stakpak/data/local.db
11. .windsurf/workflows/env.md
12. api/pipeline/run-full.js
13. dolphin-server/Dockerfile
14. dolphin-server/README.md
15. js/config.js
16. js/supabase-bundle.js
17. js/supabase-client-src.js
18. js/supabase-init.js
19. reports/execution-spine-compliance-map.json
20. reports/execution-spine-compliance-map.md
21. src/data/placeholder.txt
22. src/data/sportsdb-leagues.json
23. tmp/key-validation-1776365488298.json
24. tmp/key-validation-1776365827255.json
25. tmp/key-validation-1776482624434.json
26. tmp/today-fixture-pull-1776482706164.json

Evidence summary:
- Phase 4 B27-B29 closed B27 as 58 HISTORICAL_EVIDENCE archived assets, B28 as 55 CURRENT assets, and B29 as 26 CURRENT assets, with UNKNOWN 0 and no cleanup action authorized.
- Phase 5 B27-B29 proved functional overlap candidates across root scripts/tests, package/build config, phase reports/audit maps, frontend Supabase bundle/config, local runtime/model support, developer-agent workflows, pipeline/report projections, and provider/temp data artifacts, but authorized no cleanup action.
- Phase 6 B27-B29 kept package.json, package-lock.json, tailwind.config.js, LICENSE, and js/supabase-client-src.js as CANONICAL_KEEP where recorded.
- Phase 6 B27-B29 held root manual scripts, AI diagnostics, provider tests, historical reports, duplicate root frontend/bundle surfaces, local launch/model/runtime support, agent workflow config, hooks, local tool data, API pipeline/report projections, provider catalog data, placeholder data, and temporary validation artifacts behind NEEDS_RUNTIME_PROOF before execution, replacement, consolidation, rewrite, deletion, or retirement.
- No Phase 6 decision directly authorizes implementation-level merge/consolidation for B27-B29.

Merge/consolidation decision:
- B27 archive assets: NO_ACTION for preserved historical evidence; no archive deletion, merge, rewrite, or retirement is authorized in this phase.
- B28 root non-md/txt assets: NO_ACTION where CANONICAL_KEEP authority is already proven; HOLD_NEEDS_RUNTIME_PROOF for root scripts, historical reports, duplicate frontend surfaces, local runtime support, and temporary/provider-data candidates.
- B29 dot tool directories and small-directory assets: NO_ACTION where distinct support role is preserved; HOLD_NEEDS_RUNTIME_PROOF for agent workflow, local tool config, hook, auxiliary project, local DB, provider, API, generated-output, and temporary-data candidates.
- No HOLD_ABSENT_PATH candidate exists in this grouped unit.

Implementation boundary:
- B27-B29 only.
- No further Phase 7 grouped batch remains after this packet.
- No runtime/source files changed.
- No Supabase, database, SQL, deployment, dependency, security, UI, route, provider, data snapshot, temporary artifact, local tool, hook, package, build, license, or workflow behavior changed.

Batch decision:
- B27-B29 merge/consolidation gate is evidence-complete with NO_ACTION for proven current, historical, package/build/license, and distinct support authorities, and HOLD_NEEDS_RUNTIME_PROOF for overlap, duplicate, manual-script, report, tooling, local-runtime, provider-data, and temporary-artifact candidates.
- Grouped unit B27-B29 is closed.
- PHASE_7 merge and consolidation grouped-batch review is complete across B01-B03 through B27-B29.
- Phase 7 is ready for a separate closure summary/control packet.

Validation boundary:
- Evidence only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, vulnerability remediation, package change, build change, license change, UI behavior change, route change, provider change, temporary-file cleanup, local-tool cleanup, hook change, workflow change, or stale artifact cleanup is authorized by this packet.

## PHASE 7 CLOSURE SUMMARY

Result: PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS

Scope:
- Phase: PHASE_7 - Merge and Consolidation
- Phase question: Which confirmed canonical authority decisions should be implemented through merge and consolidation?
- Review order model: GROUPED_REVIEW_UNITS only (B01-B03, B04-B06, B07-B10, B11-B14, B15-B18, B19-B22, B23-B26, B27-B29)
- Pre-closure HEAD: 746a2231
- Pre-closure lifecycle state: PHASE_READY_TO_CLOSE
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Closed Phase 7 grouped review packets:
- B01-B03 complete
- B04-B06 complete
- B07-B10 complete
- B11-B14 complete
- B15-B18 complete
- B19-B22 complete
- B23-B26 complete
- B27-B29 complete

Phase 7 outcome summary:
- Merge and consolidation gates were completed across all eight grouped Phase 7 review units using NO_ACTION, HOLD_NEEDS_RUNTIME_PROOF, and HOLD_ABSENT_PATH only.
- No IMPLEMENT_CONSOLIDATION decision was authorized across the grouped Phase 7 programme.
- Phase 6 canonical authority decisions were reviewed without merge execution, deletion, retirement, refactor, SQL execution, deployment change, or runtime action.
- HOLD_NEEDS_RUNTIME_PROOF and HOLD_ABSENT_PATH holds remain in force until separately resolved through approved future work.
- Grouped batch sequencing was preserved; Phase 7 was not converted back to individual B01-B29 progression.

Important non-actions:
- No file was deleted.
- No file was merged.
- No file was retired.
- No runtime code was changed.
- No UI behavior was changed.
- No SQL was executed.
- No Supabase/database state was changed.
- No deployment or hosting config was changed.
- No dependency/security/vulnerability remediation was performed.
- No GitHub vulnerability notice remediation was performed in this phase.

Phase 7 closure decision:
- PHASE_7 merge and consolidation is complete across B01-B03 through B27-B29 grouped review units.
- PHASE_7 is now closed.
- PHASE_8 is activated as the next cleanup phase.

PHASE_8 activation warning:
- PHASE_8 activation does not authorize a new cleanup hunt.
- PHASE_8 activation does not re-seed individual EAC batch sequencing from B01.
- Activating PHASE_8 establishes final repository validation scope only; it does not authorize deletion, merge execution, retirement, refactor, SQL, Supabase mutation, deployment change, dependency update, or vulnerability remediation.

Next recommended control action:
- Open the approved PHASE_8 final repository validation mini-project when separately authorized.
- Do not reopen Phase 7 grouped batch review without explicit Control Center approval.

Validation boundary:
- Control Center state transition only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 8 FINAL REPOSITORY VALIDATION EVIDENCE

Result: PASS

Scope:
- Phase: PHASE_8 - Final Repository Validation
- Phase question: Is the cleaned repository internally consistent?
- Validation start HEAD: 900650e4
- Lifecycle before evidence packet: PHASE_ACTIVE
- Post-validation lifecycle state: PHASE_READY_TO_CLOSE
- Review order model: NO_BATCH_MODEL
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Phase 7 closure preservation:
- PHASE_7 is closed.
- Grouped review units preserved: B01-B03, B04-B06, B07-B10, B11-B14, B15-B18, B19-B22, B23-B26, B27-B29.
- No Phase 7 grouped batch review was reopened.

Phase 8 batch model:
- Phase 8 has no batch model.
- remaining_batches: []
- next_deterministic_batch: null
- completed_batches: []
- No individual B01-B29 sequencing was introduced.

Governance drift repairs before validation:
- Classification governance drift repaired at 26acdedc.
- Runtime inventory governance drift repaired at 900650e4.

Full governance verification:
- npm run control:center: PASS
- npm run control:classification: PASS
- npm run control:runtime: PASS
- npm run control:verify: PASS end-to-end
- npm run verify:rulebook: PASS
- npm run test:control-center: PASS

Deferred holds roll-up:
- HOLD_NEEDS_RUNTIME_PROOF holds from Phases 6 and 7 remain deferred future work, not Phase 8 defects.
- HOLD_ABSENT_PATH holds from Phases 6 and 7 remain deferred future work, not Phase 8 defects.
- Scout-Edge marriage prerequisites remain BLOCKED future work, not Phase 8 defects.
- External provider removal remains PARTIAL future work, not a Phase 8 defect.
- Supabase storage and FIP retention decisions remain BLOCKED future work, not Phase 8 defects.
- GitHub Dependabot vulnerability notices were not remediated in this mini-project.

Important non-actions:
- No file was deleted.
- No file was merged.
- No file was retired.
- No runtime code was changed.
- No UI behavior was changed.
- No SQL was executed.
- No Supabase/database state was changed.
- No deployment or hosting config was changed.
- No dependency/security/vulnerability remediation was performed.

Phase 8 validation decision:
- The cleaned repository is internally consistent under the governed Control Center verification chain.
- PHASE_8 final repository validation evidence is complete.
- PHASE_8 remains active and is ready for a separate closure summary/control packet.
- PHASE_8 is not closed by this packet.

Next recommended control action:
- Open the approved PHASE_8 closure summary/control packet mini-project when separately authorized.
- Do not reopen Phase 7 grouped batch review without explicit Control Center approval.
- Do not begin a new cleanup hunt or individual EAC batch re-sequencing from B01.

Validation boundary:
- Control Center evidence recording and lifecycle transition only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## PHASE 8 CLOSURE SUMMARY

Result: PASS

Scope:
- Phase: PHASE_8 - Final Repository Validation
- Phase question: Is the cleaned repository internally consistent?
- Pre-closure HEAD: 685018ed
- Pre-closure lifecycle state: PHASE_READY_TO_CLOSE
- Validation evidence commit: 685018ed
- Review order model: NO_BATCH_MODEL
- Deletion/merge/retirement/refactor performed: NO
- Source/runtime/product change performed: NO
- SQL execution performed: NO
- Deployment change performed: NO
- Database/Supabase mutation performed: NO
- Dependency/security/vulnerability remediation performed: NO

Phase 7 closure preservation:
- PHASE_7 is closed.
- Grouped review units preserved: B01-B03, B04-B06, B07-B10, B11-B14, B15-B18, B19-B22, B23-B26, B27-B29.
- No Phase 7 grouped batch review was reopened.

Phase 8 batch model:
- Phase 8 had no batch model.
- remaining_batches: []
- next_deterministic_batch: null
- completed_batches: []
- No individual B01-B29 sequencing was introduced.

Governance drift repairs before validation:
- Classification governance drift repaired at 26acdedc.
- Runtime inventory governance drift repaired at 900650e4.

Full governance verification:
- npm run control:center: PASS
- npm run control:classification: PASS
- npm run control:runtime: PASS
- npm run control:verify: PASS end-to-end
- npm run verify:rulebook: PASS
- npm run test:control-center: PASS

Deferred holds roll-up:
- HOLD_NEEDS_RUNTIME_PROOF holds from Phases 6 and 7 remain deferred future work, not cleanup defects.
- HOLD_ABSENT_PATH holds from Phases 6 and 7 remain deferred future work, not cleanup defects.
- Scout-Edge marriage prerequisites remain BLOCKED future work, not cleanup defects.
- External provider removal remains PARTIAL future work, not a cleanup defect.
- Supabase storage and FIP retention decisions remain BLOCKED future work, not cleanup defects.
- GitHub Dependabot vulnerability notices were not remediated in this closure packet.

Important non-actions:
- No file was deleted.
- No file was merged.
- No file was retired.
- No runtime code was changed.
- No UI behavior was changed.
- No SQL was executed.
- No Supabase/database state was changed.
- No deployment or hosting config was changed.
- No dependency/security/vulnerability remediation was performed.

Phase 8 closure decision:
- PHASE_8 final repository validation is complete.
- PHASE_8 is now closed.
- The repository cleanup programme is complete across PHASE_0 through PHASE_8.
- cleanup_programme_status: PROGRAMME_CLOSED

Programme outcome summary:
- All eight grouped Phase 7 review units completed with NO_ACTION, HOLD_NEEDS_RUNTIME_PROOF, and HOLD_ABSENT_PATH only.
- Phase 8 proved repository governance consistency without a new cleanup hunt or individual EAC batch re-sequencing.
- Deferred holds and marriage/provider/storage blockers remain recorded as separately authorized future work.

Next recommended control action:
- Do not reopen the repository cleanup programme without explicit Control Center approval.
- Do not begin post-cleanup implementation from this closure packet.
- Future work belongs to separately authorized non-cleanup programmes only.

Validation boundary:
- Control Center closure summary and programme state transition only.
- No deletion, merge, retirement, refactor, source/runtime/product change, SQL execution, deployment change, database/Supabase mutation, dependency update, or vulnerability remediation is authorized.

## SEE-001 â€” SCOUTâ€“EDGE READ-ONLY E2E MARRIAGE PROOF

Result: **NEEDS IMPLEMENTATION**

Scope:
- Mini-project: SEE-001 â€” Scoutâ€“Edge Read-Only E2E Marriage Proof
- Start commit: 6a8dc811da3e50dfa14653250991c9467f54a7cb
- Inspection HEAD: 6a8dc811da3e50dfa14653250991c9467f54a7cb
- Mode: read-only inspection + evidence packet only
- Cleanup programme: PROGRAMME_CLOSED (not reopened)

Start-point verification:
- git status --short: clean
- git rev-parse HEAD == git rev-parse origin/main == 6a8dc811
- npm run control:center: PASS
- npm run control:verify: PASS
- npm run verify:rulebook: PASS

Inspection conclusion:
- Edgeâ€™s committed sports-truth origin is still external-provider acquisition via dataProvider.getPredictionInputs() â†’ buildLiveData().
- No committed governed FIP intake boundary exists (EFI-001 remains PROPOSED).
- FIP-001 is referenced in ledger/register only; no canonical FIP contract artifact is committed in this repository.
- Scout-adjacent candidates backend/services/scoutSignalSync.js and docs/intel_read_contract_v1.md are preserved workspace candidates only (not committed).
- Nearest analysis hook: aiPipeline.buildRawPredictionFromProviderItem() after normalization to match_info / sharp_odds / contextual_intelligence.
- Nearest non-governed injection hook: POST /api/pipeline/run with { matches } â€” insufficient for marriage proof without EMG-001 + EFI-001 + EST-001.
- scout_edge_marriage_gate remains BLOCKED; E2E-001 remains BLOCKED.

Evidence artifact:
- control-center/SEE-001_SCOUT_EDGE_E2E_MARRIAGE_PROOF.v1.md

Next recommended mini-project:
- EMG-001-C1 â€” Scoutâ€“Edge Marriage Gate Contract (contract-only), then EFI-001 intake handshake before any E2E proof attempt.

Important non-actions:
- No cleanup reopening, deletion, merge, retirement, refactor, runtime/UI change, SQL, Supabase mutation, deployment change, dependency update, security remediation, or Scoutâ€“Edge bridge implementation.

Validation boundary:
- SEE-001 evidence recording only. Does not authorize marriage-gate clearance or implementation.

## EMG-001-C1 â€” SCOUTâ€“EDGE MARRIAGE GATE CONTRACT

Result: **APPROVED (contract sealed; gate remains BLOCKED)**

Scope:
- Mini-project: EMG-001-C1 â€” Scoutâ€“Edge Marriage Gate Contract (contract-only)
- Start commit: b64526cd812fb92bd6c1e1c712af147d9cd5eecb
- Mode: contract-only; no intake implementation
- Cleanup programme: PROGRAMME_CLOSED (not reopened)
- Prior evidence: SEE-001

Start-point verification:
- git status --short: clean at start
- git rev-parse HEAD == b64526cd at start
- npm run control:center: PASS (required before commit)
- npm run control:verify: PASS (required before commit)
- npm run verify:rulebook: PASS (required before commit)

Contract decision:
- EMG-001 marriage gate contract sealed at control-center/EMG-001_SCOUT_EDGE_MARRIAGE_GATE_CONTRACT.v1.md
- EMG-001 task status: APPROVED (contract validator/tests deferred)
- scout_edge_marriage_gate: BLOCKED (unchanged)
- Prerequisites complete: NO
- Allowed first E2E proof source: validated canonical Scout FIP through future EFI-001 intake boundary only
- Forbidden proof sources include buildLiveData(), parallel acquisition surfaces, and POST /api/pipeline/run { matches }
- Governed sequence: EMG-001 â†’ EFI-001 â†’ EST-001 â†’ E2E-001 â†’ separate explicit gate clearance

Evidence artifacts:
- control-center/EMG-001_SCOUT_EDGE_MARRIAGE_GATE_CONTRACT.v1.md
- control-center/SEE-001_SCOUT_EDGE_E2E_MARRIAGE_PROOF.v1.md (registered)

Next recommended mini-project:
- EFI-001-C1 â€” FIP Intake Handshake contract inspection (contract-only), when separately authorized

Important non-actions:
- No intake implementation, runtime/API/UI change, SQL, Supabase mutation, deployment, provider removal, dependency/security remediation, or gate clearance

Validation boundary:
- EMG-001-C1 contract recording only. Does not authorize EFI-001 implementation or marriage-gate clearance.

## EFI-001-C1 â€” FIP INTAKE HANDSHAKE CONTRACT

Result: **APPROVED (contract sealed; implementation forbidden; gate remains BLOCKED)**

Scope:
- Mini-project: EFI-001-C1 â€” FIP Intake Handshake Contract (contract-only)
- Start commit: 62bdb504e4c47dc460e040ca149ccde1ba453388
- Mode: contract-only; no intake implementation
- Cleanup programme: PROGRAMME_CLOSED (not reopened)
- Prior contracts: EMG-001-C1, SEE-001

Start-point verification:
- git status --short: clean at start
- git rev-parse HEAD == 62bdb504 at start
- npm run control:center: PASS (required before commit)
- npm run control:verify: PASS (required before commit)
- npm run verify:rulebook: PASS (required before commit)

Contract decision:
- EFI-001 intake handshake contract sealed at control-center/EFI-001_FIP_INTAKE_HANDSHAKE_CONTRACT.v1.md
- EFI-001 task status: APPROVED (runtime implementation forbidden)
- scout_edge_marriage_gate: BLOCKED (unchanged)
- Accepted source: validated canonical Scout FIP via future EFI-001 boundary only
- Intake boundary: upstream of buildRawPredictionFromProviderItem(); not POST /api/pipeline/run { matches }
- Fail-closed validation, idempotency, provenance, and evidence recording laws defined
- FIP-001 committed authority artifact still pending; EST-001 retention law still pending

Evidence artifacts:
- control-center/EFI-001_FIP_INTAKE_HANDSHAKE_CONTRACT.v1.md

Next recommended mini-project:
- EST-001-C1 â€” Supabase Storage and FIP Retention Contract (contract-only), when separately authorized

Important non-actions:
- No intake implementation, runtime/API/pipeline/UI change, SQL, Supabase mutation, deployment, provider removal, dependency/security remediation, or gate clearance

Validation boundary:
- EFI-001-C1 contract recording only. Does not authorize runtime intake implementation or marriage-gate clearance.

## EST-001-C1 â€” SUPABASE STORAGE AND FIP RETENTION CONTRACT

Result: **APPROVED (contract sealed; storage gate remains BLOCKED; marriage gate remains BLOCKED)**

Scope:
- Mini-project: EST-001-C1 â€” Supabase Storage and FIP Retention Contract (contract-only)
- Start commit: afc47d38a0f9dd24fb3a91bde89ad68306583d26
- Mode: contract-only; no SQL/schema/runtime storage implementation
- Cleanup programme: PROGRAMME_CLOSED (not reopened)
- Prior contracts: EFI-001-C1, EMG-001-C1, SEE-001

Start-point verification:
- git status --short: clean at start
- git rev-parse HEAD == afc47d38 at start
- npm run control:center: PASS (required before commit)
- npm run control:verify: PASS (required before commit)
- npm run verify:rulebook: PASS (required before commit)

Contract decision:
- EST-001 storage/retention contract sealed at control-center/EST-001_SUPABASE_STORAGE_AND_FIP_RETENTION_CONTRACT.v1.md
- EST-001 task status: APPROVED (runtime storage implementation forbidden)
- scout_edge_marriage_gate: BLOCKED (unchanged)
- supabase_storage_gate: BLOCKED (unchanged)
- Canonical sports truth remains in Scout (Neon); Edge stores derived state + minimal provenance/audit only
- Full FIP body and Scout evidence mirror forbidden in Supabase
- Data classes T0/R1/R2/D1/F1, retention periods, budget thresholds, replay/audit, and fail-closed persistence rules defined

Evidence artifacts:
- control-center/EST-001_SUPABASE_STORAGE_AND_FIP_RETENTION_CONTRACT.v1.md

Next recommended mini-project:
- E2E-001-C1 â€” Scout to Edge End-to-End Proof planning packet (contract/read-only), when separately authorized

Important non-actions:
- No SQL, schema creation, Supabase mutation, runtime/API/pipeline/UI change, intake implementation, provider removal, dependency/security remediation, or gate clearance

Validation boundary:
- EST-001-C1 contract recording only. Does not authorize storage implementation or gate clearance.

## E2E-001-C1 â€” SCOUT TO EDGE END-TO-END PROOF PLANNING PACKET

Result: **PLANNING COMPLETE â€” EXECUTION BLOCKED**

Scope:
- Mini-project: E2E-001-C1 â€” Scout to Edge End-to-End Proof Planning Packet (planning-only)
- Start commit: 43aad4f2edc60542622889580d2980387f3e5b52
- Mode: read-only / contract planning only; no proof execution
- Cleanup programme: PROGRAMME_CLOSED (not reopened)
- Sealed contracts: EMG-001-C1, EFI-001-C1, EST-001-C1, SEE-001

Start-point verification:
- git status --short: clean at start
- git rev-parse HEAD == 43aad4f2 at start
- npm run control:center: PASS (required before commit)
- npm run control:verify: PASS (required before commit)
- npm run verify:rulebook: PASS (required before commit)

Planning decision:
- E2E proof planning packet sealed at control-center/E2E-001_SCOUT_EDGE_PROOF_PLANNING_PACKET.v1.md
- E2E-001 task status: BLOCKED (unchanged)
- scout_edge_marriage_gate: BLOCKED (unchanged)
- supabase_storage_gate: BLOCKED (unchanged)
- Proof route: Scout validated FIP â†’ future EFI-001 boundary â†’ buildRawPredictionFromProviderItem â†’ D1 outputs + R1/R2 evidence
- Forbidden routes: buildLiveData(), POST /api/pipeline/run { matches }, public/data snapshots
- Single Football PROOF_FIXTURE sample defined; execution requires separate authorization
- E2E proof pass â‰  marriage gate clearance

Evidence artifacts:
- control-center/E2E-001_SCOUT_EDGE_PROOF_PLANNING_PACKET.v1.md

Next recommended mini-projects (sequenced):
- FIP-001-C1 â€” Register committed Scout FIP authority
- EFI-001-I1 â€” Smallest fail-closed intake implementation
- EST-001-I1 â€” Schema + retention enforcement implementation
- E2E-001-X1 â€” Controlled proof execution (when separately authorized)

Important non-actions:
- No proof execution, intake implementation, runtime/API/pipeline/UI change, SQL, Supabase mutation, deployment, provider removal, dependency/security remediation, or gate clearance

Validation boundary:
- E2E-001-C1 planning recording only. Does not authorize proof execution or gate clearance.

## FIP-001-C1 â€” REGISTER COMMITTED SCOUT FIP AUTHORITY

Result: **APPROVED (authority registered; gates remain BLOCKED)**

Scope:
- Mini-project: FIP-001-C1 â€” Register Committed Scout FIP Authority (contract-only)
- Start commit: ecebdc9fab4ae5ee89c23c0f3785894cc45da47e
- Mode: contract/authority registration only
- Cleanup programme: PROGRAMME_CLOSED (not reopened)
- Prior mini-project: E2E-001-C1 closed

Start-point verification:
- git status --short: clean at start
- git rev-parse HEAD == ecebdc9f at start
- npm run control:center: PASS (required before commit)
- npm run control:verify: PASS (required before commit)
- npm run verify:rulebook: PASS (required before commit)

Authority decision:
- Scout FIP authority contract sealed at control-center/FIP-001_SCOUT_FIP_AUTHORITY_CONTRACT.v1.md
- FIP-001 task status: APPROVED (authority registered)
- scout_edge_marriage_gate: BLOCKED (unchanged)
- supabase_storage_gate: BLOCKED (unchanged)
- Allowed fip_schema_version: 1.0.0
- Hash authority: Scout scout-fip-sha256-v1; Edge verifies at future EFI-001 boundary
- Scout confirmed as canonical sports-truth owner; Edge holds references only per EST-001
- First proof mode: PROOF_FIXTURE only; reserved proof_fixture_id E2E-001-PROOF-001
- Forbidden non-canonical sources include buildLiveData(), POST /api/pipeline/run { matches }, workspace candidates, Supabase FIP replay

Evidence artifacts:
- control-center/FIP-001_SCOUT_FIP_AUTHORITY_CONTRACT.v1.md

Next recommended mini-projects (sequenced):
- EFI-001-I1 â€” Smallest fail-closed intake implementation
- EST-001-I1 â€” Schema + retention enforcement implementation
- E2E-001-X1 â€” Controlled proof execution (when separately authorized)

Important non-actions:
- No intake implementation, E2E proof run, runtime/API/pipeline/UI change, SQL, Supabase mutation, deployment, provider removal, dependency/security remediation, or gate clearance

Validation boundary:
- FIP-001-C1 authority registration only. Does not authorize intake implementation or proof execution.


## EFI-001-I1 FAIL-CLOSED FIP INTAKE IMPLEMENTATION EVIDENCE

Result: TESTED

Scope:
- Mini-project: EFI-001-I1 - Smallest Fail-Closed FIP Intake Implementation
- Runtime code added: YES, limited to backend/services/fipIntakeService.js
- Focused test added: YES, tests/fip-intake-service.test.js
- Route/API wiring performed: NO
- Prediction pipeline call performed: NO
- Supabase/database mutation performed: NO
- SQL execution performed: NO
- E2E proof execution performed: NO
- External provider removal performed: NO
- Dependency/security remediation performed: NO
- Cleanup programme reopened: NO

Implementation evidence:
- receiveValidatedFip() accepts only committed Scout FIP-001 schema version 1.0.0.
- validation.status must be VALIDATED.
- validation.algorithm must be scout-fip-sha256-v1.
- validation.hash is verified against canonical sorted JSON with validation.hash blanked.
- Forbidden manual/provider/workspace/Supabase replay origins are rejected.
- AUTHORIZED_PRODUCTION intake remains blocked unless scout_edge_marriage_gate is separately cleared.
- Accepted proof payload maps to Edge analysis envelope: match_info, sharp_odds, contextual_intelligence, metadata.sports_truth_origin = SCOUT_FIP.

Focused proof:
- node --test tests/fip-intake-service.test.js: PASS

Gate state:
- scout_edge_marriage_gate: BLOCKED
- supabase_storage_gate: BLOCKED
- E2E-001: BLOCKED
- EFI route/API receive surface: NOT IMPLEMENTED
- EST storage enforcement: NOT IMPLEMENTED

Next recommended control action:
- Continue only with separately authorized EST-001-I1, EPI/EPRV blocker work, or E2E-001-X1 sequencing.
- Do not clear the marriage gate from EFI-001-I1.


## EST-001-I1 SUPABASE STORAGE POLICY ENFORCEMENT EVIDENCE

Result: TESTED

Scope:
- Mini-project: EST-001-I1 - Supabase Storage Enforcement
- Runtime code added: YES, limited to backend/services/fipStoragePolicyService.js
- Focused test added: YES, tests/fip-storage-policy-service.test.js
- Supabase table creation performed: NO
- Supabase/database mutation performed: NO
- SQL execution performed: NO
- Migration creation performed: NO
- Route/API wiring performed: NO
- Prediction pipeline call performed: NO
- E2E proof execution performed: NO
- External provider removal performed: NO
- Dependency/security remediation performed: NO
- Cleanup programme reopened: NO

Implementation evidence:
- buildEstStorageRecords() creates storage-ready EST records from EFI intake results without writing to Supabase.
- Accepted EFI intake produces R1 minimal provenance reference and R2 bounded intake audit event only.
- Rejected EFI intake produces R2 audit-only evidence.
- Full FIP body, Scout mirror, provider payload, and Supabase body replay persistence are forbidden.
- Replay source remains Scout by fip_id + validation hash, not Supabase FIP body replay.
- Supabase budget thresholds are enforced as OK, WARNING at 80%, CRITICAL at 95%, and HARD_BLOCK at 100%.
- HARD_BLOCK prevents all new EST records.
- No full FIP body is persisted in any EST record.

Focused proof:
- node --test tests/fip-intake-service.test.js: PASS
- node --test tests/fip-storage-policy-service.test.js: PASS

Gate state:
- scout_edge_marriage_gate: BLOCKED
- supabase_storage_gate: BLOCKED
- E2E-001: BLOCKED
- Physical Supabase persistence: NOT IMPLEMENTED
- Supabase migrations: NOT CREATED
- SQL execution: NOT PERFORMED

Next recommended control action:
- Continue only with separately authorized EPI/EPRV blocker work, a physical Supabase persistence packet if required, or E2E-001-X1 sequencing.
- Do not clear the marriage gate or storage gate from EST-001-I1.

---
## EPI-001-C1 Prediction Pipeline Integrity Contract Evidence
Result: TESTED
Scope:
- Mini-project: EPI-001-C1 â€” Prediction Pipeline Integrity Contract
- Runtime prediction code changed: NO
- SQL executed: NO
- Supabase mutation/call performed: NO
- Migration created: NO
- Route wiring performed: NO
- Provider removal performed: NO
- E2E proof executed: NO
- Gate clearance performed: NO
Evidence:
- Contract sealed at `control-center/EPI-001_PREDICTION_PIPELINE_INTEGRITY_CONTRACT.v1.md`.
- Focused proof added at `tests/epi-pipeline-integrity-contract.test.js`.
- Protected surfaces: `aiPipeline.js`, `aiScoring.js`, `filterEngine.js`, `direct1x2Engine.js`, `marketIntelligence.js`, and `accaBuilder.js`.
- `scout_edge_marriage_gate` remains BLOCKED.
- `supabase_storage_gate` remains BLOCKED.

---
## EPRV-001-C1 External Sports Provider Removal Inspection Contract Evidence

Result: PARTIAL â€” contract sealed; removal not implemented

Scope:
- Mini-project: EPRV-001-C1 â€” External Sports Provider Removal Inspection Contract
- Runtime provider code changed: NO
- Provider deletion performed: NO
- SQL executed: NO
- Supabase mutation/call performed: NO
- Migration created: NO
- Route wiring performed: NO
- E2E proof executed: NO
- Gate clearance performed: NO

Evidence:
- Contract sealed at `control-center/EPRV-001_EXTERNAL_PROVIDER_REMOVAL_INSPECTION_CONTRACT.v1.md`.
- Focused proof added at `tests/eprv-provider-removal-contract.test.js`.
- Provider/acquisition surfaces recorded across dataProvider, dataProviders, context ingestion/enrichment, football highlights, odds pipeline, heartbeat, hybrid sports data, RapidAPI waterfall, API clients, AI pipeline, and snapshot import surfaces.
- EPRV-001 remains PARTIAL.
- `scout_edge_marriage_gate` remains BLOCKED.
- `supabase_storage_gate` remains BLOCKED.
---

## ESEC-001-I1 source remediation closure - 2026-07-15

**Decision:** PASS - SOURCE AND TEST CLOSURE

- AUTH-001, SUB-001, KEY-001, CRON-001, ROUTE-001 and DB-001 are source-closed and tested.
- CRED-001 source separation is implemented: public direct-insight reads are anon-only and privileged pipeline writes are service-role-only.
- Production credential configuration, rotation and revocation proof were not executed.
- RLS-001 remains OPEN and separately excluded.
- ESEC-001 remains PARTIAL.
- E2E-001 remains BLOCKED.
- `scout_edge_marriage_gate`, `unified_lifecycle_governor` and `supabase_storage_gate` remain BLOCKED.
- ESEC-001-C1 is preserved as read-only historical inspection evidence.
- No deployment, E2E execution, Supabase function deployment, Scout activation, RLS migration, production credential change or `control:assets` execution occurred.
- Broad `test:control-center` historical result: **HOLD** - 319/331 tests passed. Packet 4C subsequently registered the three ESEC-I1 governance assets. Remaining repository-wide cleanup and asset-register drift stays outside ESEC scope. The broad suite was not rerun.

---

## ESEC-001-I1 Packet 4C targeted asset registration - 2026-07-15

**Decision:** PASS - TARGETED REGISTRATION

- Registered the I1 implementation contract in B01.
- Registered the I1 structured report in B29.
- Registered the I1 governance test in B24.
- Active ESEC-I1 focused proof: 33/33 PASS.
- Historical C1 proof remains read-only.
- Asset-register counts were reconciled to current Git discovery.
- No unrelated historical asset records or enum defects were repaired.
- `control:assets` was not executed.
- The broad Control Center suite was not rerun.
- ESEC-001 remains PARTIAL.
- RLS-001 and runtime/deployment proof remain open.
- Every runtime and marriage gate remains BLOCKED.
