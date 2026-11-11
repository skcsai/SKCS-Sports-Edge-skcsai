'use strict';

const fipIntakeService = require('./fipIntakeService');

const {
  createFixtureIdentityResolver
} = require('./fixtureIdentityResolverService');

const {
  createFixtureDisplayMetadataPersistenceService
} = require('./fixtureDisplayMetadataPersistenceService');

const {
  createFipIntakeEvidenceService,
  createEst001RetentionPolicy
} = require('./fipIntakeEvidenceService');

const {
  createGovernedFipIntakeAdapter
} = require('./governedFipIntakeAdapter');

const {
  createHmacM2MAuthenticator
} = require('./fipIntakeM2MAuthenticator');

function assertDependency(name, value) {
  if (value === null || value === undefined) {
    throw new TypeError(`Missing required dependency: ${name}`);
  }
}

function createGovernedFipIntakeComposition(deps = {}) {
  assertDependency('db', deps.db);
  assertDependency('gateReader', deps.gateReader);
  assertDependency('governor', deps.governor);
  assertDependency('clock', deps.clock);
  assertDependency('intakeIdGenerator', deps.intakeIdGenerator);
  assertDependency('secretResolver', deps.secretResolver);
  assertDependency('nonceStore', deps.nonceStore);

  const featureFlagEnabled =
    deps.featureFlagEnabled === true;

  const authenticator = createHmacM2MAuthenticator({
    secretResolver: deps.secretResolver,
    nonceStore: deps.nonceStore,
    clock: deps.clock,
    maxClockSkewMs: deps.maxClockSkewMs
  });

  const identityResolver = createFixtureIdentityResolver({
    query: deps.db.query
  });

  const displayMetadataPersistence =
    createFixtureDisplayMetadataPersistenceService({
      db: deps.db,
      gateReader: deps.gateReader,
      governor: deps.governor,
      featureFlagEnabled,
      clock: deps.clock,
      refreshGate: deps.refreshGate
    });

  const evidenceRecorder =
    createFipIntakeEvidenceService({
      db: deps.db,
      gateReader: deps.gateReader,
      governor: deps.governor,
      featureFlagEnabled,
      clock: deps.clock,
      retentionPolicy:
        deps.retentionPolicy ||
        createEst001RetentionPolicy(),
      refreshGate: deps.refreshGate
    });

  const adapter = createGovernedFipIntakeAdapter({
    fipIntakeService,
    fixtureIdentityResolver: identityResolver,
    displayMetadataPersistence,
    evidenceRecorder,
    gateReader: deps.gateReader,
    authorizeCaller: authenticator.authorizeCaller,
    featureFlagEnabled,
    clock: deps.clock,
    intakeIdGenerator: deps.intakeIdGenerator,
    readContextProofEvidence: deps.readContextProofEvidence
  });

  return Object.freeze({
    receiveValidatedFip:
      adapter.receiveValidatedFip,

    components: Object.freeze({
      authenticator,
      identityResolver,
      displayMetadataPersistence,
      evidenceRecorder
    }),

    activation: Object.freeze({
      featureFlagEnabled,
      productionRouteMounted: false,
      migrationsApplied: false
    })
  });
}

module.exports = {
  createGovernedFipIntakeComposition
};
