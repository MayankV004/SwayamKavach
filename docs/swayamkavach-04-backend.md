# SwayamKavach — 04 Backend

FastAPI endpoint specification, data models, durable asynchronous jobs, authentication, live events and control-plane integration.

## Service boundaries and endpoints

# 04 · Backend Design

This is an implementable application API specification, not a claim that these endpoints already exist. Public routes are under `/api/v1`; model slot routes are private. Nginx terminates TLS. PostgreSQL owns durable state. Long work never runs inside a request handler or FastAPI `BackgroundTasks`. [1]

## Endpoint inventory
| Method / route | Purpose | Response / authorization |
|---|---|---|
| POST `/ingestion/batches` | Validate and durably accept flow events | 202 batch receipt; sensor credential |
| GET `/ingestion/batches/{id}` | Accepted/processed/rejected counts | 200; scoped sensor or operator |
| GET `/alerts` | Cursor-paginated intrusion alerts | 200; viewer |
| GET `/alerts/{id}` | Feature quality, prediction, provenance, adjudication | 200; viewer |
| POST `/labels` | Append independent label/adjudication revision | 201; labeler; provenance required |
| GET `/monitoring/summary` | Model, pipeline and data health | 200; viewer |
| GET `/monitoring/windows` | Window coverage, drift and performance | 200; viewer |
| GET `/monitoring/windows/{id}` | Normalized evidence and report links | 200; viewer |
| POST `/monitoring/evaluations` | Queue bounded monitoring pass | 202; operator |
| POST `/training-runs` | Request approved plan on an eligible snapshot | 202; operator or policy service |
| GET `/jobs` and `/jobs/{id}` | Durable lifecycle status | 200; viewer |
| POST `/jobs/{id}/cancel` | Cooperative cancellation request | 202; operator; not a rollback |
| GET `/models` and `/models/{version}` | Lineage, releases, reports | 200; viewer |
| POST `/comparisons` | Queue paired evaluation of exact versions | 202; evaluator service/operator |
| GET `/comparisons/{id}` | PASS/FAIL/INCONCLUSIVE and evidence | 200; viewer |
| POST `/deployments` | Propose release and rollout plan | 202; deployer role; expected generation |
| POST `/approvals/{id}/decision` | Approve/reject bound evidence | 202; authorized approver |
| GET `/deployments/current` | Desired/applied routing and slot identities | 200; viewer |
| POST `/deployments/{id}/rollback` | Queue deterministic rollback intent | 202; operator/watchdog |
| GET `/events/stream` | SSE from durable event cursor | 200 streaming; viewer |
| GET `/policy` | Effective immutable policy revision | 200; viewer |
| POST `/policy/revisions` | Validate a proposed policy change | 201 or review-required; administrator |

Private slot routes: `POST /predict`, `GET /readyz`, `/livez`, `/identity`, `/metrics`. Control-plane readiness and liveness are separate. A slot is ready only after checksum, schema and warm-up checks. Ordinary users cannot call model reload or shell commands.

Use `400` for invalid action semantics, `401/403` for auth, `404` for scoped absent resources, `409` for generation/idempotency conflicts, `422` for schema validation, `429` for quota/backpressure and `503` for dependency unavailability. A 202 response means **accepted**, never 'deployed'.

## Example contracts and persistence

## Ingestion example
Values below illustrate shape only; they are not benchmark measurements.

```json
{
  "batch_id": "sensor-7:segment-42",
  "sensor_id": "sensor-7",
  "schema_version": "ton-conn-v1",
  "extractor_id": "zeek-pinned-config-sha",
  "events": [{
    "event_id": "capture-42:connection-19",
    "capture_id": "capture-42",
    "event_time": "2026-09-20T16:00:00Z",
    "feature_ready_at": "2026-09-20T16:00:02Z",
    "features": {
      "duration": 2.0, "src_bytes": 240, "dst_bytes": 800,
      "src_ip_bytes": 400, "dst_ip_bytes": 1040
    },
    "quality_flags": []
  }]
}
```

The body must not contain training labels. Credentials bind the authorized `sensor_id`; callers cannot spoof another sensor by editing JSON. The adapter may use the eleven-field superset chosen in 07, but a specific release accepts exactly one ordered schema. Reject NaN/infinity, unknown schema, invalid units or inconsistent extractor identity. Missing values follow an explicit null policy, not automatic zero-fill.

```json
{
  "job_id": "job-42",
  "status": "awaiting_labels",
  "phase": "data_eligibility",
  "window_id": "window-12",
  "reason_code": "INSUFFICIENT_TRUSTED_LABELS",
  "attempt": 1,
  "policy_revision": "policy-3",
  "updated_at": "2026-09-20T16:05:00Z"
}
```

Do not manufacture a progress percentage for training unless the training process emits a meaningful measure. Show phase and timestamps instead.

## Minimal relational model (DARI-Extended)
| Table | Essential columns / constraints |
|---|---|
| sensors | ID, credential hash/reference, allowed schema, last heartbeat |
| batches | sensor, batch ID, payload hash, receipt state; unique sensor+batch |
| flow_events | event ID, timestamps, schema/extractor IDs, feature/blob reference |
| predictions | event, purpose, release, score, threshold, slot, generation; unique event+purpose |
| alerts | prediction ID, severity policy, status; unique originating prediction |
| labels | event, revision, value, source, evidence, available_at; append-only revisions |
| windows | interval, watermark, reference, counts, report URI/hash |
| damage_fingerprints | window ID, dx, dy, db, q, l, s, r, computed_at, reference ID |
| repair_decisions | fingerprint ID, selected_action (A0-A3), feasible_actions, utility_scores, rationale |
| jobs | type, state, lease, owner, attempts, next retry, policy, cancellation flag |
| effects | operation+step+input digest unique, external reference, outcome |
| evaluations | candidate, champion, dataset/split hashes, metrics, uncertainty, decision |
| approvals | candidate/evidence/policy/predecessor binding, actor, expiry, decision |
| deployments | desired/applied generation, action_type (HOT_THRESHOLD_UPDATE/CONTAINER_ROLLOUT), target_threshold, slot identities, weights, predecessor |
| events | monotonic cursor, event type, actor, correlation IDs, sanitized payload |

For a small demo, recent feature rows may remain in Postgres; archive bounded windows to immutable Parquet. Do not keep an unbounded high-rate network corpus in application tables. Use UTC event time and processing time separately. Label revisions are selected by an explicit availability cutoff for each snapshot.

## Jobs, integration and live status

## Transaction and worker behavior
1. Authenticate; validate request and quotas.
2. Require `Idempotency-Key` for mutating operational requests. Store a normalized request hash. Same key/same body returns the existing resource; same key/different body returns 409.
3. In one transaction, persist request, durable work and audit/UI event. Return 202 after commit.
4. Worker claims with a short locked transaction, then runs outside it. Lease heartbeats and fencing prevent a stale worker from authorizing an effect.
5. Execute train/profile work in bounded subprocesses; persist stdout summaries and exit classification, not secrets.
6. Record effect outcome, job state and resulting event transactionally. Recover uncertain external effects by querying their operation references.

MLflow registration is not transactional with the job DB. Tag each run/version with an operation ID and reconcile before retrying. Deployment is a separate desired-state write; the controller must confirm observed routing. `ainvoke` and checkpoints supply orchestration state, not distributed exactly-once semantics. [2]

## Frontend-facing model and agent status
`GET /monitoring/summary` should include `as_of`, sensor freshness, queue age, active release, drift status, labelled-quality status, label coverage, controller heartbeat and rollout state. Keep independent axes: a model can have `operational: healthy`, `drift: detected`, `quality: unknown`.

SSE event shape:
```text
event: deployment.observed
id: 9182
data: {"operation_id":"op-8","generation":17,"state":"canary",...}
```

Support `Last-Event-ID`; replay retained events or send a reset instruction then fetch a fresh snapshot. Heartbeats are transport keepalives, not proof the worker is alive. Polling endpoints remain functional if SSE fails. Avoid unbounded per-subscriber queues; disconnect lagging subscribers with an explicit recovery path. [3]

Audit logs store action, evidence IDs, concise decision summary, tool arguments after redaction, result and actor. Do not present hidden model reasoning as an audit requirement. An optional hash chain detects some edits only while a trusted earlier anchor exists; it is not a substitute for write permissions, backups or external anchoring.

## Security and acceptance tests

## Authentication and permissions
For the MVP, choose a small account system with secure same-origin sessions or an existing OIDC provider—do not implement both. Session cookies require Secure/HttpOnly/SameSite settings and CSRF protection on state changes. Browser EventSource works naturally with same-origin cookies; do not put bearer tokens in SSE query strings.

Roles may be combined for student accounts but permissions remain explicit: viewer, labeler, operator, approver, administrator. Sensor credentials only ingest authorized schemas. Internal workers have narrowly scoped identities. Model servers can read approved bundles but cannot edit aliases, policies or deployment state. The controller alone can mutate approved serving services and Nginx; no public Docker socket.

Approvals are not a Boolean toggle on a candidate: bind the exact evaluation hash, release checksum, policy revision, predecessor generation and expiry. Re-evaluation or changed champion invalidates the old approval. Reject user-supplied filesystem paths, arbitrary URLs/commands, free-form training scripts and uploaded untrusted pickles.

Rate-limit ingestion/actions; cap batches, upload size, retention and concurrent jobs. Redact raw payloads, IPs and secrets in LLM input and shared logs. Mount artifact reports behind authorized reads; report HTML should not gain application-origin script privileges.

## Backend tests required
- Same batch retried after a timeout produces no duplicate committed alerts.
- Crash after inference but before commit retries safely; actual committed model identity is visible.
- Duplicate train request and duplicate approval resume only one logical operation.
- Unknown/malformed feature schema fails before inference.
- Stale approval/generation returns 409 and changes no routing.
- Missing labels yields a durable hold status, not training on predictions.
- Worker restart resumes or reconciles a job; expired leases cannot promote.
- Unauthorized rollback/policy/label action fails and is audited.
- SSE reconnect replays or resets without misleading 'success' events.

### Sources
1. [FastAPI BackgroundTasks limitations](https://fastapi.tiangolo.com/tutorial/background-tasks/).
2. [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts), [PostgreSQL queue-like SKIP LOCKED usage](https://www.postgresql.org/docs/current/sql-select.html).
3. [FastAPI server-sent events](https://fastapi.tiangolo.com/tutorial/server-sent-events/) and [Nginx proxy behavior](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
4. [MLflow registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow/).

See 05 for user-visible states, 06 for workflow state and 12 for runtime topology.

## Implementation addendum: retry attribution and delivery guarantees

## Retry attribution is explicit, not accidental

Use globally unique event IDs derived from authenticated sensor + capture + connection identity, or enforce uniqueness on that tuple. For this MVP, production inference uses **first valid committed result wins**: the active lease holder may commit a result once; a uniqueness constraint prevents subsequent attempts replacing it. A late response from an expired worker is not authorized to overwrite/commit through a reclaimed lease. Store every attempt's actual release/generation and outcome, but distinguish attempts from the single authoritative prediction. A retry routed to a different slot can therefore produce a different unused score; this is disclosed and counted. Shadow scoring uses a purpose keyed to its comparison/release so multiple deliberate experiments cannot collide.

This policy is simpler than durable per-event slot assignment but produces canary allocation noise. Evaluate measured request/flow share using actual committed release identity, and retain retry/attempt telemetry to detect bias. If stable cohorts or strict experiment assignment becomes necessary, persist a trusted assignment before dispatch and route explicitly; do not claim weighted round-robin provides it.

## Alert guarantee boundary
The MVP guarantees one committed DB/UI alert per authoritative prediction by creating prediction, alert and event/outbox rows in the same transaction. It does **not** automatically guarantee exactly-once email/webhook/chat delivery. If external notification is added, use a separate outbox consumer with a unique notification ID and destination idempotency where supported. Otherwise document at-least-once notifications and possible duplicates after an ambiguous send timeout.

## Durable acceptance and bounded queues
A 202 ingestion response requires committed work plus all feature bytes needed for replayable processing. If the request references external blob storage, verify that upload/checksum before marking accepted; an unuploaded URI is not durable receipt. Enforce batch/event byte limits, per-sensor quotas, queue/disk watermarks and retention before acceptance. When unable to meet durability, return backpressure/unavailable rather than accepting into RAM.

Poison events (permanently invalid schema/content) terminate in a quarantined/dead-letter record with an operator-visible reason; they do not retry forever or block an entire queue. Transient failures get bounded retries with next-attempt timestamps; exhausted work remains inspectable. Lease recovery and graceful cancellation must be tested under crash and overload.

These refinements narrow the guarantees to those the application can enforce; none asserts distributed exactly-once execution.
