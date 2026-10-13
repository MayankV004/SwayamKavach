# SwayamKavach — 11 End-to-End Application Flow

A complete traceable narrative from authorized IoT capture through delayed labels, retraining, evaluation, canary rollout and rollback branches.

## Scenario and sequence

# 11 · End-to-End Application Flow

This walkthrough uses symbolic release/window IDs and conditional outcomes. It is a demo/test script specification, not a report of measured performance. The same contracts apply to replay and live capture, but only independent labels support detection-quality claims.

## Starting conditions
The team has frozen a TON-compatible connection schema, trained baseline release R1, recorded its DVC/MLflow lineage and deployed it to slot A. Slot B is available. Deployment generation G1 routes all new inference requests to A. A reviewed drift reference and policy P1 are pinned. The UI explicitly displays `replay` or `authorized live pilot` and the selected autonomy mode.

```mermaid
sequenceDiagram
 participant Sensor as Zeek / Replay adapter
 participant API as FastAPI
 participant DB as Postgres
 participant Infer as Inference consumer
 participant Serve as Nginx + slots
 participant Mon as Monitor / DARI Graph
 participant Labels as Independent label source
 participant Train as Training + DVC/MLflow
 participant Ctrl as Controller / Watchdog
 participant UI as Dashboard
 Sensor->>API: Versioned flow batch
 API->>DB: Receipt + work transaction
 API-->>Sensor: 202 accepted
 Infer->>DB: Claim work
 Infer->>Serve: Predict bounded microbatch
 Serve-->>Infer: Scores + actual R1 identity + G1
 Infer->>DB: Prediction + advisory alert + event
 UI->>API: Snapshot / SSE subscription
 Labels->>API: Labels with availability time and provenance
 API->>DB: Append label revisions
 Mon->>DB: Freeze monitoring window and eligible labels
 Mon->>Mon: Compute Damage Fingerprint (Dx, Dy, Db)
 Mon->>Mon: DARI Selector: max U(Ai) = R - λC - γG
 alt Selected A0 (No Repair)
   Mon->>DB: Record benign covariate shift; zero training compute
 else Selected A1 (Threshold Calibration)
   Mon->>Mon: Calibrate optimal threshold θ*
   Mon->>Serve: Hot-apply updated threshold to Slot A
   Mon->>DB: Record A1 calibrated state (<1s recovery)
 else Selected A3 (Full Retraining)
   Mon->>Train: Freeze DVC snapshot, train candidate R2
   Train-->>Mon: Exact bundle + lineage
   Mon->>Mon: Paired R1/R2 evaluation
   Mon->>DB: Approval-bound deployment intent (Slot B)
   Ctrl->>DB: Claim expected generation
   Ctrl->>Serve: Stage B, verify, apply canary config
   Ctrl->>DB: Observed generation + slot identities
   Ctrl->>Ctrl: Clean-window canary evidence
   alt Evidence passes
     Ctrl->>Serve: Route new work to R2; retain R1 warm
     Ctrl->>DB: Observed promotion
   else Breach with healthy predecessor
     Ctrl->>Serve: Restore R1 routing
     Ctrl->>DB: Observed rollback; quarantine R2
   end
 end
 API-->>UI: Durable state/evidence events
```

## Narrative: healthy traffic to candidate

## 1. Traffic becomes a versioned event
An authorized sensor sees an IoT connection. When Zeek closes/expires it, the adapter maps originator/responder byte counters to the approved schema, assigns an event ID and preserves event/feature-ready timestamps. This is not an instantaneous first-packet detector.

The sensor sends the event in a batch. API validation checks schema, extractor identity, units, credential scope and size. The durable receipt returns 202. If the API is unavailable, the sensor spools within a bounded budget; it does not invent successful delivery.

## 2. Baseline predicts and records evidence
The inference consumer claims the batch, calls the private router and receives R1's probability/score plus threshold/class-map identity. It commits the authoritative prediction and, when policy says so, a suspected-intrusion alert. UI sees the event; Prometheus counts executed attempts and committed outcomes separately.

A retransmitted batch does not create duplicate alerts. An inference failure is an error, never a benign prediction. The dashboard can show normal operational health even while labelled model quality is unknown.

## 3. The environment changes
For the reproducible experiment, a test stream enters a held-out scenario or controlled regime. The experiment records the change point and whether the shift is natural, scenario-compositional or deliberately synthetic. The system does not receive that hidden evaluation annotation as an operational feature.

A feature-drift alarm can fire before labels arrive. The Monitoring Agent first verifies that the change is not a broken sensor or schema. It records the evidence and may open an `awaiting_labels` job. It does not assert lower F1 from unlabelled confidence scores.

## 4. Labels arrive independently
The replay label service releases ground truth under the declared delay schedule, or the authorized lab operator supplies adjudicated evidence. Each label has an availability time and provenance. Only then can the system measure error/recall/FPR on eligible labelled events.

Coverage and class support are checked. If labels come only from investigated alerts, the system flags selection bias rather than assuming those rows represent all traffic. When policy is satisfied, a deduplicated lifecycle job becomes eligible; otherwise it remains on hold.

## 5. The training set is frozen
The ML Engineer role proposes an approved recent-plus-historical plan. Policy validates sources, budget, class support and cooldown. The snapshot builder selects labels available by cutoff, excludes promotion/final-test events, preserves grouping/embargo and publishes an immutable DVC snapshot plus split manifest.

The job records dataset Git SHA, label cutoff, extractor/schema hash and training plan. A bounded subprocess trains R2. MLflow receives parameters, resources, metrics, model bundle and operation tags. A crash after registration is reconciled by operation ID rather than registering an unbounded series of duplicate versions.

## Narrative: comparison to safe serving change

## 6. R2 must earn deployment
The Evaluator scores R1 and R2 on exactly the same permitted events and label revision. It checks the primary quality objective, false-positive and class-recall guardrails, uncertainty/support, historical forgetting, latency/memory and artifact validity.

- FAIL: R2 is rejected and R1 continues.
- INCONCLUSIVE: collect more evidence; a nice-looking average does not force a pass.
- PASS: create an immutable evaluation hash bound to R1, R2 and policy P1.

In supervised mode, the dashboard requests an authorized approval of this exact evidence. In the labelled replay's configured full-auto mode, deterministic policy can authorize the next step. Neither mode bypasses evaluation gates.

## 7. Stage without touching the champion
The controller reserves slot B, starts the exact image/model release, validates checksum/schema and performs warm-up inference. If readiness fails, A remains untouched. An optional shadow phase compares paired outputs while only R1 alerts are authoritative.

## 8. Apply and observe a canary
The controller records desired generation G2 with approved weights, validates Nginx configuration and reloads it. It observes G2 and actual slot identities before reporting 'canary active'. Existing workers/in-flight requests can still reflect G1 during drain; response provenance makes this visible.

The dashboard shows nominal versus measured request and flow share, sample counts, watcher freshness and clean evaluation interval. Without enough traffic, the rollout pauses. Without independent labels, operational health does not become a claim of better intrusion recall.

## 9. Promote—or roll back
If policy evidence passes, the controller requests G3 for R2 as the authoritative model on new requests. It confirms observed routing, retains R1 warm and then updates MLflow's champion alias as display/registry metadata. An alias outage does not make the deployed model unknowable.

If a configured operational/quality breach occurs instead, the independent watcher confirms R1's readiness and applies a new rollback generation. It records the exact predecessor, reason and component timings. R2 is quarantined from auto re-promotion. No LLM permission is required to execute the deterministic safety path.

## 10. Close the lifecycle
The workflow records whether the attempt recovered quality, merely changed operational state, was rejected, remained inconclusive or failed. Reference baselines are updated only through governed policy—not automatically because new traffic has become common. Cooldown/budget controls prevent immediate repeated retraining.

The demo report includes before/after quality on eligible labelled evidence, timing, resource cost, lineage and all failed/held attempts. It does not present a cherry-picked successful cycle as the whole experiment.

## Failure branches and evidence checklist

## Explicit alternate narratives
| Situation | User-visible outcome | What must not happen |
|---|---|---|
| Live pilot has no trustworthy labels | Drift/operational monitoring, advisory alerts, awaiting-labels lifecycle | Display fabricated F1 or train on predictions as truth |
| Adapter introduces a unit/schema bug | Sensor/schema incident and quarantine | Retrain away a data-pipeline defect |
| Candidate harms rare attack detection | Reject/inconclusive evidence | Promote because weighted accuracy improved |
| UI closes during training | Job continues, reconnect restores state | Lose orchestration because browser disappeared |
| API retry after unknown response | Existing receipt/job returned | Duplicate alerts, training or promotion |
| Champion changes before approval | Stale approval conflict, reevaluation required | Apply approval to a different predecessor |
| Watchdog cannot read metrics | Pause progression / configured recovery policy | Interpret missing metrics as healthy |
| Predecessor is unavailable | Rollback failed/degraded, operator alert | Claim recovery simply because a rollback request was sent |
| Single host fails | Restore runbook/outage | Claim two containers provide HA |

## Demo acceptance evidence
For each run preserve: scenario/seed and shift construction; source versus processing timestamps; label-delay schedule; snapshot and split hashes; R1/R2 manifests; monitoring/evaluation reports; approval/policy revision; desired/applied generations; slot response provenance; incident/audit events; resource/latency traces; final outcome and limitations.

Run at least a successful eligible recovery, a no-label hold, a rejected candidate and an operational rollback, with repeated executions sufficient to characterize variability. The exact replication count follows experiment cost and advisor agreement; it is not guessed here.

### Sources and established patterns
- [Zeek connection logs](https://docs.zeek.org/en/current/logs/conn.html): why features arrive after connection observation.
- [NIDS drift survey](https://doi.org/10.1109/ACCESS.2026.3691262): labels, dynamic evaluation and adaptation limitations.
- [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts): durable human approval/resumption.
- [MLflow registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow/): aliases versus model identities.
- [Nginx reload control](https://nginx.org/en/docs/control.html): applied routing and draining.
- [DVC pipeline metadata](https://doc.dvc.org/user-guide/project-structure/dvcyaml-files): reproducibility inputs.

This narrative ties together 02 Architecture, 04 Backend, 06 Agents, 07 ML, 08 Versioning, 09 Self-Healing, 10 Monitoring and 12 Deployment.
