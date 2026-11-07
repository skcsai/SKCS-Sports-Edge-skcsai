"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  ALLOWED_STATUSES,
  CONTROL_CENTER_PATH,
  CONTROL_CENTER_GATE_GROUP,
  CLEANUP_PHASE_ORDER,
  PHASE_QUESTIONS,
  PHASE_1_FORBIDDEN_WORK,
  EAC_BATCH_IDS,
  REQUIRED_LIFECYCLE_STATES,
  REQUIRED_EXECUTION_MODES,
  createControlCenterGateState,
  getNextIncompleteBatch,
  getEacBatchIds,
  LEDGER_PATH,
  MARRIAGE_PREREQUISITES,
  evaluateControlCenterProposal,
  loadControlCenterDocument,
  loadLedger,
  loadAssetRegister,
  getTotalGovernedAssets,
  validateLedger,
  validateControlCenterPolicy,
  getMarriageState,
  runCheck,
} = require(
  "../control-center/check_control_center.js"
);

function buildPhaseWorkProposal(overrides = {}) {
  return {
    request_type: "PHASE_WORK",
    mode: "PHASE_WORK",
    phase: "PHASE_7",
    batch_id: "B27-B29",
    work_kind: "MERGE_CONSOLIDATION",
    requires_full_forensic_evidence: false,
    preserves_unrelated_changes: true,
    ...overrides,
  };
}

function buildCompleteBatchProposal(overrides = {}) {
  return {
    request_type: "COMPLETE_BATCH",
    mode: "COMPLETE_BATCH",
    batch_id: "B01",
    requires_full_forensic_lifecycle: false,
    preserves_unrelated_changes: true,
    ...overrides,
  };
}

function buildClosePhaseProposal(overrides = {}) {
  return {
    request_type: "CLOSE_PHASE",
    mode: "CLOSE_PHASE",
    phase: "PHASE_1",
    activate_phase: "PHASE_2",
    preserves_unrelated_changes: true,
    ...overrides,
  };
}

function buildFutureNoteProposal(overrides = {}) {
  return {
    request_type: "RECORD_FUTURE_PHASE_NOTE",
    mode: "RECORD_FUTURE_PHASE_NOTE",
    future_phase_note: {
      asset_paths: ["backend/server-express.js"],
      observed_issue: "Possible legacy overlap noticed during Phase 1",
      likely_future_phase: "PHASE_5",
    },
    ...overrides,
  };
}

function buildControlProposal(overrides = {}) {
  return {
    request_type: "CONTROL_CENTER_MAINTENANCE",
    mode: "CONTROL",
    owner_authorized: true,
    proven_control_center_defect: true,
    changed_files: [...CONTROL_CENTER_GATE_GROUP.asset_paths],
    product_asset_paths: [],
    ...overrides,
  };
}

describe("Edge Control Center Ledger v1", () => {
  it("loads valid Edge ledger JSON", () => {
    const ledger = loadLedger();

    assert.equal(ledger.version, "1.0");
    assert.equal(
      ledger.title,
      "SKCS Edge Build Control Ledger"
    );
    assert.ok(Array.isArray(ledger.tasks));
    assert.ok(ledger.tasks.length >= 14);
  });

  it("documents the active repository cleanup programme state", () => {
    const documentText = loadControlCenterDocument();
    const result = validateControlCenterPolicy(documentText);

    assert.equal(result.errors.length, 0);
    assert.equal(CONTROL_CENTER_PATH.endsWith("EDGE_CONTROL_CENTER.md"), true);
    assert.ok(result.state);
    assert.equal(result.state.governance_model, "REPOSITORY_CLEANUP_PROGRAMME");
    assert.deepEqual(result.state.required_modes, [...REQUIRED_EXECUTION_MODES]);
    assert.deepEqual(result.state.required_lifecycle, [...REQUIRED_LIFECYCLE_STATES]);
    assert.deepEqual(result.state.cleanup_phase_order, [...CLEANUP_PHASE_ORDER]);
    assert.equal(result.state.eac_evidence_reusable, true);
    assert.equal(
      result.state.eac_batch_manifest,
      "control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json"
    );
    assert.equal(result.state.phase_0.status, "PHASE_CLOSED");
    assert.equal(result.state.phase_1.status, "PHASE_CLOSED");
    assert.equal(result.state.phase_2.status, "PHASE_CLOSED");
    assert.equal(result.state.phase_5.status, "PHASE_CLOSED");
    assert.equal(result.state.phase_6.status, "PHASE_CLOSED");
    assert.equal(result.state.phase_7.status, "PHASE_CLOSED");
    assert.equal(result.state.active_phase, "PHASE_8");
    assert.equal(
      result.state.active_phase_question,
      "Is the cleaned repository internally consistent?"
    );
    assert.equal(result.state.lifecycle_state, "PHASE_CLOSED");
    assert.equal(result.state.cleanup_programme_status, "PROGRAMME_CLOSED");
    assert.equal(result.state.phase_8.status, "PHASE_CLOSED");
    assert.equal(result.state.phase_8.evidence.result, "PASS");
    assert.equal(result.state.phase_8.evidence.validation_evidence_commit, "685018ed");
    assert.equal(result.state.active_batch, null);
    assert.deepEqual(result.state.completed_batches, []);
    assert.deepEqual(result.state.remaining_batches, []);
    assert.equal(result.state.next_deterministic_batch, null);
    assert.deepEqual(result.state.phase_3_outcomes, [
      "ACTIVE",
      "INDIRECTLY_ACTIVE",
      "MANUAL_USE",
      "NO_CURRENT_USE_FOUND",
      "UNKNOWN",
    ]);
    assert.match(result.state.phase_3_no_deletion_law, /does not authorize deletion/i);
    assert.equal(result.state.standing_git_authority, true);
    assert.equal(result.state.dangerous_git_actions_approval_gated, true);
    assert.equal(
      result.state.historical_per_asset_forensic_lifecycle,
      "PRESERVED_AS_HISTORY_ONLY"
    );
    assert.equal(
      result.state.total_governed_assets,
      getTotalGovernedAssets(loadAssetRegister())
    );
    assert.ok(documentText.includes("### Historical Control Center evidence"));
    assert.ok(
      documentText.includes("## PHASE 8 FINAL REPOSITORY VALIDATION EVIDENCE")
    );
    assert.ok(documentText.includes("## PHASE 8 CLOSURE SUMMARY"));
    assert.ok(documentText.includes("Standing Git authority"));
    assert.ok(documentText.includes("git reset --hard"));
    assert.equal(
      documentText.includes("locked until every governed asset has reached CLOSED"),
      false
    );
  });

  it("recognizes reusable EAC-001 evidence and deterministic batches", () => {
    const state = createControlCenterGateState();
    assert.equal(state.eac_evidence_reusable, true);
    assert.deepEqual(getEacBatchIds(), [...EAC_BATCH_IDS]);
    assert.equal(getNextIncompleteBatch(state), null);
    assert.equal(state.next_deterministic_batch, null);
    assert.equal(EAC_BATCH_IDS.length, 29);
  });

  it("exposes exactly one active cleanup phase", () => {
    const state = createControlCenterGateState();
    assert.equal(state.active_phase, "PHASE_8");
    assert.equal(CLEANUP_PHASE_ORDER.filter((p) => p === state.active_phase).length, 1);
  });

  it("runCheck without a proposal defaults the gate to HOLD", () => {
    const result = runCheck({
      ledgerPath: LEDGER_PATH,
      controlCenterPath: CONTROL_CENTER_PATH,
    });

    assert.equal(result.passed, true);
    assert.deepEqual(result.policy.errors, []);
    assert.equal(result.gateDecision.gate, "HOLD");
    assert.equal(
      result.gateDecision.reason,
      "MISSING_INSTRUCTION_OR_STATE"
    );
  });

  it("no instruction or state defaults to HOLD", () => {
    const result = evaluateControlCenterProposal(null, null);

    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "MISSING_INSTRUCTION_OR_STATE");
  });

  it("Phase 7 merge consolidation work is GREEN", () => {
    const state = createControlCenterGateState({
      active_phase: "PHASE_7",
      active_phase_question: PHASE_QUESTIONS.PHASE_7,
      lifecycle_state: "BATCH_COMPLETE",
      completed_batches: [
        "B01-B03",
        "B04-B06",
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
      ],
      remaining_batches: ["B27-B29"],
      next_deterministic_batch: "B27-B29",
    });
    const result = evaluateControlCenterProposal(
      buildPhaseWorkProposal(),
      state
    );

    assert.equal(result.gate, "GREEN");
    assert.equal(result.mode, "PHASE_WORK");
    assert.equal(result.reason, "PHASE_WORK_ACCEPTED");
    assert.equal(result.nextState.lifecycle_state, "BATCH_ACTIVE");
    assert.equal(result.nextState.active_batch, "B27-B29");
  });

  it("B23-B26 grouped batch completion advances Phase 7 to B27-B29", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B23-B26",
      completed_batches: [
        "B01-B03",
        "B04-B06",
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
      ],
      remaining_batches: ["B23-B26", "B27-B29"],
      next_deterministic_batch: "B23-B26",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ batch_id: "B23-B26" }),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, [
      "B01-B03",
      "B04-B06",
      "B07-B10",
      "B11-B14",
      "B15-B18",
      "B19-B22",
      "B23-B26",
    ]);
    assert.deepEqual(result.nextState.remaining_batches, ["B27-B29"]);
    assert.equal(result.nextState.next_deterministic_batch, "B27-B29");
    assert.equal(result.nextState.lifecycle_state, "BATCH_COMPLETE");
  });

  it("B11-B14 grouped batch completion advances Phase 7 to B15-B18", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B11-B14",
      completed_batches: ["B01-B03", "B04-B06", "B07-B10"],
      remaining_batches: [
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
        "B27-B29",
      ],
      next_deterministic_batch: "B11-B14",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ batch_id: "B11-B14" }),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, [
      "B01-B03",
      "B04-B06",
      "B07-B10",
      "B11-B14",
    ]);
    assert.deepEqual(result.nextState.remaining_batches, [
      "B15-B18",
      "B19-B22",
      "B23-B26",
      "B27-B29",
    ]);
    assert.equal(result.nextState.next_deterministic_batch, "B15-B18");
    assert.equal(result.nextState.lifecycle_state, "BATCH_COMPLETE");
  });

  it("B01-B03 grouped batch completion advances Phase 7 to B04-B06", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B01-B03",
      completed_batches: [],
      remaining_batches: [
        "B01-B03",
        "B04-B06",
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
        "B27-B29",
      ],
      next_deterministic_batch: "B01-B03",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ batch_id: "B01-B03" }),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, ["B01-B03"]);
    assert.deepEqual(result.nextState.remaining_batches, [
      "B04-B06",
      "B07-B10",
      "B11-B14",
      "B15-B18",
      "B19-B22",
      "B23-B26",
      "B27-B29",
    ]);
    assert.equal(result.nextState.next_deterministic_batch, "B04-B06");
    assert.equal(result.nextState.lifecycle_state, "BATCH_COMPLETE");
  });

  it("B04-B06 grouped batch completion advances Phase 7 to B07-B10", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B04-B06",
      completed_batches: ["B01-B03"],
      remaining_batches: [
        "B04-B06",
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
        "B27-B29",
      ],
      next_deterministic_batch: "B04-B06",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ batch_id: "B04-B06" }),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, ["B01-B03", "B04-B06"]);
    assert.deepEqual(result.nextState.remaining_batches, [
      "B07-B10",
      "B11-B14",
      "B15-B18",
      "B19-B22",
      "B23-B26",
      "B27-B29",
    ]);
    assert.equal(result.nextState.next_deterministic_batch, "B07-B10");
    assert.equal(result.nextState.lifecycle_state, "BATCH_COMPLETE");
  });

  it("B07-B10 grouped batch completion advances Phase 7 to B11-B14", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B07-B10",
      completed_batches: ["B01-B03", "B04-B06"],
      remaining_batches: [
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
        "B27-B29",
      ],
      next_deterministic_batch: "B07-B10",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ batch_id: "B07-B10" }),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, [
      "B01-B03",
      "B04-B06",
      "B07-B10",
    ]);
    assert.deepEqual(result.nextState.remaining_batches, [
      "B11-B14",
      "B15-B18",
      "B19-B22",
      "B23-B26",
      "B27-B29",
    ]);
    assert.equal(result.nextState.next_deterministic_batch, "B11-B14");
    assert.equal(result.nextState.lifecycle_state, "BATCH_COMPLETE");
  });

  it("B01 batch completion advances Phase 7 to B02", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B01",
      completed_batches: [],
      remaining_batches: [...EAC_BATCH_IDS],
      next_deterministic_batch: "B01",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ batch_id: "B01" }),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, ["B01"]);
    assert.deepEqual(
      result.nextState.remaining_batches,
      EAC_BATCH_IDS.filter((batchId) => batchId !== "B01")
    );
    assert.equal(result.nextState.next_deterministic_batch, "B02");
    assert.equal(result.nextState.lifecycle_state, "BATCH_COMPLETE");
  });

  it("Phase 6 canonical authority selection work is GREEN with historical state", () => {
    const state = createControlCenterGateState({
      active_phase: "PHASE_6",
      active_phase_question: PHASE_QUESTIONS.PHASE_6,
      lifecycle_state: "BATCH_COMPLETE",
      completed_batches: ["B02-B03", "B04-B06"],
      remaining_batches: [
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
        "B27-B29",
      ],
      next_deterministic_batch: "B07-B10",
    });
    const result = evaluateControlCenterProposal(
      buildPhaseWorkProposal({
        phase: "PHASE_6",
        batch_id: "B07-B10",
        work_kind: "CANONICAL_AUTHORITY_SELECTION",
      }),
      state
    );

    assert.equal(result.gate, "GREEN");
    assert.equal(result.mode, "PHASE_WORK");
    assert.equal(result.reason, "PHASE_WORK_ACCEPTED");
    assert.equal(result.nextState.lifecycle_state, "BATCH_ACTIVE");
    assert.equal(result.nextState.active_batch, "B07-B10");
  });

  it("Phase 1 blocks purpose/legacy/overlap/repair as active work", () => {
    for (const work_kind of PHASE_1_FORBIDDEN_WORK) {
      const result = evaluateControlCenterProposal(
        buildPhaseWorkProposal({ phase: "PHASE_1", work_kind }),
        createControlCenterGateState({
          active_phase: "PHASE_1",
          active_phase_question: PHASE_QUESTIONS.PHASE_1,
        })
      );
      assert.equal(result.gate, "HOLD");
      assert.equal(result.reason, "PHASE_1_FORBIDDEN_WORK");
    }
  });

  it("Phase 1 rejects requiring full forensic evidence", () => {
    const result = evaluateControlCenterProposal(
      buildPhaseWorkProposal({ phase: "PHASE_1", requires_full_forensic_evidence: true }),
      createControlCenterGateState({
        active_phase: "PHASE_1",
        active_phase_question: PHASE_QUESTIONS.PHASE_1,
      })
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "PHASE_1_FULL_FORENSIC_EVIDENCE_NOT_REQUIRED");
  });

  it("wrong-phase work is fail-closed", () => {
    const result = evaluateControlCenterProposal(
      buildPhaseWorkProposal({ phase: "PHASE_5", work_kind: "OVERLAP_IDENTIFICATION" }),
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "CROSS_PHASE_DRIFT");
  });

  it("FUTURE_PHASE_NOTE records without changing active phase", () => {
    const state = createControlCenterGateState();
    const result = evaluateControlCenterProposal(
      buildFutureNoteProposal(),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "FUTURE_PHASE_NOTE_RECORDED");
    assert.equal(result.nextState.active_phase, "PHASE_8");
    assert.equal(result.nextState.lifecycle_state, state.lifecycle_state);
    assert.equal(result.nextState.future_phase_notes.length, 1);
    assert.equal(
      result.nextState.future_phase_notes[0].likely_future_phase,
      "PHASE_5"
    );
  });

  it("batch can complete without unique files entering old forensic lifecycle", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B01",
      completed_batches: [
        "B02-B03",
        "B04-B06",
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
      ],
      remaining_batches: ["B27-B29"],
      next_deterministic_batch: "B27-B29",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal(),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, [
      "B02-B03",
      "B04-B06",
      "B07-B10",
      "B11-B14",
      "B15-B18",
      "B19-B22",
      "B23-B26",
      "B01",
    ]);
    assert.equal(result.nextState.next_deterministic_batch, "B27-B29");
    assert.equal(result.nextState.lifecycle_state, "BATCH_COMPLETE");
  });

  it("B27-B29 grouped batch completion readies Phase 7 for closure", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B27-B29",
      completed_batches: [
        "B02-B03",
        "B04-B06",
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
      ],
      remaining_batches: ["B27-B29"],
      next_deterministic_batch: "B27-B29",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ batch_id: "B27-B29" }),
      state
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "BATCH_COMPLETED");
    assert.deepEqual(result.nextState.completed_batches, [
      "B02-B03",
      "B04-B06",
      "B07-B10",
      "B11-B14",
      "B15-B18",
      "B19-B22",
      "B23-B26",
      "B27-B29",
    ]);
    assert.deepEqual(result.nextState.remaining_batches, []);
    assert.equal(result.nextState.next_deterministic_batch, null);
    assert.equal(result.nextState.lifecycle_state, "PHASE_READY_TO_CLOSE");
  });

  it("batch completion requiring full forensic lifecycle is HOLD", () => {
    const state = createControlCenterGateState({
      lifecycle_state: "BATCH_ACTIVE",
      active_batch: "B01",
    });
    const result = evaluateControlCenterProposal(
      buildCompleteBatchProposal({ requires_full_forensic_lifecycle: true }),
      state
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(
      result.reason,
      "FULL_FORENSIC_LIFECYCLE_NOT_REQUIRED_FOR_BATCH"
    );
  });

  it("later phase cannot activate before active phase closes", () => {
    const state = createControlCenterGateState({
      active_phase: "PHASE_1",
      active_phase_question: PHASE_QUESTIONS.PHASE_1,
      lifecycle_state: "PHASE_ACTIVE",
      remaining_batches: [...EAC_BATCH_IDS],
    });
    const result = evaluateControlCenterProposal(
      buildClosePhaseProposal({ activate_phase: "PHASE_2" }),
      state
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "PHASE_NOT_READY_TO_CLOSE");
  });

  it("phase order is fail-closed when activating a skipped phase", () => {
    const state = createControlCenterGateState({
      active_phase: "PHASE_1",
      active_phase_question: PHASE_QUESTIONS.PHASE_1,
      lifecycle_state: "PHASE_READY_TO_CLOSE",
      remaining_batches: [],
      completed_batches: [...EAC_BATCH_IDS],
    });
    const result = evaluateControlCenterProposal(
      buildClosePhaseProposal({ activate_phase: "PHASE_4" }),
      state
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "PHASE_ORDER_VIOLATION");
  });

  it("closing ready Phase 6 activates Phase 7 in order", () => {
    const state = {
      ...createControlCenterGateState(),
      active_phase: "PHASE_6",
      active_phase_question: PHASE_QUESTIONS.PHASE_6,
      lifecycle_state: "PHASE_READY_TO_CLOSE",
      active_batch: null,
      completed_batches: [
        "B02-B03",
        "B04-B06",
        "B07-B10",
        "B11-B14",
        "B15-B18",
        "B19-B22",
        "B23-B26",
        "B27-B29",
      ],
      remaining_batches: [],
      next_deterministic_batch: null,
    };

    const result = evaluateControlCenterProposal(
      buildClosePhaseProposal({
        phase: "PHASE_6",
        activate_phase: "PHASE_7",
      }),
      state
    );

    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "PHASE_CLOSED_NEXT_ACTIVATED");
    assert.equal(result.nextState.active_phase, "PHASE_7");
    assert.equal(
      result.nextState.active_phase_question,
      PHASE_QUESTIONS.PHASE_7
    );
    assert.equal(result.nextState.lifecycle_state, "PHASE_ACTIVE");
    assert.deepEqual(result.nextState.completed_batches, []);
    assert.deepEqual(result.nextState.remaining_batches, [
      "B01-B03",
      "B04-B06",
      "B07-B10",
      "B11-B14",
      "B15-B18",
      "B19-B22",
      "B23-B26",
      "B27-B29",
    ]);
    assert.equal(result.nextState.next_deterministic_batch, "B01-B03");
  });

  it("closing ready Phase 7 activates Phase 8 without individual batch seeding", () => {
    const state = {
      ...createControlCenterGateState({
        active_phase: "PHASE_7",
        active_phase_question: PHASE_QUESTIONS.PHASE_7,
        lifecycle_state: "PHASE_READY_TO_CLOSE",
        completed_batches: [
          "B01-B03",
          "B04-B06",
          "B07-B10",
          "B11-B14",
          "B15-B18",
          "B19-B22",
          "B23-B26",
          "B27-B29",
        ],
        remaining_batches: [],
        next_deterministic_batch: null,
      }),
      phase_7: {
        status: "PHASE_READY_TO_CLOSE",
        question: PHASE_QUESTIONS.PHASE_7,
        evidence: {
          result: "PASS WITH NO_ACTION AND RUNTIME-PROOF HOLDS",
        },
      },
    };

    const result = evaluateControlCenterProposal(
      buildClosePhaseProposal({
        phase: "PHASE_7",
        activate_phase: "PHASE_8",
      }),
      state
    );

    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "PHASE_CLOSED_NEXT_ACTIVATED");
    assert.equal(result.nextState.active_phase, "PHASE_8");
    assert.equal(
      result.nextState.active_phase_question,
      PHASE_QUESTIONS.PHASE_8
    );
    assert.equal(result.nextState.lifecycle_state, "PHASE_ACTIVE");
    assert.deepEqual(result.nextState.completed_batches, []);
    assert.deepEqual(result.nextState.remaining_batches, []);
    assert.equal(result.nextState.next_deterministic_batch, null);
    assert.equal(result.nextState.phase_7.status, "PHASE_CLOSED");
  });

  it("closing ready Phase 8 closes the cleanup programme", () => {
    const state = {
      ...createControlCenterGateState({
        active_phase: "PHASE_8",
        active_phase_question: PHASE_QUESTIONS.PHASE_8,
        lifecycle_state: "PHASE_READY_TO_CLOSE",
        completed_batches: [],
        remaining_batches: [],
        next_deterministic_batch: null,
      }),
      phase_8: {
        status: "PHASE_READY_TO_CLOSE",
        question: PHASE_QUESTIONS.PHASE_8,
        evidence: {
          result: "PASS",
          validation_start_commit: "900650e4",
          lifecycle_before_validation: "PHASE_ACTIVE",
          review_order_model: "NO_BATCH_MODEL",
          control_verify: "PASS",
          validation_note:
            "Phase 8 final repository validation evidence is complete.",
        },
      },
    };

    const result = evaluateControlCenterProposal(
      buildClosePhaseProposal({
        phase: "PHASE_8",
        activate_phase: null,
      }),
      state
    );

    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "PROGRAMME_CLOSED");
    assert.equal(result.nextState.active_phase, "PHASE_8");
    assert.equal(result.nextState.lifecycle_state, "PHASE_CLOSED");
    assert.equal(result.nextState.cleanup_programme_status, "PROGRAMME_CLOSED");
    assert.equal(result.nextState.phase_8.status, "PHASE_CLOSED");
    assert.deepEqual(result.nextState.completed_batches, []);
    assert.deepEqual(result.nextState.remaining_batches, []);
    assert.equal(result.nextState.next_deterministic_batch, null);
  });

  it("closing ready Phase 1 activates Phase 2 in order", () => {
    const state = {
      ...createControlCenterGateState(),
      active_phase: "PHASE_1",
      active_phase_question: PHASE_QUESTIONS.PHASE_1,
      lifecycle_state: "PHASE_READY_TO_CLOSE",
      active_batch: null,
      remaining_batches: [],
      completed_batches: [...EAC_BATCH_IDS],
      next_deterministic_batch: null,
    };

    const result = evaluateControlCenterProposal(
      buildClosePhaseProposal(),
      state
    );

    assert.equal(result.gate, "GREEN");
    assert.equal(result.reason, "PHASE_CLOSED_NEXT_ACTIVATED");
    assert.equal(result.nextState.active_phase, "PHASE_2");
    assert.equal(
      result.nextState.active_phase_question,
      PHASE_QUESTIONS.PHASE_2
    );
    assert.equal(result.nextState.lifecycle_state, "PHASE_ACTIVE");
  });

  it("legacy per-asset forensic modes are retired", () => {
    const result = evaluateControlCenterProposal(
      {
        request_type: "INSPECT_GROUP",
        mode: "INSPECT",
        inspection_only: true,
      },
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "LEGACY_PER_ASSET_FORENSIC_LIFECYCLE_RETIRED");
  });

  it("broad repository inspection is HOLD", () => {
    const result = evaluateControlCenterProposal(
      {
        request_type: "BROAD_REPOSITORY_INSPECTION",
        mode: "PHASE_WORK",
      },
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "BROAD_REPOSITORY_WORK");
  });

  it("premature deletion is HOLD", () => {
    const result = evaluateControlCenterProposal(
      {
        request_type: "PREMATURE_DELETE",
        mode: "PHASE_WORK",
      },
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "PREMATURE_DELETE");
  });

  it("premature merge is HOLD", () => {
    const result = evaluateControlCenterProposal(
      {
        request_type: "PREMATURE_MERGE",
        mode: "PHASE_WORK",
      },
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "PREMATURE_MERGE");
  });

  it("feature work is HOLD", () => {
    const result = evaluateControlCenterProposal(
      {
        request_type: "FEATURE_WORK",
        mode: "PHASE_WORK",
      },
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "FEATURE_WORK");
  });

  it("CONTROL without owner authorization is HOLD", () => {
    const result = evaluateControlCenterProposal(
      buildControlProposal({ owner_authorized: false }),
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "OWNER_AUTHORIZATION_REQUIRED");
  });

  it("CONTROL without proven defect is HOLD", () => {
    const result = evaluateControlCenterProposal(
      buildControlProposal({ proven_control_center_defect: false }),
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "PROVEN_CONTROL_CENTER_DEFECT_REQUIRED");
  });

  it("CONTROL touching product files is HOLD", () => {
    const result = evaluateControlCenterProposal(
      buildControlProposal({
        changed_files: [
          ...CONTROL_CENTER_GATE_GROUP.asset_paths,
          "backend/server-express.js",
        ],
        product_asset_paths: ["backend/server-express.js"],
      }),
      createControlCenterGateState()
    );
    assert.equal(result.gate, "HOLD");
    assert.equal(result.reason, "CONTROL_SCOPE_MISMATCH");
  });

  it("proven owner-authorized Control Center defect is GREEN", () => {
    const result = evaluateControlCenterProposal(
      buildControlProposal(),
      createControlCenterGateState()
    );
    assert.equal(result.gate, "GREEN");
    assert.equal(result.mode, "CONTROL");
    assert.equal(result.reason, "CONTROL_CENTER_MAINTENANCE_ACCEPTED");
  });

  it("Control Center bootstrap is DONE", () => {
    const task = loadLedger().tasks.find(
      (item) => item.task_id === "ECC-001"
    );

    assert.ok(task);
    assert.equal(task.status, "DONE");
    assert.ok(task.current_evidence.length > 0);
  });

  it("Edge Master Project Register becomes TESTED", () => {
    const task = loadLedger().tasks.find(
      (item) => item.task_id === "EPR-001"
    );

    assert.ok(task);
    assert.equal(task.status, "TESTED");
    assert.deepEqual(task.blocked_by, ["ECC-001"]);
  });

  it("EPR-001 governed-unresolved ownership contract is updated", () => {
    const task = loadLedger().tasks.find(
      (item) => item.task_id === "EPR-001"
    );

    assert.ok(task);
    assert.equal(task.status, "TESTED");
    assert.equal(
      task.blocked_by[0],
      "ECC-001"
    );

    // Completion definition (semantic substrings; not dependent on unresolved counts)
    assert.match(
      task.completion_definition,
      /A complete Edge Master Project Register and Repository Asset Register foundation exist/
    );
    assert.match(
      task.completion_definition,
      /project register is synchronized with canonical Edge Control Center sequencing/
    );
    assert.match(
      task.completion_definition,
      /every tracked repository path is registered or explicitly excluded/
    );
    assert.match(
      task.completion_definition,
      /every registered tracked asset declares a valid governed_by_control_task_id/
    );
    assert.match(
      task.completion_definition,
      /unresolved final project ownership may remain as a governed cleanup finding/
    );
    assert.match(
      task.completion_definition,
      /non-empty next_validation/
    );
    assert.match(
      task.completion_definition,
      /no tracked path is unclassified/
    );
    assert.match(
      task.completion_definition,
      /candidate status does not establish CURRENT_AUTHORITY/
    );
    assert.match(
      task.completion_definition,
      /non-ignored pre-existing untracked workspace paths are discovered separately from the tracked repository universe/i
    );
    assert.match(
      task.completion_definition,
      /preserved as governed workspace candidate evidence or explicitly excluded with a reason/i
    );
    assert.match(
      task.completion_definition,
      /without requiring the underlying file to be committed/i
    );
    assert.match(
      task.completion_definition,
      /known first-party rule and governance authority candidates remain identifiable by review role/i
    );
    assert.match(
      task.completion_definition,
      /governed candidate relationship graph|explicitly justified as standalone review candidates/i
    );
    assert.match(
      task.completion_definition,
      /ignored dependency, environment, and cache paths are excluded from first-party authority candidate discovery/i
    );
    assert.match(
      task.completion_definition,
      /asset integrity does not fail merely because an asset is/i
    );

    // Proof requirements (must include all governed-unresolved semantics)
    assert.ok(Array.isArray(task.proof_required));
    const proofText = task.proof_required.join("\n");

    assert.match(
      proofText,
      /Edge Repository Asset Register exists and validates\./
    );
    assert.match(
      proofText,
      /Unclassified tracked path count is zero\./
    );
    assert.match(
      proofText,
      /UNRESOLVED final project ownership remains a non-fatal governed cleanup finding only when the asset has a valid Control Center task binding and non-empty next_validation\./
    );
    assert.match(
      proofText,
      /Invalid or unknown governed_by_control_task_id remains fail-closed\./
    );
    assert.match(
      proofText,
      /Non-ignored untracked workspace candidate discovery is performed separately from tracked-path counting\./
    );
    assert.match(
      proofText,
      /git-aware non-ignored path discovery such as git ls-files --others --exclude-standard/
    );
    assert.match(
      proofText,
      /Preserving a pre-existing untracked workspace candidate does not require committing the underlying artifact\./
    );
    assert.ok(
      proofText.includes(
        "node_modules, .venv, venv, **pycache**, and .pyc"
      )
    );
    assert.match(
      proofText,
      /Candidate-role assignment is a review classification and does not establish CURRENT_AUTHORITY\./
    );
    assert.match(
      proofText,
      /linked through governed related-asset relationships or an equivalent candidate relationship graph\./
    );
    assert.match(
      proofText,
      /no relationship edge must be explicitly marked as a standalone review candidate with a non-empty justification\./
    );
    assert.match(
      proofText,
      /Relationship edges identify review relationships only and do not assert authority precedence\./
    );
    assert.match(
      proofText,
      /candidate relationship graph integrity fails for missing candidate references|Tests prove candidate relationship graph integrity fails for missing candidate references/
    );
    assert.match(
      proofText,
      /Final authority classification remains subject to governed review\./
    );
    assert.match(
      proofText,
      /No runtime provider removal, Scout\/FIP intake, Supabase mutation, prediction-rule change, ACCA-rule change, migration execution, or deployment change occurs as part of EPR-001\./
    );
    assert.match(
      proofText,
      /Tests prove EPR-001 may close without inventing final ownership for bootstrap-registered legacy\/unknown assets\./
    );

    // Next action must preserve fail-closed semantics and set closure evidence for TESTED promotion.
    assert.match(
      task.next_action,
      /foundation closed and TESTED/i
    );
    assert.match(
      task.next_action,
      /Preserve the Edge Master Project Register/i
    );
    assert.match(
      task.next_action,
      /complete tracked repository asset coverage/i
    );
    assert.match(
      task.next_action,
      /governed pre-existing untracked workspace candidate snapshot/i
    );
    assert.match(
      task.next_action,
      /governed unresolved final project ownership findings/i
    );
    assert.match(
      task.next_action,
      /Do not start ESA-001/i
    );
  });

  it("ESA-001 is not auto-startable once TESTED", () => {
    const result = runCheck({
      ledgerPath: LEDGER_PATH,
    });

    assert.ok(!result.startable.some((t) => t.task_id === "EAC-001"));
    assert.ok(result.next);
    assert.equal(result.next.task_id, "EMG-001");
    assert.equal(result.next.status, "APPROVED");
    assert.equal(result.gated, null);
  });

  it("EPR-001 remains TESTED and is not startable once ESA-001 is TESTED", () => {
    const result = runCheck({
      ledgerPath: LEDGER_PATH,
    });

    assert.ok(!result.startable.some((t) => t.task_id === "ESA-001"));
    assert.ok(!result.startable.some((t) => t.task_id === "EPR-001"));
  });

  it("ESA-001 completion_definition preserves the inventory closure contract", () => {
    const task = loadLedger().tasks.find(
      (item) => item.task_id === "ESA-001"
    );

    assert.ok(task);
    assert.equal(task.status, "TESTED");

    const cd = task.completion_definition;

    // Coverage classes
    assert.match(cd, /complete material Edge system and runtime inventory foundation exists/i);
    assert.match(cd, /synchronized with the Edge Master Project Register/i);
    assert.match(cd, /runtime entry points|entry points/i);
    assert.match(cd, /mounted route surfaces/i);
    assert.match(cd, /runtime-reachable controller and service paths|controller and service paths/i);
    assert.match(cd, /external provider reachability/i);
    assert.match(cd, /Scout\/FIP-related Edge surfaces/i);
    assert.match(cd, /database and Supabase runtime read\/write surfaces/i);
    assert.match(cd, /scheduled and background execution surfaces/i);
    assert.match(cd, /deployment surfaces/i);

    // Governed unresolved / next_validation requirements
    assert.match(cd, /unresolved or unknown runtime relationships remain governed findings/i);
    assert.match(cd, /non-empty next_validation/i);
    assert.match(cd, /valid Control Center task binding/i);
    assert.match(cd, /inventory distinguishes confirmed, candidate, legacy, parallel, unreachable, unknown, and unresolved/i);

    // Rule/governance enforcement reachability inventory without declaring authority.
    assert.match(
      cd,
      /runtime\/database\/build-gate rule or governance enforcement surfaces/i
    );
    assert.match(
      cd,
      /without declaring canonical rule authority|authority precedence|rule-threshold changes/i
    );

    // Forbidden future architecture declarations
    assert.match(cd, /without declaring future Edge architecture/i);
    assert.match(cd, /provider-retirement decisions/i);
    assert.match(cd, /Scout\/FIP activation/i);
    assert.match(cd, /database-retention decisions/i);
    assert.match(cd, /canonical rule authority|authority precedence|rule-threshold changes/i);

    // Canonical artifacts and fail-closed integrity
    assert.match(cd, /canonical machine-readable Edge System Runtime Inventory/i);
    assert.match(cd, /synchronized human-readable runtime map/i);
    assert.match(cd, /integrity checker/i);
    assert.match(cd, /contract tests prove complete material coverage/i);
    assert.match(cd, /fail closed when required runtime surfaces silently disappear from governance/i);
  });

  it("Scout-Edge marriage gate is explicitly blocked", () => {
    const result = runCheck({
      ledgerPath: LEDGER_PATH,
    });

    assert.equal(
      result.ledger.scout_edge_marriage_gate,
      "BLOCKED"
    );
    assert.equal(result.marriage.allowed, false);
    assert.equal(
      result.marriage.reason,
      "scout_edge_marriage_gate_explicitly_blocked"
    );
  });

  it("all marriage prerequisite tasks exist", () => {
    const { tasks } = loadLedger();
    const ids = new Set(
      tasks.map((task) => task.task_id)
    );

    for (const taskId of MARRIAGE_PREREQUISITES) {
      assert.ok(
        ids.has(taskId),
        `missing marriage prerequisite ${taskId}`
      );
    }
  });

  it("marriage prerequisites are incomplete", () => {
    const ledger = loadLedger();
    const state = getMarriageState(
      ledger.tasks,
      ledger
    );

    assert.equal(
      state.prerequisitesComplete,
      false
    );
    assert.ok(state.incomplete.length > 0);
  });

  it("external provider removal is PARTIAL and waits for FIP intake", () => {
    const ledger = loadLedger();
    const task = ledger.tasks.find(
      (item) => item.task_id === "EPRV-001"
    );

    assert.ok(task);
    assert.equal(task.status, "PARTIAL");
    assert.ok(task.blocked_by.includes("EFI-001"));
    assert.equal(
      ledger.provider_removal_state,
      "PARTIAL"
    );
  });

  it("Supabase storage governance explicitly tracks the 0.5 GB constraint", () => {
    const ledger = loadLedger();
    const task = ledger.tasks.find(
      (item) => item.task_id === "EST-001"
    );

    assert.ok(task);
    assert.equal(task.status, "TESTED");
    assert.match(
      `${task.description} ${task.current_evidence.join(" ")}`,
      /0\.5 GB/i
    );

    assert.equal(
      ledger.supabase_storage_gate,
      "BLOCKED"
    );
  });

  it("Supabase is not designated as a Scout evidence mirror", () => {
    const ledger = loadLedger();

    assert.match(
      ledger.supabase_storage_policy,
      /must not become a permanent mirror of Scout raw evidence/i
    );
  });

  it("full Control Center check passes", () => {
    const result = runCheck({
      ledgerPath: LEDGER_PATH,
    });

    assert.equal(
      result.errors.length,
      0,
      result.errors.join("; ")
    );

    assert.equal(result.passed, true);
  });
});
