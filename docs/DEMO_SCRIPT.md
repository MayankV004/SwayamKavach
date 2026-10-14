# SwayamKavach — Demonstration Walkthrough & Video Script

> **Demonstration Title**: Autonomous Self-Healing IoT Intrusion Detection in Action  
> **Duration**: 5 Minutes  
> **Target Audience**: Faculty Evaluation Panel, Capstone Review Committee, Security Engineers  
> **Pre-requisite**: Full system running locally via `scripts/rehearse_restore.sh` or local startup

---

## Pre-Flight Checklist (T - 2 Minutes)

Before commencing the demonstration or starting the screen recording:
1. Ensure the terminal window is sized comfortably with 14pt+ font.
2. Ensure browser is open at `http://localhost:3000` (Operator UI) and `http://localhost:8000/docs` (FastAPI Swagger).
3. Confirm backend services are active:
   ```bash
   # Quick health check:
   curl -s http://localhost:8000/api/v1/health | jq
   curl -s http://localhost:8001/health | jq
   ```
4. Verify active champion is `Release R1` in Slot A with 100% traffic.

---

## Timed Walkthrough Script

### Scene 1: Introduction & Operational Baseline (0:00 – 1:00)
- **Presenter Action**: Open the SwayamKavach Next.js Dashboard at `http://localhost:3000`.
- **Display**: Point out the Top Navigation Bar, the **Active Champion (R1 in Slot A)** badge, and the **Dual-Slot Traffic Split** card (Slot A: 100%, Slot B: 0%).
- **Spoken Commentary**:
  > *"Respected panel, welcome to the demonstration of SwayamKavach. In modern edge IoT networks, intrusion detection systems face a critical dilemma: static models fail under concept drift, while blindly retraining on every alert causes retrain fatigue and burns valuable gateway compute.*  
  > *Here on the operator dashboard, we see SwayamKavach operating in nominal state. Release R1 is serving 100% of network traffic in Slot A. Latency is under 2 milliseconds, and security recall is 99.66%. Behind the scenes, the continuous window selector is aggregating live Zeek connection logs."*

---

### Scene 2: Environmental Covariate & Boundary Shift $\to$ Level A1 Calibration (1:00 – 2:15)
- **Presenter Action**: Scroll down to the **Autonomous Self-Healing Simulation Suite** section. Click the **"Boundary Shift (Margin Ambiguity)"** scenario button.
- **Display**: Watch the 7D Damage Radar / Fingerprint update in real time ($D_B = 0.480, D_X = 0.045, D_Y = 0.012$).
- **Spoken Commentary**:
  > *"Now, we inject an environmental covariate shift where network traffic fluctuates near our decision boundary, elevating margin ambiguity ($D_B$).*  
  > *In a naive MLOps pipeline, this statistical drift would trigger an expensive, multi-minute retraining cycle. But look at SwayamKavach's DARI engine: because feature representations remain intact and only the decision boundary is affected, DARI determines that full retraining is unnecessary.*  
  > *It selects Action A1: Threshold Recalibration. In less than 20 milliseconds, without changing a single weight or spinning up heavy training jobs, the threshold is recalibrated to 0.150, immediately restoring attack recall to 100% with zero compute waste."*

---

### Scene 3: Severe Attack Shift $\to$ Candidate Evaluation & Dual-Slot Canary (2:15 – 3:30)
- **Presenter Action**: Click the **"Severe Multi-Class Attack"** scenario button.
- **Display**: Show the DARI diagnostic fingerprint ($D_X = 0.450, D_Y = 0.220, R = 3$). Show the Candidate Evaluation card and the Canary Staging ladder advancing ($5\% \to 25\% \to 50\% \to 100\%$).
- **Spoken Commentary**:
  > *"Now let's examine what happens when an actual, severe, persistent multi-class attack occurs ($R=3$ consecutive windows). DARI diagnoses true structural damage and authorizes Level A3: Candidate Model Retraining.*  
  > *However, SwayamKavach enforces strict safety invariants: no model is promoted merely because training succeeded. The candidate enters our Deterministic Safety Gate.*  
  > *First, it undergoes paired McNemar statistical testing ($p < 0.001$). Second, it passes our zero-regression invariant on critical attack classes—ensuring rare backdoor and injection attacks are never sacrificed for general accuracy.*  
  > *Upon receiving a cryptographic SHA-256 approval manifest, Candidate R2 is staged into Slot B. The canary controller shifts traffic: 5%, 25%, 50%, and finally 100%, completing promotion with zero downtime."*

---

### Scene 4: Negative Scenarios & Warm Rollback (3:30 – 4:15)
- **Presenter Action**: Click **"Canary Watchdog Rollback"** and **"Corrupted Data Rejection"**.
- **Display**: Show the instant drop of Slot B traffic back to 0.0% and the safety alert indicating that corrupted data ($Q=0.55$) strictly forbade retraining.
- **Spoken Commentary**:
  > *"SwayamKavach is designed for defense-in-depth under failure conditions.*  
  > *When we inject corrupted sensor data where data quality $Q$ drops below 0.70, DARI strictly blocks retraining to prevent adversarial poisoning.*  
  > *Furthermore, if an operational SLA is breached during canary rollout—for instance, if latency exceeds 150ms—our watchdog triggers an immediate warm rollback. In zero milliseconds, Slot B is isolated and 100% of traffic returns to Champion Slot A with zero dropped packets."*

---

### Scene 5: Comparative Benchmarks & Academic Handover (4:15 – 5:00)
- **Presenter Action**: Scroll to the **Empirical Benchmark Comparison Scoreboard**.
- **Display**: Highlight the comparison table between Static Champion, Periodic Retraining, Retrain-All, and SwayamKavach (DARI).
- **Spoken Commentary**:
  > *"Finally, we evaluated SwayamKavach across 2,000 real-world streaming IoT events against three industry baselines.*  
  > *Compared to Retrain-All, SwayamKavach eliminates 100% of retrain fatigue—reducing the unnecessary retraining rate from 85.7% to 0.0%. It achieves a 57.1% reduction in edge compute time, saves 45% of manual ground-truth labeling costs, and maintains 98.2% cumulative attack recall.*  
  > *Our clean-room script guarantees that this entire platform can be cloned, verified with 56 passing tests, and reproduced from scratch in under 30 seconds.*  
  > *Thank you, and we welcome your questions."*

---

## Recommended Demonstration Backup Screenshots

1. **Dashboard Overview**: Active Champion R1, 100% Slot A traffic, and real-time alert log.
2. **DARI 7D Radar Fingerprint**: Showing $D_X, D_Y, D_B, Q, L, S, R$ under boundary shift.
3. **Safety Gate Audit Card**: Showing McNemar $p$-value, per-class critical recall comparison, and SHA-256 approval hash.
4. **Benchmark Scoreboard**: Showing the quantitative comparison matrix and compute reduction chart.
