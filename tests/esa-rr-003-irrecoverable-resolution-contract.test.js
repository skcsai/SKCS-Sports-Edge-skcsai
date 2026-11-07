"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const CONTRACT = path.join(ROOT, "control-center", "ESA-RR-003_IRRECOVERABLE_PRESERVED_CANDIDATE_RESOLUTION_CONTRACT.v1.md");
const LEDGER = path.join(ROOT, "control-center", "EDGE_BUILD_CONTROL_LEDGER.v1.json");
const REGISTER = path.join(ROOT, "control-center", "EDGE_MASTER_PROJECT_REGISTER.v1.json");
const ASSETS = path.join(ROOT, "control-center", "EDGE_REPOSITORY_ASSET_REGISTER.v1.json");
const PACKAGE = path.join(ROOT, "package.json");
const INCIDENT_PATHS = Object.freeze([
  "scratch/inspect_edge_external_sources.js",
  "scripts/inspect_secondary.js",
  "scripts/seed_acca_test_data.js",
  "scripts/seed_final.js",
  "supabase/migrations/20260616_scout_signal_mirror.sql",
  "supabase/migrations/20260617000000_setup_accas.sql",
  "temp_migrate.js",
  "try_regions.js",
]);
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function contractText() { return fs.readFileSync(CONTRACT, "utf8"); }

test("ESA-RR-003 contract exists and is contract-only", () => {
  const text = contractText();
  assert.equal(text.includes("ESA-RR-003 STATUS: IN_PROGRESS — CONTRACT-ONLY"), true);
  assert.equal(text.includes("does **not** implement runtime repair"), true);
  assert.equal(text.includes("No runtime application code changes"), true);
});

test("ESA-RR-003 incident set is exactly the eight governed paths", () => {
  const text = contractText();
  assert.equal(INCIDENT_PATHS.length, 8);
  for (const assetPath of INCIDENT_PATHS) assert.equal(text.includes("`" + assetPath + "`"), true, assetPath);
  assert.equal(text.includes("Any ninth path requires a separate governed decision"), true);
});

test("ESA-RR-003 preserves source-presence law and adds only a separate resolution", () => {
  const text = contractText();
  assert.equal(text.includes("does **not** create a fourth source-presence state"), true);
  assert.equal(text.includes("`ABSENT_PRESERVED_CANDIDATE`"), true);
  assert.equal(text.includes("`IRRECOVERABLE_EVIDENCE_ONLY`"), true);
});

test("ESA-RR-003 forbids invented source and relationship facts", () => {
  const text = contractText();
  for (const phrase of [
    "No source file may be recreated from memory",
    "must not populate or synthesize",
    "`source_content_sha256`",
    "`relationship_evidence`",
    "`relationship_evidence_provenance`",
    "imports or importers",
    "database/Supabase read or write roles",
    "prediction roles",
  ]) assert.equal(text.includes(phrase), true, phrase);
});

test("ESA-RR-003 records RCP-1 and RCP-2 exhaustion", () => {
  const text = contractText();
  for (const phrase of [
    "RCP-1 is recorded **EXHAUSTED**",
    "161 SKCS/local project roots",
    "Google Drive exact-filename searches: zero hits",
    "GitHub full repository path history: zero commits",
    "RCP-2 is recorded **EXHAUSTED**",
    "13 committed revisions",
    "f6ac94957a9ea6bce72b2a08530bb622070ada57",
    "3bc0b267cb95fb64cbdb6f40c2de2f0e70a8574f",
  ]) assert.equal(text.includes(phrase), true, phrase);
});

test("asset register preserves all eight historical discovery candidates", () => {
  const register = readJson(ASSETS);
  const candidates = register.workspace_candidate_snapshot?.candidates || [];
  for (const assetPath of INCIDENT_PATHS) {
    const candidate = candidates.find((entry) => entry.asset_path === assetPath);
    assert.ok(candidate, assetPath);
    assert.equal(candidate.source_state, "PRE_EXISTING_UNTRACKED");
    assert.equal(candidate.candidate_disposition, "PRESERVED_CANDIDATE");
    assert.equal(candidate.governed_by_control_task_id, "EPR-001");
  }
});

test("ESA-RR-003 future implementation boundary is checker tests and generated outputs only", () => {
  const text = contractText();
  for (const file of [
    "control-center/check_edge_system_runtime_inventory.js",
    "tests/edge-system-runtime-inventory.test.js",
    "control-center/EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json",
    "control-center/EDGE_SYSTEM_RUNTIME_MAP.md",
  ]) assert.equal(text.includes("`" + file + "`"), true, file);
  assert.equal(text.includes("must not create T17"), true);
});

test("ESA-RR-003 is registered IN_PROGRESS and gates remain blocked", () => {
  const ledger = readJson(LEDGER);
  const task = ledger.tasks.find((entry) => entry.task_id === "ESA-RR-003");
  assert.ok(task);
  assert.equal(task.status, "IN_PROGRESS");
  assert.equal(task.startable, true);
  assert.deepEqual(task.blocked_by, ["ESA-RR-002", "EAC-001"]);
  assert.equal(ledger.scout_edge_marriage_gate?.status || "BLOCKED", "BLOCKED");
  assert.notEqual(ledger.supabase_storage_gate?.status, "CLEARED");
});

test("project register mirrors ESA-RR-003 and control suite includes proof", () => {
  const register = readJson(REGISTER);
  const project = register.projects.find((entry) => entry.project_id === "ESA-RR-003");
  assert.ok(project);
  assert.equal(project.current_status, "IN_PROGRESS");
  assert.equal(project.governed_by_control_task_id, "ESA-RR-003");
  const pkg = readJson(PACKAGE);
  assert.equal(pkg.scripts["test:control-center"].includes("tests/esa-rr-003-irrecoverable-resolution-contract.test.js"), true);
});