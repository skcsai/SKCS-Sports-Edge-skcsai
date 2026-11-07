# EPRV-001-C2 - FIP Replacement Mapping and Fail-Closed Provider Readiness Contract v1

## Contract status

| Field | Value |
|---|---|
| **Contract ID** | `EPRV-001_C2_FIP_REPLACEMENT_READINESS_CONTRACT.v1` |
| **Governed task** | `EPRV-001-C2` |
| **Contract mode** | Contract/readiness only |
| **C2 state after closure** | **TESTED** |
| **Provider-removal readiness verdict** | **HOLD - NOT IMPLEMENTATION READY** |
| **Scout -> Edge marriage gate** | **BLOCKED** (unchanged) |
| **Supabase storage gate** | **BLOCKED** (unchanged) |
| **Runtime provider edits** | **FORBIDDEN** in this packet |
| **Prediction runtime edits** | **FORBIDDEN** in this packet |
| **Date sealed** | 2026-11-07 |

## 1. Purpose

This completed packet answers one question only: does the governed Scout/FIP boundary already prove equivalent replacement data for every Edge provider-acquired fact class required by prediction execution?

It does not remove providers, change provider reachability, alter prediction formulas, execute a live prediction, run SQL, mutate Supabase, wire routes, deploy, or clear any gate.

The answer is not yet. Fixture identity/schedule and 1X2/market inputs are mapped. The current FIP contract carries a generic `context` object but does not require class-level fields for weather, injuries/availability, H2H, team form, or news/context. A generic context container is not proof that those facts are present, complete, current, or safe to substitute for current provider acquisition.

## 2. Current governed FIP intake evidence

Current `backend/services/fipIntakeService.js` requires fixture identity and kickoff fields, `markets` as an object, and `context` as an object.

`mapToEdgeAnalysisEnvelope()` maps fixture identity/schedule to `match_info`; `markets.direct_1x2` or `markets.sharp_odds` to `sharp_odds`; and `context.contextual_intelligence`, or otherwise the whole `context` object, to `contextual_intelligence`.

The canonical required-path list does not require `context.weather`, `context.injuries`, `context.availability`, `context.h2h`, `context.form`, `context.news`, or `context.team_news`. Those classes are therefore not proven replacement inputs yet.

## 3. Provider-to-FIP replacement matrix

| Fact class | Current Edge acquisition/use evidence | Governed Scout/FIP replacement evidence | Readiness | Provider-removal ruling |
|---|---|---|---|---|
| Fixture identity and schedule | `dataProvider.js`, provider fixture loaders, pipeline match identity | Required canonical FIP fixture/scout identity and kickoff fields mapped to `match_info` | **MAPPED** | May be replaced after implementation gate |
| 1X2 / market inputs | provider odds/market acquisition, `oddsApiPipeline.js`, scoring market inputs | Required `markets` object; envelope requires `direct_1x2` or `sharp_odds` and maps it to `sharp_odds` | **MAPPED** | May be replaced after implementation gate |
| Weather | current weather/context acquisition and downstream weather adjustments | Generic `context` only; no required `context.weather` contract | **MISSING_BLOCKER** | Do not remove/bypass weather source yet |
| Injuries / availability | injury/context acquisition and downstream availability adjustments | Generic `context` only; no required injuries/availability class contract | **MISSING_BLOCKER** | Do not remove/bypass availability source yet |
| H2H | football highlights / H2H enrichment path | Generic `context` only; no required H2H class contract | **MISSING_BLOCKER** | Do not remove/bypass H2H source yet |
| Team form | provider/context-derived form inputs used by prediction context | Generic `context` only; no required form class contract | **MISSING_BLOCKER** | Do not remove/bypass form source yet |
| News / contextual events | team-news/news/context acquisition and downstream context/AI surfaces | Generic `context` only; no required news/team-news class contract | **MISSING_BLOCKER** | Do not remove/bypass news/context source yet |

No class may be upgraded from `MISSING_BLOCKER` merely because an arbitrary object could be placed inside `context`. Upgrade requires a governed field contract plus completeness/freshness behavior and focused proof.

## 4. Runtime reachability ruling

The current pipeline still has a provider path. In `resolveConfiguredPredictionInput()`, when the caller does not supply the `fip_envelopes` property, Edge calls the configured provider loader. When a governed FIP batch is supplied, existing P1-B01 proof shows provider input is bypassed for that configured input path.

This is acceptable before provider-removal activation. It is not the future post-removal behavior.

## 5. Future fail-closed no-input law

After a separately authorized provider-removal implementation activates Scout/FIP as the required sports-truth path:

1. absence of `fip_envelopes` for the governed prediction path must reject/fail closed;
2. an empty, malformed, stale, invalid, unauthorized, or rejected FIP batch must reject/fail closed;
3. rejection must not call external sports-truth providers as a fallback;
4. no provider may silently become canonical sports truth because FIP is incomplete;
5. optional context classes may be neutral/held only when a separate contract explicitly defines neutral behavior and proves no score/ACCA/publication drift;
6. existing provider mode remains unchanged until that later implementation is explicitly authorized.

## 6. Prediction integrity and storage laws

EPI-001 remains binding. Future provider removal must preserve raw prediction validation and metadata compatibility, scoring/confidence semantics unless separately approved, filter output behavior, direct 1X2 adjustment behavior, market conflict/fallback behavior, ACCA construction/publication dependencies, and grading/accuracy compatibility.

EST-001 remains binding. Provider removal must not persist the full Scout FIP body or create a Scout mirror in Edge storage. Only approved provenance/reference/audit and derived Edge state may be retained.

## 7. Gates and forbidden work

This packet keeps all runtime gates blocked. It does not authorize editing `backend/services/dataProvider.js`; editing provider clients/utilities; deleting or disabling providers; changing `DATA_MODE`; changing prediction formulas/weights; live prediction execution; full Scout/FIP retention; SQL, migrations, or database mutation; route wiring or deployment; E2E execution; or marriage/storage gate clearance.

## 8. Completion verdict

| Criterion | Result |
|---|---|
| Fixture/schedule replacement mapping | **PASS / MAPPED** |
| 1X2/market replacement mapping | **PASS / MAPPED** |
| Weather replacement mapping | **HOLD / MISSING_BLOCKER** |
| Injuries/availability replacement mapping | **HOLD / MISSING_BLOCKER** |
| H2H replacement mapping | **HOLD / MISSING_BLOCKER** |
| Team-form replacement mapping | **HOLD / MISSING_BLOCKER** |
| News/context replacement mapping | **HOLD / MISSING_BLOCKER** |
| Future no-FIP behavior defined fail-closed | **PASS - CONTRACT LAW ONLY** |
| Prediction/storage/gate boundaries preserved | **PASS** |
| Runtime/provider changes performed | **NONE** |
| **Provider-removal implementation readiness** | **HOLD - NOT IMPLEMENTATION READY** |

The next implementation packet must not start until each `MISSING_BLOCKER` class is either supplied by a governed Scout/FIP field contract or separately approved as `HELD_WITH_NEUTRAL_BEHAVIOUR` with deterministic regression proof.