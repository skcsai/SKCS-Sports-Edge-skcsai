'use strict';

const ALLOWED_STARTUP_MODES = new Set(['normal', 'canary']);

function resolveStartupMode(env = process.env) {
    const raw = String(env.SKCS_STARTUP_MODE || 'normal').trim().toLowerCase();
    if (!ALLOWED_STARTUP_MODES.has(raw)) {
        throw new Error(`Invalid SKCS_STARTUP_MODE "${raw}". Allowed values: normal, canary.`);
    }

    const sideEffectsEnabled = raw === 'normal';
    return Object.freeze({
        mode: raw,
        sideEffectsEnabled,
        runDatabaseBootstrap: sideEffectsEnabled,
        initializeCronJobs: sideEffectsEnabled,
        startHeartbeat: sideEffectsEnabled
    });
}

function resolveCanaryRequestPolicy(env = process.env) {
    const startup = resolveStartupMode(env);
    const explicitRequestWrites = String(
        env.SKCS_CANARY_ALLOW_REQUEST_WRITES || ''
    ).trim().toLowerCase() === 'true';

    const requestWritesEnabled =
        startup.mode !== 'canary' || explicitRequestWrites;

    return Object.freeze({
        readOnly: startup.mode === 'canary' && !requestWritesEnabled,
        requestWritesEnabled
    });
}

module.exports = {
    ALLOWED_STARTUP_MODES,
    resolveStartupMode,
    resolveCanaryRequestPolicy
};
