#!/usr/bin/env node

"use strict";

// ESA-001 static inventory checker
// Observational only: no runtime execution and no importing discovered files.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");

const LEDGER_PATH = path.join(
  ROOT,
  "control-center",
  "EDGE_BUILD_CONTROL_LEDGER.v1.json"
);
const ASSET_REGISTER_PATH = path.join(
  ROOT,
  "control-center",
  "EDGE_REPOSITORY_ASSET_REGISTER.v1.json"
);
const INVENTORY_PATH = path.join(
  ROOT,
  "control-center",
  "EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json"
);
const MAP_PATH = path.join(
  ROOT,
  "control-center",
  "EDGE_SYSTEM_RUNTIME_MAP.md"
);

const SURFACE_CLASSES = new Set([
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
]);

const REACHABILITY_STATES = new Set([
  "CONFIRMED",
  "CANDIDATE",
  "LEGACY",
  "PARALLEL",
  "UNREACHABLE",
  "UNKNOWN",
  "UNRESOLVED",
]);

const DATABASE_ROLES = new Set([
  "NONE",
  "READ",
  "WRITE",
  "READ_WRITE",
  "RPC",
  "CONNECTION_OR_CLIENT",
  "MIGRATION",
  "TRIGGER",
  "SCHEMA",
  "SEED",
  "MANUAL_TOOL",
  "UNKNOWN",
]);

const GOVERNANCE_REACHABILITY_TYPES = new Set([
  "NONE",
  "RUNTIME",
  "DATABASE",
  "BUILD_GATE",
  "AUDIT_TOOL",
  "TEST_PROOF",
  "DOCUMENT_ONLY",
  "UNKNOWN",
]);

const REQUIRED_ARRAY_FIELDS = [
  "runtime_callers",
  "runtime_consumers",
  "runtime_dependencies",
  "external_providers",
  "environment_key_names",
  "database_objects",
  "evidence",
];

const INVENTORY_SEMANTICS_DEFAULTS = {
  candidate_status_establishes_current_authority: false,
  relationships_establish_authority_precedence: false,
  inventory_declares_future_architecture: false,
  provider_reachability_establishes_retention: false,
  scout_fip_visibility_activates_marriage: false,
  database_visibility_establishes_retention: false,
};

// ESA-RR-002 Option A — provenance-backed runtime inventory reproducibility.
// Contract Phase B/G/H: runtime-derived three-state source presence.
const SOURCE_PRESENCE_STATES = new Set([
  "PRESENT_TRACKED",
  "PRESENT_PRESERVED_CANDIDATE",
  "ABSENT_PRESERVED_CANDIDATE",
]);

const ESA_RR_003_RESOLUTION = "IRRECOVERABLE_EVIDENCE_ONLY";
const ESA_RR_003_IRRECOVERABLE_PATHS = new Set([
  "scratch/inspect_edge_external_sources.js",
  "scripts/inspect_secondary.js",
  "scripts/seed_acca_test_data.js",
  "scripts/seed_final.js",
  "supabase/migrations/20260616_scout_signal_mirror.sql",
  "supabase/migrations/20260617000000_setup_accas.sql",
  "temp_migrate.js",
  "try_regions.js",
]);
const ESA_RR_003_TOMBSTONE_KEYS = new Set([
  "asset_path",
  "source_presence_state",
  "candidate_disposition",
  "resolution",
  "governed_by_control_task_id",
  "source_bytes_available",
  "relationship_provenance_available",
  "recovery_rcp1",
  "recovery_rcp2",
  "runtime_relationship_status",
  "resolution_contract",
]);

const RELATIONSHIP_EVIDENCE_PROVENANCE_FIELDS = [
  "source_content_sha256",
  "relationship_evidence_sha256",
  "captured_source_presence_state",
];

function isValidSha256Hex(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function sha256HexOfBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readSourceBytesIfPresent(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) return null;
  const st = fs.statSync(filePath);
  if (!st.isFile()) return null;
  // IMPORTANT: hash the exact current bytes (no UTF-8 re-encoding).
  return fs.readFileSync(filePath);
}

function readTrackedIndexBlobBytes(relativePath) {
  const assetPath = normalizePath(relativePath);
  try {
    const out = execFileSync("git", ["cat-file", "blob", `:${assetPath}`], {
      cwd: ROOT,
      encoding: null, // Buffer
      maxBuffer: 64 * 1024 * 1024,
    });
    return Buffer.isBuffer(out) ? out : null;
  } catch {
    return null;
  }
}

function computeSourcePresenceStateForPath({
  assetRegister,
  relativePath,
  trackedSet,
  preservedCandidateSet,
}) {
  const rel = normalizePath(relativePath);
  const isTracked = trackedSet.has(rel);
  const isPreservedCandidate = preservedCandidateSet.has(rel);
  const filePath = path.join(ROOT, rel);
  const sourcePresent = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

  // Contract Phase B: exactly one of the three approved states.
  // If a path is both tracked and preserved-candidate-governed, the preserved
  // candidate classification takes precedence (captured_source_presence_state
  // is still restricted to PRESENT_* only).
  if (isPreservedCandidate && sourcePresent)
    return "PRESENT_PRESERVED_CANDIDATE";
  if (isPreservedCandidate && !sourcePresent)
    return "ABSENT_PRESERVED_CANDIDATE";
  if (isTracked && sourcePresent) return "PRESENT_TRACKED";

  // "Unclassifiable" is governed by existing fail-closed candidate/runtime discovery law.
  return null;
}

function normalizeRelationshipCanonicalScalar(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRelationshipCanonicalList(value) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))].sort();
}

function canonicalRelationshipEvidenceObjectForFingerprint(fields) {
  // Contract Phase E: five keys in this exact order.
  return {
    database_role: normalizeRelationshipCanonicalScalar(fields.database_role),
    database_objects: normalizeRelationshipCanonicalList(
      fields.database_objects
    ),
    schedule_or_trigger: normalizeRelationshipCanonicalScalar(fields.schedule_or_trigger),
    deployment_surface: normalizeRelationshipCanonicalScalar(fields.deployment_surface),
    governance_reachability: normalizeRelationshipCanonicalScalar(
      fields.governance_reachability
    ),
  };
}

function relationshipEvidenceSha256FromCanonicalSemantic(fields) {
  const canonical = canonicalRelationshipEvidenceObjectForFingerprint(fields);
  const json = JSON.stringify(canonical);
  const buf = Buffer.from(json, "utf8");
  return sha256HexOfBuffer(buf);
}

function computeRelationshipEvidenceFingerprintFromInventorySurface(surface) {
  return relationshipEvidenceSha256FromCanonicalSemantic({
    database_role: surface.database_role,
    database_objects: surface.database_objects,
    schedule_or_trigger: surface.schedule_or_trigger,
    deployment_surface: surface.deployment_surface,
    governance_reachability: surface.governance_reachability_type,
  });
}

function computeRelationshipEvidenceFingerprintFromExtractedFields(fields) {
  return relationshipEvidenceSha256FromCanonicalSemantic({
    database_role: fields.database_role,
    database_objects: fields.database_objects,
    schedule_or_trigger: fields.schedule_or_trigger,
    deployment_surface: fields.deployment_surface,
    governance_reachability: fields.governance_reachability_type,
  });
}

function readRelationshipEvidenceFieldsFromSource(relativePath, sourceText, ruleAuthPaths) {
  const isCodeLikeFile = isCodeLike(relativePath);
  const isSqlFile = /\.sql$/iu.test(relativePath);

  const databaseRole =
    isCodeLikeFile || isSqlFile
      ? detectDatabaseRole(relativePath, sourceText)
      : "NONE";

  const databaseObjects =
    databaseRole !== "NONE" || isSqlFile
      ? extractDatabaseObjects(relativePath, sourceText)
      : [];

  const scheduleOrTrigger = extractScheduleOrTrigger(relativePath, sourceText);

  const deploymentSurface = detectDeploymentSurface(relativePath);

  const governanceReachabilityType = ruleAuthPaths.has(relativePath)
    ? detectGovernanceReachability(relativePath, sourceText)
    : "NONE";

  return {
    database_role: databaseRole,
    database_objects: databaseObjects,
    schedule_or_trigger: scheduleOrTrigger || "",
    deployment_surface: deploymentSurface || "",
    governance_reachability_type: governanceReachabilityType || "NONE",
  };
}

function validateRelationshipEvidenceProvenanceSchema({ assetPath, provenance, capturedAllowedOnly }) {
  const requiredKeys = RELATIONSHIP_EVIDENCE_PROVENANCE_FIELDS;
  if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) {
    return [`ESA_RR_002_PROVENANCE_SCHEMA_INVALID: ${assetPath}: not an object`];
  }

  const keys = Object.keys(provenance).sort();
  const requiredSorted = [...requiredKeys].sort();
  if (JSON.stringify(keys) !== JSON.stringify(requiredSorted)) {
    return [
      `ESA_RR_002_PROVENANCE_SCHEMA_INVALID: ${assetPath}: wrong keys`,
    ];
  }

  if (capturedAllowedOnly) {
    if (!capturedAllowedOnly.has(provenance.captured_source_presence_state)) {
      return [
        `ESA_RR_002_PROVENANCE_SCHEMA_INVALID: ${assetPath}: captured_source_presence_state invalid`,
      ];
    }
  }

  if (!isValidSha256Hex(provenance.source_content_sha256)) {
    return [
      `ESA_RR_002_PROVENANCE_SCHEMA_INVALID: ${assetPath}: source_content_sha256 invalid`,
    ];
  }
  if (!isValidSha256Hex(provenance.relationship_evidence_sha256)) {
    return [
      `ESA_RR_002_PROVENANCE_SCHEMA_INVALID: ${assetPath}: relationship_evidence_sha256 invalid`,
    ];
  }

  return [];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readTextIfPresent(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) return "";
  if (!fs.statSync(filePath).isFile()) return "";
  return fs.readFileSync(filePath, "utf8");
}

function normalizePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map(normalizePath))].sort();
}

function gitLines(args) {
  const output = execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return output
    .split(/\r?\n/u)
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean);
}

function trackedPaths() {
  return uniqueSorted(gitLines(["ls-files"]));
}

function extractLedgerTasks(ledger) {
  if (Array.isArray(ledger.tasks)) return ledger.tasks;
  for (const v of Object.values(ledger)) {
    if (!Array.isArray(v)) continue;
    if (
      v.every(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          (typeof entry.id === "string" ||
            typeof entry.task_id === "string" ||
            typeof entry.project_id === "string")
      )
    ) {
      return v;
    }
  }
  throw new Error("Unable to locate canonical ledger task array");
}

function taskId(task) {
  return task.id || task.task_id || task.project_id || "";
}

function getWorkspaceCandidates(assetRegister) {
  const snap = assetRegister.workspace_candidate_snapshot;
  const candidates = snap && Array.isArray(snap.candidates) ? snap.candidates : [];
  return candidates;
}

function governedCandidatePaths(assetRegister) {
  return uniqueSorted(
    getWorkspaceCandidates(assetRegister)
      .filter((c) => c.candidate_disposition === "PRESERVED_CANDIDATE")
      .map((c) => c.asset_path)
  );
}

function workspaceCandidateByPath(assetRegister, assetPath) {
  const normalized = normalizePath(assetPath);
  return (
    getWorkspaceCandidates(assetRegister).find(
      (candidate) => normalizePath(candidate.asset_path) === normalized
    ) || null
  );
}

function isEvidenceOnlyTombstone(surface) {
  return Boolean(surface && surface.resolution === ESA_RR_003_RESOLUTION);
}

function buildIrrecoverableEvidenceOnlyTombstone({
  assetRegister,
  assetPath,
  trackedSet,
  preservedCandidateSet,
}) {
  const normalized = normalizePath(assetPath);
  if (!ESA_RR_003_IRRECOVERABLE_PATHS.has(normalized)) return null;

  const candidate = workspaceCandidateByPath(assetRegister, normalized);
  if (!candidate || candidate.candidate_disposition !== "PRESERVED_CANDIDATE") {
    return null;
  }

  const sourcePresenceState = computeSourcePresenceStateForPath({
    assetRegister,
    relativePath: normalized,
    trackedSet,
    preservedCandidateSet,
  });
  if (sourcePresenceState !== "ABSENT_PRESERVED_CANDIDATE") return null;

  return {
    asset_path: normalized,
    source_presence_state: "ABSENT_PRESERVED_CANDIDATE",
    candidate_disposition: "PRESERVED_CANDIDATE",
    resolution: ESA_RR_003_RESOLUTION,
    governed_by_control_task_id: candidate.governed_by_control_task_id,
    source_bytes_available: false,
    relationship_provenance_available: false,
    recovery_rcp1: "EXHAUSTED",
    recovery_rcp2: "EXHAUSTED",
    runtime_relationship_status: "UNKNOWABLE_FROM_GOVERNED_EVIDENCE",
    resolution_contract: "ESA-RR-003",
  };
}

function validateIrrecoverableEvidenceOnlyTombstone({
  assetRegister,
  surface,
  trackedSet,
  preservedCandidateSet,
}) {
  const errors = [];
  const assetPath = normalizePath(surface?.asset_path || "");

  if (!ESA_RR_003_IRRECOVERABLE_PATHS.has(assetPath)) {
    errors.push(
      `ESA_RR_004_TOMBSTONE_PATH_NOT_AUTHORIZED: ${assetPath || "(empty)"}`
    );
  }

  const actualKeys = Object.keys(surface || {}).sort();
  const expectedKeys = [...ESA_RR_003_TOMBSTONE_KEYS].sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    errors.push(`ESA_RR_004_TOMBSTONE_SCHEMA_INVALID: ${assetPath || "(empty)"}`);
  }

  const expectedFields = {
    source_presence_state: "ABSENT_PRESERVED_CANDIDATE",
    candidate_disposition: "PRESERVED_CANDIDATE",
    resolution: ESA_RR_003_RESOLUTION,
    source_bytes_available: false,
    relationship_provenance_available: false,
    recovery_rcp1: "EXHAUSTED",
    recovery_rcp2: "EXHAUSTED",
    runtime_relationship_status: "UNKNOWABLE_FROM_GOVERNED_EVIDENCE",
    resolution_contract: "ESA-RR-003",
  };
  for (const [key, expectedValue] of Object.entries(expectedFields)) {
    if (surface?.[key] !== expectedValue) {
      errors.push(`ESA_RR_004_TOMBSTONE_FIELD_INVALID: ${assetPath} field=${key}`);
    }
  }

  const candidate = workspaceCandidateByPath(assetRegister, assetPath);
  if (!candidate || candidate.candidate_disposition !== "PRESERVED_CANDIDATE") {
    errors.push(`ESA_RR_004_TOMBSTONE_CANDIDATE_INVALID: ${assetPath}`);
  } else if (
    surface?.governed_by_control_task_id !== candidate.governed_by_control_task_id
  ) {
    errors.push(`ESA_RR_004_TOMBSTONE_GOVERNANCE_IDENTITY_INVALID: ${assetPath}`);
  }

  const sourcePresenceState = assetPath
    ? computeSourcePresenceStateForPath({
        assetRegister,
        relativePath: assetPath,
        trackedSet,
        preservedCandidateSet,
      })
    : null;
  if (sourcePresenceState !== "ABSENT_PRESERVED_CANDIDATE") {
    errors.push(`ESA_RR_004_TOMBSTONE_SOURCE_RETURNED: ${assetPath}`);
  }

  return errors;
}

function authorityCandidatePaths(assetRegister) {
  const graph = assetRegister.rule_authority_candidate_graph;
  const nodes = graph && Array.isArray(graph.nodes) ? graph.nodes : [];
  return new Set(nodes.map((n) => normalizePath(n.asset_path)).filter(Boolean));
}

function candidateUniverse(assetRegister) {
  return uniqueSorted([...trackedPaths(), ...governedCandidatePaths(assetRegister)]);
}

function isCodeLike(relativePath) {
  return /\.(?:js|cjs|mjs|ts|tsx|py)$/iu.test(relativePath);
}

function resolveLocalModule(fromRelativePath, request) {
  const base = path.posix.normalize(
    path.posix.join(path.posix.dirname(fromRelativePath), request)
  );
  const attempts = [
    base,
    `${base}.js`,
    `${base}.cjs`,
    `${base}.mjs`,
    `${base}.ts`,
    `${base}.py`,
    path.posix.join(base, "index.js"),
  ];
  const resolved = attempts.find((attempt) =>
    fs.existsSync(path.join(ROOT, attempt))
  );
  return resolved ? normalizePath(resolved) : null;
}

function localDependencies(relativePath, source) {
  const dependencies = [];
  const patterns = [
    /require\(\s*["'](\.[^"']+)["']\s*\)/gu,
    /require\(\s*["'](node:[^"']+)["']\s*\)/gu,
    /from\s+["'](\.[^"']+)["']/gu,
    /from\s+["'](node:[^"']+)["']/gu,
    /import\s+["'](\.[^"']+)["']/gu,
    /import\s+["'](node:[^"']+)["']/gu,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const request = match[1];
      if (request.startsWith("node:")) {
        dependencies.push(request);
        continue;
      }
      const resolved = resolveLocalModule(relativePath, request);
      if (resolved) dependencies.push(resolved);
    }
  }

  return uniqueSorted(dependencies);
}

function packageRuntimeRoots() {
  const packageJson = readJson(path.join(ROOT, "package.json"));
  const roots = [];

  for (const [name, command] of Object.entries(packageJson.scripts || {})) {
    if (!["start", "dev"].includes(name)) continue;
    const matches = String(command).matchAll(
      /\b(?:node|nodemon)\s+([^\s;&|]+)/gu
    );
    for (const m of matches) roots.push(normalizePath(m[1]));
  }

  return uniqueSorted(roots);
}

function deploymentRuntimeRoots(universe) {
  const roots = [];
  const renderText = readTextIfPresent("render.yaml");
  const vercelText = readTextIfPresent("vercel.json");

  const sources = [
    renderText ? ["render.yaml", renderText] : null,
    vercelText ? ["vercel.json", vercelText] : null,
  ].filter(Boolean);

  for (const [, source] of sources) {
    for (const match of source.matchAll(
      /\b(?:node|nodemon)\s+([A-Za-z0-9_./-]+\.(?:js|cjs|mjs|ts|py))/gu
    )) {
      roots.push(normalizePath(match[1]));
    }
  }

  return uniqueSorted(roots);
}

function discoverReachableGraph(roots) {
  const discovered = new Set();
  const queue = [...roots];

  while (queue.length > 0) {
    const current = normalizePath(queue.shift());
    if (!current || discovered.has(current)) continue;
    if (!fs.existsSync(path.join(ROOT, current))) continue;
    if (!isCodeLike(current)) continue;

    discovered.add(current);
    const source = readTextIfPresent(current);

    for (const dep of localDependencies(current, source)) {
      if (!discovered.has(dep)) queue.push(dep);
    }
  }

  return uniqueSorted([...discovered]);
}

function extractEnvironmentKeyNames(source) {
  const names = [];
  for (const match of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/gu)) {
    names.push(match[1]);
  }
  for (const match of source.matchAll(
    /process\.env\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]/gu
  )) {
    names.push(match[1]);
  }
  return [...new Set(names)].sort();
}

function extractProviderHosts(source) {
  const hosts = [];
  for (const match of source.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/gu)) {
    const host = match[1].toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local")
    ) {
      continue;
    }
    hosts.push(host);
  }
  return [...new Set(hosts)].sort();
}

function extractScheduleOrTrigger(relativePath, source) {
  const triggers = [];

  for (const match of source.matchAll(
    /cron\.schedule\(\s*["'`]([^"'`]+)["'`]/gu
  )) {
    triggers.push(`cron:${match[1]}`);
  }

  if (/\bsetInterval\s*\(/u.test(source)) {
    triggers.push("setInterval");
  }

  if (/\bsetImmediate\s*\(/u.test(source)) {
    triggers.push("setImmediate");
  }

  if (/scheduler/iu.test(relativePath)) {
    triggers.push("scheduler-path");
  }

  return [...new Set(triggers)].sort().join("; ");
}

function detectDeploymentSurface(relativePath) {
  if (relativePath === "render.yaml") {
    return "RENDER_CONFIGURATION";
  }

  if (relativePath === "vercel.json") {
    return "VERCEL_CONFIGURATION";
  }

  if (relativePath === "package.json") {
    return "PACKAGE_RUNTIME_SCRIPTS";
  }

  if (/^Dockerfile(?:\.|$)/u.test(path.posix.basename(relativePath))) {
    return "CONTAINER_BUILD";
  }

  return "";
}

function stripSqlComments(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//gu, " ")
    .replace(/--.*$/gmu, " ");
}

function extractQualifiedIdentifiers(text) {
  // Captures dot-qualified identifiers like `public.predictions_raw`.
  // Does not try to parse quoted identifiers; this is intentionally conservative.
  const objects = [];
  const ident = /^([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)$/u;

  const patterns = [
    /\bFROM\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    /\bJOIN\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    /\bINSERT\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    /\bUPDATE\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b\s+SET\b/giu,
    /\bDELETE\s+FROM\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    /\bCREATE\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    /\bALTER\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    /\bDROP\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    /\bTRUNCATE\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
    // Fallback: allow capturing identifiers after generic TABLE keyword usage.
    /\bTABLE\s+([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\b/giu,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const obj = match[1];
      if (obj && ident.test(obj)) objects.push(obj);
    }
  }

  return [...new Set(objects)].sort();
}

function extractSqlEvidenceObjectsFromSqlText(sqlText) {
  const cleaned = stripSqlComments(sqlText);
  return extractQualifiedIdentifiers(cleaned);
}

function detectGovernanceReachability(relativePath, source) {
  const normalizedPath = String(relativePath || "")
    .replace(/\\/g, "/")
    .toLowerCase();
  const text = String(source || "");
  const lower = text.toLowerCase();

  const looksLikeTestProof =
    normalizedPath.startsWith("tests/") ||
    normalizedPath.startsWith("test/") ||
    /(?:^|\/)test(s)?[_-]/u.test(normalizedPath) ||
    /(?:\.test\.[cm]?[jt]s|\.spec\.[cm]?[jt]s|\/test_)/iu.test(normalizedPath) ||
    normalizedPath.includes("test_scenarios_master_rulebook");

  if (looksLikeTestProof) return "TEST_PROOF";

  const looksLikeAuditTool =
    normalizedPath.includes("/scripts/audit-") ||
    normalizedPath.includes("/scripts/audit_") ||
    /(?:^|\/)(?:audit-|audit_).*\.js$/iu.test(normalizedPath) ||
    normalizedPath.endsWith("audit-football-rules-alignment.js");

  if (looksLikeAuditTool) return "AUDIT_TOOL";

  const looksLikeBuildGate =
    /(?:^|\/)(scripts\/)?(verify-|verify_|check-|check_).*\.js$/iu.test(
      normalizedPath
    ) ||
    normalizedPath.endsWith("verify-master-rulebook-alignment.js") ||
    normalizedPath.endsWith("scripts/verify-master-rulebook-alignment.js") ||
    normalizedPath.includes("/scripts/verify-") ||
    normalizedPath.includes("/scripts/check-") ||
    normalizedPath.includes("/scripts/check_") ||
    normalizedPath.includes("/scripts/verify_");

  // Require enforcement/guard evidence, not just file naming.
  if (looksLikeBuildGate) {
    const hasFailEvidence =
      /\bprocess\.exitCode\b/iu.test(text) ||
      /\bprocess\.exit\s*\(\s*1\s*\)/iu.test(text) ||
      /\bthrow\b/iu.test(text) ||
      /\bverification\b/iu.test(text) ||
      /\bfail\s*(?:when|closed|pass)/iu.test(text) ||
      /\bverification failed\b/iu.test(lower) ||
      /\bexitCode\s*=\s*1\b/iu.test(lower);
    if (hasFailEvidence) return "BUILD_GATE";
  }

  const looksLikeSql = /\.sql$/iu.test(normalizedPath);
  const hasDatabaseEnforcementEvidence =
    /\bcreate\s+trigger\b/iu.test(text) ||
    /\bcreate\s+(?:or\s+replace\s+)?function\b/iu.test(text) ||
    /\bcreate\s+function\b/iu.test(text) ||
    /\bcreate\s+policy\b/iu.test(text) ||
    /\balter\s+policy\b/iu.test(text) ||
    /\brow\s+level\s+security\b/iu.test(text) ||
    /\braise\s+exception\b/iu.test(text) ||
    /\breturns\s+trigger\b/iu.test(text) ||
    /\bexecute\s+function\b/iu.test(text);

  if (looksLikeSql && hasDatabaseEnforcementEvidence) return "DATABASE";

  const looksLikeRuntimeEnforcement = normalizedPath.startsWith("backend/");
  const hasRuntimeEnforcementEvidence =
    /\b(blo(?:cked|king)|reject|forbidden|disallowed|prevent|cannot|throw)\b/iu.test(text) ||
    /\breturn\s+false\b/iu.test(text) ||
    /\breturn\s*\{[^}]*error\b/iu.test(text) ||
    /\breturn\s*\{[^}]*blocked\b/iu.test(text) ||
    /\benforce|gatekeeper|block.*publish\b/iu.test(lower);

  if (looksLikeRuntimeEnforcement && hasRuntimeEnforcementEvidence) return "RUNTIME";

  const looksDocumentary =
    normalizedPath.endsWith(".md") ||
    normalizedPath.endsWith(".txt") ||
    normalizedPath.includes("documentation");

  if (looksDocumentary) return "DOCUMENT_ONLY";

  return "UNKNOWN";
}

const RELATIONSHIP_EVIDENCE_FIELDS = [
  "database_role",
  "database_objects",
  "schedule_or_trigger",
  "deployment_surface",
  "governance_reachability",
];

function normalizeRelationshipScalar(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRelationshipList(value) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))].sort();
}

function compareRelationshipEvidence(discoveredRecord, inventoryRecord) {
  const findings = [];

  for (const field of RELATIONSHIP_EVIDENCE_FIELDS) {
    const discoveredValue =
      field === "database_objects"
        ? normalizeRelationshipList(discoveredRecord?.[field])
        : field === "governance_reachability"
          ? normalizeRelationshipScalar(
              discoveredRecord?.governance_reachability ??
                discoveredRecord?.governance_reachability_type
            )
          : normalizeRelationshipScalar(discoveredRecord?.[field]);

    const inventoryValue =
      field === "database_objects"
        ? normalizeRelationshipList(inventoryRecord?.[field])
        : field === "governance_reachability"
          ? normalizeRelationshipScalar(
              inventoryRecord?.governance_reachability ??
                inventoryRecord?.governance_reachability_type
            )
          : normalizeRelationshipScalar(inventoryRecord?.[field]);

    const matches =
      field === "database_objects"
        ? JSON.stringify(discoveredValue) === JSON.stringify(inventoryValue)
        : discoveredValue === inventoryValue;

    if (!matches) {
      findings.push({
        field,
        discovered: discoveredValue,
        inventoried: inventoryValue,
      });
    }
  }

  return findings;
}

function isLikelySqlLiteralContent(content) {
  // Tight structural filter to avoid interpreting prose as SQL.
  const hasSqlCore = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)\b/iu.test(
    content
  );
  if (!hasSqlCore) return false;

  // Require at least one structural clause typical of a statement.
  return (
    /\b( FROM | JOIN | INTO | SET | VALUES | TABLE )\b/iu.test(` ${content} `) ||
    /\bINSERT\s+INTO\b/iu.test(content) ||
    /\bDELETE\s+FROM\b/iu.test(content) ||
    /\bUPDATE\b/iu.test(content) && /\bSET\b/iu.test(content)
  );
}

function extractDatabaseObjects(relativePath, source) {
  const objects = [];

  // Always capture Supabase evidence from direct call sites.
  for (const match of source.matchAll(
    /\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/gu
  )) {
    if (match[1]) objects.push(match[1]);
  }
  for (const match of source.matchAll(
    /\.rpc\(\s*["'`]([^"'`]+)["'`]\s*/gu
  )) {
    if (match[1]) objects.push(match[1]);
  }

  const isSqlFile = /\.sql$/iu.test(relativePath);
  if (isSqlFile) {
    // For raw SQL files, scan whole content conservatively after stripping comments.
    objects.push(...extractSqlEvidenceObjectsFromSqlText(source));
    return [...new Set(objects)].sort();
  }

  // For JS/TS-like source, only scan string/template literal content that looks like SQL.
  // This avoids treating prose like "update Edge ... from Scout" as executable SQL.
  for (const match of source.matchAll(/`([\s\S]*?)`/gu)) {
    const content = match[1] || "";
    if (!isLikelySqlLiteralContent(content)) continue;
    objects.push(...extractSqlEvidenceObjectsFromSqlText(content));
  }

  // Also support single/double-quoted literals *only* when the literal content itself is very SQL-like.
  for (const match of source.matchAll(/(['"])([\s\S]*?)\1/gu)) {
    const content = match[2] || "";
    if (!isLikelySqlLiteralContent(content)) continue;
    objects.push(...extractSqlEvidenceObjectsFromSqlText(content));
  }

  return [...new Set(objects)].sort();
}

function hasDatabaseExecutableEvidence(relativePath, source) {
  if (/\.sql$/iu.test(relativePath)) {
    return true;
  }

  return (
    /\bcreateClient\s*\(/u.test(source) ||
    /\bnew\s+Pool\s*\(/u.test(source) ||
    /\bnew\s+Client\s*\(/u.test(source) ||
    /\brequire\s*\(\s*['"](?:pg|@supabase\/supabase-js|[^'"]*(?:\/db|\/database))['"]\s*\)/u.test(
      source
    ) ||
    /\bfrom\s+['"](?:pg|@supabase\/supabase-js|[^'"]*(?:\/db|\/database))['"]/u.test(
      source
    ) ||
    /\.rpc\s*\(/u.test(source) ||
    /\.from\s*\(\s*['"][\w_]+['"]\s*\)/u.test(source)
  );
}

function detectDatabaseRole(relativePath, source) {
  if (/\/migrations?\//iu.test(`/${relativePath}`)) return "MIGRATION";
  if (/trigger/iu.test(relativePath) && /\.sql$/iu.test(relativePath))
    return "TRIGGER";
  if (/schema/iu.test(relativePath) && /\.sql$/iu.test(relativePath))
    return "SCHEMA";
  if (/seed/iu.test(relativePath)) return "SEED";

  const hasDbEvidence = hasDatabaseExecutableEvidence(relativePath, source);
  const hasRpc = /\.rpc\s*\(/u.test(source);
  const hasRead =
    hasDbEvidence &&
    (/\.select\s*\(/u.test(source) || /\bSELECT\b/iu.test(source));

  const hasWrite =
    hasDbEvidence &&
    (/\.(?:insert|upsert|update|delete)\s*\(/iu.test(source) ||
      /\b(?:INSERT|UPDATE|DELETE)\b/iu.test(source));

  if (hasRead && hasWrite) return "READ_WRITE";
  if (hasWrite) return "WRITE";
  if (hasRead) return "READ";
  if (hasRpc) return "RPC";
  if (hasDbEvidence) return "CONNECTION_OR_CLIENT";
  return "NONE";
}

function isScheduledExecution(relativePath, source) {
  return extractScheduleOrTrigger(relativePath, source) !== "";
}

function isScoutFipDiscoveryInfrastructurePath(relativePath) {
  return (
    relativePath.startsWith("control-center/") ||
    relativePath.startsWith("tests/")
  );
}

function isScoutFipSurface(relativePath, source) {
  if (isScoutFipDiscoveryInfrastructurePath(relativePath)) {
    return false;
  }

  const hasScoutFipRuntimeImport =
    /\brequire\s*\(\s*['"][^'"]*(?:fipIntake|fipStorage|\/scout)/iu.test(source) ||
    /\bfrom\s+['"][^'"]*(?:fip|scout)/iu.test(source);

  const hasScoutFipRuntimeCall =
    /\b(?:receiveValidatedFip|buildEstStorageRecords|computeFipHash|computeIdempotencyKey)\s*\(/u.test(
      source
    );

  const pathSignalsScoutFip =
    /(?:^|\/)fip[A-Z]|fipIntake|fipStorage|scoutFip/iu.test(relativePath);

  return (
    hasScoutFipRuntimeImport ||
    hasScoutFipRuntimeCall ||
    pathSignalsScoutFip ||
    /\bSCOUT_DATABASE_URL\b/u.test(source) ||
    /(?:^|\/)supabase\/migrations\/[^/]*scout_signal_mirror[^/]*\.sql$/iu.test(
      relativePath
    )
  );
}

function discoverRouteMounts(serverPath, reachableRootsSet) {
  const source = readTextIfPresent(serverPath);
  const mounts = [];

  const requireVarToAsset = new Map();
  for (const match of source.matchAll(
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*["'](\.[^"']+)["']\s*\)/gu
  )) {
    const variable = match[1];
    const request = match[2];
    const resolved = resolveLocalModule(serverPath, request);
    if (resolved && reachableRootsSet.has(resolved)) requireVarToAsset.set(variable, resolved);
  }

  for (const match of source.matchAll(
    /app\.use\(\s*["']([^"']+)["']\s*,\s*([A-Za-z_$][\w$]*)/gu
  )) {
    const mountPath = match[1];
    const variable = match[2];
    const asset_path = requireVarToAsset.get(variable);
    if (asset_path) {
      mounts.push({ mount_path: mountPath, asset_path });
    }
  }

  return mounts;
}

function renderRuntimeMap(inventory) {
  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        inventory_version: inventory.inventory_version,
        source_contract: inventory.source_contract,
        semantics: inventory.semantics,
        surfaces: [...inventory.surfaces].sort((a, b) =>
          String(a.asset_path).localeCompare(String(b.asset_path))
        ),
      })
    )
    .digest("hex");

  const lines = [
    "# Edge System Runtime Map",
    "",
    `Inventory version: ${inventory.inventory_version}`,
    `Inventory SHA-256: ${hash}`,
    "",
    "> Synchronized review surface for `EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json`.",
    "> This map is observational and does not declare future Edge architecture or canonical authority.",
    "",
    "## Summary",
    "",
    `- Runtime/system surfaces: ${inventory.surfaces.length}`,
    `- Candidate status establishes authority: ${inventory.semantics.candidate_status_establishes_current_authority}`,
    `- Inventory declares future architecture: ${inventory.semantics.inventory_declares_future_architecture}`,
    "",
    "## Surfaces",
    "",
  ];

  const sortedSurfaces = [...inventory.surfaces].sort((a, b) =>
    String(a.asset_path).localeCompare(String(b.asset_path))
  );

  for (const surface of sortedSurfaces) {
    lines.push(`### ${surface.asset_path}`);
    lines.push("");

    if (isEvidenceOnlyTombstone(surface)) {
      lines.push(`- Evidence-only resolution: ${surface.resolution}`);
      lines.push(`- Source presence: ${surface.source_presence_state}`);
      lines.push(`- Candidate disposition: ${surface.candidate_disposition}`);
      lines.push(`- Governed by: ${surface.governed_by_control_task_id}`);
      lines.push(`- Recovery RCP-1: ${surface.recovery_rcp1}`);
      lines.push(`- Recovery RCP-2: ${surface.recovery_rcp2}`);
      lines.push(`- Runtime relationship status: ${surface.runtime_relationship_status}`);
      lines.push("");
      continue;
    }

    lines.push(
      `- Surface classes: ${Array.isArray(surface.surface_classes) ? surface.surface_classes.join(", ") : ""}`
    );
    lines.push(`- Reachability: ${surface.reachability_state}`);
    lines.push(`- Source state: ${surface.source_state}`);
    lines.push(`- Governed by: ${surface.governed_by_control_task_id}`);
    lines.push(
      `- Runtime callers: ${
        surface.runtime_callers && surface.runtime_callers.length
          ? surface.runtime_callers.join(", ")
          : "None recorded"
      }`
    );
    lines.push(
      `- Runtime consumers: ${
        surface.runtime_consumers && surface.runtime_consumers.length
          ? surface.runtime_consumers.join(", ")
          : "None recorded"
      }`
    );
    lines.push(`- Database role: ${surface.database_role}`);
    lines.push(
      `- Database objects: ${
        surface.database_objects && surface.database_objects.length
          ? surface.database_objects.join(", ")
          : "None recorded"
      }`
    );
    lines.push(
      `- External providers: ${
        surface.external_providers && surface.external_providers.length
          ? surface.external_providers.join(", ")
          : "None recorded"
      }`
    );
    lines.push(`- Next validation: ${surface.next_validation}`);
    lines.push("");
  }

  // Avoid emitting a trailing blank line (which would create an extra `\n` at EOF).
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return `${lines.join("\n")}\n`;
}

function sourceStateForPath(assetRegister, relativePath) {
  const asset = (assetRegister.assets || []).find(
    (a) => normalizePath(a.asset_path) === normalizePath(relativePath)
  );
  if (asset && asset.source_state) return asset.source_state;

  const cand = getWorkspaceCandidates(assetRegister).find(
    (c) => normalizePath(c.asset_path) === normalizePath(relativePath)
  );
  if (cand) return "PRE_EXISTING_UNTRACKED";

  return "COMMITTED_REPOSITORY";
}

function discoverMaterialSurfaces(assetRegister) {
  const universe = candidateUniverse(assetRegister);
  const packageRoots = packageRuntimeRoots();
  const deploymentRoots = deploymentRuntimeRoots(universe);
  const runtimeRoots = uniqueSorted([...packageRoots, ...deploymentRoots]);

  const trackedSet = new Set(trackedPaths());
  const preservedCandidateSet = new Set(governedCandidatePaths(assetRegister));

  const reachableList = discoverReachableGraph(runtimeRoots);
  const reachable = new Set(reachableList);
  const reachableRootsSet = new Set(reachableList);
  for (const root of runtimeRoots) reachableRootsSet.add(root);

  const ruleAuthPaths = authorityCandidatePaths(assetRegister);

  // Mount discovery only from likely server entry points.
  const routeMounts = [];
  for (const root of runtimeRoots) {
    if (!String(root).startsWith("backend/server")) continue;
    routeMounts.push(...discoverRouteMounts(root, reachableRootsSet));
  }

  const getMountedPathsFor = (assetPath) =>
    routeMounts.filter((m) => normalizePath(m.asset_path) === normalizePath(assetPath)).map((m) => m.mount_path).sort();

  const surfaces = [];

  for (const relativePath of universe) {
    const relNorm = normalizePath(relativePath);
    const isAbsentPreservedCandidate =
      preservedCandidateSet.has(relNorm) &&
      !(
        fs.existsSync(path.join(ROOT, relNorm)) &&
        fs.statSync(path.join(ROOT, relNorm)).isFile()
      );

    // Avoid scanning binaries/zips/archives as UTF-8, which can produce massive false positives.
    // Discovery must be observational only, so for non-text artifacts we treat "source" as empty.
    const isCodeLikeFile = isCodeLike(relativePath);
    const isSqlFile = /\.sql$/iu.test(relativePath);
    const isYamlOrJsonConfig =
      relativePath === "render.yaml" ||
      relativePath === "vercel.json" ||
      relativePath === "package.json";
    const isDock = /^Dockerfile(?:\.|$)/u.test(path.posix.basename(relativePath));
    const isYamlOrJson = /\.ya?ml$/iu.test(relativePath) || /\.json$/iu.test(relativePath);

    const isTextLike =
      isCodeLikeFile ||
      isSqlFile ||
      isYamlOrJsonConfig ||
      isDock ||
      isYamlOrJson;

    const source = isTextLike && !isAbsentPreservedCandidate
      ? readTextIfPresent(relativePath)
      : "";

    const classes = new Set();
    if (runtimeRoots.includes(relativePath)) classes.add("RUNTIME_ENTRY_POINT");
    if (relativePath.startsWith("backend/routes/")) classes.add("ROUTE");
    if (relativePath.startsWith("backend/controllers/")) classes.add("CONTROLLER");
    if (relativePath.startsWith("backend/services/")) classes.add("SERVICE");

    // Only extract env/provider/db evidence from code or sql.
    const envKeyNames =
      isCodeLikeFile && !isAbsentPreservedCandidate
        ? extractEnvironmentKeyNames(source)
        : [];
    const providerHosts =
      isCodeLikeFile && !isAbsentPreservedCandidate
        ? extractProviderHosts(source)
        : [];

    if (providerHosts.length > 0 && reachable.has(relativePath)) {
      classes.add("EXTERNAL_PROVIDER");
    }

    if (isCodeLikeFile && isScoutFipSurface(relativePath, source)) {
      classes.add("SCOUT_FIP_SURFACE");
    }

    const databaseRole =
      isAbsentPreservedCandidate || (!isCodeLikeFile && !isSqlFile)
        ? "NONE"
        : detectDatabaseRole(relativePath, source);
    if (databaseRole !== "NONE") {
      classes.add("DATABASE_SURFACE");
    }

    const scheduleOrTrigger = isAbsentPreservedCandidate
      ? ""
      : extractScheduleOrTrigger(relativePath, source);
    if (scheduleOrTrigger) {
      classes.add("SCHEDULED_EXECUTION");
    }

    const deploymentSurface = detectDeploymentSurface(relativePath);
    if (deploymentSurface) {
      classes.add("DEPLOYMENT_SURFACE");
    }

    if (ruleAuthPaths.has(relativePath)) {
      classes.add("GOVERNANCE_ENFORCEMENT");
    }

    const classArr = [...classes].sort();

    const reachability_state = reachable.has(relativePath)
      ? "CONFIRMED"
      : "CANDIDATE";

    const material =
      classArr.length > 0 &&
      (() => {
        const isPreservedCandidate = preservedCandidateSet.has(relNorm);

        // Determinism for ESA-RR-T09/T15:
        // If a preserved-candidate has database_role=NONE, it is excluded
        // from the canonical proof surface selection so test tampering isn't
        // a no-op.
        if (isPreservedCandidate && databaseRole === "NONE") {
          // Allow only explicit governance enforcement / deployment/scout
          // surfaces even if database evidence is NONE.
          return (
            classArr.includes("SCOUT_FIP_SURFACE") ||
            classArr.includes("DEPLOYMENT_SURFACE") ||
            classArr.includes("GOVERNANCE_ENFORCEMENT")
          );
        }

        return (
          (reachable.has(relativePath) && !isPreservedCandidate) ||
          (isPreservedCandidate && databaseRole !== "NONE") ||
          classArr.includes("SCOUT_FIP_SURFACE") ||
          classArr.includes("DEPLOYMENT_SURFACE") ||
          classArr.includes("GOVERNANCE_ENFORCEMENT") ||
          (databaseRole !== "NONE" &&
            ["MIGRATION", "TRIGGER", "SCHEMA", "SEED"].includes(databaseRole))
        );
      })();

    if (!material) continue;

    const runtime_dependencies = localDependencies(relativePath, source);
    const runtime_consumers = uniqueSorted(
      [...reachable].filter((candidate) => {
        const candidateSource = readTextIfPresent(candidate);
        return localDependencies(candidate, candidateSource).includes(relativePath);
      })
    );

    const surface = {
      asset_path: relativePath,
      source_state: sourceStateForPath(assetRegister, relativePath),
      surface_classes: classArr,
      reachability_state,
      mount_paths: getMountedPathsFor(relativePath),

      runtime_callers: [],
      runtime_consumers,
      runtime_dependencies,

      external_providers: providerHosts,
      environment_key_names: envKeyNames,
      database_role: databaseRole,
      database_objects:
        isAbsentPreservedCandidate
          ? []
          : databaseRole !== "NONE" || isSqlFile
            ? extractDatabaseObjects(relativePath, source)
            : [],

      schedule_or_trigger: scheduleOrTrigger || "",
      deployment_surface: deploymentSurface || "",

      governance_reachability_type: ruleAuthPaths.has(relativePath)
        ? isAbsentPreservedCandidate
          ? "NONE"
          : detectGovernanceReachability(relativePath, source)
        : "NONE",

      governed_by_control_task_id: "ESA-001",
      next_validation:
        "Revalidate runtime reachability and relationships during the next governed Edge architecture review.",

      evidence: ["Static package/deployment/import/mount evidence."],

      notes:
        "Current-state inventory evidence only; this record does not declare future Edge architecture.",
    };

    surfaces.push(surface);
  }

  return surfaces.sort((a, b) => a.asset_path.localeCompare(b.asset_path));
}

function validateInventory({ ledger, assetRegister, inventory, mapText }) {
  const errors = [];
  const warnings = [];

  const tasks = extractLedgerTasks(ledger);
  const knownTaskIds = new Set(tasks.map(taskId).filter(Boolean));

  if (inventory.inventory_version !== "1.0.0") {
    errors.push("INVALID_RUNTIME_INVENTORY_VERSION");
  }

  if (
    !inventory.source_contract ||
    inventory.source_contract.control_task_id !== "ESA-001"
  ) {
    errors.push("INVALID_RUNTIME_INVENTORY_SOURCE_CONTRACT");
  }

  const semantics = inventory.semantics || {};

  if (semantics.candidate_status_establishes_current_authority !== false) {
    errors.push("CANDIDATE_STATUS_ESTABLISHES_AUTHORITY");
  }
  if (semantics.relationships_establish_authority_precedence !== false) {
    errors.push(
      "INVENTORY_RELATIONSHIP_ESTABLISHES_AUTHORITY_PRECEDENCE"
    );
  }
  if (semantics.inventory_declares_future_architecture !== false) {
    errors.push("INVENTORY_DECLARES_FUTURE_ARCHITECTURE");
  }

  if (!Array.isArray(inventory.surfaces)) {
    errors.push("RUNTIME_SURFACES_NOT_ARRAY");
    return { errors, warnings, discovered: [] };
  }

  if (typeof mapText !== "string") {
    errors.push("RUNTIME_MAP_TEXT_MISSING");
  }

  // Validate inventory surfaces schema.
  for (const surface of inventory.surfaces) {
    if (!surface || typeof surface !== "object") {
      errors.push("RUNTIME_SURFACE_INVALID_OBJECT");
      continue;
    }

    if (!surface.asset_path || !String(surface.asset_path).trim()) {
      errors.push("RUNTIME_SURFACE_PATH_MISSING");
      continue;
    }

    if (isEvidenceOnlyTombstone(surface)) {
      const trackedSetForTombstone = new Set(trackedPaths());
      const preservedSetForTombstone = new Set(governedCandidatePaths(assetRegister));
      errors.push(
        ...validateIrrecoverableEvidenceOnlyTombstone({
          assetRegister,
          surface,
          trackedSet: trackedSetForTombstone,
          preservedCandidateSet: preservedSetForTombstone,
        })
      );
      continue;
    }

    if (!Array.isArray(surface.surface_classes) || surface.surface_classes.length === 0) {
      errors.push(`RUNTIME_SURFACE_CLASS_MISSING: ${surface.asset_path}`);
    } else {
      for (const c of surface.surface_classes) {
        if (!SURFACE_CLASSES.has(c)) {
          errors.push(`INVALID_RUNTIME_SURFACE_CLASS: ${surface.asset_path} ${c}`);
        }
      }
    }

    if (!REACHABILITY_STATES.has(surface.reachability_state)) {
      errors.push(
        `INVALID_RUNTIME_REACHABILITY_STATE: ${surface.asset_path} ${surface.reachability_state}`
      );
    }

    if (!DATABASE_ROLES.has(surface.database_role)) {
      errors.push(`INVALID_DATABASE_ROLE: ${surface.asset_path} ${surface.database_role}`);
    }

    if (!GOVERNANCE_REACHABILITY_TYPES.has(surface.governance_reachability_type)) {
      errors.push(
        `INVALID_GOVERNANCE_REACHABILITY_TYPE: ${surface.asset_path} ${surface.governance_reachability_type}`
      );
    }

    for (const field of REQUIRED_ARRAY_FIELDS) {
      if (!Array.isArray(surface[field])) {
        errors.push(
          `RUNTIME_SURFACE_ARRAY_FIELD_INVALID: ${surface.asset_path} ${field}`
        );
      }
    }

    const governedTaskId = String(surface.governed_by_control_task_id || "").trim();
    if (!knownTaskIds.has(governedTaskId)) {
      errors.push(`RUNTIME_CONTROL_TASK_UNKNOWN: ${surface.asset_path} ${governedTaskId || "(empty)"}`);
    }

    if (
      ["UNKNOWN", "UNRESOLVED"].includes(surface.reachability_state) &&
      !String(surface.next_validation || "").trim()
    ) {
      errors.push(`RUNTIME_NEXT_VALIDATION_MISSING: ${surface.asset_path}`);
    }

    if (
      Array.isArray(surface.environment_key_names) &&
      surface.environment_key_names.some(
        (name) => typeof name !== "string" || !/^[A-Z][A-Z0-9_]*$/u.test(name)
      )
    ) {
      errors.push(`INVALID_ENVIRONMENT_KEY_NAME: ${surface.asset_path}`);
    }

    if (
      Object.prototype.hasOwnProperty.call(surface, "environment_values") ||
      Object.prototype.hasOwnProperty.call(surface, "secret_values") ||
      Object.prototype.hasOwnProperty.call(surface, "api_keys")
    ) {
      errors.push(`SECRET_VALUE_FIELD_FORBIDDEN: ${surface.asset_path}`);
    }
  }

  // ESA-RR-002 Option A provenance-backed retention validation (sealed).
  const trackedSet = new Set(trackedPaths());
  const preservedCandidateSet = new Set(governedCandidatePaths(assetRegister));
  const ruleAuthPaths = authorityCandidatePaths(assetRegister);
  const capturedPresentOnly = new Set([
    "PRESENT_TRACKED",
    "PRESENT_PRESERVED_CANDIDATE",
  ]);

  for (const surface of inventory.surfaces) {
    const assetPath = normalizePath(surface.asset_path);
    if (isEvidenceOnlyTombstone(surface)) continue;

    const presenceState = computeSourcePresenceStateForPath({
      assetRegister,
      relativePath: assetPath,
      trackedSet,
      preservedCandidateSet,
    });

    if (!presenceState || !SOURCE_PRESENCE_STATES.has(presenceState)) {
      errors.push(
        `ESA_RR_002_SOURCE_PRESENCE_UNCLASSIFIABLE: ${surface.asset_path}`
      );
      continue;
    }

    const provenance = surface.relationship_evidence_provenance;

    const schemaErrors = validateRelationshipEvidenceProvenanceSchema({
      assetPath: surface.asset_path,
      provenance,
      capturedAllowedOnly: capturedPresentOnly,
    });
    if (schemaErrors.length) {
      errors.push(...schemaErrors);
      continue;
    }

    // Binding law: provenance.relationship_evidence_sha256 must bind to the
    // committed governed relationship-evidence fields in the inventory.
    const committedRelEvidenceFingerprint =
      computeRelationshipEvidenceFingerprintFromInventorySurface(surface);

    if (
      provenance.relationship_evidence_sha256 !==
      committedRelEvidenceFingerprint
    ) {
      errors.push(
        `ESA_RR_002_RELATIONSHIP_EVIDENCE_PROVENANCE_BINDING_FAIL: ${surface.asset_path}`
      );
      continue;
    }

    if (presenceState === "ABSENT_PRESERVED_CANDIDATE") {
      // Phase F: fail-closed absent-candidate retention.
      // IMPORTANT: no synthetic source text reads and no relationship extractors.
      continue;
    }

    // Phase G: returning-source conflict (and present-source validation).
    // Contract Phase BA: for PRESENT_TRACKED, authoritative bytes are Git index
    // blob bytes; for PRESENT_PRESERVED_CANDIDATE, they are filesystem bytes.
    const sourceBytes =
      presenceState === "PRESENT_TRACKED"
        ? readTrackedIndexBlobBytes(assetPath)
        : readSourceBytesIfPresent(assetPath);
    if (!sourceBytes) {
      errors.push(`ESA_RR_002_SOURCE_BYTES_MISSING: ${surface.asset_path}`);
      continue;
    }

    const currentSourceContentSha256 = sha256HexOfBuffer(sourceBytes);
    if (currentSourceContentSha256 !== provenance.source_content_sha256) {
      errors.push(
        `ESA_RR_002_SOURCE_CONTENT_SHA_DRIFT: ${surface.asset_path}`
      );
    }

    // Same-authoritative-buffer law: decode relationship evidence extraction
    // from the exact bytes used for hashing.
    const sourceText = sourceBytes.toString("utf8");
    const extractedFields = readRelationshipEvidenceFieldsFromSource(
      assetPath,
      sourceText,
      ruleAuthPaths
    );
    const currentRelEvidenceFingerprint =
      computeRelationshipEvidenceFingerprintFromExtractedFields(extractedFields);

    if (
      currentRelEvidenceFingerprint !==
      provenance.relationship_evidence_sha256
    ) {
      errors.push(
        `ESA_RR_002_RELATIONSHIP_EVIDENCE_HASH_DRIFT: ${surface.asset_path}`
      );
    }

    // Semantic relationship comparator check against committed inventory.
    const discoveredRecord = {
      asset_path: surface.asset_path,
      database_role: extractedFields.database_role,
      database_objects: extractedFields.database_objects,
      schedule_or_trigger: extractedFields.schedule_or_trigger,
      deployment_surface: extractedFields.deployment_surface,
      governance_reachability_type: extractedFields.governance_reachability_type,
    };

    const findings = compareRelationshipEvidence(discoveredRecord, surface);
    for (const finding of findings) {
      errors.push(
        `ESA_RR_002_RELATIONSHIP_SEMANTIC_DRIFT: ${surface.asset_path} field=${finding.field}`
      );
    }
  }

  // ESA-RR-004 exact-eight evidence-only accounting.
  const tombstonesByPath = new Map(
    inventory.surfaces
      .filter(isEvidenceOnlyTombstone)
      .map((surface) => [normalizePath(surface.asset_path), surface])
  );

  for (const [assetPath, tombstone] of tombstonesByPath) {
    errors.push(
      ...validateIrrecoverableEvidenceOnlyTombstone({
        assetRegister,
        surface: tombstone,
        trackedSet,
        preservedCandidateSet,
      })
    );
    if (!ESA_RR_003_IRRECOVERABLE_PATHS.has(assetPath)) {
      errors.push(`ESA_RR_004_TOMBSTONE_PATH_NOT_AUTHORIZED: ${assetPath}`);
    }
  }

  for (const exactPath of ESA_RR_003_IRRECOVERABLE_PATHS) {
    const sourcePresenceState = computeSourcePresenceStateForPath({
      assetRegister,
      relativePath: exactPath,
      trackedSet,
      preservedCandidateSet,
    });
    if (
      sourcePresenceState === "ABSENT_PRESERVED_CANDIDATE" &&
      !tombstonesByPath.has(exactPath)
    ) {
      errors.push(`ESA_RR_004_IRRECOVERABLE_TOMBSTONE_REQUIRED: ${exactPath}`);
    }
    if (
      sourcePresenceState !== "ABSENT_PRESERVED_CANDIDATE" &&
      tombstonesByPath.has(exactPath)
    ) {
      errors.push(`ESA_RR_004_RETURNED_SOURCE_TOMBSTONE_FORBIDDEN: ${exactPath}`);
    }
  }

  // Completeness + fail-closed: every discovered material surface must exist in the inventory.
  const discovered = discoverMaterialSurfaces(assetRegister);
  const discoveredByPath = new Map(discovered.map((s) => [normalizePath(s.asset_path), s]));

  const inventoryByPath = new Map(
    inventory.surfaces.map((s) => [normalizePath(s.asset_path), s])
  );

  for (const discoveredSurface of discovered) {
    const assetPath = normalizePath(discoveredSurface.asset_path);
    const inv = inventoryByPath.get(assetPath);
    if (!inv) {
      errors.push(`MATERIAL_RUNTIME_SURFACE_UNGOVERNED: ${discoveredSurface.asset_path}`);
      continue;
    }

    // Phase F: absent preserved candidates must not be drift-compared using
    // synthetic empty source content; provenance checks cover fail-closed behavior.
    const discoveredIsAbsentPreservedCandidate =
      preservedCandidateSet.has(assetPath) &&
      !(
        fs.existsSync(path.join(ROOT, assetPath)) &&
        fs.statSync(path.join(ROOT, assetPath)).isFile()
      );
    if (discoveredIsAbsentPreservedCandidate) continue;

    for (const surfaceClass of discoveredSurface.surface_classes) {
      if (!inv.surface_classes.includes(surfaceClass)) {
        errors.push(
          `DISCOVERED_RUNTIME_CLASS_MISSING: ${discoveredSurface.asset_path} ${surfaceClass}`
        );
      }
    }

    const findings = compareRelationshipEvidence(discoveredSurface, inv);
    for (const finding of findings) {
      errors.push(
        `RUNTIME_RELATIONSHIP_EVIDENCE_DRIFT: ${discoveredSurface.asset_path} field=${finding.field} discovered=${JSON.stringify(
          finding.discovered
        )} inventoried=${JSON.stringify(finding.inventoried)}`
      );
    }
  }

  // Map sync
  const expectedMap = renderRuntimeMap(inventory);
  const normalizeNewlines = (s) =>
    String(s).replace(/\r\n/gu, "\n").replace(/\r/gu, "\n");

  if (normalizeNewlines(mapText) !== normalizeNewlines(expectedMap)) {
    errors.push("RUNTIME_MAP_OUT_OF_SYNC");
  }

  // Unknown/unresolved governance findings are governed (warnings only).
  for (const surface of inventory.surfaces) {
    if (["LEGACY", "PARALLEL", "UNREACHABLE", "UNKNOWN", "UNRESOLVED"].includes(surface.reachability_state)) {
      warnings.push(`RUNTIME_REVIEW_FINDING: ${surface.asset_path} ${surface.reachability_state}`);
    }
  }

  return { errors, warnings, discovered: discoveredByPath.size ? discovered : discovered };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const ledger = readJson(LEDGER_PATH);
  const assetRegister = readJson(ASSET_REGISTER_PATH);

  if (args.has("--discover")) {
    const surfaces = discoverMaterialSurfaces(assetRegister);

    if (args.has("--write-inventory")) {
        const existing = fs.existsSync(INVENTORY_PATH)
          ? readJson(INVENTORY_PATH)
          : null;

        const inventory =
          existing && existing.surfaces && Array.isArray(existing.surfaces)
            ? existing
            : {
                inventory_version: "1.0.0",
                source_contract: {
                  control_task_id: "ESA-001",
                  repository_asset_truth:
                    "control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json",
                  inventory_scope:
                    "CURRENT_STATE_STATIC_RUNTIME_AND_SYSTEM_REACHABILITY",
                },
                semantics: { ...INVENTORY_SEMANTICS_DEFAULTS },
                surfaces: [],
              };

        // ESA-RR-002 Option A bootstrap: evidence/provenance creation for PRESENT_* only.
        const trackedSet = new Set(trackedPaths());
        const preservedCandidateSet = new Set(
          governedCandidatePaths(assetRegister)
        );
        const ruleAuthPaths = authorityCandidatePaths(assetRegister);
        const existingByPath = new Map(
          (inventory.surfaces || []).map((s) => [
            normalizePath(s.asset_path),
            s,
          ])
        );
        const capturedPresentOnly = new Set([
          "PRESENT_TRACKED",
          "PRESENT_PRESERVED_CANDIDATE",
        ]);

        const bootstrappedSurfaces = surfaces
          .map((discovered) => {
            const assetPath = normalizePath(discovered.asset_path);
            const presenceState = computeSourcePresenceStateForPath({
              assetRegister,
              relativePath: assetPath,
              trackedSet,
              preservedCandidateSet,
            });

            if (!presenceState || !SOURCE_PRESENCE_STATES.has(presenceState)) {
              return {
                ...discovered,
                // This will fail validation later; fail-closed is enforced in tests/validation.
                relationship_evidence_provenance: undefined,
              };
            }

            if (presenceState === "ABSENT_PRESERVED_CANDIDATE") {
              // Phase F + H: carry-forward only; no newly created provenance.
              const committed = existingByPath.get(assetPath);
              if (!committed) {
                return {
                  ...discovered,
                  relationship_evidence_provenance: undefined,
                };
              }

              const schemaErrors = validateRelationshipEvidenceProvenanceSchema(
                {
                  assetPath: committed.asset_path,
                  provenance: committed.relationship_evidence_provenance,
                  capturedAllowedOnly: capturedPresentOnly,
                }
              );
              if (schemaErrors.length) {
                return {
                  ...discovered,
                  relationship_evidence_provenance: undefined,
                };
              }

              const committedFingerprint =
                computeRelationshipEvidenceFingerprintFromInventorySurface(
                  committed
                );

              if (
                committed.relationship_evidence_provenance
                  .relationship_evidence_sha256 !== committedFingerprint
              ) {
                return {
                  ...discovered,
                  relationship_evidence_provenance: undefined,
                };
              }

              return committed;
            }

            // PRESENT_TRACKED / PRESENT_PRESERVED_CANDIDATE: regenerate from present source.
            // Contract Phase BA: use Git index blob bytes for PRESENT_TRACKED,
            // and filesystem bytes for PRESENT_PRESERVED_CANDIDATE.
            const sourceBytes =
              presenceState === "PRESENT_TRACKED"
                ? readTrackedIndexBlobBytes(assetPath)
                : readSourceBytesIfPresent(assetPath);
            if (!sourceBytes) {
              return {
                ...discovered,
                relationship_evidence_provenance: undefined,
              };
            }

            // Same-authoritative-buffer law: decode relationship evidence extraction
            // from the exact bytes used for hashing.
            const sourceText = sourceBytes.toString("utf8");
            const extractedFields = readRelationshipEvidenceFieldsFromSource(
              assetPath,
              sourceText,
              ruleAuthPaths
            );

            const relationshipEvidenceSha256 =
              computeRelationshipEvidenceFingerprintFromExtractedFields(
                extractedFields
              );

            const sourceContentSha256 = sha256HexOfBuffer(sourceBytes);

            return {
              ...discovered,
              database_role: extractedFields.database_role,
              database_objects: extractedFields.database_objects,
              schedule_or_trigger: extractedFields.schedule_or_trigger,
              deployment_surface: extractedFields.deployment_surface,
              governance_reachability_type:
                extractedFields.governance_reachability_type,
              relationship_evidence_provenance: {
                source_content_sha256: sourceContentSha256,
                relationship_evidence_sha256: relationshipEvidenceSha256,
                captured_source_presence_state: presenceState,
              },
            };
          })
          // Keep deterministic ordering.
          .sort((a, b) => a.asset_path.localeCompare(b.asset_path));

        const bootstrappedByPath = new Map(
          bootstrappedSurfaces.map((surface) => [
            normalizePath(surface.asset_path),
            surface,
          ])
        );
        const bootstrapErrors = [];

        // ESA-RR-004: account for every governed preserved candidate, including
        // absent candidates omitted by ordinary material-surface discovery.
        for (const candidate of getWorkspaceCandidates(assetRegister)) {
          if (candidate.candidate_disposition !== "PRESERVED_CANDIDATE") continue;

          const assetPath = normalizePath(candidate.asset_path);
          const presenceState = computeSourcePresenceStateForPath({
            assetRegister,
            relativePath: assetPath,
            trackedSet,
            preservedCandidateSet,
          });
          if (presenceState !== "ABSENT_PRESERVED_CANDIDATE") continue;

          if (ESA_RR_003_IRRECOVERABLE_PATHS.has(assetPath)) {
            const tombstone = buildIrrecoverableEvidenceOnlyTombstone({
              assetRegister,
              assetPath,
              trackedSet,
              preservedCandidateSet,
            });
            if (!tombstone) {
              bootstrapErrors.push(`ESA_RR_004_TOMBSTONE_BUILD_FAILED: ${assetPath}`);
            } else {
              bootstrappedByPath.set(assetPath, tombstone);
            }
            continue;
          }

          // All non-exempt absent candidates retain ESA-RR-002 fail-closed law.
          const committed = existingByPath.get(assetPath);
          if (!committed) {
            bootstrapErrors.push(
              `ESA_RR_002_ABSENT_COMMITTED_RECORD_REQUIRED: ${assetPath}`
            );
            continue;
          }

          const schemaErrors = validateRelationshipEvidenceProvenanceSchema({
            assetPath: committed.asset_path,
            provenance: committed.relationship_evidence_provenance,
            capturedAllowedOnly: capturedPresentOnly,
          });
          if (schemaErrors.length) {
            bootstrapErrors.push(...schemaErrors);
            continue;
          }

          const committedFingerprint =
            computeRelationshipEvidenceFingerprintFromInventorySurface(committed);
          if (
            committed.relationship_evidence_provenance.relationship_evidence_sha256 !==
            committedFingerprint
          ) {
            bootstrapErrors.push(
              `ESA_RR_002_RELATIONSHIP_EVIDENCE_PROVENANCE_BINDING_FAIL: ${assetPath}`
            );
            continue;
          }

          bootstrappedByPath.set(assetPath, committed);
        }

        inventory.surfaces = [...bootstrappedByPath.values()].sort((a, b) =>
          a.asset_path.localeCompare(b.asset_path)
        );
        if (!inventory.semantics)
          inventory.semantics = { ...INVENTORY_SEMANTICS_DEFAULTS };

        // Fail closed before either canonical output is written.
        const candidateMap = renderRuntimeMap(inventory);
        const candidateValidation = validateInventory({
          ledger,
          assetRegister,
          inventory,
          mapText: candidateMap,
        });
        const allBootstrapErrors = [
          ...bootstrapErrors,
          ...candidateValidation.errors,
        ];
        if (allBootstrapErrors.length) {
          for (const error of allBootstrapErrors) console.error(`ERROR: ${error}`);
          console.error("ESA_RR_004_BOOTSTRAP_VALIDATION_FAILED");
          process.exitCode = 1;
          return;
        }

        fs.writeFileSync(
          INVENTORY_PATH,
          `${JSON.stringify(inventory, null, 2)}\n`,
          "utf8"
        );
        fs.writeFileSync(MAP_PATH, candidateMap, "utf8");
        return;
    }

    process.stdout.write(`${JSON.stringify(surfaces, null, 2)}\n`);
    return;
  }

  if (args.has("--render-map")) {
    const inventory = readJson(INVENTORY_PATH);
    const mapText = renderRuntimeMap(inventory);

    if (args.has("--write-map")) {
      fs.writeFileSync(MAP_PATH, mapText, "utf8");
      return;
    }

    process.stdout.write(mapText);
    return;
  }

  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error("Missing inventory file: EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json");
    process.exitCode = 1;
    return;
  }

  const inventory = readJson(INVENTORY_PATH);
  const mapText = fs.existsSync(MAP_PATH) ? fs.readFileSync(MAP_PATH, "utf8") : "";

  const result = validateInventory({
    ledger,
    assetRegister,
    inventory,
    mapText,
  });

  console.log("ESA-001 — EDGE SYSTEM RUNTIME INVENTORY");
  console.log(`Inventory surfaces: ${inventory.surfaces.length}`);
  console.log(`Discovered surfaces: ${result.discovered.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  if (result.errors.length) {
    for (const e of result.errors) console.error(`ERROR: ${e}`);
    console.log("RESULT: FAIL");
    process.exitCode = 1;
    return;
  }

  console.log("RESULT: PASS");
}

if (require.main === module) {
  main();
}

module.exports = {
  ESA_RR_003_IRRECOVERABLE_PATHS,
  ESA_RR_003_RESOLUTION,
  isEvidenceOnlyTombstone,
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
  extractDatabaseObjects,
  detectDeploymentSurface,
  extractScheduleOrTrigger,
  detectGovernanceReachability,
  compareRelationshipEvidence,
  isScoutFipSurface,
};
