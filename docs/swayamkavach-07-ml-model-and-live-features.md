# SwayamKavach — 07 ML Model and Live Features

Dataset selection, exact TON-to-Zeek feature mapping, model and preprocessing design, leakage-resistant evaluation and live inference limitations.

## Dataset selection and evidence

# 07 · ML Model, Datasets and Live Feature Engineering

**Recommendation:** binary attack/benign first, TON_IoT network data, a connection-only feature contract and CPU batch retraining. Compare LightGBM with Random Forest and HistGradientBoosting rather than assume the most complex estimator wins. This research did not download full dataset archives, train models or benchmark hardware; archive headers, extractor parity and performance remain implementation tests.

| Dataset | Suitable use | Deployment/evaluation caveat |
|---|---|---|
| TON_IoT network | Primary IoT/IIoT benchmark; PCAP, Zeek logs, processed CSV and ground truth | Mixed modalities exist; choose network subset explicitly. Verify full versus sampled release and historical extraction rules |
| CICIDS2017 | Secondary enterprise-network benchmark | Five-day chronology, benign Monday, scheduled attacks; CICFlowMeter semantics and known labelling/extraction defects |
| CSE-CIC-IDS2018 | Larger enterprise benchmark | Different testbed, not simply renamed 2017; larger PCAP/storage scope and same provenance concerns |
| CICIoT2023 | IoT-native optional comparison; 105 devices, 33 attacks | Published extraction uses class-dependent packet aggregation windows; direct live equivalence needs correction/re-extraction |
| CICIoMT2024 | Verified newer medical-IoT alternative; Wi-Fi/MQTT/Bluetooth | Specialized domain; BLE is not a Zeek IP connection; newer does not mean better for this scope |
| NSL-KDD | Cheap historical smoke test | Legacy features and traffic; not evidence of modern IoT deployment validity |

Official sources provide TON_IoT academic-use terms and ground-truth provenance. The network labels were constructed from attack timing and known attacker hosts; identifiers can encode the experiment rather than behavior. Preserve them for joining/splitting, but exclude them from default predictors. [1]

For CIC2017/2018, cite the exact original or corrected version. Engelen et al. document material flow/extraction/label problems; a newly installed similarly named extractor does not automatically reproduce published CSV. [2–3]

**Do not claim a globally 'latest' dataset.** CICIoMT2024 is a verified newer option considered here, not a claim that no 2025/2026 corpus exists. Select on fit, provenance and extractability—not date alone.

## Feature contract and packet-to-model bridge

## Recommended connection-only feature sets
Start with the five-feature subset investigated in the supplied TON-IoT paper, then ablate a modest connection-feature superset. Its reported random-split accuracy is not an expected score under your temporal evaluation. [4]

| Canonical TON name | Zeek conn.log field | Meaning / policy |
|---|---|---|
| duration | duration | Seconds under Zeek connection semantics; null allowed under explicit policy |
| src_bytes | orig_bytes | Originator payload-byte accounting; not IP total bytes |
| dst_bytes | resp_bytes | Responder payload-byte accounting |
| src_ip_bytes | orig_ip_bytes | Observed originator IP-level bytes, not header-only bytes |
| dst_ip_bytes | resp_ip_bytes | Observed responder IP-level bytes |
| src_pkts | orig_pkts | Optional superset: originator packet count |
| dst_pkts | resp_pkts | Optional superset: responder packet count |
| proto | proto | Optional categorical transport protocol |
| service | service | Optional Zeek-detected service; absence is not zero |
| conn_state | conn_state | Optional categorical connection state |
| missed_bytes | missed_bytes | Optional capture-quality/input feature; also monitor separately |

Originator/responder does not mean local/remote. Pin unit, dtype, null representation, direction, checksum policy, Zeek version/scripts, protocol filter, flow timeouts and ordered feature names. A model manifest identifies exactly `ton-conn-5-v1` or `ton-conn-11-v1`, not a vague 'TON model'. [5]

TON's full inventory includes DNS (`query`, `qtype`, response flags), SSL/TLS (`version`, `cipher`, certificates), HTTP (method, URI, body lengths/status) and weird-event fields. These originate in separate logs. A field mapping is **not** a complete reconstruction: several application events can share a connection, requiring original join/selection/default rules. Blind joins duplicate rows. TLS encryption and TLS 1.3 certificate visibility limit passive application features. Drop these strings initially for privacy, cardinality and reproducibility.

## Actual live path
```text
Authorized gateway / TAP / mirrored interface
  -> pinned Zeek capture
  -> JSON conn.log
  -> schema adapter and bounded local spool
  -> authenticated flow batch ingestion
  -> durable inference consumer
  -> exact preprocessing/model bundle
  -> score, thresholded advisory alert, release provenance
```

Documented capture examples (run on your authorized sensor):
```bash
zeek -r capture.pcap LogAscii::use_json=T
zeek -i <authorized-interface> LogAscii::use_json=T
```
Do not add checksum-disabling flags by habit; determine whether capture offload requires them. A cloud VM cannot observe a private LAN without an installed sensor/forwarding path. A laptop normally cannot see other switched hosts. [5–6]

**Latency:** `first_packet → connection closure/expiration → feature ready → queue → prediction → alert`. Completed-flow models do not classify the first packet. To shorten long-flow latency, design partial-window features and retrain on that representation; do not feed incomplete flows to a complete-flow model without validation.

## Other extractor choices
CICFlowMeter provides PCAP/live capture paths but has Java/native dependency and historical implementation considerations. NFStream exposes interface/PCAP inputs and configurable timeouts/accounting. Neither is a drop-in translator for TON CSV. If TON CSV parity cannot be demonstrated, re-extract its PCAP with one chosen configuration and train a new, explicitly named derived dataset. Use that same extractor in live operation. [7]

For cross-dataset transfer, re-extract both PCAP sources through the same contract. Do not rename CICIoT2023 `Tot size`, `IAT` or aggregate counts into directional TON byte features. Its paper describes 10- versus 100-packet aggregation according to class, which a live predictor cannot know beforehand; use class-independent extraction for deployment. [8]

## Preprocessing and training procedure

## Reproducible training steps
1. Freeze raw archive identity, selected captures, licence/access notes and checksum. Keep original timestamps/capture IDs before any filtering.
2. Validate schema and ground-truth joins. Reject impossible values/infinities and record missingness; do not impute unknown labels.
3. Construct chronological development partitions and a sealed final evaluation partition. Group related sessions/overlapping windows/duplicate events across boundaries; purge/embargo according to feature dependencies.
4. Fit all preprocessing and feature selection only inside training partitions. Use later development data for hyperparameters, early stopping, calibration and decision threshold; avoid reusing final test data.
5. Train compact baselines with comparable search budgets. Log code, lockfile, dataset/split/label revisions, seeds, parameters, fit time and resource usage.
6. Evaluate paired predictions on the same eligible events; log class order, score semantics and threshold.
7. Package fitted preprocessing, estimator, threshold, class map and feature schema as one release; verify loaded-model prediction equivalence before registration as deployable.

### Preprocessing by feature type
For five numeric fields, a tree model typically does not need standardization. RF may use an imputer plus missing indicators; LightGBM/HistGradientBoosting can support native missingness under a tested contract. Null must not be silently converted to a physically meaningful zero. Log transforms are an optional ablation, not automatic necessity for trees.

For the superset, encode `proto`, `service`, `conn_state` consistently. One-hot with unknown-category handling is simple; native categorical support is more compact but requires exact training/serving categories and estimator-specific handling. Never assign arbitrary numeric category codes and accidentally imply order. Scaling becomes important for linear/distance baselines. Document sparse/dense output and dtype so serialization does not change behavior.

For CIC schemas, remove label/flow identifiers/timestamps from predictors and address infinities such as zero-duration-derived rates explicitly. For NSL-KDD, encode protocol/service/flag categoricals and scale if using distance/linear models; this preprocessing does not solve live extraction of its legacy content/window features.

## Estimator comparison
| Model | Why include | Watch-outs |
|---|---|---|
| LightGBM | Fast tabular boosting, nonlinear interactions, bounded batch updates | Leaf count/min-data/regularization; categorical mapping; weighting affects score calibration |
| Random Forest | Strong low-tuning baseline, intuitive feature diagnostics | Memory/latency with deep large forests; OOB not a temporal-generalization test |
| HistGradientBoosting | sklearn-only boosting baseline, missing/categorical support | Category limits; random internal early stopping must not leak across time |
| Small Decision Tree | Very cheap interpretability/latency baseline | High variance and limited robustness; paper's good random-split result may not transfer |

These are batch learners, not default `partial_fit` streaming algorithms. Warm-starting more trees is not a substitute for controlled retraining/forgetting. Use one bounded hyperparameter search budget and time-aware validation. [9–10]

### DARI Tiered Remediation Mechanisms
1. **Level A1 — Threshold Tuning & Calibration (Zero-Training Intervention):**
   - *Operating Threshold Search:* When boundary damage $D_B$ rises while feature ranking remains intact, re-optimize the decision threshold $\theta^*$ on the development calibration window using Youden's J statistic ($J = \text{Recall} - \text{FPR}$) subject to the hard constraint $\text{FPR} \le \tau_{\text{fpr}}$.
   - *Probability Recalibration:* Fit Platt scaling (logistic regression on logit margin scores) or Isotonic Regression on calibration data to correct score drift.
   - *Latency & Cost:* Executes in <500 milliseconds; updates serving threshold in-memory without retraining or container redeployment.
2. **Level A2 — Localized Subspace Adaptation:**
   - *Targeted Sample Re-weighting:* Apply density-ratio weights $w(x) = P_{\text{target}}(x) / P_{\text{source}}(x)$ to localized cohorts where specific attack types or protocols drifted.
   - *Focused Fine-tuning:* Train a localized booster on the affected cohort combined with historical replay anchors to prevent catastrophic forgetting.
3. **Level A3 — Full Retraining:**
   - Full re-estimation of the LightGBM/RandomForest baseline across the frozen DVC snapshot (approved recent window + historical replay).

**Imbalance:** compare unweighted versus training-derived class/sample weights; preserve natural test prevalence. Document whole-block/scenario subsampling under CPU limits. Do not use SMOTE by default on mixed categorical protocol features or split before preventing related-flow leakage. If calibrated probabilities are needed, calibrate on separate eligible development data; class weighting alone does not produce calibrated attack probabilities.

## Evaluation, labels and limitations

## Metrics
Binary primary set: attack AP/PR curve, precision, recall, F1 at a validation-selected threshold, FPR = FP/(FP+TN), confusion counts and class prevalence. AP is not identical to trapezoidal PR-AUC; label the computation. Accuracy/ROC-AUC are secondary, especially with imbalance.

Multiclass extension: per-class recall/precision, macro-F1, confusion matrix and support. Weighted-F1 can hide rare-attack failures. Missing attack classes or one-class windows can make metrics undefined—report unavailable/support rather than zero.

Operational set: packet→alert and feature-ready→alert percentiles, capture loss, queue age, throughput, resource usage, update duration, recovery/rollback timing. False alerts per hour/device require a genuine timed stream, not arbitrary accelerated CSV playback presented as natural time.

## Temporal evaluation traps
- `TimeSeriesSplit` does not group sessions and its gap is a row count, not necessarily a real-time embargo. `GroupKFold` alone is not chronological. [11]
- CICIDS2017 Monday is benign: naïvely training only on Monday gives no attack examples for a supervised binary classifier. Report this rather than shuffling away the experiment.
- Sorting a sampled/shuffled TON CSV by timestamp cannot reconstruct original complete arrival rates or capture continuity.
- Duplicate feature vectors can be legitimate repeated attacks; group duplicate original events to prevent leakage without deleting prevalence indiscriminately.
- Compare future-known-device and unseen-device/scenario generalization separately.

## Labels and drift
Track event time, prediction time and label availability time. At a given training cutoff, only independently available labels are eligible. For replay, a separate label component releases dataset labels with configured delay; the model never sees them as features. For live lab trials, use authorized scenario schedules plus endpoint evidence/adjudication. Unknown is not benign; a detector or signature alert is not automatically gold truth.

Feature drift concerns P(X); concept drift concerns P(Y|X). One can change without the other. Delayed error/quality evidence may support degradation analysis; an unlabelled KS/PSI alarm cannot prove concept drift or improved recall after retraining. The drift survey emphasizes precisely these experimental limitations. [12]

## Paper appraisal and sources
The supplied five-feature paper reports a stratified random 70/30 split and strong DT/RF accuracy. That is evidence for a lightweight candidate, not for future-device generalization. Its cross-dataset feature substitutions and 'incremental' DT description need clarification before adopting them. [4]

1. [TON_IoT official](https://research.unsw.edu.au/projects/toniot-datasets).
2. [CICIDS2017](https://www.unb.ca/cic/datasets/ids-2017.html); [CSE-CIC-IDS2018](https://www.unb.ca/cic/datasets/ids-2018.html).
3. [Engelen et al., dataset troubleshooting](https://doi.org/10.1109/SPW53761.2021.00009); [extended/corrected dataset documentation](https://intrusion-detection.distrinet-research.be/WTMC2021/extended_doc.html).
4. [Dharini et al., TON-IoT feature selection](https://doi.org/10.1038/s41598-026-37834-y).
5. [Zeek conn.log](https://docs.zeek.org/en/current/logs/conn.html).
6. [Zeek quick start](https://docs.zeek.org/en/lts/quickstart.html).
7. [CICFlowMeter repository](https://github.com/CanadianInstituteForCybersecurity/CICFlowMeter/); [NFStream API](https://nfstream.org/docs/api).
8. [CICIoT2023 official](https://www.unb.ca/cic/datasets/iotdataset-2023.html); [dataset paper](https://www.mdpi.com/1424-8220/23/13/5941).
9. [LightGBM classifier API](https://lightgbm.readthedocs.io/en/stable/pythonapi/lightgbm.LGBMClassifier.html).
10. [HistGradientBoosting API](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.HistGradientBoostingClassifier.html).
11. [sklearn cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html).
12. [Concept-drift-resilient NIDS survey](https://doi.org/10.1109/ACCESS.2026.3691262).
13. [CICIoMT2024](https://www.unb.ca/cic/datasets/iomt-dataset-2024.html); [NSL-KDD official caveats](https://www.unb.ca/cic/datasets/nsl.html).

See 08 for paired statistics and promotion gates; 10 for ingestion/monitoring implementation.
