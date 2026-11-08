# EPRV-001-C3 - Upstream Context Availability Reconciliation v1

## Contract status

| Field | Value |
|---|---|
| Contract ID | `EPRV-001_C3_UPSTREAM_CONTEXT_AVAILABILITY_RECONCILIATION.v1` |
| Governed task | `EPRV-001-C3` |
| Mode | Read-only upstream evidence reconciliation |
| State during packet | **IN_PROGRESS** |
| Scout source commit | `8647e2d0fdb73da4fa4a958af46e35a01888092d` |
| Scout package SHA-256 | `153684f6d7511ce653d26e490c8f507b0a7e0ad23d834d84671d9adea5a65912` |
| Provider-removal readiness | **HOLD** |
| Scout prediction execution | **false** |
| Edge runtime/provider edits | **NONE** |

## 1. Purpose

EPRV-001-C2 proved five provider-removal context blockers but did not distinguish between data that Scout already possesses and data that Scout does not yet collect. C3 performs that reconciliation only.

Scout remains the governed evidence/calculation owner. Scout does not predict. Edge remains the prediction system.

## 2. Immutable upstream evidence

The inspected Scout package is `evidence/cc-nscs-034/crystal-palace-liverpool-20261108.json`, generated at `2026-11-06T12:00:14.460Z` for Crystal Palace vs Liverpool, with prediction cutoff `2026-11-06T10:48:52.000Z` and kickoff `2026-11-08T14:00:00.000Z`.

The package records:

- `calculation_owner: SCOUT`;
- `edge_consumer_policy: EDGE_CONSUME_NO_RECOMPUTE`;
- `prediction_execution: false`;
- `sports_edge: false`;
- `odds: false`.

### Availability / injuries

- Crystal Palace availability rows: **29**.
- Liverpool availability rows: **31**.
- Liverpool match-specific availability includes **3 OUT** and **1 DOUBTFUL**.
- Explicit known examples include Conor Bradley OUT/INJURED, Giovanni Leoni OUT/RECOVERING, Jeremie Frimpong DOUBTFUL/INJURED, and Hugo Ekitike OUT/INJURED.
- Availability rows carry `availability_status`, `injury_status`, `suspension_status`, `reason`, and `source_id`.

### Team form

Both teams have governed `team_form` data containing:

- current five-result form sequence;
- won/drawn/lost season summary;
- goals for / goals against;
- source identity.

### H2H

The package contains governed `h2h` data with:

- `played: 34`;
- `won: 21`;
- `drawn: 6`;
- `lost: 7` from the recorded Liverpool perspective;
- three recent meetings with kickoff, competition, teams and scores;
- source identity.

### Weather and news

The inspected package has no top-level `weather`, `news`, or `team_news` field.

Absence here is evidence of package absence only. It does not authorize guessing, synthetic defaults, or third-party fallback.

## 3. C3 blocker reconciliation

| C2 blocker | Upstream Scout state | C3 classification | Required next owner |
|---|---|---|---|
| Injuries / availability | Present in governed Scout package | **UPSTREAM_EXISTS_NOT_TRANSPORTED** | Scout FIP output/transport contract + Edge EFI/FIP intake mapping |
| H2H | Present in governed Scout package | **UPSTREAM_EXISTS_NOT_TRANSPORTED** | Scout FIP output/transport contract + Edge EFI/FIP intake mapping |
| Team form | Present in governed Scout package | **UPSTREAM_EXISTS_NOT_TRANSPORTED** | Scout FIP output/transport contract + Edge EFI/FIP intake mapping |
| Weather | Not present in inspected Scout package | **UPSTREAM_ABSENT** | Separate Scout weather collection/governance work before transport |
| News / contextual events | No `news` or `team_news` field in inspected Scout package | **UPSTREAM_ABSENT** | Separate Scout news/context evidence-admission/governance work before transport |

## 4. Transport law

For the three `UPSTREAM_EXISTS_NOT_TRANSPORTED` classes:

1. Edge must not scrape or recreate the facts merely because the current FIP omits them.
2. Scout must remain source/evidence owner.
3. The future FIP field contract must preserve source identity, cutoff/evidence timing, explicit unknown values, and fail-closed validation.
4. Edge may consume those fields only after the governed FIP contract and intake mapping are separately approved and tested.
5. Edge must not recompute Scout-owned source facts.

## 5. Upstream-absent law

For weather and news/context:

1. no provider-removal implementation may assume replacement data exists;
2. no synthetic or guessed values may satisfy the replacement gate;
3. a separate Scout mini-project must govern legal source, evidence admission, schema, timing/freshness and unknown/absence behaviour;
4. Edge transport work starts only after Scout produces a governed field contract and evidence.

## 6. Existing gates remain unchanged

C3 does not authorize provider removal, runtime provider bypass, prediction changes, live prediction execution, database mutation, deployment, Scout transport activation, E2E execution, or marriage/storage gate clearance.

EPRV-001 remains PARTIAL/HOLD until all required classes have governed transport or explicit neutral-behaviour proof.

## 7. Final C3 conclusion

C3 reduces the five C2 blockers to:

- **3 transport/contract blockers**: availability/injuries, H2H, team form;
- **2 genuine upstream collection/governance blockers**: weather, news/context.

This is a readiness classification only. No runtime/provider/prediction behaviour changed.