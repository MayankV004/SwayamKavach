# SWAYAMKAVACH

## Drift-Aware Repair Inference (DARI)

**Architecture, decision flow and implementation design**

> **Core idea:** DARI does not treat drift as an automatic signal for full retraining. It diagnoses the type/severity of damage and selects the smallest repair that can satisfy the required security constraints.

## 1. System Architecture

The system has four logical layers. The DARI decision layer is the main algorithmic component; validation and deployment form the safety layer.

### Architecture flow

1. **MONITOR** — traffic + data quality
2. **DETECT** — drift + degradation
3. **DIAGNOSE** — \(D_X, D_Y, D_B\)
4. **SELECT** — A0–A3 repair
5. **BUILD** — selected candidate
6. **VALIDATE** — security + statistics
7. **CANARY** — 5 → 25 → 50 → 100%
8. **DEPLOY** — promote / rollback

| Layer | Purpose | Main modules |
|---|---|---|
| Monitoring | Understand what is happening to the incoming stream. | Feature extraction, schema checks, windowing, drift/performance monitoring |
| DARI decision | Determine what repair is actually required. | Damage fingerprint, feasible-action filter, utility, repair selector |
| Candidate validation | Check whether the selected repair is better/safe enough. | Champion–challenger comparison, security constraints, statistical test |
| Safe deployment | Introduce the candidate without losing the working model. | Shadow, canary, monitoring, promotion, rollback |

## 2. DARI Inputs → Damage Fingerprint

| Signal | What it represents | Why DARI needs it |
|---|---|---|
| \(D_X\) | Distribution damage | Shows how strongly current traffic differs from the reference. |
| \(D_Y\) | Performance damage | Shows whether IDS security performance has degraded. |
| \(D_B\) | Boundary / uncertainty damage | Shows instability around the model's decision boundary. |
| \(Q\) | Data quality | Prevents bad/corrupted data from driving adaptation. |
| \(L\) | Label reliability | Indicates how trustworthy available labels are. |
| \(S\) | Sample sufficiency | Determines whether enough data exists for a repair. |
| \(R\) | Persistence | Prevents one-window/transient changes from causing repair. |

**Damage fingerprint:**

\[
F_t = [D_X, D_Y, D_B, Q, L, S, R]
\]

## 3. Repair Ladder

| Level | Decision | Typical situation | Example |
|---|---|---|---|
| A0 | No repair | Drift but security behaviour remains stable. | Continue monitoring |
| A1 | Threshold / calibration | Decision boundary shifted; model ranking still useful. | Change threshold / calibrate |
| A2 | Local adaptation | Localized degradation with enough recent evidence. | Reweight / targeted / few-shot update |
| A3 | Full retraining | Broad or severe degradation with sufficient diverse data. | Replay + recent-data retraining |

> **Key principle:** A3 is not the default. DARI should prefer the lowest intervention that restores the required security behaviour.

---

## 4. DARI Decision Engine

The selector first removes actions that are unsafe or infeasible. It then ranks the remaining actions using expected recovery, intervention cost and deployment risk.

\[
U(A_i) = R(A_i) - \lambda C(A_i) - \gamma G(A_i)
\]

| Term | Meaning |
|---|---|
| \(R(A_i)\) | Expected security-performance recovery from the repair. |
| \(C(A_i)\) | Compute, label, training and operational cost. |
| \(G(A_i)\) | Deployment risk or instability penalty. |
| Hard constraints | Critical recall, FPR, data quality and evidence requirements that must be satisfied before ranking. |

**Selection:** \(A^* = \arg\max U(A_i)\) among feasible actions.

## 5. End-to-End DARI Flow

1. **Monitor**  
   Collect the next traffic window. Validate schema, ranges, missingness and basic data quality.

2. **Detect**  
   Measure distribution shift and changes in model behaviour relative to the champion/reference.

3. **Diagnose**  
   Compute \(D_X\), \(D_Y\) and \(D_B\) to determine whether the change is benign, localized or harmful.

4. **Check evidence**  
   Evaluate \(Q\), \(L\), \(S\) and persistence \(R\). If critical safety conditions fail, use the safe/emergency policy instead of normal repair selection.

5. **Select repair**  
   Generate feasible A0–A3 actions and choose the action with the best expected recovery–cost–risk trade-off.

6. **Build candidate**  
   Construct only the selected repair. Do not train unnecessary candidates just to compare them.

7. **Validate**  
   Compare the candidate against the current champion using security constraints and the chosen statistical acceptance test.

8. **Canary → deploy**  
   Shadow/canary at 5% → 25% → 50% → 100%. Promote if safe; rollback immediately if safety conditions are violated.

## 6. Main DARI Algorithm

```text
INPUT: champion M_c, traffic window W_t, reference R

1.  Validate W_t
2.  Compute D_X, D_Y, D_B and Q, L, S, R
3.  Check critical safety conditions
4.  Generate feasible actions A = {A0, A1, A2, A3}
5.  Estimate recovery R(A_i), cost C(A_i), risk G(A_i)
6.  Compute U(A_i) = R(A_i) − λC(A_i) − γG(A_i)
7.  Select A* = argmax U(A_i)
8.  If A*=A0 → continue monitoring
9.  Otherwise build candidate for A*
10. Validate candidate against champion
11. FAIL → reject; INCONCLUSIVE → gather evidence; PASS → canary
12. Canary safe → promote; unsafe → rollback
```

## 7. Validation & Safe Deployment

| Gate | What must pass |
|---|---|
| Data gate | Valid schema, acceptable quality and sufficient samples. |
| Security gate | Critical-class recall and FPR remain within policy limits. |
| Statistical gate | Candidate advantage is supported by the selected statistical comparison. |
| Canary gate | No critical degradation while the candidate receives live traffic. |
| Rollback gate | Champion remains immediately available until promotion is complete. |

**Deployment path:** Champion → Shadow → 5% → 25% → 50% → 100%.

## 8. LangGraph Role

LangGraph is the workflow/orchestration layer around DARI. It should not become the security authority.

| Node | Responsibility |
|---|---|
| Monitor | Collect current evidence. |
| Damage | Compute the damage fingerprint. |
| Repair | Run the DARI selector. |
| Candidate | Build the selected repair. |
| Validation | Run deterministic safety/statistical checks. |
| Canary | Control staged deployment. |
| Promote / Rollback | Execute only the policy-approved deployment action. |
| Audit | Store evidence, decision, candidate and outcome. |

> **LLM rule:** it may orchestrate and explain structured evidence, but it cannot bypass deterministic safety gates.

## 9. Evaluation Plan

| Baseline | What it tells us |
|---|---|
| Static champion | How much degradation occurs without adaptation. |
| Periodic retraining | Cost/benefit of scheduled adaptation. |
| Drift → full retrain | Cost and safety of the common reactive strategy. |
| EGA-v2 | Whether DARI's repair selection improves on evidence-gated adaptation. |
| Fixed repair ladder | Whether DARI's inference adds value beyond predefined escalation. |
| DARI | Security + cost + repair-selection performance. |

### Metric groups

| Metric group | Examples |
|---|---|
| Security | F1, attack recall, critical-class recall, FPR. |
| Adaptation | Number of adaptations, repair level, time-to-recovery. |
| Cost | Training time, compute, labels consumed, candidate count. |
| Safety | Harmful promotions, rollback rate, critical violations. |
| Decision quality | Utility, regret vs. oracle, unnecessary A3 rate. |

## 10. Implementation Structure

| Module | Responsibility |
|---|---|
| `monitoring/` | Windowing, drift and performance signals. |
| `damage/` | \(D_X\), \(D_Y\), \(D_B\) computation. |
| `dari/` | A0–A3 actions, constraints, utility and selector. |
| `validation/` | Champion–challenger evaluation. |
| `deployment/` | Shadow, canary and rollback. |
| `agent/` | LangGraph workflow and explanation. |
| `experiments/` | Drift scenarios, baselines and ablations. |

**Implementation order:** Champion → Monitoring → Damage Fingerprint → A0/A1/A2/A3 → DARI Selector → Validation → Canary/Rollback → LangGraph.

## 11. What DARI Is Actually Contributing

The contribution should be presented as a decision algorithm, not as a new classifier or a new drift detector.

| Problem | DARI response |
|---|---|
| Drift does not necessarily mean model failure. | Separate drift evidence from damage evidence. |
| Different damage can require different interventions. | Map the damage fingerprint to A0–A3. |
| Full retraining is expensive. | Prefer the minimum sufficient repair. |
| A candidate may be worse than the champion. | Validate before deployment. |
| Repeated drift can cause oscillation. | Use persistence/cooldown and controlled reference updates. |

### DARI's central research hypothesis

> A damage-aware, minimum-intervention repair policy can maintain or improve critical IoT IDS security performance while reducing unnecessary full retraining, adaptation cost and unsafe model replacement.

## 12. One-Page Mental Model

Something changed? → Detect drift

↓

Did the model actually suffer damage? → Diagnose \(D_X / D_Y / D_B\)

↓

What is the smallest fix? → A0 / A1 / A2 / A3

↓

Is the fix safe? → Champion–challenger validation

↓

Is it safe in production? → Canary

↓

Safe? → Promote  
Unsafe? → Rollback

**Final architecture:** Monitor → Detect → Diagnose → Select Repair → Build → Validate → Canary → Promote/Rollback.
