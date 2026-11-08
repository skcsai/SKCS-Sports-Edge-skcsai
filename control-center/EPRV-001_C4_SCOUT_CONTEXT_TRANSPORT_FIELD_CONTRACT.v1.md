# EPRV-001-C4 - Governed Scout Context Transport Field Contract v1

## Contract status

| Field | Value |
|---|---|
| Contract ID | `EPRV-001_C4_SCOUT_CONTEXT_TRANSPORT_FIELD_CONTRACT.v1` |
| Governed task | `EPRV-001-C4` |
| Mode | Contract-only / no runtime implementation |
| State during packet | **IN_PROGRESS** |
| Upstream evidence basis | EPRV-001-C3 TESTED |
| Provider-removal readiness | **HOLD** |
| Scout prediction execution | **false** |
| Edge runtime/provider edits | **NONE** |

## 1. Purpose

C3 proved that injuries/availability, H2H and team form already exist in governed Scout evidence but are not transported by the current generic FIP context contract. C4 defines the exact future transport shape for those three classes only.

Scout remains the source/evidence and calculation owner. Edge is a read-only consumer of these facts and must not recompute, reinterpret or fabricate them.

Weather and news/context are explicitly out of scope because C3 classified them as upstream-absent.

## 2. Transport location

The future governed FIP context object must carry exactly these class roots when authorized:

- `context.availability`
- `context.h2h`
- `context.team_form`

No C4 runtime implementation is authorized. These are future contract paths only.

## 3. Availability / injuries contract

`context.availability` must be an object with:

- `home`: array
- `away`: array

Each player row must preserve these fields exactly:

- `name`: non-empty string
- `availability_status`: non-empty string
- `injury_status`: non-empty string
- `suspension_status`: non-empty string
- `reason`: non-empty string
- `source_id`: non-empty string

### Availability evidence-state law

`UNKNOWN` is a valid governed evidence state. It must not be converted to:

- AVAILABLE;
- HEALTHY;
- NOT_INJURED;
- NOT_SUSPENDED;
- zero risk;
- any synthetic confidence or score.

Known values such as `OUT` and `DOUBTFUL` are transported as Scout-owned facts. Edge may use them in later prediction logic only under a separately authorized prediction implementation; C4 itself does not score them.

## 4. H2H contract

`context.h2h` must be an object containing:

- `perspective_team`: non-empty string
- `source_id`: non-empty string
- `played`: non-negative integer
- `won`: non-negative integer
- `drawn`: non-negative integer
- `lost`: non-negative integer
- `recent_meetings`: array

Each `recent_meetings` row must preserve:

- `kickoff_at`: parseable timestamp string
- `competition`: non-empty string
- `home_team`: non-empty string
- `away_team`: non-empty string
- `home_score`: non-negative integer
- `away_score`: non-negative integer

Edge must preserve `perspective_team`; it must not silently invert the summary or recalculate historical results.

## 5. Team-form contract

`context.team_form` must contain:

- `home`: object
- `away`: object

Each side must preserve:

- `team_name`: non-empty string
- `source_id`: non-empty string
- `current_form`: array of governed result tokens from Scout
- `season_summary`: object containing `won`, `drawn`, `lost`, `goals_for`, `goals_against` as non-negative integers

Edge must not regenerate form from its own fixture store when governed Scout form is supplied.

## 6. Timing and provenance binding

The three class roots inherit the enclosing FIP package identity and validation boundary. Future transport must preserve:

- Scout FIP package validation status and canonical hash;
- fixture identity;
- package generation time;
- prediction/evidence cutoff time;
- each class or row `source_id` supplied by Scout.

A class must fail closed if its structure is malformed. A valid explicit `UNKNOWN` value does not fail the package merely because evidence is unknown.

## 7. Ownership and no-recompute law

The future FIP/Edge envelope must preserve:

- `calculation_owner = SCOUT` or equivalent governed ownership metadata;
- `edge_consumer_policy = EDGE_CONSUME_NO_RECOMPUTE` or equivalent governed policy;
- Scout no-prediction boundary.

Edge may derive prediction features from valid transported facts only under separately authorized Edge prediction logic. Edge must not mutate the transported Scout facts to make them look more complete.

## 8. Fail-closed transport law

When the future class-specific transport is activated:

1. malformed availability, H2H or team-form structure rejects that class/package according to the future intake implementation contract;
2. missing required `source_id` rejects the affected class;
3. explicit `UNKNOWN` is preserved, not filled;
4. no external provider fallback may silently replace a rejected Scout class after provider-removal activation;
5. weather/news absence cannot be substituted into these three classes.

## 9. Forbidden work

C4 does not authorize:

- Scout code changes;
- changing the current FIP schema or runtime mapper;
- provider removal/bypass;
- prediction formula changes;
- live prediction execution;
- SQL/database changes;
- route/deployment changes;
- weather/news collection;
- E2E or marriage/storage gate clearance.

## 10. C4 readiness result

| Class | Contract result |
|---|---|
| Injuries / availability | **TRANSPORT_CONTRACT_DEFINED** |
| H2H | **TRANSPORT_CONTRACT_DEFINED** |
| Team form | **TRANSPORT_CONTRACT_DEFINED** |
| Weather | **OUT_OF_SCOPE / UPSTREAM_ABSENT** |
| News / context | **OUT_OF_SCOPE / UPSTREAM_ABSENT** |
| Provider-removal implementation | **HOLD** |

C4 defines the transport contract only. A later separately authorized implementation must update Scout FIP output and Edge intake mapping consistently before these three blockers can be considered transported.