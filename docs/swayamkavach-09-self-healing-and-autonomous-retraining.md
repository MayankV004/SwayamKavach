# SwayamKavach — 09 Self-Healing and Autonomous Retraining

Signal eligibility, automatic labelled-data assembly, guarded retraining, shadow/canary policy and deterministic rollout/rollback protocol.

## Signals and eligibility

# 09 · Self-Healing and Autonomous Retraining Flow (DARI Paradigm)

Self-healing is a controlled, minimum-intervention recovery process—not an automatic trigger for full model retraining. Under the **Drift-Aware Repair Inference (DARI)** architecture, SwayamKavach does not treat distribution drift as proof of model failure. Instead, it diagnoses the type and severity of damage and executes the smallest sufficient repair on a tiered **Repair Ladder (A0–A3)** that satisfies security constraints while minimizing compute, label consumption, and deployment risk.

## 1. DARI Inputs and Damage Fingerprint

A monitored window $W_t$ produces a 7-dimensional **Damage Fingerprint**:

$$F_t = [D_X, D_Y, D_B, Q, L, S, R]$$

| Signal | Name | Range | Description & Purpose |
|---|---|---|---|
| $D_X$ | Distribution Damage | $[0, 1]$ | Input feature drift severity relative to reference $R$ (unlabelled). |
| $D_Y$ | Performance Damage | $[0, 1]$ or `None` | Ground-truth detection quality degradation on delayed labels. |
| $D_B$ | Boundary Damage | $[0, 1]$ | Decision boundary uncertainty, score margin instability, and calibration drift (unlabelled). |
| $Q$ | Data Quality | $[0, 1]$ | Schema, missingness, impossible ranges, and capture health. |
| $L$ | Label Reliability | $[0, 1]$ | Source trustworthiness, adjudication status, and selection-bias score. |
| $S$ | Sample Sufficiency | $[0, 1]$ | Observation volume and class support relative to statistical requirements. |
| $R$ | Persistence | $[0, 1]$ | Multi-window persistence and cooldown status to prevent oscillation. |

### Mathematical Formulations for $D_X, D_Y, D_B$

1. **Distribution Damage ($D_X$):**
   Continuous connection features (e.g., `duration`, `orig_bytes`, `resp_bytes`) use the two-sample Kolmogorov-Smirnov statistic or Wasserstein distance; categorical features (`proto`, `conn_state`) use Population Stability Index (PSI) or Jensen-Shannon Divergence:
   $$D_X = \sum_{j=1}^{M} w_j \cdot D_{\text{KS}}\left(X_{\text{ref}}^{(j)}, X_t^{(j)}\right), \quad \sum w_j = 1$$

2. **Performance Damage ($D_Y$):**
   Requires verified ground truth ($L > \tau_L$). Evaluates loss in attack recall and inflation in False Positive Rate (FPR) with a security bias ($\alpha = 0.7$):
   $$D_Y = \alpha \cdot \frac{\max(0, \text{Recall}_{\text{ref}} - \text{Recall}_t)}{\text{Recall}_{\text{ref}}} + (1 - \alpha) \cdot \frac{\max(0, \text{FPR}_t - \text{FPR}_{\text{ref}})}{1 - \text{FPR}_{\text{ref}}}$$
   *If trusted labels are absent, $D_Y = \text{None}$; the system enters an `awaiting_labels` state and cannot claim performance degradation.*

3. **Boundary Damage ($D_B$):**
   Evaluates model confidence loss and prediction clustering near the operating threshold $\theta$ using model scores $\hat{p} = M_c(X)$ without ground truth:
   $$D_B^{\text{margin}} = \frac{1}{|W_t|} \sum_{i=1}^{|W_t|} \mathbb{I}\left(|\hat{p}_i - \theta| < \epsilon\right), \quad \epsilon = 0.10$$
   $$D_B^{\text{entropy}} = \frac{1}{|W_t|} \sum_{i=1}^{|W_t|} -\left[\hat{p}_i \log_2 \hat{p}_i + (1 - \hat{p}_i) \log_2 (1 - \hat{p}_i)\right]$$
   $$D_B = 0.5 \cdot D_B^{\text{margin}} + 0.5 \cdot D_B^{\text{entropy}} \in [0, 1]$$

---

## 2. The DARI Repair Ladder (A0–A3)

Instead of an all-or-nothing retrain decision, DARI defines a 4-tier hierarchical ladder:

| Level | Action | Diagnostic Signature | Operational Intervention |
|---|---|---|---|
| **A0** | **No Repair** | $D_X > 0$, but $D_Y \approx 0, D_B \approx 0$ | Benign covariate shift. Continue monitoring; 100% compute/label saved. |
| **A1** | **Threshold / Calibration** | $D_X > 0$, $D_B \gg 0$, base ranking intact | Decision boundary shifted. Re-tune operating threshold $\theta$ or apply Platt/isotonic calibration (<1 sec execution; zero training). |
| **A2** | **Local Adaptation** | Localized degradation in specific cohort | Targeted sample re-weighting or fine-tuning on recent affected subspace with replay buffer. |
| **A3** | **Full Retraining** | $D_X \gg 0, D_Y \gg 0, D_B \gg 0, S \ge S_{\min}$ | Systemic degradation. Build DVC snapshot; retrain full tree estimator with replay memory. |

> **Key Principle:** Level A3 is an expensive, high-risk last resort. DARI strictly selects the lowest intervention level that restores the required security constraints.

---

## 3. DARI Decision Engine & Utility Optimization

The repair selector first enforces **Hard Security and Evidence Constraints**:
1. Sensor/Schema integrity: $Q \ge Q_{\min}$ (otherwise declare sensor incident).
2. Label reliability: $L \ge L_{\min}$ for actions requiring supervision ($A2, A3$).
3. Sample sufficiency: $S \ge S_{\min}$ for training candidates.
4. Critical safety guardrails: Estimated $\text{Recall}_{\text{attack}} \ge \tau_{\text{recall}}$ and $\text{FPR} \le \tau_{\text{fpr}}$.

For all remaining feasible actions $\mathcal{A}_{\text{feasible}} \subseteq \{A0, A1, A2, A3\}$, DARI maximizes expected net utility:

$$U(A_i) = R(A_i) - \lambda C(A_i) - \gamma G(A_i)$$

* $R(A_i)$: Expected security-performance recovery (gain in recall and reduction in false alarms).
* $C(A_i)$: Intervention cost (compute duration, CPU utilization, label consumption, training memory).
* $G(A_i)$: Deployment risk / instability penalty (probability of catastrophic forgetting or canary failure).
* $\lambda, \gamma$: Calibrated policy weights balancing operational cost and stability against recovery urgency.

**Optimal Selection:**
$$A^* = \arg\max_{A_i \in \mathcal{A}_{\text{feasible}}} U(A_i)$$

**Selective Candidate Construction:** The system builds **only** the selected action $A^*$. It does not wastefully train competing candidates across all tiers.

---

## 4. Automatic Data Assembly & Candidate Validation

### Tier-Specific Candidate Construction
- **If $A^* = A0$:** Log decision, update Prometheus metrics, and continue passive monitoring.
- **If $A^* = A1$:** Execute threshold search (e.g., Youden's J statistic or cost-sensitive FPR bound) or fit Platt scaler on development calibration window. No DVC snapshot or container rebuild required.
- **If $A^* = A2$ or $A3$:**
  1. Freeze monitoring interval and event watermark with label cutoff.
  2. Select independently verified labels ($L \ge L_{\min}$). Quarantine contradictory or unadjudicated rows.
  3. Combine recent labelled blocks with historical replay buffer to prevent catastrophic forgetting.
  4. Materialize immutable Parquet and publish versioned DVC snapshot.
  5. Run bounded subprocess training for $A2$ (fine-tune/re-weight) or $A3$ (full fit). Log bundle, metrics, and parameters to MLflow with operation ID.

### Predeployment Gates
- Provenance, bundle checksum, and schema validation.
- Same-event champion/challenger paired evaluation on governed promotion window with block bootstrap confidence intervals.
- Hard security non-regression gates passed (recall on critical attack classes must not drop).
- Outputs: `PASS`, `FAIL`, or `INCONCLUSIVE`. Failures reject the candidate and retain the champion without repeated unconstrained retries.

## Shadow, canary and promotion protocol

## Shadow versus canary
**Shadow:** duplicate the same feature events to the candidate while champion predictions remain authoritative. Strong for paired output/latency comparison and warm-up; doubles some compute. Use distinct `purpose` values so shadow alerts never page an operator as production alerts. Unlabelled agreement is not accuracy.

**Canary:** candidate becomes authoritative for a subset of inference requests/cohorts. Reduces exposure but does not provide paired labels by itself. For this stateless-flow MVP, Nginx weighted routing is simpler; stable hashed cohorts are an option if device isolation matters. Random small canaries may underrepresent rare attacks. A short shadow phase is recommended if resources permit, not falsely represented as an existing feature.

## Deployment state machine
`PROPOSED → STAGING → READY → CANARY → PROMOTING → STABLE`
with branches to `REJECTED`, `PAUSED`, `ROLLING_BACK`, `ROLLED_BACK`, `ROLLBACK_FAILED` and `DEGRADED`.

1. **Reserve inactive slot.** Hold a deployment lease/fence and host lock. Verify previous stabilization has ended before overwriting a retained rollback slot.
2. **Load exact release.** Pin image digest, model version and checksum; load preprocessing and threshold too. Candidate readiness requires warm-up fixtures and identity verification.
3. **Write desired generation.** Include expected current generation, exact slot identities, approved weights and evidence. Reject concurrent/stale mutation.
4. **Apply routing.** Render bounded Nginx configuration, test it, atomically install configuration, reload and observe a fresh-connection generation marker. Persist desired and observed state separately.
5. **Evaluate clean canary interval.** Exclude mixed earlier generations/slot occupants. Record candidate requests/flows, operational metrics and available labels. Minimum duration and sample counts are calibrated policy, not an arbitrary percentage ladder.
6. **Progress or pause.** Advance only when all required evidence and watcher freshness pass. Insufficient data pauses; absence of requests is not zero errors.
7. **Promote and retain predecessor.** Request a new generation with candidate authoritative for all new inference requests. Confirm application, retain old slot warm through stabilization, then update MLflow alias as a non-authoritative projection.

Nginx OSS supports weighted upstreams; percentages are approximate request shares, affected by sample size, batching, retries and backend failures. Do not use weight zero: remove/mark a server down for zero traffic. Graceful reload leaves old workers draining, so a signaled reload is not instantaneous convergence or a zero-downtime guarantee. [2–3]

## Rollback and verification

## Independent deterministic watchdog
Runs outside the training job and does not depend on the LLM. It checks slot identities/readiness, controller heartbeat, telemetry freshness, error/latency/saturation policy, routing divergence and labelled-quality evidence when sufficient.

Operational conditions can justify immediate recovery, but label-free confidence/prediction-distribution differences are **diagnostic proxies**, not proof the candidate is worse. A successful retrained model may legitimately change score distribution. Compare candidate/champion on matching cohorts and calibrate proxy policy; do not mechanically roll back every useful adaptation.

**Rollback sequence:**
1. Fence further progression; identify last known healthy release and expected generation.
2. Verify predecessor is still loaded, ready and checksum-correct.
3. Request a new generation routing new work to predecessor using the same validate/apply/observe protocol.
4. Keep candidate alive until old routing workers/in-flight requests drain or explicit drain timeout is reached.
5. Persist observed rollback, reason and timings; quarantine failed release and prevent auto re-promotion.
6. If predecessor unavailable, declare `ROLLBACK_FAILED/DEGRADED`, hold new changes and alert. Do not download a model while claiming a guaranteed warm rollback.

DB outage stops ordinary transitions. A tested optional local emergency path can restore only the last validated config/release, under a host lock and durable local journal, reconciling later. Otherwise disclose that the single-host/DB control path cannot guarantee rollback during that outage. Host/disk/shared-extractor failures are not repaired by switching estimator versions.

**Measure:** fault occurrence→detection, detection→decision, decision→new-route observation and old-request drain. The old proposal's '<5 seconds' can be a benchmark target only after defining which interval it measures. Report percentiles and failures, not only the best run.

### Two Deployment Pathways by Repair Level

1. **Lightweight Configuration Rollout (Level A1):**
   - When A1 is selected and validated, the deployment intent contains a `threshold_update` payload (new threshold $\theta^*$ and optional calibration map).
   - Applied atomically to the active serving slot's runtime configuration via the private API route without spinning up a container or restarting Nginx.
   - Verification occurs within seconds via test fixtures.
   
2. **Container Slot Rollout (Levels A2 & A3):**
   - Follows the complete dual-slot staging and canary protocol:
   - `PROPOSED → STAGING (Slot B) → READY → CANARY (5% → 25% → 50% → 100%) → PROMOTING → STABLE`.
   - The predecessor (Slot A) remains warm for instantaneous rollback if watchdog criteria breach.

## Required demonstrations
| Scenario | DARI Fingerprint & Trigger | Expected Result |
|---|---|---|
| **DARI-A0 Demonstration** | $D_X > 0.35, D_Y = 0.0, D_B < 0.1$ | Selects **A0 (No Repair)**; logs benign covariate shift, zero retraining compute used. |
| **DARI-A1 Demonstration** | $D_X > 0.2, D_B > 0.35$, ranking valid | Selects **A1 (Threshold Calibration)**; operating threshold re-tuned in <1s; immediate recovery without model rebuild. |
| **DARI-A2 Demonstration** | Localized cohort drop, $S \ge S_{\min}$ | Selects **A2 (Local Adaptation)**; fine-tunes on affected subspace with replay buffer; stages candidate in Slot B. |
| **DARI-A3 Demonstration** | $D_X > 0.5, D_Y > 0.4, D_B > 0.4$ | Selects **A3 (Full Retraining)**; builds DVC snapshot, retrains full LightGBM baseline, completes canary and promotes. |
| **Missing labels** | $L < L_{\min}, D_Y = \text{None}$ | Enters `awaiting_labels` state; champion retained; no pseudo-label adaptation. |
| **Capture/schema failure** | $Q < Q_{\min}$ (missing cols, drops) | Declares sensor incident; model frozen; no retraining. |
| **Candidate harms guarded class** | Critical attack recall drops | Paired evaluator marks `FAIL` or `INCONCLUSIVE`; candidate rejected. |
| **Bad candidate operational behavior** | Latency/error breach during canary | Watchdog initiates deterministic rollback to warm predecessor in <5 seconds. |
| **Duplicate trigger / worker crash** | Idempotent lease & operation ID | One logical repair cycle, reconciled state. |

### Sources
1. [Evidently drift customization](https://docs.evidentlyai.com/metrics/customize_data_drift) and [NIDS drift survey](https://doi.org/10.1109/ACCESS.2026.3691262).
2. [Nginx upstream routing](https://nginx.org/en/docs/http/ngx_http_upstream_module.html).
3. [Nginx control/reload](https://nginx.org/en/docs/control.html).
4. [LangGraph interrupt semantics](https://docs.langchain.com/oss/python/langgraph/interrupts).
5. [MLflow registry aliases](https://mlflow.org/docs/latest/ml/model-registry/workflow/).

Guardrails and state transitions are proposed SwayamKavach policies; cited tools do not enforce them automatically.
