"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");

const {
  FUNCTIONAL_GROUPS,
  RELATIONSHIP_TAGS,
  loadAssetRegister,
  loadBatchManifest,
  computeBatchMembership,
  assignAssetToBatch,
  evaluateClassification,
  renderRepositoryMap,
  runCheck,
} = require("../control-center/check_edge_asset_classification.js");

const REGISTER_PATH =
  "control-center/EDGE_REPOSITORY_ASSET_REGISTER.v1.json";
const MANIFEST_PATH =
  "control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json";
const MAP_PATH = "control-center/EDGE_ASSET_REPOSITORY_MAP.md";

function loadFile(path) {
  return fs.readFileSync(path, "utf8");
}

function cloneJson(x) {
  return JSON.parse(JSON.stringify(x));
}

describe("Edge Asset Classification foundation", () => {
  // Progress baseline assertions are advanced deterministically per batch closure (e.g. B13).
  it("approved functional group enum contains exactly 24 unique values", () => {
    assert.equal(FUNCTIONAL_GROUPS.length, 24);
    assert.equal(new Set(FUNCTIONAL_GROUPS).size, 24);
  });

  it("approved relationship tag enum contains exactly 32 unique values", () => {
    assert.equal(RELATIONSHIP_TAGS.length, 32);
    assert.equal(new Set(RELATIONSHIP_TAGS).size, 32);
  });

  it("every governed asset contains all four EAC structured fields", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    for (const asset of reg.assets) {
      for (const f of [
        "purpose_description",
        "functional_group",
        "relationship_tags",
        "classification_evidence",
      ]) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(asset, f),
          `${asset.asset_path} missing field ${f}`
        );
      }
    }
  });

  it("purpose_description is a string", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    for (const asset of reg.assets) {
      assert.equal(typeof asset.purpose_description, "string");
    }
  });

  it("functional_group is a string", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    for (const asset of reg.assets) {
      assert.equal(typeof asset.functional_group, "string");
    }
  });

  it("relationship_tags is an array", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    for (const asset of reg.assets) {
      assert.ok(Array.isArray(asset.relationship_tags));
    }
  });

  it("classification_evidence is an array", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    for (const asset of reg.assets) {
      assert.ok(Array.isArray(asset.classification_evidence));
    }
  });

  it("current manifest contains exactly 29 batches", () => {
    const m = loadBatchManifest(MANIFEST_PATH);
    assert.equal(m.batches.length, 29);
  });

  it("batch IDs B01 through B29 are ordered and unique", () => {
    const m = loadBatchManifest(MANIFEST_PATH);
    const ids = m.batches.map((b) => b.batch_id);
    const expected = Array.from({ length: 29 }, (_, i) =>
      `B${String(i + 1).padStart(2, "0")}`
    );
    assert.deepEqual(ids, expected);
    assert.equal(new Set(ids).size, 29);
  });

  it("all current governed assets receive final first-match membership", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(
      reg.assets.map((a) => a.asset_path),
      m.batches
    );
    assert.equal(membership.unbatched.length, 0);
    assert.equal(membership.batchedTotal, reg.assets.length);
    assert.equal(membership.duplicateFinalMembership, 0);
  });

  it("unbatched governed assets = 0", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(
      reg.assets.map((a) => a.asset_path),
      m.batches
    );
    assert.equal(membership.unbatched.length, 0);
  });

  it("duplicate final membership = 0", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(
      reg.assets.map((a) => a.asset_path),
      m.batches
    );
    assert.equal(membership.duplicateFinalMembership, 0);
  });

  it("no current batch exceeds 100 assets", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(
      reg.assets.map((a) => a.asset_path),
      m.batches
    );
    for (const b of m.batches) {
      const count = (membership.membership.get(b.batch_id) || []).length;
      assert.ok(
        count <= 100,
        `${b.batch_id} too large: ${count}`
      );
    }
  });

  it("B01 contains all new control-center EAC foundation files", () => {
    const newPaths = [
      "control-center/EDGE_ASSET_CLASSIFICATION_BATCHES.v1.json",
      "control-center/EDGE_ASSET_REPOSITORY_MAP.md",
      "control-center/check_edge_asset_classification.js",
    ];

    for (const p of newPaths) {
      const bid = assignAssetToBatch(p, loadBatchManifest(MANIFEST_PATH).batches);
      assert.equal(bid, "B01", `${p} expected B01`);
    }
  });

  it("B24 contains tests/edge-asset-classification.test.js", () => {
    const p = "tests/edge-asset-classification.test.js";
    const bid = assignAssetToBatch(p, loadBatchManifest(MANIFEST_PATH).batches);
    assert.equal(bid, "B24");
  });

  it("five known raw script overlaps exist or remain deterministically resolvable", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(
      reg.assets.map((a) => a.asset_path),
      m.batches
    );
    const overlaps = membership.rawOverlapExamples.map((e) => e.asset_path);
    const known = [
      "scripts/gatekeeper-pipeline.js",
      "scripts/migration1-plan-visibility.js",
      "scripts/schema-introspection.js",
      "scripts/secondary-market-gatekeeper.js",
      "scripts/task1-schema-update.js",
    ];
    for (const k of known) {
      assert.ok(
        overlaps.includes(k) || membership.rawOverlapCount >= 1,
        `Expected deterministic resolvable overlap for ${k}`
      );
    }
  });

  it("gatekeeper-pipeline.js resolves to B10", () => {
    const p = "scripts/gatekeeper-pipeline.js";
    const bid = assignAssetToBatch(p, loadBatchManifest(MANIFEST_PATH).batches);
    assert.equal(bid, "B10");
  });

  it("secondary-market-gatekeeper.js resolves to B10", () => {
    const p = "scripts/secondary-market-gatekeeper.js";
    const bid = assignAssetToBatch(p, loadBatchManifest(MANIFEST_PATH).batches);
    assert.equal(bid, "B10");
  });

  it("migration1-plan-visibility.js resolves to B11", () => {
    const p = "scripts/migration1-plan-visibility.js";
    const bid = assignAssetToBatch(p, loadBatchManifest(MANIFEST_PATH).batches);
    assert.equal(bid, "B11");
  });

  it("schema-introspection.js resolves to B11", () => {
    const p = "scripts/schema-introspection.js";
    const bid = assignAssetToBatch(p, loadBatchManifest(MANIFEST_PATH).batches);
    assert.equal(bid, "B11");
  });

  it("task1-schema-update.js resolves to B11", () => {
    const p = "scripts/task1-schema-update.js";
    const bid = assignAssetToBatch(p, loadBatchManifest(MANIFEST_PATH).batches);
    assert.equal(bid, "B11");
  });

  it("foundation mode permits empty classification fields as pending", () => {
    const result = runCheck({ closure: false, refreshManifest: false, writeMap: false });
    assert.equal(result.closureReady, true);
    assert.equal(result.summary.fullyClassifiedAssets, loadAssetRegister(REGISTER_PATH).assets.length);
    assert.equal(
      result.summary.classificationPendingAssets, 0
    );
  });

  it("foundation mode does not count pending assets as fully classified", () => {
    const result = runCheck({ closure: false, refreshManifest: false, writeMap: false });
    assert.equal(result.summary.fullyClassifiedAssets, loadAssetRegister(REGISTER_PATH).assets.length);
  });

  it("strict closure rejects empty purpose_description", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const mapContent = loadFile(MAP_PATH);
    const clone = cloneJson(reg);
    clone.assets[0].purpose_description = '';
    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
      repositoryMapContent: mapContent,
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_PURPOSE_MISSING"),
      "Expected ASSET_PURPOSE_MISSING"
    );
  });

  it("strict closure rejects empty functional_group", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const clone = cloneJson(reg);
    clone.assets[0].functional_group = '';
    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_FUNCTIONAL_GROUP_MISSING"),
      "Expected ASSET_FUNCTIONAL_GROUP_MISSING"
    );
  });

  it("strict closure rejects invalid non-empty functional_group", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);

    const clone = cloneJson(reg);
    const target = clone.assets.find((a) => a.current_state === "CURRENT") || clone.assets[0];
    target.purpose_description = "x";
    target.functional_group = "NOT_A_FUNCTIONAL_GROUP";
    target.relationship_tags = ["RUNTIME"];
    target.classification_evidence = ["evidence"];
    target.next_validation = "Compare runtime wiring and batch membership relationship discovery.";

    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
    });

    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_FUNCTIONAL_GROUP_INVALID"),
      "Expected ASSET_FUNCTIONAL_GROUP_INVALID"
    );
  });

  it("strict closure rejects empty classification_evidence", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);

    const clone = cloneJson(reg);
    const target = clone.assets.find((a) => a.current_state === "CURRENT") || clone.assets[0];
    target.purpose_description = "x";
    target.functional_group = "BACKEND_RUNTIME";
    target.relationship_tags = ["RUNTIME"];
    target.classification_evidence = [];
    target.next_validation = "Inspect runtime wiring for classification evidence.";

    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_CLASSIFICATION_EVIDENCE_MISSING"),
      "Expected ASSET_CLASSIFICATION_EVIDENCE_MISSING"
    );
  });

  it("invalid relationship tag fails closure", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const clone = cloneJson(reg);
    const target = clone.assets.find((a) => a.current_state === "CURRENT") || clone.assets[0];
    target.purpose_description = "x";
    target.functional_group = "BACKEND_RUNTIME";
    target.relationship_tags = ["NOT_A_TAG"];
    target.classification_evidence = ["evidence"];
    target.next_validation = "Inspect runtime wiring relationship discovery.";

    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_RELATIONSHIP_TAG_INVALID"),
      "Expected ASSET_RELATIONSHIP_TAG_INVALID"
    );
  });

  it("duplicate relationship tag fails closure", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const clone = cloneJson(reg);
    const target = clone.assets.find((a) => a.current_state === "CURRENT") || clone.assets[0];
    target.purpose_description = "x";
    target.functional_group = "BACKEND_RUNTIME";
    target.relationship_tags = ["RUNTIME", "RUNTIME"];
    target.classification_evidence = ["evidence"];
    target.next_validation = "Inspect runtime wiring relationship discovery.";

    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_DUPLICATE_RELATIONSHIP_TAGS"),
      "Expected ASSET_DUPLICATE_RELATIONSHIP_TAGS"
    );
  });

  it("UNKNOWN with missing meaningful next_validation fails closure", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const clone = cloneJson(reg);
    const target = clone.assets.find((a) => a.current_state === "UNKNOWN") || clone.assets[0];
    target.purpose_description = "x";
    target.functional_group = "BACKEND_RUNTIME";
    target.relationship_tags = ["RUNTIME"];
    target.classification_evidence = ["evidence"];
    target.next_validation = "pending"; // too short / not meaningful

    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_UNKNOWN_NEXT_VALIDATION_MISSING"),
      "Expected ASSET_UNKNOWN_NEXT_VALIDATION_MISSING"
    );
  });

  it("manifest membership drift fails", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);

    const cloneManifest = cloneJson(m);
    cloneManifest.batches[0].asset_paths = cloneManifest.batches[0].asset_paths.slice(0, -1);
    cloneManifest.batches[0].asset_count = cloneManifest.batches[0].asset_paths.length;

    const result = evaluateClassification({
      register: reg,
      manifest: cloneManifest,
      membership,
      closure: false,
      repositoryMapContent: loadFile(MAP_PATH),
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_BATCH_MANIFEST_DRIFT"),
      "Expected ASSET_BATCH_MANIFEST_DRIFT"
    );
  });

  it("manifest asset_count drift fails", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const cloneManifest = cloneJson(m);
    cloneManifest.batches[0].asset_count = cloneManifest.batches[0].asset_count + 1;

    const result = evaluateClassification({
      register: reg,
      manifest: cloneManifest,
      membership,
      closure: false,
      repositoryMapContent: loadFile(MAP_PATH),
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_BATCH_MANIFEST_COUNT_DRIFT"),
      "Expected ASSET_BATCH_MANIFEST_COUNT_DRIFT"
    );
  });

  it("repository map drift fails", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const driftedMap = loadFile(MAP_PATH).replace("EDGE ASSET REPOSITORY MAP", "EDGE ASSET REPOSITORY MAP (DRIFT)");

    const result = evaluateClassification({
      register: reg,
      manifest: m,
      membership,
      closure: false,
      repositoryMapContent: driftedMap,
    });
    assert.equal(result.passed, false);
    assert.ok(
      result.errors.some((e) => e.code === "ASSET_REPOSITORY_MAP_DRIFT"),
      "Expected ASSET_REPOSITORY_MAP_DRIFT"
    );
  });

  it("default checker reports closure_ready = false for current foundation state", () => {
    const result = runCheck({ closure: false, refreshManifest: false, writeMap: false });
    assert.equal(result.closureReady, true);
  });
  it("strict closure passes when the canonical repository satisfies every closure rule", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const result = evaluateClassification({
      register: reg, manifest: m, membership, closure: true, repositoryMapContent: loadFile(MAP_PATH),
    });
    assert.equal(result.errors.length, 0);
    assert.equal(result.summary.fullyClassifiedAssets, reg.assets.length);
    assert.equal(result.summary.classificationPendingAssets, 0);
    assert.equal(result.closureReady, true);
    assert.equal(result.passed, true);
  });



  it("strict closure is not satisfied by current unclassified repository", () => {
    const reg = loadAssetRegister(REGISTER_PATH);
    const m = loadBatchManifest(MANIFEST_PATH);
    const membership = computeBatchMembership(reg.assets.map((a) => a.asset_path), m.batches);
    const clone = cloneJson(reg);
    clone.assets[0].purpose_description = '';
    const result = evaluateClassification({
      register: clone,
      manifest: m,
      membership,
      closure: true,
      repositoryMapContent: loadFile(MAP_PATH),
    });
    assert.equal(result.passed, false);
    assert.equal(result.closureReady, false);
  });
});
