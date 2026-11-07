#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const EAC_PROJECT_ID = "EAC-001";
const MANIFEST_PATH = path.join(
  __dirname,
  "EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json"
);
const MAP_PATH = path.join(__dirname, "EDGE_ASSET_REPOSITORY_MAP.md");
const ASSET_REGISTER_PATH = path.join(
  __dirname,
  "EDGE_REPOSITORY_ASSET_REGISTER.v1.json"
);

const FUNCTIONAL_GROUPS = [
  "CONTROL_CENTER",
  "GOVERNANCE",
  "BACKEND_RUNTIME",
  "API_ROUTE",
  "CONTROLLER",
  "SERVICE",
  "DATABASE",
  "DATABASE_MIGRATION",
  "PROVIDER_INTEGRATION",
  "SCOUT_FIP",
  "PREDICTION",
  "ACCA",
  "GRADING_ACCURACY",
  "AI_EDGEMIND",
  "SCHEDULER_BACKGROUND",
  "SECURITY_SUBSCRIBER",
  "FRONTEND_UI",
  "PUBLIC_ASSET",
  "DEPLOYMENT_OPERATIONS",
  "SCRIPT_TOOL",
  "TEST_PROOF",
  "DOCUMENTATION_KNOWLEDGE",
  "GENERATED_OUTPUT",
  "UNCATEGORIZED",
];

const RELATIONSHIP_TAGS = [
  "RUNTIME",
  "API",
  "ROUTE",
  "CONTROLLER",
  "SERVICE",
  "DATABASE",
  "RPC",
  "MIGRATION",
  "SQL",
  "PROVIDER",
  "SCOUT",
  "FIP",
  "PREDICTION",
  "ACCA",
  "GRADING",
  "AI_EDGEMIND",
  "SCHEDULER",
  "BACKGROUND_JOB",
  "SECURITY",
  "SUBSCRIBER",
  "UI",
  "PUBLIC_ASSET",
  "DEPLOYMENT",
  "CONFIGURATION",
  "SCRIPT_TOOL",
  "TEST_PROOF",
  "RULEBOOK",
  "DOCUMENTATION",
  "OBSERVABILITY",
  "GENERATED",
  "AUDIT",
  "GOVERNANCE",
];

const ERROR_CODES = {
  ASSET_PURPOSE_MISSING: "ASSET_PURPOSE_MISSING",
  ASSET_FUNCTIONAL_GROUP_MISSING: "ASSET_FUNCTIONAL_GROUP_MISSING",
  ASSET_FUNCTIONAL_GROUP_INVALID: "ASSET_FUNCTIONAL_GROUP_INVALID",
  ASSET_RELATIONSHIP_TAGS_MISSING: "ASSET_RELATIONSHIP_TAGS_MISSING",
  ASSET_RELATIONSHIP_TAG_INVALID: "ASSET_RELATIONSHIP_TAG_INVALID",
  ASSET_CLASSIFICATION_EVIDENCE_MISSING:
    "ASSET_CLASSIFICATION_EVIDENCE_MISSING",
  ASSET_BATCH_MISSING: "ASSET_BATCH_MISSING",
  ASSET_BATCH_DUPLICATE: "ASSET_BATCH_DUPLICATE",
  ASSET_UNKNOWN_NEXT_VALIDATION_MISSING:
    "ASSET_UNKNOWN_NEXT_VALIDATION_MISSING",
  ASSET_CLASSIFICATION_COUNT_DRIFT: "ASSET_CLASSIFICATION_COUNT_DRIFT",
  ASSET_BATCH_MANIFEST_DRIFT: "ASSET_BATCH_MANIFEST_DRIFT",
  ASSET_REPOSITORY_MAP_DRIFT: "ASSET_REPOSITORY_MAP_DRIFT",
  ASSET_BATCH_MANIFEST_COUNT_DRIFT:
    "ASSET_BATCH_MANIFEST_COUNT_DRIFT",
  ASSET_UNBATCHED: "ASSET_UNBATCHED",
  ASSET_DUPLICATE_MEMBERSHIP: "ASSET_DUPLICATE_MEMBERSHIP",
  ASSET_STRUCTURAL_TYPE_INVALID: "ASSET_STRUCTURAL_TYPE_INVALID",
  ASSET_DUPLICATE_RELATIONSHIP_TAGS: "ASSET_DUPLICATE_RELATIONSHIP_TAGS",
};

function normalizePath(p) {
  return String(p).replace(/\\/g, "/");
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function safeTrim(s) {
  return String(s ?? "").trim();
}

function isMeaningfulNextValidation(text) {
  const t = String(text || "").toLowerCase();
  if (t.length < 10) return false;
  return /relationship|runtime|database|migration|batch|route|provider|controller|service|rulebook|evidence|classification/.test(
    t
  );
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function getApprovedFunctionalGroup(fg) {
  if (!isNonEmptyString(fg)) return "";
  if (!FUNCTIONAL_GROUPS.includes(fg)) return null;
  return fg;
}

function dedupeArray(arr) {
  return Array.from(new Set(arr));
}

function checkRelationshipTagsArray(asset, errors, strict) {
  // strict=true implies closure requirements; foundation only checks validity/types.
  const tags = asset.relationship_tags;
  if (!Array.isArray(tags)) {
    errors.push({
      code: ERROR_CODES.ASSET_RELATIONSHIP_TAGS_MISSING,
      asset_path: asset.asset_path,
      detail: "relationship_tags must be an array",
    });
    return { ok: false };
  }

  // Duplicate tags are invalid in all modes (deterministic structure contract).
  const seen = new Set();
  for (const t of tags) {
    if (seen.has(t)) {
      errors.push({
        code: ERROR_CODES.ASSET_DUPLICATE_RELATIONSHIP_TAGS,
        asset_path: asset.asset_path,
        detail: `duplicate relationship tag: ${t}`,
      });
      return { ok: false };
    }
    seen.add(t);
  }

  for (const t of tags) {
    if (!RELATIONSHIP_TAGS.includes(t)) {
      errors.push({
        code: ERROR_CODES.ASSET_RELATIONSHIP_TAG_INVALID,
        asset_path: asset.asset_path,
        detail: `invalid relationship tag: ${t}`,
      });
      return { ok: false };
    }
  }

  if (!strict) {
    return { ok: true };
  }

  // Strict closure relationship-empty rule is only allowed for UNKNOWN,
  // and only when classification_evidence explicitly states relationship inference could not be made.
  if (tags.length === 0) {
    if (asset.current_state !== "UNKNOWN") {
      errors.push({
        code: ERROR_CODES.ASSET_RELATIONSHIP_TAGS_MISSING,
        asset_path: asset.asset_path,
        detail: "empty relationship_tags not allowed unless current_state=UNKNOWN",
      });
      return { ok: false };
    }

    const evidence = Array.isArray(asset.classification_evidence)
      ? asset.classification_evidence
      : [];
    const marker = evidence.some((e) =>
      String(e).toLowerCase().includes("no supported relationship inferred")
    );
    const nextOk = isMeaningfulNextValidation(asset.next_validation) &&
      /relationship/.test(String(asset.next_validation).toLowerCase());

    if (!marker || !nextOk) {
      errors.push({
        code: ERROR_CODES.ASSET_RELATIONSHIP_TAGS_MISSING,
        asset_path: asset.asset_path,
        detail:
          "UNKNOWN empty relationship_tags not allowed without explicit relationship-inference evidence marker and relationship-discovery next_validation",
      });
      return { ok: false };
    }
  }

  return { ok: true };
}

function matchBatchRule(rule, assetPath) {
  const p = normalizePath(assetPath);

  if (rule.type === "prefix_any") {
    return rule.values.some((v) => p.startsWith(v));
  }

  if (rule.type === "direct_child") {
    if (!p.startsWith(rule.prefix)) return false;
    const rest = p.slice(rule.prefix.length);
    return rest.length > 0 && !rest.includes("/");
  }

  if (rule.type === "script_basename") {
    if (!p.startsWith(rule.prefix)) return false;
    const rest = p.slice(rule.prefix.length);
    if (rest.includes("/")) return false; // must be direct child of scripts/

    const basename = rest;
    for (const sw of rule.starts_with || []) {
      if (basename.startsWith(sw)) return true;
    }
    for (const ex of rule.exact || []) {
      if (basename === ex) return true;
    }
    return false;
  }

  if (rule.type === "root_extensions") {
    if (p.includes("/")) return false;
    return (rule.extensions || []).some((ext) => p.endsWith(ext));
  }

  if (rule.type === "root_not_extensions") {
    if (p.includes("/")) return false;
    const excludedExt = rule.excluded_extensions || [];
    for (const ext of excludedExt) {
      if (p.endsWith(ext)) return false;
    }
    const excludedExact = rule.excluded_exact || [];
    if (excludedExact.includes(p)) return false;
    return true;
  }

  if (rule.type === "exact_or_prefix") {
    const exact = rule.exact || [];
    const prefixes = rule.prefix || [];
    if (exact.includes(p)) return true;
    return prefixes.some((pref) => p.startsWith(pref));
  }

  throw new Error(`Unknown batch rule type: ${rule.type}`);
}

function assignAssetToBatch(assetPath, batches) {
  const p = normalizePath(assetPath);
  for (const batch of batches) {
    if (matchBatchRule(batch.rule, p)) return batch.batch_id;
  }
  return null;
}

function computeBatchMembership(assetPaths, batches) {
  const batchById = new Map(batches.map((b) => [b.batch_id, b]));
  const membership = new Map();
  const rawMatches = new Map(); // asset_path -> matched batch_ids
  let unbatched = [];

  for (const assetPath of assetPaths) {
    const p = normalizePath(assetPath);
    const matched = [];
    for (const batch of batches) {
      if (matchBatchRule(batch.rule, p)) matched.push(batch.batch_id);
    }
    rawMatches.set(p, matched);
    if (matched.length === 0) {
      unbatched.push(p);
      continue;
    }

    const chosen = matched[0]; // fixed ordered first-match
    if (!membership.has(chosen)) membership.set(chosen, []);
    membership.get(chosen).push(p);
  }

  // Sort paths for deterministic membership snapshots.
  for (const [id, paths] of membership.entries()) {
    paths.sort((a, b) => a.localeCompare(b));
  }

  let rawOverlapCount = 0;
  let rawOverlapExamples = [];
  for (const [p, matched] of rawMatches.entries()) {
    if (matched.length > 1) {
      rawOverlapCount += 1;
      if (rawOverlapExamples.length < 20) {
        rawOverlapExamples.push({ asset_path: p, matched_batch_ids: matched });
      }
    }
  }

  // Compute duplicate final membership (should not happen with ordered first-match).
  // We define duplicates as a path appearing in multiple batch lists in final membership.
  const counts = new Map();
  for (const [id, paths] of membership.entries()) {
    for (const p of paths) counts.set(p, (counts.get(p) || 0) + 1);
  }
  let duplicateFinalMembership = 0;
  for (const [, c] of counts.entries()) {
    if (c > 1) duplicateFinalMembership += 1;
  }

  return {
    membership,
    unbatched,
    rawOverlapCount,
    rawOverlapExamples,
    duplicateFinalMembership,
    governedTotal: assetPaths.length,
    batchedTotal: assetPaths.length - unbatched.length,
  };
}

function loadAssetRegister(registerPath = ASSET_REGISTER_PATH) {
  return loadJson(registerPath);
}

function loadBatchManifest(manifestPath = MANIFEST_PATH) {
  return loadJson(manifestPath);
}

function evaluateClassification({
  register,
  manifest,
  membership,
  closure,
  repositoryMapContent,
  manifestPath,
  mapPath,
}) {
  const assets = register.assets || [];
  const batches = manifest.batches || [];

  const errors = [];

  // ---- Manifest structural validation ----
  const orderedBatchIds = batches.map((b) => b.batch_id);
  const expectedBatchIds = [
    "B01",
    "B02",
    "B03",
    "B04",
    "B05",
    "B06",
    "B07",
    "B08",
    "B09",
    "B10",
    "B11",
    "B12",
    "B13",
    "B14",
    "B15",
    "B16",
    "B17",
    "B18",
    "B19",
    "B20",
    "B21",
    "B22",
    "B23",
    "B24",
    "B25",
    "B26",
    "B27",
    "B28",
    "B29",
  ];

  // Foundation: structural drift must be caught (fail-closed).
  if (batches.length !== 29) {
    errors.push({
      code: ERROR_CODES.ASSET_BATCH_MISSING,
      detail: `Expected 29 batches, got ${batches.length}`,
    });
  }
  for (let i = 0; i < expectedBatchIds.length; i++) {
    if (orderedBatchIds[i] !== expectedBatchIds[i]) {
      errors.push({
        code: ERROR_CODES.ASSET_BATCH_MISSING,
        detail: `Batch id drift at position ${i}: expected ${expectedBatchIds[i]} got ${orderedBatchIds[i]}`,
      });
      break;
    }
  }

  // ---- Membership & drift checks ----
  const recomputedMembership = membership || computeBatchMembership(assets.map((a) => a.asset_path), batches);

  if (recomputedMembership.unbatched.length > 0) {
    errors.push({
      code: ERROR_CODES.ASSET_UNBATCHED,
      detail: `Unbatched assets: ${recomputedMembership.unbatched.length}`,
    });
  }

  if (recomputedMembership.duplicateFinalMembership !== 0) {
    errors.push({
      code: ERROR_CODES.ASSET_DUPLICATE_MEMBERSHIP,
      detail: `Duplicate final membership paths: ${recomputedMembership.duplicateFinalMembership}`,
    });
  }

  // Manifest drift: in foundation mode and strict closure, manifest membership must match recomputation.
  const manifestBatchesById = new Map(batches.map((b) => [b.batch_id, b]));
  for (const batchId of orderedBatchIds) {
    const batch = manifestBatchesById.get(batchId);
    const recomputedPaths = recomputedMembership.membership.get(batchId) || [];
    const manifestPaths = (batch.asset_paths || []).map(normalizePath).sort((a, b) => a.localeCompare(b));
    const samePaths =
      manifestPaths.length === recomputedPaths.length &&
      manifestPaths.every((p, idx) => p === recomputedPaths[idx]);

    if (!samePaths) {
      errors.push({
        code: ERROR_CODES.ASSET_BATCH_MANIFEST_DRIFT,
        detail: `Manifest membership drift for ${batchId}`,
        asset_path: batchId,
      });
      break;
    }

    const manifestCount = Number(batch.asset_count || 0);
    if (manifestCount !== recomputedPaths.length) {
      errors.push({
        code: ERROR_CODES.ASSET_BATCH_MANIFEST_COUNT_DRIFT,
        detail: `Manifest asset_count drift for ${batchId}`,
      });
      break;
    }
  }

  // ---- Repo map drift check (default mode only) ----
  if (!closure) {
    const expected = renderRepositoryMap({
      register,
      manifest,
      recomputedMembership,
      closureReady: false,
    });
    const actualContent =
      repositoryMapContent !== undefined
        ? repositoryMapContent
        : fs.existsSync(mapPath || MAP_PATH)
        ? readText(mapPath || MAP_PATH)
        : "";

    const normalizeMd = (s) => String(s).replace(/\r\n/g, "\n").trimEnd();
    if (normalizeMd(expected) !== normalizeMd(actualContent)) {
      errors.push({
        code: ERROR_CODES.ASSET_REPOSITORY_MAP_DRIFT,
        detail: "Repository map content drift",
      });
    }
  }

  // ---- Asset field checks & closure classifications ----
  let structurallyExtended = 0;
  let fullyClassified = 0;
  let classificationPending = 0;
  let unknownCount = 0;

  for (const asset of assets) {
    const assetErrorCountAtStart = errors.length;
    const pdesc = asset.purpose_description;
    const fg = asset.functional_group;
    const relTags = asset.relationship_tags;
    const evidence = asset.classification_evidence;

    const purposeOk = typeof pdesc === "string";
    const fgOk = typeof fg === "string";
    const relOk = Array.isArray(relTags);
    const evidenceOk = Array.isArray(evidence);

    if (purposeOk && fgOk && relOk && evidenceOk) {
      structurallyExtended += 1;
    } else {
      errors.push({
        code: ERROR_CODES.ASSET_STRUCTURAL_TYPE_INVALID,
        asset_path: asset.asset_path,
        detail: "Missing or wrong EAC structural field type",
      });
    }

    if (asset.current_state === "UNKNOWN") unknownCount += 1;

    // Foundation mode: only validate enums for non-empty values.
    if (!closure) {
      if (safeTrim(fg) !== "") {
        const validFg = getApprovedFunctionalGroup(fg);
        if (validFg === null) {
          errors.push({
            code: ERROR_CODES.ASSET_FUNCTIONAL_GROUP_INVALID,
            asset_path: asset.asset_path,
            detail: `Invalid functional_group: ${fg}`,
          });
        }
      }

      // relationship tags: empty allowed only while classification pending
      // but validity checks still apply for any non-empty tags.
      if (Array.isArray(relTags) && relTags.length > 0) {
        const seen = new Set();
        for (const t of relTags) {
          if (seen.has(t)) {
            errors.push({
              code: ERROR_CODES.ASSET_DUPLICATE_RELATIONSHIP_TAGS,
              asset_path: asset.asset_path,
              detail: `duplicate relationship tag: ${t}`,
            });
            break;
          }
          seen.add(t);
          if (!RELATIONSHIP_TAGS.includes(t)) {
            errors.push({
              code: ERROR_CODES.ASSET_RELATIONSHIP_TAG_INVALID,
              asset_path: asset.asset_path,
              detail: `Invalid relationship tag: ${t}`,
            });
            break;
          }
        }
      }

      if (Array.isArray(evidence)) {
        for (const e of evidence) {
          if (typeof e !== "string") {
            errors.push({
              code: ERROR_CODES.ASSET_STRUCTURAL_TYPE_INVALID,
              asset_path: asset.asset_path,
              detail: "classification_evidence elements must be strings",
            });
            break;
          }
        }
      }

      const isFullyClassified =
        safeTrim(pdesc) !== "" &&
        safeTrim(fg) !== "" &&
        evidence.some((e) => isNonEmptyString(e)) &&
        Array.isArray(relTags) &&
        relTags.length > 0 &&
        RELATIONSHIP_TAGS.every((t) => true); // placeholder; full validation in strict closure

      if (isFullyClassified) fullyClassified += 1;
      else classificationPending += 1;
      continue;
    }

    // ---- Strict closure rules ----
    // Required non-empty classification fields.
    if (safeTrim(pdesc) === "") {
      errors.push({
        code: ERROR_CODES.ASSET_PURPOSE_MISSING,
        asset_path: asset.asset_path,
      });
    }

    const validFg = getApprovedFunctionalGroup(fg);
    if (safeTrim(fg) === "") {
      errors.push({
        code: ERROR_CODES.ASSET_FUNCTIONAL_GROUP_MISSING,
        asset_path: asset.asset_path,
      });
    } else if (validFg === null) {
      errors.push({
        code: ERROR_CODES.ASSET_FUNCTIONAL_GROUP_INVALID,
        asset_path: asset.asset_path,
        detail: `Invalid functional_group: ${fg}`,
      });
    }

    if (!Array.isArray(evidence) || evidence.length === 0) {
      errors.push({
        code: ERROR_CODES.ASSET_CLASSIFICATION_EVIDENCE_MISSING,
        asset_path: asset.asset_path,
      });
    } else if (!evidence.some((e) => isNonEmptyString(e))) {
      errors.push({
        code: ERROR_CODES.ASSET_CLASSIFICATION_EVIDENCE_MISSING,
        asset_path: asset.asset_path,
      });
    }

    const relationshipResult = checkRelationshipTagsArray(asset, errors, true);
    if (!relationshipResult.ok) {
      // errors already pushed
    }

    if (asset.current_state === "UNKNOWN") {
      if (!isMeaningfulNextValidation(asset.next_validation)) {
        errors.push({
          code: ERROR_CODES.ASSET_UNKNOWN_NEXT_VALIDATION_MISSING,
          asset_path: asset.asset_path,
        });
      }
    } else {
      if (!safeTrim(asset.next_validation)) {
        errors.push({
          code: ERROR_CODES.ASSET_UNKNOWN_NEXT_VALIDATION_MISSING,
          asset_path: asset.asset_path,
          detail: "next_validation must be non-empty",
        });
      }
    }

    if (errors.length === assetErrorCountAtStart) fullyClassified += 1;
    else classificationPending += 1;
  }

  // In strict closure, closure-ready means all assets are fully classified.
  const total = assets.length;
  let closureReady = false;
  if (!closure) {
    closureReady = false; // foundation is not closure-ready by design unless fullyClassified===total
    if (fullyClassified === total) closureReady = true;
  } else {
    closureReady = errors.length === 0 && fullyClassified === total;
  }

  if (closure) {
    // For strict closure, we consider the run passed only when closureReady is true.
  }

  const result = {
    passed: errors.length === 0 && (!closure || closureReady),
    closureReady,
    errors,
    summary: {
      totalGovernedAssets: assets.length,
      totalBatchedAssets: assets.length - (membership.unbatched?.length || 0),
      unbatchedAssets: membership.unbatched?.length || 0,
      duplicateFinalMembership: membership.duplicateFinalMembership,
      rawOverlapCount: membership.rawOverlapCount,
      rawOverlapExamples: membership.rawOverlapExamples,
      structurallyExtendedAssets: structurallyExtended,
      fullyClassifiedAssets: closure ? (errors.length === 0 ? total : 0) : fullyClassified,
      classificationPendingAssets: closure ? (errors.length === 0 ? 0 : total) : classificationPending,
      unknownCount,
    },
  };

  return result;
}

function renderRepositoryMap({ register, manifest, recomputedMembership, closureReady }) {
  const assets = register.assets || [];
  const batches = manifest.batches || [];

  const totalGovernedAssets = assets.length;
  const totalBatchedAssets =
    totalGovernedAssets - (recomputedMembership.unbatched || []).length;

  const currentStateCounts = new Map();
  for (const asset of assets) {
    currentStateCounts.set(asset.current_state, (currentStateCounts.get(asset.current_state) || 0) + 1);
  }

  const functionalCounts = new Map();
  for (const asset of assets) {
    const fg = String(asset.functional_group || "");
    const key = fg.trim() === "" ? "(PENDING)" : fg;
    functionalCounts.set(key, (functionalCounts.get(key) || 0) + 1);
  }

  const relationshipTagCounts = new Map();
  for (const asset of assets) {
    const tags = Array.isArray(asset.relationship_tags) ? asset.relationship_tags : [];
    for (const t of tags) {
      relationshipTagCounts.set(t, (relationshipTagCounts.get(t) || 0) + 1);
    }
  }

  const fullyClassifiedAssets = 0; // foundation stage map generation does not infer content classification
  const classificationPendingAssets = assets.length; // foundation stage

  const nextValidationNonEmpty = assets.filter((a) => safeTrim(a.next_validation)).length;

  const header = [];
  header.push(`# EDGE ASSET REPOSITORY MAP`);
  header.push(`EAC_PROJECT_ID: ${manifest.project_id}`);
  header.push(`MANIFEST_SCHEMA_VERSION: ${manifest.schema_version}`);
  header.push(`TOTAL_GOVERNED_ASSETS: ${totalGovernedAssets}`);
  header.push(`TOTAL_BATCHED_ASSETS: ${totalBatchedAssets}`);
  header.push(`FULLY_CLASSIFIED_ASSETS: ${fullyClassifiedAssets}`);
  header.push(`CLASSIFICATION_PENDING_ASSETS: ${classificationPendingAssets}`);
  header.push(`CLOSURE_READY: ${closureReady ? "YES" : "NO"}`);
  header.push("");

  header.push(`CURRENT_STATE_COUNTS`);
  const csOrder = [
    "CURRENT",
    "PARALLEL",
    "LEGACY",
    "HISTORICAL_EVIDENCE",
    "STALE_OR_SUPERSEDED",
    "UNKNOWN",
    "GENERATED",
  ];
  for (const s of csOrder) {
    header.push(`- ${s}: ${currentStateCounts.get(s) || 0}`);
  }

  header.push("");
  header.push(`FUNCTIONAL_GROUP_COUNTS`);
  for (const [k, v] of [...functionalCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    header.push(`- ${k}: ${v}`);
  }

  header.push("");
  header.push(`RELATIONSHIP_TAG_COUNTS`);
  for (const [k, v] of [...relationshipTagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    header.push(`- ${k}: ${v}`);
  }

  header.push("");
  header.push(`NEXT_VALIDATION_NON_EMPTY_ASSETS: ${nextValidationNonEmpty}`);
  header.push("");

  header.push(`BATCH_COMPLETION_SUMMARY`);
  for (const batch of batches) {
    const paths = (recomputedMembership.membership.get(batch.batch_id) || []).slice().sort((a, b) => a.localeCompare(b));
    // Foundation stage: fully classified are always 0.
    header.push(`- ${batch.batch_id} | ${batch.title} | ASSET_COUNT=${paths.length} | CLASSIFIED=0 | PENDING=${paths.length}`);
  }

  header.push("");
  header.push(`PER_ASSET_BY_BATCH`);

  for (const batch of batches) {
    const paths = (recomputedMembership.membership.get(batch.batch_id) || []).slice().sort((a, b) => a.localeCompare(b));
    header.push(``);
    header.push(`## ${batch.batch_id} ${batch.title}`);
    header.push(`| asset_path | purpose_description | functional_group | current_state | relationship_tags | classification_evidence | next_validation |`);
    header.push(`|---|---|---|---|---|---|---|`);

    const assetByPath = new Map(assets.map((a) => [normalizePath(a.asset_path), a]));

    for (const p of paths) {
      const a = assetByPath.get(normalizePath(p));
      const purpose = safeTrim(a.purpose_description) === "" ? "PENDING" : a.purpose_description;
      const fg = safeTrim(a.functional_group) === "" ? "PENDING" : a.functional_group;
      const rel = Array.isArray(a.relationship_tags) && a.relationship_tags.length === 0 ? "PENDING" : JSON.stringify(a.relationship_tags);
      const ev =
        Array.isArray(a.classification_evidence) && a.classification_evidence.length === 0
          ? "PENDING"
          : JSON.stringify(a.classification_evidence);
      const row = `| ${a.asset_path} | ${escapeMd(purpose)} | ${escapeMd(fg)} | ${a.current_state} | ${escapeMd(rel)} | ${escapeMd(ev)} | ${escapeMd(a.next_validation)} |`;
      header.push(row);
    }
  }

  header.push("");
  return header.join("\n");
}

function escapeMd(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function runCheck(options = {}) {
  const closure = Boolean(options.closure);
  const refreshManifest = Boolean(options.refreshManifest);
  const writeMap = Boolean(options.writeMap);
  const manifestPath = options.manifestPath || MANIFEST_PATH;
  const mapPath = options.mapPath || MAP_PATH;
  const repositoryMapContent = options.repositoryMapContent;

  const register = loadAssetRegister(ASSET_REGISTER_PATH);
  const manifest = loadBatchManifest(manifestPath);
  const batches = manifest.batches || [];

  const assets = register.assets || [];
  const assetPaths = assets.map((a) => a.asset_path);
  const recomputedMembership = computeBatchMembership(assetPaths, batches);

  if (refreshManifest) {
    // Refresh membership snapshot only (rule definitions remain untouched).
    const updated = {
      ...manifest,
      batches: manifest.batches.map((batch) => {
        const paths = (recomputedMembership.membership.get(batch.batch_id) || []).slice();
        return {
          ...batch,
          asset_paths: paths,
          asset_count: paths.length,
        };
      }),
    };
    writeJson(manifestPath, updated);
    if (!writeMap) {
      return {
        passed: true,
        closureReady: false,
        errors: [],
        summary: updatedSummaryFromMembership(recomputedMembership, assets.length),
      };
    }
  }

  // Reload updated manifest if we refreshed it.
  const manifestToUse = refreshManifest ? loadBatchManifest(manifestPath) : manifest;
  const membershipToUse = recomputedMembership;

  if (writeMap) {
    const mapContent = renderRepositoryMap({
      register,
      manifest: manifestToUse,
      recomputedMembership: membershipToUse,
      closureReady: false,
    });
    fs.writeFileSync(mapPath, mapContent, "utf8");
  }

  const result = evaluateClassification({
    register,
    manifest: manifestToUse,
    membership: membershipToUse,
    closure,
    repositoryMapContent,
    manifestPath,
    mapPath,
  });

  if (!closure && refreshManifest) {
    // In practice refresh-manifest is used standalone; leave pass/fail to evaluate.
  }

  return result;
}

function updatedSummaryFromMembership(m, totalAssets) {
  return {
    totalGovernedAssets: totalAssets,
    totalBatchedAssets: totalAssets - (m.unbatched?.length || 0),
    unbatchedAssets: m.unbatched?.length || 0,
    duplicateFinalMembership: m.duplicateFinalMembership,
    rawOverlapCount: m.rawOverlapCount,
    rawOverlapExamples: m.rawOverlapExamples,
  };
}

function printSummary({ result }) {
  const sum = result.summary || {};
  console.log("");
  console.log(`TOTAL GOVERNED ASSETS: ${sum.totalGovernedAssets}`);
  console.log(`TOTAL BATCHED ASSETS: ${sum.totalBatchedAssets}`);
  console.log(`UNBATCHED ASSETS: ${sum.unbatchedAssets}`);
  console.log(`DUPLICATE FINAL MEMBERSHIP: ${sum.duplicateFinalMembership}`);
  console.log("");
  if (!result.closureReady) {
    console.log(`CLOSURE READY: NO`);
  } else {
    console.log(`CLOSURE READY: YES`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const closure = args.includes("--closure");
  const refreshManifest = args.includes("--refresh-manifest");
  const writeMap = args.includes("--write-map");

  const result = runCheck({
    closure,
    refreshManifest,
    writeMap,
  });

  // Render a deterministic console summary.
  console.log("=== EDGE ASSET CLASSIFICATION CHECK ===");
  if (refreshManifest) {
    console.log("Mode: refresh-manifest");
  } else if (writeMap) {
    console.log("Mode: write-map");
  } else if (closure) {
    console.log("Mode: strict closure");
  } else {
    console.log("Mode: foundation");
  }

  if (result.errors?.length) {
    console.log(`Errors: ${result.errors.length}`);
  }

  const sum = result.summary || {};
  // These fields are required by the foundation/sequence expectations.
  const total = sum.totalGovernedAssets || 0;
  console.log(`TOTAL GOVERNED ASSETS: ${total}`);
  console.log(`TOTAL BATCHED ASSETS: ${sum.totalBatchedAssets || 0}`);
  console.log(`UNBATCHED ASSETS: ${sum.unbatchedAssets || 0}`);
  console.log(
    `DUPLICATE FINAL MEMBERSHIP: ${sum.duplicateFinalMembership || 0}`
  );
  if (refreshManifest) {
    const manifest = loadBatchManifest(MANIFEST_PATH);
    console.log(`BATCH COUNT: ${manifest.batches.length}`);
    const largest = manifest.batches
      .map((b) => ({ id: b.batch_id, count: b.asset_count || 0 }))
      .sort((a, b) => b.count - a.count)[0];
    console.log(`LARGEST BATCH: ${largest?.count || 0}`);
    const over100 = manifest.batches.filter((b) => (b.asset_count || 0) > 100);
    console.log(`BATCHES OVER 100: ${over100.length}`);
  } else {
    console.log(`CLOSURE READY: ${result.closureReady ? "YES" : "NO"}`);
    console.log(
      `STRUCTURALLY EXTENDED ASSETS: ${sum.structurallyExtendedAssets || 0}`
    );
    console.log(`FULLY CLASSIFIED ASSETS: ${sum.fullyClassifiedAssets || 0}`);
    console.log(
      `CLASSIFICATION PENDING ASSETS: ${sum.classificationPendingAssets || 0}`
    );
  }

  if (closure) {
    if (result.passed) {
      console.log("RESULT: PASS (unexpected for foundation state)");
      process.exit(0);
    }
    console.log("RESULT: FAIL / NOT READY");
    process.exit(1);
  }

  if (!result.passed) {
    console.log("RESULT: FAIL");
    process.exit(1);
  }
  console.log("RESULT: PASS");
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  FUNCTIONAL_GROUPS,
  RELATIONSHIP_TAGS,
  loadAssetRegister,
  loadBatchManifest,
  matchBatchRule,
  assignAssetToBatch,
  computeBatchMembership,
  evaluateClassification: ({ register, manifest, membership, closure, repositoryMapContent, mapPath }) => {
    const result = evaluateClassification({
      register,
      manifest,
      membership,
      closure,
      repositoryMapContent,
      mapPath,
    });
    return result;
  },
  renderRepositoryMap,
  runCheck,
};
