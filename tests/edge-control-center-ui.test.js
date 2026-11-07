"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

const path = require("path");
const fs = require("fs");

const controlCenterRouter = require("../backend/routes/controlCenter");

const eacChecker = require("../control-center/check_edge_asset_classification.js");
const ccChecker = require("../control-center/check_control_center.js");
const runtimeChecker = require("../control-center/check_edge_system_runtime_inventory.js");
const {
  loadAssetRegister,
} = require("../control-center/check_edge_repository_asset_register.js");

const CONTROL_CENTER_DIR = path.resolve(
  __dirname,
  "../control-center"
);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

const ADMIN_KEY = "edge_control_center_ui_test_admin_key";

describe("ECU-001 Control Center Operator UI", () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.ADMIN_API_KEY = ADMIN_KEY;

    const app = express();
    app.use("/api/control-center", controlCenterRouter);

    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) server.close();
  });

  async function fetchJson(url, { apiKey, method = "GET" } = {}) {
    const headers = {};
    if (apiKey !== undefined) headers["x-api-key"] = apiKey;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(url, { method, headers });
        const text = await res.text().catch(() => "");
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (_) {
          // ignore
        }
        return { res, json, text };
      } catch (err) {
        if (attempt === 1) throw err;
        // These tests run synchronous heavy validation work in the same process;
        // a short retry avoids intermittent connection resets.
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    throw new Error("fetchJson: unreachable");
  }

  it("all endpoints require admin authentication", async () => {
    const endpoints = [
      "/overview",
      "/projects",
      "/assets",
      "/gates",
      "/runtime",
      "/findings",
    ];

    for (const ep of endpoints) {
      const url = `${baseUrl}/api/control-center${ep}`;
      const missing = await fetchJson(url, { apiKey: undefined });
      assert.equal(missing.res.status, 401, `missing key: ${ep}`);

      const invalid = await fetchJson(url, {
        apiKey: "not_the_admin_key",
      });
      assert.equal(invalid.res.status, 403, `invalid key: ${ep}`);

      const ok = await fetchJson(url, { apiKey: ADMIN_KEY });
      assert.equal(ok.res.status, 200, `valid key: ${ep}`);
      assert.ok(ok.json && typeof ok.json === "object");
    }
  });

  it("routes are GET-only (no POST/PUT/PATCH/DELETE)", async () => {
    const methods = ["POST", "PUT", "PATCH", "DELETE"];
    for (const method of methods) {
      const { res } = await fetchJson(
        `${baseUrl}/api/control-center/overview`,
        { apiKey: ADMIN_KEY, method }
      );
      assert.ok(
        res.status === 404 || res.status === 405,
        `method ${method} should not be allowed`
      );
    }
  });

  it("overview derives counts from canonical data", async () => {
    const { res, json } = await fetchJson(
      `${baseUrl}/api/control-center/overview`,
      { apiKey: ADMIN_KEY }
    );

    assert.equal(res.status, 200);

    // Compute expected values after the request to keep the API call stable
    // under heavy synchronous validation work.
    const expectedEac = eacChecker.runCheck({
      closure: false,
      refreshManifest: false,
      writeMap: false,
    });

    const ledger = readJson(
      path.join(
        CONTROL_CENTER_DIR,
        "EDGE_BUILD_CONTROL_LEDGER.v1.json"
      )
    );
    const projectsRegister = readJson(
      path.join(
        CONTROL_CENTER_DIR,
        "EDGE_MASTER_PROJECT_REGISTER.v1.json"
      )
    );
    const runtimeInventory = readJson(
      path.join(
        CONTROL_CENTER_DIR,
        "EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json"
      )
    );
    const runtimeMapText = readText(
      path.join(CONTROL_CENTER_DIR, "EDGE_SYSTEM_RUNTIME_MAP.md")
    );
    const assetRegister = loadAssetRegister();

    const runtimeValidation = runtimeChecker.validateInventory({
      ledger,
      assetRegister,
      inventory: runtimeInventory,
      mapText: runtimeMapText,
    });

    assert.equal(
      json.classification.totalGovernedAssets,
      assetRegister.assets.length
    );
    assert.equal(
      json.classification.fullyClassifiedAssets,
      expectedEac.summary.fullyClassifiedAssets
    );
    assert.equal(
      json.classification.classificationPendingAssets,
      expectedEac.summary.classificationPendingAssets
    );

    assert.equal(
      json.projects.projectCount,
      projectsRegister.projects.length
    );
    assert.equal(
      json.projects.ledgerTaskCount,
      ledger.tasks.length
    );

    assert.equal(
      json.gates.scoutEdgeMarriageGate,
      ledger.scout_edge_marriage_gate
    );
    assert.equal(
      json.runtime.runtimeSurfacesTotal,
      runtimeInventory.surfaces.length
    );
    assert.equal(
      json.runtime.runtimeWarningCount,
      runtimeValidation.warnings.length
    );
  });

  it("assets endpoint paginates and enforces max pageSize", async () => {
    const { json } = await fetchJson(
      `${baseUrl}/api/control-center/assets?page=1&pageSize=999`,
      { apiKey: ADMIN_KEY }
    );

    assert.ok(Array.isArray(json.items));
    assert.ok(json.pageSize <= 100);
    assert.equal(json.pageSize, 100);
    assert.ok(json.items.length <= 100);
  });

  it("assets endpoint supports search and filters", async () => {
    const assetRegister = loadAssetRegister();
    const sampleAsset = assetRegister.assets[0];
    assert.ok(sampleAsset && sampleAsset.asset_path);

    const bySearch = await fetchJson(
      `${baseUrl}/api/control-center/assets?q=${encodeURIComponent(
        sampleAsset.asset_path
      )}&page=1&pageSize=5`,
      { apiKey: ADMIN_KEY }
    );

    assert.equal(bySearch.res.status, 200);
    assert.ok(
      bySearch.json.items.some(
        (a) => a.asset_path === sampleAsset.asset_path
      )
    );

    const stateResp = await fetchJson(
      `${baseUrl}/api/control-center/assets?state=${encodeURIComponent(
        sampleAsset.current_state
      )}&page=1&pageSize=25`,
      { apiKey: ADMIN_KEY }
    );

    assert.ok(stateResp.json.items.length > 0);
    assert.ok(
      stateResp.json.items.every(
        (a) => a.current_state === sampleAsset.current_state
      )
    );

    const groupResp = await fetchJson(
      `${baseUrl}/api/control-center/assets?group=${encodeURIComponent(
        sampleAsset.functional_group
      )}&page=1&pageSize=25`,
      { apiKey: ADMIN_KEY }
    );

    assert.ok(groupResp.json.items.length > 0);
    assert.ok(
      groupResp.json.items.every(
        (a) => a.functional_group === sampleAsset.functional_group
      )
    );

    const ownerResp = await fetchJson(
      `${baseUrl}/api/control-center/assets?owner=${encodeURIComponent(
        sampleAsset.owner_project_id
      )}&page=1&pageSize=25`,
      { apiKey: ADMIN_KEY }
    );

    assert.ok(ownerResp.json.items.length > 0);
    assert.ok(
      ownerResp.json.items.every(
        (a) => a.owner_project_id === sampleAsset.owner_project_id
      )
    );

    // Projection must not leak secrets / connection strings.
    const payload = JSON.stringify(bySearch.json);
    const forbidden = [
      "ADMIN_API_KEY",
      "DATABASE_URL",
      "BEGIN RSA PRIVATE KEY",
      "BEGIN PRIVATE KEY",
      "supabase.co",
      "postgres",
      "C:\\",
      "/Users/",
    ];
    for (const s of forbidden) {
      assert.equal(
        payload.includes(s),
        false,
        `assets projection must not contain ${s}`
      );
    }
  });

  it("HTML contains required dashboard sections and does not embed governed JSON", async () => {
    const htmlPath = path.join(
      __dirname,
      "../public/control-center.html"
    );
    const html = readText(htmlPath);

    for (const id of [
      "overview-section",
      "projects-section",
      "assets-section",
      "gates-section",
      "runtime-section",
      "findings-section",
    ]) {
      assert.ok(
        html.includes(`id="${id}"`),
        `missing section ${id}`
      );
    }

    assert.ok(html.includes("Admin Access Required"));
    assert.equal(
      html.includes("EDGE_REPOSITORY_ASSET_REGISTER"),
      false
    );
    assert.equal(html.includes("EDGE_MASTER_PROJECT_REGISTER"), false);
    assert.equal(html.includes("EDGE_SYSTEM_RUNTIME_INVENTORY"), false);
  });

  it("frontend stores admin key only in localStorage and uses x-api-key for requests", async () => {
    const jsPath = path.join(
      __dirname,
      "../public/js/control-center.js"
    );
    const js = readText(jsPath);

    assert.ok(js.includes("skcs_admin_api_key"));
    assert.ok(js.includes("'x-api-key'") || js.includes("x-api-key"));
    assert.equal(js.includes(ADMIN_KEY), false);
  });

  it("dedicated gates projection carries canonical Scout-Edge marriage gate", async () => {
    const ledger = readJson(
      path.join(CONTROL_CENTER_DIR, "EDGE_BUILD_CONTROL_LEDGER.v1.json")
    );
    const { res, json } = await fetchJson(
      `${baseUrl}/api/control-center/gates`,
      { apiKey: ADMIN_KEY }
    );

    assert.equal(res.status, 200);
    assert.equal(
      json.scoutEdgeMarriageGate,
      ledger.scout_edge_marriage_gate
    );
    assert.equal(
      json.supabaseStorageGate,
      ledger.supabase_storage_gate
    );
    assert.ok(json.scoutEdgeMarriageGate);
  });

  it("dedicated runtime projection agrees with overview canonical counts", async () => {
    const overview = await fetchJson(
      `${baseUrl}/api/control-center/overview`,
      { apiKey: ADMIN_KEY }
    );
    const runtime = await fetchJson(
      `${baseUrl}/api/control-center/runtime`,
      { apiKey: ADMIN_KEY }
    );

    assert.equal(overview.res.status, 200);
    assert.equal(runtime.res.status, 200);
    assert.equal(
      runtime.json.runtimeSurfacesTotal,
      overview.json.runtime.runtimeSurfacesTotal
    );
    assert.equal(
      runtime.json.runtimeWarningCount,
      overview.json.runtime.runtimeWarningCount
    );
    assert.ok(Number.isFinite(runtime.json.runtimeSurfacesTotal));
    assert.ok(Number.isFinite(runtime.json.runtimeWarningCount));
  });

  it("EAC-001 project projection carries TESTED closure next_action", async () => {
    const ledger = readJson(
      path.join(CONTROL_CENTER_DIR, "EDGE_BUILD_CONTROL_LEDGER.v1.json")
    );
    const eacTask = ledger.tasks.find((t) => t.task_id === "EAC-001");
    assert.ok(eacTask);

    const { res, json } = await fetchJson(
      `${baseUrl}/api/control-center/projects`,
      { apiKey: ADMIN_KEY }
    );
    assert.equal(res.status, 200);

    const eacProject = (json.projects || []).find(
      (p) => p.project_id === "EAC-001"
    );
    assert.ok(eacProject);
    assert.equal(eacProject.next_action, eacTask.next_action);
    assert.match(
      eacProject.next_action,
      /EAC-001 is TESTED and closed/
    );
    assert.equal(
      /Do not begin B01/.test(eacProject.next_action),
      false
    );
  });

  it("frontend loads dedicated gates and runtime endpoints", async () => {
    const jsPath = path.join(
      __dirname,
      "../public/js/control-center.js"
    );
    const js = readText(jsPath);

    assert.ok(js.includes("/api/control-center/gates"));
    assert.ok(js.includes("/api/control-center/runtime"));
    assert.ok(js.includes("runtimeSurfaces"));
    assert.ok(js.includes("runtimeWarnings"));
    assert.ok(js.includes("gatesList"));
    assert.equal(js.includes("BLOCKED"), false);
  });
});

