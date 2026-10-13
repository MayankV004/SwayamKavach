# SwayamKavach — 03 Tech Stack

Technology rationale, integration contracts, API migration pitfalls and dependency validation plan for the SwayamKavach MVP.

## Technology decisions

# 03 · Tech Stack and Compatibility

**Principle:** use this stack to support one reliable IDS lifecycle, not to maximize the number of tools. The reference design in 02 uses one Linux host; an architecture alternative is not silently selected here. Documentation was checked in September 2026; no complete dependency lock has been installed or certified by this research.

| Technology | Specific role and justification | Trade-off / alternative |
|---|---|---|
| Python | Shared feature, model, API and orchestration contracts | Separate environments/processes still needed to isolate dependency conflicts |
| uv | Fast package installer, workspace resolver, and deterministic virtual environment manager (`uv.lock`) | Eliminates slow installs and version drift; requires team familiarity with uv CLI |
| scikit-learn | Preprocessing pipelines, RF/HistGradientBoosting baselines, metrics, Platt/isotonic calibration | Baseline algorithms, not a competing framework category to LightGBM |
| SciPy / NumPy | Kolmogorov-Smirnov statistics ($D_X$), prediction entropy ($D_B$), and DARI utility solver | Vectorized calculations; keep within bounded memory limits |
| LightGBM | CPU-efficient tabular challenger using sklearn-compatible estimator | Native dependency and serialization tests; not proven best until measured |
| Zeek | Network-connection features aligned to TON_IoT field origins | Completed-flow latency; full historical protocol-log joins may not be reproducible |
| Evidently | Scheduled window/reference quality and drift reports | Not a packet consumer, truth-label service, scheduler or proof of concept drift |
| LangGraph | Durable stateful lifecycle with DARI branching (A0–A3), waits and approval | Can orchestrate deterministic nodes without LLMs; graph alone is not a queue |
| FastAPI/Pydantic | Typed ingestion/control endpoints and schema validation | Structural validation does not prove feature correctness or authorize actions |
| PostgreSQL | Durable receipts, labels, jobs, approvals, events and rollout generations | Requires migrations/backups; simpler than a multi-broker design at MVP scale |
| DVC + Git | Reconstructable feature/label/split snapshots and pipeline metadata | Bulk bytes need a remote; commits alone are insufficient |
| MLflow | Runs, artifacts, estimator metadata and model-version registry | Alias changes do not reload a server or route traffic |
| Docker Compose | Reproducible single-host service topology | Not HA, an autoscaler or a safe privileged deployment API |
| Nginx OSS | TLS/reverse proxy and weighted slot routing | Reload/drain convergence must be observed; not instant atomic switching |
| Prometheus/Grafana | Bounded-cardinality metrics, trends and operational alerts | Not storage for per-flow logs, decisions or labels |
| Next.js/TypeScript/Tailwind | Typed operator interface, DARI radar panel, and protected actions | Keep ML logic out of UI; avoid unnecessary SSR complexity for live panels |
| GitHub Actions/GHCR | Test/build immutable application images | Model retraining must not require rebuilding the application image every time |
| Optional LLM | Structured diagnosis explainer and audit summaries | Cost, latency, nondeterminism and injection exposure; no final safety authority |

**Not initially necessary:** Kafka, Kubernetes, a feature-store product, multiple vector databases or an autonomous code-generating AutoML agent. Redis/Celery is reasonable if the team already knows it, but otherwise a small, tested Postgres queue is the proposed minimum.

## Integration contracts and gotchas

## LangGraph ↔ MLflow ↔ Evidently
There is no requirement for a magic three-way connector. Implement thin typed adapters:

```text
monitor_window(window_manifest, reference_manifest, policy)
  -> MonitorResult + raw Evidently report URI/hash
train_candidate(dataset_manifest, training_plan)
  -> TrainingResult(run_id, exact_model_version, bundle_hash)
evaluate_candidate(candidate_release, champion_release, eval_manifest)
  -> EvaluationResult(PASS | FAIL | INCONCLUSIVE, evidence_hash)
request_deployment(release_manifest, expected_generation)
  -> operation_id
```

Adapters convert library-specific output into stable application schemas. Unit-test them independently and store both normalized evidence and raw artifacts. Never have an LLM scrape HTML to decide deployment.

### Evidently migration
Current documentation describes the 0.7+ API using `Dataset`, `DataDefinition` and `Report`; old `ColumnMapping`, `evidently.report` or `evidently.future` examples belong to other releases. `Report` is configuration; `run()` returns the result you export. [1]

```python
from evidently import DataDefinition, Dataset, Report
from evidently.presets import DataDriftPreset

def profile(current_df, reference_df, policy):
    cols = policy.numeric_features + policy.categorical_features
    definition = DataDefinition(
        numerical_columns=policy.numeric_features,
        categorical_columns=policy.categorical_features,
    )
    current = Dataset.from_pandas(current_df[cols], data_definition=definition)
    reference = Dataset.from_pandas(reference_df[cols], data_definition=definition)
    result = Report([DataDriftPreset(
        method=policy.method,
        threshold=policy.threshold,
        drift_share=policy.drift_share,
    )]).run(current_data=current, reference_data=reference)
    return result
```

This is a documentation-grounded skeleton for one policy/method; per-feature methods may be preferable. Policy values must be calibrated, not copied from a tutorial. Check quality/missingness separately; identifiers and labels must not enter the drift-column denominator. Export JSON/HTML from `result`. Test equality boundaries and normalized report parsing against the exact installed release. [1–3]

### MLflow compatibility
- Registry stages are deprecated since 2.9.0; use aliases/tags for organizational status and exact versions for release identity. [4]
- Current model logging examples may use `name`; older examples use `artifact_path`. Pick the API supported by the lockfile.
- Default pyfunc output may be hard predictions. If downstream consumers need probabilities, explicitly log/test that function and class ordering.
- sklearn persistence does not promise compatibility across sklearn versions. Custom transformers must be importable in serving; serializing a notebook-local class is fragile. [5]
- Serialization defaults can differ between explicit logging and autologging; inspect the installed signature. Restrict trusted types and reject untrusted pickle/joblib/cloudpickle objects.
- LightGBM plus preprocessing is one release bundle; logging only the booster loses encoders, imputation and threshold policy.
- Backend metadata and artifact bytes are separate. MLflow's host/CORS protections are not authentication. [6]

### LangGraph compatibility
Use `langgraph-checkpoint-postgres` with compatible psycopg dependencies, initialize checkpoint tables via controlled setup, and preserve a stable `thread_id`. Resuming an interrupt restarts that node. Replays can repeat tool effects. `ainvoke` is not a durable scheduler; the job table and worker own scheduling. Put large data and model objects in artifacts, not checkpoint state. [7–8]

## Environment and integration validation

## Reproducible environment strategy
Use a repository-level Python version decision and resolved locks for service images; pin Python minor, package versions, native libraries and image digests. Keep training/serving versions aligned for the model flavor. A separate monitoring environment can isolate Evidently's pandas/numpy requirements, communicating only via versioned Parquet/manifests and JSON results. This costs another image but reduces coupled upgrades.

For LightGBM, verify the target OS/architecture and OpenMP availability; avoid assuming a developer macOS wheel proves the Linux container works. When CPU reproducibility matters, the official `deterministic` option also calls for choosing an appropriate row-wise or column-wise execution mode. It does not promise identical results across every compiler/version/hardware combination. [9]

**Frontend:** freeze Node and the Next.js/React/Tailwind combination using a lockfile. Tailwind major-version instructions differ. Do not mix an older configuration tutorial with current package installation. Browser types should be generated from the API's OpenAPI schemas where practical, then supplemented for SSE events. Keep secrets server-side and out of `NEXT_PUBLIC_*` variables.

**SSE:** current FastAPI docs have native server-sent-event support, but older pinned releases may not. Select either the documented API for the chosen release or an explicitly pinned compatible library. Through Nginx, disable buffering and set heartbeat/read-timeout behavior. [10]

## Mandatory smoke tests before freezing versions
| Test | Failure caught |
|---|---|
| Fresh Linux install/import/build of every image | Python/native/Node incompatibility |
| Train/log/load the exact preprocessing + LightGBM pipeline | Flavor and serializer incompatibility |
| Compare native and loaded probabilities and class order | Hard-label output or reordered classes |
| Known feature schema including null, unknown category and huge value | DataFrame dtype/category mismatch |
| Evidently stable/drifted/empty/missing-column cases | API/report shape changes and invalid healthy status |
| LangGraph interrupt, restart and resume | Lost checkpoint or repeated effects |
| Duplicate registration/deployment request | At-least-once side-effect errors |
| DVC pull in a fresh checkout | Missing remote objects/credentials |
| Nginx reload during concurrent requests | Mixed generations, drain and upstream errors |
| UI disconnect/reconnect and stale approval | Event replay and concurrency mistakes |

Until these pass, describe example code/configuration as a specification, not 'production-ready' software.

### Sources
1. [Evidently migration](https://docs.evidentlyai.com/faq/migration).
2. [Data definition](https://docs.evidentlyai.com/docs/library/data_definition) and [report execution](https://docs.evidentlyai.com/docs/library/report).
3. [Drift customization](https://docs.evidentlyai.com/metrics/customize_data_drift).
4. [MLflow registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow/).
5. [sklearn model persistence](https://scikit-learn.org/stable/model_persistence.html) and [MLflow sklearn API](https://mlflow.org/docs/latest/api_reference/python_api/mlflow.sklearn.html).
6. [MLflow artifact store](https://mlflow.org/docs/latest/self-hosting/architecture/artifact-store/) and [network security](https://mlflow.org/docs/latest/self-hosting/security/network/).
7. [LangGraph checkpoint setup](https://docs.langchain.com/oss/python/langgraph/add-memory).
8. [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts).
9. [LightGBM parameters](https://lightgbm.readthedocs.io/en/stable/Parameters.html).
10. [FastAPI SSE](https://fastapi.tiangolo.com/tutorial/server-sent-events/) and [Nginx proxy buffering](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
11. [DVC remote storage](https://doc.dvc.org/user-guide/data-management/remote-storage).

See 07 for model selection, 08 for lineage and 12 for service configuration.
