# SwayamKavach — 01 PRD

Implementation-oriented product requirements, six-week scope, success criteria, team workstreams and research claims for the IoT IDS lifecycle MVP.

## Purpose, stakeholders and evidence

# 01 · Product Requirements Document

**Project:** SwayamKavach, formerly SentinelOps. **Context:** four-person B.Tech final-year major project, IIIT Kottayam; advisor Dr. Koppala Guravaiah. **Horizon:** six-week MVP, then next-semester refinement. Research checked 20 September 2026. This document specifies a proposed implementation—not a deployed system or measured results.

## Problem
An IoT intrusion detector operates against changing devices, protocols, traffic patterns and attack distributions. Its API can remain healthy while detection quality deteriorates. Traditional systems treat drift as an automatic signal for full retraining—an expensive, high-risk response that consumes scarce labels and can introduce catastrophic forgetting or unsafe replacement.

**Product proposition & DARI research hypothesis:** SwayamKavach implements **Drift-Aware Repair Inference (DARI)**—a recoverable, auditable supervisory system that does not treat drift as an automatic signal for full retraining. By diagnosing distribution damage ($D_X$), performance damage ($D_Y$), and boundary uncertainty damage ($D_B$), DARI selects the *smallest sufficient repair* on a hierarchical Repair Ladder ($A0$: No repair, $A1$: Threshold calibration, $A2$: Local adaptation, $A3$: Full retrain). The central research hypothesis is that a damage-aware, minimum-intervention repair policy maintains or improves critical IoT IDS security performance while drastically reducing unnecessary retraining, label consumption, compute overhead, and unsafe model replacement.

| Stakeholder | Need | Product evidence |
|---|---|---|
| IoT lab/network operator | Understand alerts and model health | Alert investigation, sensor coverage, damage fingerprint ($D_X, D_Y, D_B$), model identity |
| ML engineer | Reproduce and compare updates | DARI repair decisions, utility rankings, DVC snapshots, MLflow runs, evaluation reports |
| Faculty evaluator | Verify engineering and research contribution | DARI vs. Retrain baselines, repair ladder distributions, compute savings, failure tests |
| Student maintainers | Build and debug within six weeks | One-host deployment, explicit contracts, small operational surface |
| Security/data owner | Limit exposure and unsafe changes | Capture authorization, access control, bounded retention, advisory-only IDS |

The attached proposal and TEAM-27 slides establish the four-role direction. They do **not** establish a sub-five-second rollback, 0.90 F1, 30 ms end-to-end detection, zero downtime or publication novelty. Those are aspirations to measure or revise. The drift survey supports the importance of delayed labels, drift evaluation and adaptation cost, not a guarantee that drift always causes performance loss. [1]

## Goals, non-goals and scope

## MVP goals
1. Train a reproducible binary benign/attack classifier on a documented TON_IoT network subset; compare a small set of CPU-friendly estimators.
2. Serve a pinned preprocessing-plus-model release and record every prediction's provenance.
3. Compute the DARI Damage Fingerprint $F_t = [D_X, D_Y, D_B, Q, L, S, R]$, separating sensor faults from distribution drift and margin uncertainty.
4. Implement the DARI Repair Ladder ($A0–A3$) and constrained utility selector $U(A_i) = R(A_i) - \lambda C(A_i) - \gamma G(A_i)$.
5. Run complete remediation lifecycles: hot threshold calibration ($A1$) in active slots, and full retraining ($A3$) via dual-slot canary rollout with warm rollback.
6. Make lifecycle jobs durable across process restarts and repeated requests; bound retries and resource consumption.
7. Present intrusion alerts, damage fingerprints, repair ladder states, rollout status and manual approval/rollback controls.
8. Demonstrate real traffic capture and feature extraction in an authorized environment, without pretending that unlabelled traffic proves accuracy.

## Two evidence tracks
**Track A — reproducible lifecycle demonstration:** chronological or explicitly simulated replay, disjoint training/evaluation events, known change points where injected, and labels released by an independent replay component after a documented delay. Full-auto promotion is permitted only within fixed deterministic policy.

**Track B — live deployment pilot:** actual authorized capture at a gateway/TAP/mirror or controlled endpoint; same extractor and model schema; advisory alerts and operational monitoring. Without sufficient independently verified labels, retraining/promotion pauses or requires review. A cloud API alone is not a sensor and cannot see an IoT LAN.

## Scope boundary
| Essential in six weeks | Next-semester extension |
|---|---|
| One primary dataset/schema, binary task | Multiclass and rare-family studies; cross-domain PCAP re-extraction |
| DARI decision engine & LangGraph workflow | Advanced active learning, online continual learning |
| Tiered repair (A0, A1 calibration, A3 retrain) | Advanced A2 subspace adaptation and manifold learning |
| One host, two serving slots, warm rollback | Multi-host availability, additional warm model slots |
| Minimal dashboard with DARI panel + Grafana | Rich investigation UX and multi-site tenancy |
| Basic auth, audit events, bounded data retention | External audit anchoring, formal policy verification |
| Deterministic DARI baseline + optional LLM explainer | Larger comparative agent studies |

**Non-goals:** autonomous firewall changes; exploitation outside an isolated authorized lab; guaranteed zero-day detection; packet-level immediate classification from completed-flow features; guaranteed high availability; downloading and evaluating every named dataset; generating labels from the detector's own predictions; uncontrolled agent-written training code.

## Acceptance criteria and research design

## Measurable acceptance—not invented target values
| Area | Measure | Acceptance method |
|---|---|---|
| Detection quality | AP, thresholded precision/recall/F1, FPR, per-class support | Freeze task, split and operating threshold on development data; record final results, not an assumed 0.90 F1 |
| Adaptation efficiency | Recovery vs baselines, time-to-recovery, repair level distribution ($A0/A1/A2/A3$) | Measure across controlled drift episodes; evaluate speed of A1 threshold fix vs A3 full retrain |
| Decision quality | Unnecessary A3 rate, regret vs oracle policy, utility scores | Benchmark whether DARI avoids full retraining when A0 or A1 suffices |
| Resource & cost savings | Training time, CPU hours, label volume, candidate count | Quantify compute and label savings achieved by DARI compared to naive retraining |
| Drift & damage diagnosis | $D_X, D_Y, D_B$ sensitivity, detection delay, false alarm rate | Evaluate across known covariate shifts, boundary shifts, and novel attack regimes |
| Reproducibility | Fresh checkout restores data, model, and decision lineage | DVC pull, frozen environment, checksum and prediction round-trip tests |
| Serving | Feature-ready→alert latency, packet→alert latency, throughput, drops | Load at agreed offered rate; include flow-completion wait separately |
| Safety & rollback | Rejection, abstention, stale approval and warm rollback behavior | Deterministic automated scenarios; old model remains warm during canary stabilization |
| Durability | Restart/duplicate behavior | Crash before and after each external side effect; no duplicate committed alerts or unintended promotions |

**Policy parameters to determine empirically:** monitoring window size, minimum class support, damage thresholds for $D_X, D_Y, D_B$, utility weights ($\lambda, \gamma$), label freshness/coverage, quality non-regression margins, canary sample/dwell requirements, and cooldown.

**Research Baselines to Compare:**
1. **Static Champion:** Model unadapted over time (measures raw degradation).
2. **Periodic Retraining:** Scheduled time-based retraining (measures cost of blind adaptation).
3. **Drift $\to$ Full Retrain (EGA):** Retrains whenever drift is detected and labels are available (measures cost and instability of naive reactive adaptation).
4. **DARI (Proposed):** Damage-aware minimum intervention via A0–A3 repair ladder and utility optimization.

## Delivery plan, risks and decisions

## Six-week workstreams
Role assignments are proposed work packages, not a reassignment of named teammates from the old proposal.

| Week | ML/data lead | API/agents lead | Platform/monitoring lead | UI/integration lead | Exit evidence |
|---|---|---|---|---|---|
| 1 | Verify dataset, extractor and split; baseline | Schema, receipts/jobs, mock tools | Compose/Postgres, basic serving | Dashboard skeleton/mock contracts | One flow → stored prediction |
| 2 | Frozen baseline, MLflow/DVC lineage | Durable worker and graph skeleton | Metrics, sensor/replay path | Alerts, jobs and versions screens | End-to-end monitored baseline |
| 3 | Drift scenarios, delayed labels | Data eligibility and retraining | Two slots and controller | Live events, evidence panel | Candidate reproducibly trained |
| 4 | Paired evaluation and safety tests | Approval, rejection, retry recovery | Canary and warm rollback | Protected action flows | Candidate deployed and rolled back |
| 5 | Baseline comparison experiments | Crash/idempotency tests | Load, disk, sensor/host tests | Integration and usability | Full evidence matrix; live pilot if ready |
| 6 | Freeze results and limitations | Fix critical failures, no new architecture | Restore rehearsal and demo packaging | Demo narrative and documentation | Repeatable demo plus report/video |

**Scope triage:** drop optional datasets, dashboard polish and LLM complexity before dropping honest labels, evaluation gates or rollback. If capture permissions are unavailable, deliver replay and an explicit unexecuted live-deployment specification; do not label replay as production.

## Decisions needing team/advisor input
- Available CPU/RAM/storage, host OS, access to a Linux capture point and authorized traffic scope.
- TON_IoT release and whether PCAP re-extraction is feasible within storage/time limits.
- Binary-first recommendation versus an academic requirement for multiclass.
- Trusted label source and acceptable label delay in a live pilot.
- LLM provider, budget and permissible data disclosure; deterministic fallback remains mandatory.
- Artifact/DVC remote and data retention policy.
- Promotion policy: full-auto for labelled replay, supervised pilot recommended.

## Research claim discipline
Describe the contribution as **an evaluated integration of bounded orchestration, data provenance, model comparison and safe IDS deployment** unless the literature establishes more. A hash chain without external anchoring is not tamper-proof. Pydantic does not prevent semantic hallucinations. The supplied self-composable paper uses controlled tabular benchmarks; the supplied self-healing-agent manuscript states that full experiments remain ongoing. These are design references, not performance guarantees. [2–3]

### Sources
1. [Komarchesqui et al., concept-drift-resilient NIDS survey, IEEE Access (2026)](https://doi.org/10.1109/ACCESS.2026.3691262).
2. [Aueawatthanaphisut & Lamichhane, trustworthy self-composable BDaaS, preprint](https://arxiv.org/abs/2606.17915).
3. [Jeong & Shin, self-healing LLM agents, supplied preprint reference](https://arxiv.org/abs/2605.06737).
4. [UNSW TON_IoT official dataset](https://research.unsw.edu.au/projects/toniot-datasets).
5. [MLflow registry workflow and alias semantics](https://mlflow.org/docs/latest/ml/model-registry/workflow/).

**Companion documents:** 02 Architecture defines the common design; 07 ML and 08 Versioning specify experimental gates; 12 Deployment supplies the operational plan.

## Decision register and implementation handoff

## Decisions to close before implementation milestones
Recommendations below are not silently assumed user decisions. Use this register in the first advisor/team meeting and record actual values in versioned configuration.

| Decision | Proposed starting direction | Alternative / evidence needed | Close by |
|---|---|---|---|
| Primary data/task | TON_IoT network, binary first | Multiclass if required; verify archive release and class support | Week 1 |
| External feature contract | Fixed Zeek connection schema; five-field baseline and eleven-field ablation | Re-extract PCAP if historical CSV parity fails; no casual field renaming | Week 1 |
| Live environment | Authorized Linux sensor at a real visibility point | Endpoint-only pilot or documented replay-only limit if permissions unavailable | Week 1 |
| Data/label ownership | Independent labels with availability timestamps | Specify adjudication/ground-truth source; no labels means no autonomous quality claims | Week 1 |
| Queue/orchestration | Postgres durable queue, one lifecycle worker, LangGraph | Celery/Redis if team expertise outweighs extra service boundary | Week 1 |
| LLM authority/provider | Optional allowlisted plan proposals plus deterministic fallback | Deterministic baseline mandatory; provider/privacy/budget need approval | Week 2 |
| Artifact/DVC remote | Protected local storage plus off-host backup, or available object storage | Estimate selected PCAP, snapshot and retained-model footprint | Week 2 |
| Drift windows/methods | Calibrate on stable and shifted development episodes | Record false-alarm/detection-delay trade-off and cohort policy | Week 3 |
| Training budgets/cooldown | One concurrent fit; hard measured resource/time/attempt caps | Values depend on host and estimator; undefined safety caps block full-auto | Week 3 |
| Quality promotion policy | Predeclared objective, non-regression constraints and uncertainty/support checks | Advisor agrees practical margins and independent evidence units | Week 3 |
| Canary/rollback policy | Two fixed slots; deterministic watcher; measured routing/drain | Weights, dwell, support and retention calibrated, not copied from examples | Week 4 |
| Autonomy mode | Full-auto labelled replay; supervised live pilot | Change only with verified labels, evidence policy and authorized approval | Before demo/pilot |

## Reading and build order
Start with 01 PRD → 02 Architecture → 07 ML Model to settle feasibility and data. Implement 04 Backend + 10 Monitoring + the minimal portion of 12 Deployment as the first vertical slice. Add 08 Versioning/Comparison and 06 Agents, then complete 09 Self-Healing. Build 05 Frontend against the same API contracts in parallel. Use 11 Application Flow as the integration demo script and 03 Tech Stack as the compatibility checklist.

## Research-to-code boundary
The twelve documents contain source-backed findings, proposed application contracts and clearly marked scaffolding. They do not constitute executed code, a tested dependency lock, downloaded/validated full datasets, measured model results or an already deployed system. Archive-header checks, preprocessing/serving parity, dependency smoke tests, load tests and restore/rollback drills are explicit implementation acceptance work.

An independent text-based architecture review highlighted retry attribution, external-notification semantics, enforceable host fencing and old-worker draining. Backend and Deployment addenda resolve those contracts: first valid committed prediction wins, DB/UI alert uniqueness is distinct from delivery, host mutations share a lock/journal, and new-generation observation is distinct from complete drain. Label maturity and repeated-holdout selection limitations remain explicitly covered in 07–09.
