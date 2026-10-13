# SwayamKavach — 10 Intrusion Detection and Monitoring Triggers

Live IoT capture, asynchronous flow inference, alert semantics, monitoring windows, Prometheus/Grafana metrics and feedback triggers.

## Capture and ingestion

# 10 · Intrusion Detection and Monitoring Trigger Flow

This document describes the online data plane, complementing the lifecycle control plane in 09. Intrusion prediction, operational alerting and model-drift alarms are three different event types.

## From actual IoT traffic to a feature event
**Placement:** deploy Zeek at an explicitly authorized gateway, TAP or mirror/SPAN interface. Capturing on a cloud application VM or arbitrary laptop does not expose the entire IoT network. A Linux host sensor with narrow capture capabilities is preferable to granting the application stack blanket privileges. Docker bridge networking is not LAN packet capture. [1–2]

**Representations:** PCAP replay and live capture both use the same pinned Zeek configuration and typed adapter. Connection-completion summaries become the five- or eleven-feature schema chosen in 07. Keep capture ID, sensor ID, schema/extractor versions, event time and feature-ready time. One-sided capture, truncation, dropped packets and missing bytes affect feature quality and must be observable.

**Spooling:** write a bounded local durable spool keyed by sensor/capture/event ID. Send batches to `/api/v1/ingestion/batches`; remove/acknowledge local entries only after durable receipt. Retry with backoff and stable IDs. Bound disk retention and expose losses explicitly when capacity is exhausted; never silently skip data while reporting normal throughput.

**Backpressure:** the API returns 202 after committing accepted work, 422 for invalid features, 429 for admission limits and 503 when it cannot durably accept. Admission capacity is tied to disk/queue budget, not an unbounded in-memory list. Monitor oldest unprocessed event age in addition to queue size.

**Why flow rather than packet inference?** TON-compatible connection fields require accumulated state. Stateful feature accumulation stays at the extractor, so either serving slot can score a complete row. First-packet or fixed-window detection is a separate representation requiring retraining and its own evaluation.

## Prediction and alert pipeline

## Inference consumer
1. Claim durable work without holding a long database transaction.
2. Group only compatible schema events into a bounded microbatch; preserve event IDs.
3. Call private Nginx `/predict`, which routes the request to slot A or B.
4. Slot validates schema, applies the bundled preprocessing, computes scores and applies its bundled threshold/class map.
5. Consumer verifies response IDs/count/schema and persists the authoritative prediction plus any advisory alert in one transaction.
6. Emit durable UI/audit events and application metrics; acknowledge work only after commit.

A score response contains `release_id`, explicit `model_version`, `slot`, threshold/class order, inference timing and actual router generation. Idempotent commits prevent a lost response/retry producing duplicate alerts. Executed inference attempts and committed predictions have different counters. A failed request must not return a benign label.

## Intrusion alert semantics
Binary score above the validated operating threshold produces a **suspected intrusion**, not confirmed ground truth. Alert policy may aggregate related events into incidents using sensor/session/time metadata; this reduces notification fatigue but does not erase raw prediction evidence. Class-specific severity is policy and must not be confused with the estimator's confidence.

- Persist alert evidence in the application database, not as a Prometheus label.
- Operator acknowledgement is not adjudication.
- Independent labels are versioned and joined later by event ID.
- No automatic firewall block/isolation in the MVP.
- Candidate shadow predictions are explicitly non-authoritative and do not create production alerts.

For multiclass extensions, class map and unknown/unseen-family limitations must be explicit. A supervised classifier generally cannot name a class absent from its trained class map; binary novelty experiments test detection generalization, not recognition of a new named category.

## Prometheus and Grafana design

## Proposed metric contract
Names below are application definitions to implement; they are not built-in metrics supplied by FastAPI/Zeek.

| Metric | Type / bounded labels | Purpose |
|---|---|---|
| `sk_ingest_events_total` | Counter; outcome enum | Accepted/rejected event volume |
| `sk_inference_attempts_total` | Counter; slot, outcome | Model HTTP execution including retries |
| `sk_predictions_committed_total` | Counter; outcome/class enum | Authoritative stored outcomes |
| `sk_inference_duration_seconds` | Histogram; slot | Feature-batch scoring duration; define per-request/per-row semantics |
| `sk_feature_to_alert_duration_seconds` | Histogram; bounded stage or cohort | Queue plus inference/commit latency |
| `sk_queue_oldest_age_seconds` | Gauge; queue enum | Backlog urgency |
| `sk_sensor_last_seen_timestamp_seconds` | Gauge; provisioned sensor set | Capture/transport freshness |
| `sk_capture_dropped_packets_total` | Counter; provisioned sensor set | Capture loss |
| `sk_monitor_last_success_timestamp_seconds` | Gauge | Monitoring freshness |
| `sk_window_label_coverage_ratio` | Gauge; bounded cohort | Eligibility context, not ground-truth completeness guarantee |
| `sk_feature_drift_score` | Gauge; finite feature, method | Diagnostic statistic with method-specific meaning |
| `sk_damage_dx_score` | Gauge | DARI Distribution Damage $D_X \in [0, 1]$ |
| `sk_damage_dy_score` | Gauge | DARI Performance Damage $D_Y \in [0, 1]$ |
| `sk_damage_db_score` | Gauge | DARI Boundary / Uncertainty Damage $D_B \in [0, 1]$ |
| `sk_repair_decisions_total` | Counter; action enum (A0, A1, A2, A3) | DARI repair selections |
| `sk_adaptation_compute_saved_seconds_total` | Counter | Cumulative training compute saved by selecting A0/A1 over A3 |
| `sk_controller_last_seen_timestamp_seconds` | Gauge | Deployment watcher health |
| `sk_deployment_desired_generation` / `sk_deployment_applied_generation` | Gauges | Routing convergence |
| `sk_serving_release_info` | Info-style gauge; slot and retained release | Small release identity series |

Provisioned sensors/classes still need a cardinality budget; do not attach arbitrary source IP, event ID, job ID, full URL or attacker-provided category to metrics. Store high-cardinality evidence in DB/log artifacts. Release labels on every histogram cause churn; use bounded slot labels plus application queries filtered to clean deployment intervals. [3]

### PromQL examples
```promql
histogram_quantile(
  0.95,
  sum by (le, slot) (rate(sk_inference_duration_seconds_bucket[5m]))
)
```
```promql
sum by (slot) (rate(sk_inference_attempts_total{outcome="error"}[5m]))
/
sum by (slot) (rate(sk_inference_attempts_total[5m]))
```
The five-minute ranges are **illustrative query windows**, not chosen operating policy. Guard ratios/quantiles with sufficient request counts, clean release intervals and telemetry freshness. Missing series or zero denominator is unknown/insufficient data, not zero errors. Never average p95 values across instances; aggregate histograms correctly first. Native histograms are an option if supported end-to-end by the pinned client/server/Grafana versions. [4]

### Grafana dashboards
1. **Data plane:** capture visibility/loss, accepted events, queue age, inference latency/error and host saturation.
2. **Model evidence:** drift by feature/reference, labelled quality/support, label delay and missingness.
3. **Lifecycle:** training duration/resource use, job outcomes, candidate decisions and cooldown state.
4. **Deployment:** desired/applied generation, slot health, measured share, watchdog heartbeat and rollback events.

Choose Prometheus rules plus optional Alertmanager for operational notifications, or Grafana alerting for the MVP—but avoid duplicate conflicting rules. Prometheus rule `for` means persistence of a condition; it is not the same as the query's range window. [5]

## Monitoring feedback loop and validation

## From monitoring to lifecycle trigger
The scheduled monitoring worker, not Grafana screenshots, constructs an immutable event-time window from persisted features and labels. Use a watermark/allowed-lateness policy; record excluded late/invalid events. At high volume, bounded sampling/reservoirs must preserve their sampling metadata and cohort meaning.

For each window:
1. Confirm schema/extractor/sensor consistency and minimum valid data.
2. Compare approved feature columns to the vetted release/cohort reference using Evidently.
3. Separately compute missingness, out-of-range values, quality flags and capture changes.
4. Join only trusted labels available by the cutoff; compute labelled metrics with support/coverage or mark unknown.
5. Save raw report plus normalized `MonitorResult` and policy revision.
6. Apply deterministic signal classification and deduplication; enqueue one eligible lifecycle request or a hold/incident event.

An optional alert webhook can request an earlier bounded check, but cannot directly train or promote. Authenticate it and deduplicate by fingerprint/time interval. Avoid a feedback storm where one drifting feature creates hundreds of training jobs.

**Reference governance:** keep an approved baseline per release and relevant cohort. Sensor replacement or extractor version change is not ordinary model drift; require compatibility checks. A rolling recent baseline can supplement diagnosis but must not silently normalize attacks. [6]

## End-to-end latency and quality reporting
Store at least event, feature-ready, receipt, prediction and alert-commit timestamps. Accelerated replay has both source event time and wall-clock processing time; do not mix them. Timestamped CSV replay shows pipeline behavior, while PCAP replay additionally tests feature extraction. Neither is proof of performance on a real, independently labelled deployment.

## Validation cases
- Same PCAP/config yields expected feature fixture and directionality.
- Live isolated replay and offline extraction agree within documented semantics.
- Sensor silence, packet loss and schema changes create distinct incidents.
- Duplicate batches do not duplicate committed alerts.
- No labels suppresses precision/recall display, not operational metrics.
- Harmless feature change can alert without automatic promotion.
- Concept/quality change not visible in input marginals is still caught when labelled error evidence arrives.
- Metrics use bounded label values; attacker-controlled strings cannot create unlimited series.

### Sources
1. [Zeek conn.log semantics](https://docs.zeek.org/en/current/logs/conn.html) and [quick start](https://docs.zeek.org/en/lts/quickstart.html).
2. [Linux packet socket privileges](https://man7.org/linux/man-pages/man7/packet.7.html); [Docker host networking limitations](https://docs.docker.com/engine/network/drivers/host/).
3. [Prometheus naming/cardinality guidance](https://prometheus.io/docs/practices/naming/).
4. [Prometheus histogram guidance](https://prometheus.io/docs/practices/histograms/).
5. [Prometheus alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/).
6. [Evidently data definition](https://docs.evidentlyai.com/docs/library/data_definition) and [drift customization](https://docs.evidentlyai.com/metrics/customize_data_drift).
7. [NIDS drift survey](https://doi.org/10.1109/ACCESS.2026.3691262).

See 07 for the exact feature schema and 09 for response policy.
