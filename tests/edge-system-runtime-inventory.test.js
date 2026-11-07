"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const {
  ESA_RR_003_IRRECOVERABLE_PATHS,
  ESA_RR_003_RESOLUTION,
  buildIrrecoverableEvidenceOnlyTombstone,
  validateIrrecoverableEvidenceOnlyTombstone,
  discoverMaterialSurfaces,
  renderRuntimeMap,
  validateInventory,
  computeRelationshipEvidenceFingerprintFromInventorySurface,
  computeRelationshipEvidenceFingerprintFromExtractedFields,
  computeSourcePresenceStateForPath,
  readRelationshipEvidenceFieldsFromSource,
  detectDatabaseRole,
  detectDeploymentSurface,
  extractScheduleOrTrigger,
  isScoutFipSurface,
  extractDatabaseObjects,
  detectGovernanceReachability,
  compareRelationshipEvidence,
} = require("../control-center/check_edge_system_runtime_inventory");

const ROOT = path.resolve(__dirname, "..");

const ledger = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "control-center", "EDGE_BUILD_CONTROL_LEDGER.v1.json"),
    "utf8"
  )
);

const assetRegister = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "control-center",
      "EDGE_REPOSITORY_ASSET_REGISTER.v1.json"
    ),
    "utf8"
  )
);

const storedCanonicalInventory = JSON.parse(
  fs.readFileSync(
    path.join(
      ROOT,
      "control-center",
      "EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json"
    ),
    "utf8"
  )
);

function withExpectedIrrecoverableTombstones(inventory) {
  const next = JSON.parse(JSON.stringify(inventory));
  const trackedSet = new Set(
    execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/u)
      .map((p) => p.replace(/\\/gu, "/").replace(/^\.\/+/u, ""))
      .filter(Boolean)
  );
  const preservedCandidateSet = new Set(
    (assetRegister.workspace_candidate_snapshot?.candidates || [])
      .filter((candidate) => candidate.candidate_disposition === "PRESERVED_CANDIDATE")
      .map((candidate) =>
        String(candidate.asset_path || "").replace(/\\/gu, "/").replace(/^\.\/+/u, "")
      )
      .filter(Boolean)
  );
  const byPath = new Map(next.surfaces.map((surface) => [surface.asset_path, surface]));
  for (const assetPath of ESA_RR_003_IRRECOVERABLE_PATHS) {
    if (byPath.has(assetPath)) continue;
    const tombstone = buildIrrecoverableEvidenceOnlyTombstone({
      assetRegister,
      assetPath,
      trackedSet,
      preservedCandidateSet,
    });
    assert.ok(tombstone, `Expected ESA-RR-004 tombstone fixture for ${assetPath}`);
    byPath.set(assetPath, tombstone);
  }
  next.surfaces = [...byPath.values()].sort((a, b) =>
    a.asset_path.localeCompare(b.asset_path)
  );
  return next;
}

const canonicalInventory = withExpectedIrrecoverableTombstones(
  storedCanonicalInventory
);
const canonicalMap = renderRuntimeMap(canonicalInventory);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validate(inventory, mapText = renderRuntimeMap(inventory)) {
  return validateInventory({
    ledger,
    assetRegister,
    inventory,
    mapText,
  });
}

test("canonical ESA-001 runtime inventory passes integrity validation", () => {
  const result = validateInventory({
    ledger,
    assetRegister,
    inventory: canonicalInventory,
    mapText: canonicalMap,
  });

  assert.deepEqual(result.errors, []);
});

test("all statically discovered material runtime surfaces are governed", () => {
  const discovered = discoverMaterialSurfaces(assetRegister);
  const governedPaths = new Set(
    canonicalInventory.surfaces.map((surface) => surface.asset_path)
  );

  const missing = discovered
    .map((surface) => surface.asset_path)
    .filter((assetPath) => !governedPaths.has(assetPath));

  assert.deepEqual(missing, []);
});

test("silently removing a material runtime surface fails closed", () => {
  const discovered = discoverMaterialSurfaces(assetRegister);
  assert.ok(discovered.length > 0);

  const inventory = clone(canonicalInventory);
  inventory.surfaces = inventory.surfaces.filter(
    (surface) => surface.asset_path !== discovered[0].asset_path
  );

  const result = validate(inventory);

  assert.ok(
    result.errors.some((error) =>
      error.startsWith("MATERIAL_RUNTIME_SURFACE_UNGOVERNED:")
    )
  );
});

test("unknown Control Center task binding fails closed", () => {
  const inventory = clone(canonicalInventory);
  assert.ok(inventory.surfaces.length > 0);

  inventory.surfaces[0].governed_by_control_task_id =
    "UNKNOWN-FAKE-TASK";

  const result = validate(inventory);

  assert.ok(
    result.errors.some((error) =>
      error.startsWith("RUNTIME_CONTROL_TASK_UNKNOWN:")
    )
  );
});

test("UNKNOWN runtime relationship requires next_validation", () => {
  const inventory = clone(canonicalInventory);
  assert.ok(inventory.surfaces.length > 0);

  inventory.surfaces[0].reachability_state = "UNKNOWN";
  inventory.surfaces[0].next_validation = "";

  const result = validate(inventory);

  assert.ok(
    result.errors.some((error) =>
      error.startsWith("RUNTIME_NEXT_VALIDATION_MISSING:")
    )
  );
});

test("UNRESOLVED runtime relationship requires next_validation", () => {
  const inventory = clone(canonicalInventory);
  assert.ok(inventory.surfaces.length > 0);

  inventory.surfaces[0].reachability_state = "UNRESOLVED";
  inventory.surfaces[0].next_validation = "";

  const result = validate(inventory);

  assert.ok(
    result.errors.some((error) =>
      error.startsWith("RUNTIME_NEXT_VALIDATION_MISSING:")
    )
  );
});

test("candidate status cannot establish current authority", () => {
  const inventory = clone(canonicalInventory);

  inventory.semantics.candidate_status_establishes_current_authority =
    true;

  const result = validate(inventory);

  assert.ok(
    result.errors.includes("CANDIDATE_STATUS_ESTABLISHES_AUTHORITY")
  );
});

test("runtime inventory cannot declare future architecture", () => {
  const inventory = clone(canonicalInventory);

  inventory.semantics.inventory_declares_future_architecture = true;

  const result = validate(inventory);

  assert.ok(
    result.errors.includes("INVENTORY_DECLARES_FUTURE_ARCHITECTURE")
  );
});

test("inventory relationships cannot establish authority precedence", () => {
  const inventory = clone(canonicalInventory);

  inventory.semantics.relationships_establish_authority_precedence = true;

  const result = validate(inventory);

  assert.ok(
    result.errors.includes(
      "INVENTORY_RELATIONSHIP_ESTABLISHES_AUTHORITY_PRECEDENCE"
    )
  );
});

test("secret value fields are forbidden from runtime inventory", () => {
  const inventory = clone(canonicalInventory);
  assert.ok(inventory.surfaces.length > 0);

  inventory.surfaces[0].api_keys = ["DO_NOT_STORE_SECRET_VALUES"];

  const result = validate(inventory);

  assert.ok(
    result.errors.some((error) =>
      error.startsWith("SECRET_VALUE_FIELD_FORBIDDEN:")
    )
  );
});

test("human-readable runtime map must remain synchronized", () => {
  const result = validateInventory({
    ledger,
    assetRegister,
    inventory: canonicalInventory,
    mapText: `${canonicalMap}\nmanual drift\n`,
  });

  assert.ok(result.errors.includes("RUNTIME_MAP_OUT_OF_SYNC"));
});

test("canonical map exactly matches deterministic inventory rendering", () => {
  assert.equal(canonicalMap, renderRuntimeMap(canonicalInventory));
});

test("Scout/FIP visibility does not activate marriage semantics", () => {
  assert.equal(
    canonicalInventory.semantics.scout_fip_visibility_activates_marriage,
    false
  );
});

test("provider reachability does not establish retention", () => {
  assert.equal(
    canonicalInventory.semantics.provider_reachability_establishes_retention,
    false
  );
});

test("database visibility does not establish retention", () => {
  assert.equal(
    canonicalInventory.semantics.database_visibility_establishes_retention,
    false
  );
});

test("runtime inventory covers required material surface classes", () => {
  const classes = new Set(
    canonicalInventory.surfaces.flatMap((surface) => surface.surface_classes)
  );

  for (const requiredClass of [
    "RUNTIME_ENTRY_POINT",
    "ROUTE",
    "CONTROLLER",
    "SERVICE",
    "EXTERNAL_PROVIDER",
    "SCOUT_FIP_SURFACE",
    "DATABASE_SURFACE",
    "SCHEDULED_EXECUTION",
    "DEPLOYMENT_SURFACE",
    "GOVERNANCE_ENFORCEMENT",
  ]) {
    assert.ok(
      classes.has(requiredClass),
      `Missing required material surface class: ${requiredClass}`
    );
  }
});

test("Control Center and contract-test Scout/FIP vocabulary does not create runtime surfaces by itself", () => {
  assert.equal(
    isScoutFipSurface(
      "control-center/check_edge_system_runtime_inventory.js",
      'classes.add("SCOUT_FIP_SURFACE"); scout_fip_visibility_activates_marriage'
    ),
    false
  );

  assert.equal(
    isScoutFipSurface(
      "tests/edge-system-runtime-inventory.test.js",
      "Scout/FIP visibility does not activate marriage semantics"
    ),
    false
  );
});

test("actual Edge Scout/FIP evidence remains discoverable", () => {
  assert.equal(
    isScoutFipSurface(
      "backend/services/scoutSignalSync.js",
      "const url = process.env.SCOUT_DATABASE_URL;"
    ),
    true
  );

  assert.equal(
    isScoutFipSurface(
      "supabase/migrations/20260616_scout_signal_mirror.sql",
      "CREATE TABLE scout_raw_match_signals"
    ),
    true
  );

  assert.equal(
    isScoutFipSurface(
      "backend/services/fipIntakeService.js",
      "const { receiveValidatedFip } = require('./fipIntakeService');"
    ),
    true
  );

  assert.equal(
    isScoutFipSurface(
      "backend/services/exampleConsumer.js",
      "const intake = require('../services/fipIntakeService');\nintake.receiveValidatedFip(payload);"
    ),
    true
  );
});

test("crypto update is not classified as a database write", () => {
  const cryptoOnlySource = `
  const crypto = require('node:crypto');
  crypto.createHash('sha256').update('value').digest('hex');
`;
  assert.equal(
    detectDatabaseRole("backend/services/hashOnly.js", cryptoOnlySource),
    "NONE"
  );
});

test("Supabase update remains a database write", () => {
  const supabaseWriteSource = `
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(url, key);
  client.from('fixtures').update({ state: 'VISIBLE' });
`;
  assert.equal(
    detectDatabaseRole("backend/services/supabaseWrite.js", supabaseWriteSource),
    "WRITE"
  );
});

test("SQL UPDATE remains a database write", () => {
  const sqlWriteSource = `
  UPDATE fixture_lifecycle_current
  SET lifecycle_state = 'ARCHIVED';
`;
  assert.notEqual(
    detectDatabaseRole("sql/example.sql", sqlWriteSource),
    "NONE"
  );
});

test("pure Scout-related terminology does not create SCOUT_FIP_SURFACE", () => {
  const terminologyOnlySource = `
  const scoutEdgeMarriageGate = 'BLOCKED';
  function evaluateFixtureLifecycle() {}
`;
  assert.equal(
    isScoutFipSurface(
      "backend/services/lifecycleGovernor.js",
      terminologyOnlySource
    ),
    false
  );
});

test("real FIP intake import remains SCOUT_FIP_SURFACE", () => {
  const fipImportSource = `
  const { receiveValidatedFip } = require('../services/fipIntakeService');
  module.exports = { accept: receiveValidatedFip };
`;
  assert.equal(
    isScoutFipSurface("backend/services/exampleConsumer.js", fipImportSource),
    true
  );
});

test("Prose false positives: natural-language text does not create Edge/Scout objects, but .from('scout_raw_match_signals') still is detected", () => {
  const source = `
    update Edge after data arrives from Scout
    const { data } = await supabase.from("scout_raw_match_signals").select("*");
  `;

  const objects = extractDatabaseObjects(
    "backend/services/proseFalsePositive.js",
    source
  );

  assert.ok(!objects.includes("Edge"));
  assert.ok(!objects.includes("Scout"));
  assert.ok(objects.includes("scout_raw_match_signals"));
});

test("Raw SQL inside JS template literal detects qualified database objects", () => {
  const source =
    "const sql = `SELECT * FROM public.predictions_raw " +
    "JOIN public.teams t ON t.id = pr.team_id " +
    "INSERT INTO public.prediction_publish_runs (prediction_id) " +
    "VALUES (123);`; " +
    'await supabase.rpc("noop", {});';

  const objects = extractDatabaseObjects(
    "backend/services/sqlTemplateLiteral.js",
    source
  );

  assert.ok(objects.includes("public.predictions_raw"));
  assert.ok(objects.includes("public.teams"));
  assert.ok(objects.includes("public.prediction_publish_runs"));
});

test("SQL comments do not create fake objects, but CREATE TABLE detects real table", () => {
  const source = `
    -- FROM public.fake_from_comment
    /* JOIN public.fake_join_block */
    CREATE TABLE public.real_table (
      id uuid PRIMARY KEY
    );
  `;

  const objects = extractDatabaseObjects("scratch/test.sql", source);

  assert.ok(objects.includes("public.real_table"));
  assert.ok(!objects.includes("public.fake_from_comment"));
  assert.ok(!objects.includes("public.fake_join_block"));
});

test("RPC classification returns RPC for rpc-only Supabase usage", () => {
  const role = detectDatabaseRole(
    "backend/services/rpcOnly.js",
    'await supabase.rpc("refresh_predictions", {});'
  );

  assert.equal(role, "RPC");
});

test("scheduled execution discovery preserves static trigger evidence", () => {
  assert.equal(
    extractScheduleOrTrigger(
      "backend/services/cronJobs.js",
      'cron.schedule("0 * * * *", runJob);'
    ),
    "cron:0 * * * *"
  );

  assert.equal(
    extractScheduleOrTrigger(
      "backend/routes/scheduler.js",
      "setImmediate(() => runPipeline());"
    ),
    "scheduler-path; setImmediate"
  );
});

test("deployment surfaces receive evidence-backed current-state roles", () => {
  assert.equal(detectDeploymentSurface("render.yaml"), "RENDER_CONFIGURATION");
  assert.equal(detectDeploymentSurface("vercel.json"), "VERCEL_CONFIGURATION");
  assert.equal(
    detectDeploymentSurface("package.json"),
    "PACKAGE_RUNTIME_SCRIPTS"
  );
  assert.equal(detectDeploymentSurface("Dockerfile"), "CONTAINER_BUILD");
  assert.equal(
    detectDeploymentSurface("dolphin-server/Dockerfile"),
    "CONTAINER_BUILD"
  );
});

test("Governance reachability classification uses executable/test/audit/build/sql evidence precedence", () => {
  const sql = fs.readFileSync(
    path.join(ROOT, "sql", "master_rulebook_triggers.sql"),
    "utf8"
  );
  assert.equal(
    detectGovernanceReachability("sql/master_rulebook_triggers.sql", sql),
    "DATABASE"
  );

  const audit = fs.readFileSync(
    path.join(ROOT, "scripts", "audit-football-rules-alignment.js"),
    "utf8"
  );
  assert.equal(
    detectGovernanceReachability(
      "scripts/audit-football-rules-alignment.js",
      audit
    ),
    "AUDIT_TOOL"
  );

  const verify = fs.readFileSync(
    path.join(ROOT, "scripts", "verify-master-rulebook-alignment.js"),
    "utf8"
  );
  assert.equal(
    detectGovernanceReachability(
      "scripts/verify-master-rulebook-alignment.js",
      verify
    ),
    "BUILD_GATE"
  );

  const scenarios = fs.readFileSync(
    path.join(ROOT, "test_scenarios_master_rulebook.js"),
    "utf8"
  );
  assert.equal(
    detectGovernanceReachability(
      "test_scenarios_master_rulebook.js",
      scenarios
    ),
    "TEST_PROOF"
  );

  // Synthetic runtime enforcement evidence: this must not become DOCUMENT_ONLY.
  const runtimeEvidence = `
    if (request.state === "forbidden") {
      throw new Error("blocked publish");
    }
    return { ok: true };
  `;
  assert.equal(
    detectGovernanceReachability("backend/runtimeRuleEnforcer.js", runtimeEvidence),
    "RUNTIME"
  );

  // Documentary-only markdown must remain DOCUMENT_ONLY.
  const docEvidence = `# Rulebook\nThis is documentation only.`;
  assert.equal(
    detectGovernanceReachability("docs/governance_spec.md", docEvidence),
    "DOCUMENT_ONLY"
  );
});

test("Ambiguous governance candidate remains UNKNOWN (not generic DOCUMENT_ONLY)", () => {
  const ambiguousSource = `
    This script mentions governance and rules, but it does not execute,
    does not throw, and does not declare database triggers/policies.
  `;

  assert.equal(
    detectGovernanceReachability("scripts/ambiguousGovernance.js", ambiguousSource),
    "UNKNOWN"
  );
});

test("Relationship evidence parity: matching evidence passes despite database_objects ordering", () => {
  const discovered = {
    asset_path: "backend/example.js",
    database_role: "RPC",
    database_objects: ["public.predictions", "public.accas"],
    schedule_or_trigger: "cron.schedule: */15 * * * *",
    deployment_surface: "RENDER_CONFIGURATION",
    governance_reachability: "RUNTIME",
  };

  const inventoried = {
    asset_path: "backend/example.js",
    database_role: "RPC",
    database_objects: ["public.accas", "public.predictions"],
    schedule_or_trigger: "cron.schedule: */15 * * * *",
    deployment_surface: "RENDER_CONFIGURATION",
    governance_reachability: "RUNTIME",
  };

  assert.deepEqual(compareRelationshipEvidence(discovered, inventoried), []);
});

test("Relationship evidence parity: drift in any supported field fails closed with exactly one finding", () => {
  const base = {
    asset_path: "backend/example.js",
    database_role: "RPC",
    database_objects: ["public.predictions", "public.accas"],
    schedule_or_trigger: "cron.schedule: */15 * * * *",
    deployment_surface: "RENDER_CONFIGURATION",
    governance_reachability: "RUNTIME",
  };

  const cases = [
    {
      field: "database_role",
      discovered: { ...base, database_role: "READ" },
    },
    {
      field: "database_objects",
      discovered: { ...base, database_objects: ["public.accas"] },
      expectedInventoried: { ...base, database_objects: ["public.predictions", "public.accas"] },
    },
    {
      field: "schedule_or_trigger",
      discovered: { ...base, schedule_or_trigger: null },
    },
    {
      field: "deployment_surface",
      discovered: { ...base, deployment_surface: "VERCEL_CONFIGURATION" },
    },
    {
      field: "governance_reachability",
      discovered: { ...base, governance_reachability: "DOCUMENT_ONLY" },
    },
  ];

  for (const c of cases) {
    const discovered = c.discovered;
    const inventoried = c.expectedInventoried || base;

    const findings = compareRelationshipEvidence(discovered, inventoried);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].field, c.field);
  }
});

test("Canonical checker emits RUNTIME_RELATIONSHIP_EVIDENCE_DRIFT when supported relationship evidence drifts for same asset_path", () => {
  const inventory = clone(canonicalInventory);
  const target = inventory.surfaces.find(
    (s) => s.asset_path === "sql/master_rulebook_triggers.sql"
  );
  assert.ok(target);

  // Introduce a supported relationship-evidence drift: governance reachability type.
  target.governance_reachability_type = "DOCUMENT_ONLY";

  const result = validate(inventory);
  const driftErrors = result.errors.filter((e) =>
    e.startsWith("RUNTIME_RELATIONSHIP_EVIDENCE_DRIFT:")
  );

  assert.equal(driftErrors.length, 1);
  assert.ok(driftErrors[0].includes("field=governance_reachability"));
});

// ESA-RR-002 Option A — Provenance-backed runtime inventory reproducibility contract tests.
const normalizePathForTest = (value) =>
  String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\.\/+/u, "");

const preservedCandidateAssetPathSet = new Set(
  (assetRegister.workspace_candidate_snapshot?.candidates || [])
    .filter((c) => c.candidate_disposition === "PRESERVED_CANDIDATE")
    .map((c) => normalizePathForTest(c.asset_path))
);

const trackedAssetPathSet = new Set(
  execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/u)
    .map((p) => normalizePathForTest(p))
    .filter(Boolean)
);

function absPathFromAssetPath(assetPath) {
  return path.join(ROOT, normalizePathForTest(assetPath));
}

function getFirstSurfaceWithPresenceState(targetPresenceState) {
  for (const surface of canonicalInventory.surfaces) {
    const presenceState = computeSourcePresenceStateForPath({
      assetRegister,
      relativePath: surface.asset_path,
      trackedSet: trackedAssetPathSet,
      preservedCandidateSet: preservedCandidateAssetPathSet,
    });
    if (presenceState === targetPresenceState) return surface;
  }
  throw new Error(`No canonical surface found with presence=${targetPresenceState}`);
}

function renameFileOutOfWay(absPath) {
  const tmp = `${absPath}.ESA-RR-TMP-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  fs.renameSync(absPath, tmp);
  return tmp;
}

test("ESA-RR-T01 (R1 OPTION A): canonical inventory includes required provenance object schema", () => {
  const surface = canonicalInventory.surfaces[0];
  assert.ok(surface.relationship_evidence_provenance);
  const prov = surface.relationship_evidence_provenance;
  assert.deepEqual(
    Object.keys(prov).sort(),
    [
      "captured_source_presence_state",
      "relationship_evidence_sha256",
      "source_content_sha256",
    ].sort()
  );
  assert.ok(isValidHex(prov.source_content_sha256));
  assert.ok(isValidHex(prov.relationship_evidence_sha256));
  assert.ok(
    ["PRESENT_TRACKED", "PRESENT_PRESERVED_CANDIDATE"].includes(
      prov.captured_source_presence_state
    )
  );
});

function isValidHex(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

test("ESA-RR-T02 (R2 EXACT-BYTE SOURCE IDENTITY): changing bytes causes SOURCE_CONTENT_SHA drift", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const absPath = absPathFromAssetPath(surface.asset_path);

  const originalBytes = fs.readFileSync(absPath);
  const modifiedBytes = Buffer.concat([
    originalBytes,
    Buffer.from("\nESA-RR-T02-append\n", "utf8"),
  ]);

  try {
    fs.writeFileSync(absPath, modifiedBytes);

    const result = validate(clone(canonicalInventory));
    const drift = result.errors.filter((e) =>
      e.includes("ESA_RR_002_SOURCE_CONTENT_SHA_DRIFT")
    );
    assert.ok(drift.length >= 1);
  } finally {
    fs.writeFileSync(absPath, originalBytes);
  }
});

test("ESA-RR-T03 (R3 SOURCE-PRESENCE STATES): present preserved-candidate becomes ABSENT preserved-candidate", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const absPath = absPathFromAssetPath(surface.asset_path);

  const originalState = computeSourcePresenceStateForPath({
    assetRegister,
    relativePath: surface.asset_path,
    trackedSet: trackedAssetPathSet,
    preservedCandidateSet: preservedCandidateAssetPathSet,
  });
  assert.equal(originalState, "PRESENT_PRESERVED_CANDIDATE");

  const tmpPath = renameFileOutOfWay(absPath);
  try {
    const absentState = computeSourcePresenceStateForPath({
      assetRegister,
      relativePath: surface.asset_path,
      trackedSet: trackedAssetPathSet,
      preservedCandidateSet: preservedCandidateAssetPathSet,
    });
    assert.equal(absentState, "ABSENT_PRESERVED_CANDIDATE");
  } finally {
    fs.renameSync(tmpPath, absPath);
  }
});

test("ESA-RR-T05 (R5 ABSENT EVIDENCE RETENTION): absent preserved candidate retains canonical validation", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const absPath = absPathFromAssetPath(surface.asset_path);

  const originalState = computeSourcePresenceStateForPath({
    assetRegister,
    relativePath: surface.asset_path,
    trackedSet: trackedAssetPathSet,
    preservedCandidateSet: preservedCandidateAssetPathSet,
  });
  assert.equal(originalState, "PRESENT_PRESERVED_CANDIDATE");

  const tmpPath = renameFileOutOfWay(absPath);
  try {
    const result = validate(clone(canonicalInventory));
    assert.equal(result.errors.length, 0, result.errors.join("; "));
  } finally {
    fs.renameSync(tmpPath, absPath);
  }
});

test("ESA-RR-T04 (R4 NO SYNTHETIC EMPTY SOURCE): absent validation passes even when evidence differs from what empty source would yield", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const absPath = absPathFromAssetPath(surface.asset_path);

  const tmpPath = renameFileOutOfWay(absPath);
  try {
    const inventory = clone(canonicalInventory);
    const s = inventory.surfaces.find((x) => x.asset_path === surface.asset_path);
    assert.ok(s);

    // Mutate the committed governed relationship evidence fields.
    s.database_role = "NONE";
    s.database_objects = [];
    s.schedule_or_trigger = "";
    s.deployment_surface = s.deployment_surface || "";

    // Update only the governed relationship fingerprint to keep absent-retained provenance bound.
    s.relationship_evidence_provenance.relationship_evidence_sha256 =
      computeRelationshipEvidenceFingerprintFromInventorySurface(s);

    const result = validate(inventory);
    assert.equal(result.errors.length, 0, result.errors.join("; "));
  } finally {
    fs.renameSync(tmpPath, absPath);
  }
});

test("ESA-RR-T06 (R6 PROVENANCE BINDING): absent preserved-candidate fails closed when provenance fingerprint no longer binds", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const absPath = absPathFromAssetPath(surface.asset_path);
  const tmpPath = renameFileOutOfWay(absPath);
  try {
    const inventory = clone(canonicalInventory);
    const s = inventory.surfaces.find((x) => x.asset_path === surface.asset_path);
    assert.ok(s);

    // Break the relationship-evidence binding while source is absent.
    const prov = s.relationship_evidence_provenance;
    assert.ok(prov && prov.relationship_evidence_sha256);
    prov.relationship_evidence_sha256 =
      prov.relationship_evidence_sha256.slice(0, -1) + (prov.relationship_evidence_sha256.slice(-1) === "a" ? "b" : "a");

    const result = validate(inventory);
    assert.ok(result.errors.some((e) => e.includes("ESA_RR_002_RELATIONSHIP_EVIDENCE_PROVENANCE_BINDING_FAIL")));
  } finally {
    fs.renameSync(tmpPath, absPath);
  }
});

test("ESA-RR-T07 (R7 FAIL-CLOSED INVALID PROVENANCE): absent preserved-candidate fails closed on schema invalid provenance", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const absPath = absPathFromAssetPath(surface.asset_path);
  const tmpPath = renameFileOutOfWay(absPath);
  try {
    const inventory = clone(canonicalInventory);
    const s = inventory.surfaces.find((x) => x.asset_path === surface.asset_path);
    assert.ok(s);

    s.relationship_evidence_provenance = {
      // Missing required keys intentionally.
      source_content_sha256: s.relationship_evidence_provenance.source_content_sha256,
    };

    const result = validate(inventory);
    assert.ok(
      result.errors.some((e) => e.includes("ESA_RR_002_PROVENANCE_SCHEMA_INVALID")),
      result.errors.join("; ")
    );
  } finally {
    fs.renameSync(tmpPath, absPath);
  }
});

test("ESA-RR-T08 (R8 RETURNING-SOURCE REREAD): absent then returning modified bytes triggers SOURCE_CONTENT_SHA drift", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const absPath = absPathFromAssetPath(surface.asset_path);

  const originalBytes = fs.readFileSync(absPath);
  const tmpPath = renameFileOutOfWay(absPath);
  let restored = false;
  try {
    const absentResult = validate(clone(canonicalInventory));
    assert.equal(absentResult.errors.length, 0, absentResult.errors.join("; "));

    const modifiedBytes = Buffer.concat([
      originalBytes,
      Buffer.from("\nESA-RR-T08-mod\n", "utf8"),
    ]);
    fs.renameSync(tmpPath, absPath);
    restored = true;
    fs.writeFileSync(absPath, modifiedBytes);

    const returningResult = validate(clone(canonicalInventory));
    assert.ok(
      returningResult.errors.some((e) =>
        e.includes("ESA_RR_002_SOURCE_CONTENT_SHA_DRIFT")
      ),
      returningResult.errors.join("; ")
    );
  } finally {
    // Restore original bytes and source.
    fs.writeFileSync(absPath, originalBytes);
    if (!restored) fs.renameSync(tmpPath, absPath);
  }
});

test("ESA-RR-T09 (R9 RETURNING-SOURCE RE-EXTRACTION): present-source semantic evidence mismatches after inventory evidence tampering", () => {
  const surface = getFirstSurfaceWithPresenceState("PRESENT_PRESERVED_CANDIDATE");
  const inventory = clone(canonicalInventory);
  const s = inventory.surfaces.find((x) => x.asset_path === surface.asset_path);
  assert.ok(s);

  // Tamper with governed semantic evidence fields.
  s.database_role = "NONE";
  s.database_objects = [];

  // Keep provenance fingerprint "internally" bound to the tampered inventory fields.
  // Validation must still re-extract from the real source and reject mismatches.
  s.relationship_evidence_provenance.relationship_evidence_sha256 =
    computeRelationshipEvidenceFingerprintFromInventorySurface(s);

  const result = validate(inventory);
  assert.ok(
    result.errors.some((e) => e.includes("ESA_RR_002_RELATIONSHIP_EVIDENCE_HASH_DRIFT")) ||
      result.errors.some((e) => e.includes("ESA_RR_002_RELATIONSHIP_SEMANTIC_DRIFT")),
    result.errors.join("; ")
  );
});

test("ESA-RR-T10 (R10 GOVERNED RELATIONSHIP FIELDS): non-governed inventory fields can change without failing provenance validation", () => {
  const inventory = clone(canonicalInventory);
  const s = inventory.surfaces[0];
  assert.ok(s);
  s.evidence = ["Non-governed note changed for T10 proof"];

  const result = validate(inventory);
  assert.equal(result.errors.length, 0, result.errors.join("; "));
});

test("ESA-RR-T11 (R11 CLEAN-CHECKOUT REPRODUCIBILITY): validation passes when all preserved-candidate sources are absent", () => {
  const preservedSurfaces = canonicalInventory.surfaces.filter((s) =>
    preservedCandidateAssetPathSet.has(normalizePathForTest(s.asset_path))
  );
  assert.ok(preservedSurfaces.length > 0);

  const absPaths = preservedSurfaces
    .map((s) => absPathFromAssetPath(s.asset_path))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).isFile());

  const renames = [];
  try {
    for (const p of absPaths) {
      renames.push({ from: p, to: renameFileOutOfWay(p) });
    }

    const result = validate(clone(canonicalInventory));
    assert.equal(result.errors.length, 0, result.errors.join("; "));
  } finally {
    for (const r of renames) {
      fs.renameSync(r.to, r.from);
    }
  }
});

test("ESA-RR-T12 (R12 RETURNING-SOURCE DRIFT): returning modified bytes after clean checkout fails closed", () => {
  const preservedSurfaces = canonicalInventory.surfaces.filter((s) =>
    preservedCandidateAssetPathSet.has(normalizePathForTest(s.asset_path))
  );
  assert.ok(preservedSurfaces.length > 0);

  const originalBytesByAbsPath = new Map();
  const absPaths = preservedSurfaces
    .map((s) => absPathFromAssetPath(s.asset_path))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).isFile());

  for (const p of absPaths) {
    originalBytesByAbsPath.set(p, fs.readFileSync(p));
  }

  const renames = [];
  try {
    // Clean-checkout simulation: all preserved-candidate sources are absent.
    for (const p of absPaths) {
      renames.push({ from: p, to: renameFileOutOfWay(p) });
    }

    const absentResult = validate(clone(canonicalInventory));
    assert.equal(absentResult.errors.length, 0, absentResult.errors.join("; "));

    // Returning-source drift: restore one file but change its bytes.
    const firstAbs = renames[0].from;
    const firstTmp = renames[0].to;
    const modifiedBytes = Buffer.concat([
      originalBytesByAbsPath.get(firstAbs),
      Buffer.from("\nESA-RR-T12-drift\n", "utf8"),
    ]);

    fs.renameSync(firstTmp, firstAbs);
    fs.writeFileSync(firstAbs, modifiedBytes);

    const returningResult = validate(clone(canonicalInventory));
    assert.ok(
      returningResult.errors.some((e) =>
        e.includes("ESA_RR_002_SOURCE_CONTENT_SHA_DRIFT")
      ),
      returningResult.errors.join("; ")
    );
  } finally {
    // Restore everything.
    for (const r of renames) {
      if (!fs.existsSync(r.from)) {
        fs.renameSync(r.to, r.from);
      }
      fs.writeFileSync(r.from, originalBytesByAbsPath.get(r.from));
    }
  }
});

test("ESA-RR-T13 (R13 MAP NEWLINE NORMALIZATION): CRLF map text still validates", () => {
  const mapTextCRLF = canonicalMap.replace(/\n/gu, "\r\n");

  const result = validateInventory({
    ledger,
    assetRegister,
    inventory: canonicalInventory,
    mapText: mapTextCRLF,
  });

  assert.equal(result.errors.length, 0, result.errors.join("; "));
});

test("ESA-RR-T14 (R14 BOOTSTRAP / VALIDATION SEPARATION): validateInventory does not mutate the provided inventory object", () => {
  const inventory = clone(canonicalInventory);
  const before = JSON.stringify(inventory);

  const result = validate(inventory);
  assert.equal(result.errors.length, 0, result.errors.join("; "));
  assert.equal(JSON.stringify(inventory), before);
});

test("ESA-RR-T15 (R6 PROVENANCE BINDING + R5 ABSENT EVIDENCE RETENTION): exact evidence-only tombstones are strict and fail closed outside the sealed set", () => {
  const exactPath = [...ESA_RR_003_IRRECOVERABLE_PATHS][0];
  const exactTombstone = canonicalInventory.surfaces.find(
    (entry) => entry.asset_path === exactPath && entry.resolution === ESA_RR_003_RESOLUTION
  );
  assert.ok(exactTombstone);
  assert.deepEqual(
    validateIrrecoverableEvidenceOnlyTombstone({
      assetRegister,
      surface: exactTombstone,
      trackedSet: trackedAssetPathSet,
      preservedCandidateSet: preservedCandidateAssetPathSet,
    }),
    []
  );

  const unauthorized = clone(exactTombstone);
  unauthorized.asset_path = "scripts/esa-rr-004-unapproved-ninth-path.js";
  const unauthorizedErrors = validateIrrecoverableEvidenceOnlyTombstone({
    assetRegister,
    surface: unauthorized,
    trackedSet: trackedAssetPathSet,
    preservedCandidateSet: preservedCandidateAssetPathSet,
  });
  assert.ok(
    unauthorizedErrors.some((error) =>
      error.startsWith("ESA_RR_004_TOMBSTONE_PATH_NOT_AUTHORIZED:")
    )
  );
});

test("ESA-RR-T16 (R11 CLEAN-CHECKOUT REPRODUCIBILITY + R14 BOOTSTRAP / VALIDATION SEPARATION): validation is read-only during clean checkout simulation", () => {
  const invPath = path.join(ROOT, "control-center", "EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json");
  const mapPath = path.join(ROOT, "control-center", "EDGE_SYSTEM_RUNTIME_MAP.md");
  const invBefore = fs.readFileSync(invPath, "utf8");
  const mapBefore = fs.readFileSync(mapPath, "utf8");

  const preservedSurfaces = canonicalInventory.surfaces.filter((s) =>
    preservedCandidateAssetPathSet.has(normalizePathForTest(s.asset_path))
  );

  const absPaths = preservedSurfaces
    .map((s) => absPathFromAssetPath(s.asset_path))
    .filter((p) => fs.existsSync(p) && fs.statSync(p).isFile());

  const renames = [];
  let validationErrors = [];
  try {
    for (const p of absPaths) {
      renames.push({ from: p, to: renameFileOutOfWay(p) });
    }

    const result = validate(clone(canonicalInventory));
    validationErrors = result.errors;
  } finally {
    for (const r of renames) {
      fs.renameSync(r.to, r.from);
    }
  }

  const storedTombstoneCount = storedCanonicalInventory.surfaces.filter(
    (surface) => surface.resolution === ESA_RR_003_RESOLUTION
  ).length;
  if (storedTombstoneCount === ESA_RR_003_IRRECOVERABLE_PATHS.size) {
    assert.equal(validationErrors.length, 0, validationErrors.join("; "));
  } else {
    assert.equal(
      validationErrors.some((error) => error.startsWith("ESA_RR_004_")),
      false,
      validationErrors.join("; ")
    );
  }

  const invAfter = fs.readFileSync(invPath, "utf8");
  const mapAfter = fs.readFileSync(mapPath, "utf8");
  assert.equal(invAfter, invBefore);
  assert.equal(mapAfter, mapBefore);

  const exactTombstones = canonicalInventory.surfaces.filter(
    (surface) => surface.resolution === ESA_RR_003_RESOLUTION
  );
  assert.equal(exactTombstones.length, 8);
  assert.deepEqual(
    exactTombstones.map((surface) => surface.asset_path).sort(),
    [...ESA_RR_003_IRRECOVERABLE_PATHS].sort()
  );
  const forbiddenTombstoneFields = [
    "source_content_sha256",
    "relationship_evidence",
    "relationship_evidence_provenance",
    "runtime_callers",
    "runtime_consumers",
    "runtime_dependencies",
    "database_role",
    "database_objects",
    "external_providers",
    "schedule_or_trigger",
    "deployment_surface",
    "surface_classes",
    "reachability_state",
  ];
  for (const tombstone of exactTombstones) {
    assert.deepEqual(
      forbiddenTombstoneFields.filter((field) =>
        Object.prototype.hasOwnProperty.call(tombstone, field)
      ),
      []
    );
  }

  const testSource = fs.readFileSync(__filename, "utf8");
  const forbiddenTestIdentity = ["ESA-RR-", "T17"].join("");
  assert.equal(testSource.includes(forbiddenTestIdentity), false);
});