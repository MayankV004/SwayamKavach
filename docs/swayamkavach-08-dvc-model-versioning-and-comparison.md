# SwayamKavach — 08 DVC, Model Versioning and Comparison

DVC and MLflow responsibilities, immutable release lineage, statistical comparison, held-out data governance and model promotion policy.

## Versioning responsibilities and lineage

# 08 · Model Versioning and Comparison (DVC + MLflow)

**Division of responsibility:** Git versions code/configuration and DVC metadata; DVC stores reproducible dataset/label/split objects; MLflow tracks experiments and model artifacts; the application deployment ledger records actual serving state. DVC and MLflow must not become competing production registries.

| Object | Authoritative identity / owner |
|---|---|
| Raw capture selection, curated features | DVC object hashes + dataset repository commit |
| Labels, label cutoff, split/reference manifests | DVC snapshots with source/provenance and cutoff |
| Training/extractor code and environment | Git commit, dependency lock hash, extractor/image digest |
| Experiment | MLflow run ID with dataset/code tags |
| Model bundle | Registered model name + explicit version + artifact checksum |
| Serving release | Immutable application manifest tying image, model, schema, threshold and evidence |
| Actual rollout | Deployment ID, desired/applied generation, observed slot identities |

MLflow aliases such as `champion` are convenient mutable pointers, not immutable deployment identities. Stages are deprecated in current MLflow workflow guidance. A changed alias does not reload an already running model. [1]

```yaml
# Proposed release manifest; placeholders are not executable values.
release_id: <immutable-release-id>
image_digest: ghcr.io/<org>/swayamkavach-serve@sha256:<digest>
model:
  name: swayamkavach_ids
  version: '<explicit-version>'
  sha256: <bundle-digest>
mlflow_run_id: <run-id>
code_git_sha: <full-sha>
dependency_lock_sha256: <digest>
dataset_git_sha: <full-sha>
dvc_manifest_path: snapshots/<snapshot-id>.parquet.dvc
label_cutoff: <utc-time>
split_manifest_sha256: <digest>
feature_schema: ton-conn-5-v1
extractor_digest: <digest>
class_map: <versioned-map-ref>
decision_threshold_ref: <immutable-config-ref>
evaluation_hash: <digest>
```

> **DARI Versioning Rule:** Heavy DVC data snapshots and MLflow model registrations are executed **only** when Level A3 full retraining (or Level A2 partition updates) is selected. Level A1 threshold and probability calibration updates do not create redundant multi-gigabyte DVC snapshots; they update `decision_threshold_ref` as an immutable configuration revision logged to MLflow and the application deployment ledger.

DVC's content hash identifies bytes; it is not proof that an authorized person produced them. MLflow version IDs also do not prevent a privileged writer replacing underlying artifact bytes. Protect release storage, validate checksums and restrict write permissions.

## DVC pipeline and experiment workflow

## Repository layout
```text
data/raw/                 # DVC-tracked selected source material
snapshots/                # immutable curated data/label snapshots
manifests/splits/          # event IDs, time bounds, grouping and embargo
schemas/                  # feature and label schema definitions
src/features/             # shared extraction adapter
src/training/             # training and evaluation entry points
policies/                 # approved calibration and promotion policy
releases/                 # immutable release manifests
params.yaml
dvc.yaml
dvc.lock
```

A data repository separate from application code avoids autonomous snapshot commits on the application deployment branch. A single repository is simpler initially but requires isolated worktrees and serialization of snapshot publication. Never run DVC checkout inside a serving model directory.

### Proposed DVC pipeline skeleton
```yaml
stages:
  curate:
    cmd: python -m src.training.curate --config params.yaml
    deps:
      - data/raw/selected
      - src/features
      - src/training/curate.py
    params:
      - data
    outs:
      - snapshots/curated.parquet
  split:
    cmd: python -m src.training.split --config params.yaml
    deps:
      - snapshots/curated.parquet
      - src/training/split.py
    params:
      - split
    outs:
      - manifests/splits/current.json
  train:
    cmd: python -m src.training.fit --config params.yaml
    deps:
      - snapshots/curated.parquet
      - manifests/splits/current.json
      - src/training/fit.py
    params:
      - model
      - preprocessing
    outs:
      - build/model_bundle
    metrics:
      - build/metrics.json:
          cache: false
```

These entry points must be implemented; this is a pipeline specification. Local DVC outputs make rebuilds testable. MLflow registration/logging is a separate idempotent publish step keyed by bundle/snapshot/operation—not a side effect blindly repeated every time `dvc repro` reruns. MLflow owns the deployable copy; a DVC cache of a reproducibility output is not a second promotion authority.

`dvc.yaml` declares dependencies; generated `dvc.lock` records resolved hashes/parameters. For standalone snapshots, `dvc add` creates `.dvc` files without requiring a pipeline lock. Git push does not upload data, and DVC push does not publish Git metadata. [2–4]

### Atomicity-aware snapshot publication
1. Freeze eligible event IDs, labels as of cutoff and split manifest under a snapshot ID.
2. Materialize immutable Parquet plus metadata; checksum and validate.
3. DVC-track objects in an isolated worktree; upload objects to the remote.
4. Commit/publish metadata and capture the exact commit SHA. Verify fresh pull/read before marking snapshot available for automation.
5. Log that SHA/path/hash into MLflow run tags and the release manifest.

A partial upload/commit remains `publishing`, not usable training data. Avoid remote garbage collection of objects referenced by retained model releases. Remote credentials belong in workload identity or local secret configuration, not committed `.dvc/config`. [3]

## Champion–challenger comparison and statistics

## Evaluation partitions serve different purposes
- **Training:** eligible recent labelled blocks plus approved historical replay; excludes evaluation IDs.
- **Development/calibration:** estimator and threshold selection within time/group constraints.
- **Promotion evidence:** a fresh or governed labelled evaluation window, plus a historical regression suite; both models predict identical events.
- **Sealed scientific final test:** held untouched for final project reporting, not repeatedly used to select candidates.

Repeated testing against one fixed promotion set can overfit the selection process even if it never enters training. Bound attempts, rotate independent windows where feasible, record every candidate and use the final test only after freezing the method. If only a small number of independent scenarios exists, say so.

## Paired comparison record
For each event store label and both models' score/prediction, class order, threshold and provenance. Compare using the same labels, event IDs and label revision. Do not compare MLflow run-level F1 values from different test sets as if they were paired evidence.

**Metric vector:** AP, attack recall, FPR, precision/F1, class-specific support and recall where meaningful, inference latency/memory. Select a primary improvement objective and safety constraints before inspecting candidate outcomes. Both thresholds are fixed using their permitted development/calibration protocol; never tune them on the promotion window.

## Statistical significance versus practical significance
Network flows are dependent within sessions, devices and attack campaigns. Millions of rows do not mean millions of independent trials.

Recommended analysis: pair predictions, then bootstrap independent capture/scenario clusters or defensible temporal blocks, retaining labels and both predictions together. Compute the metric difference for each resample and report its interval. Choose block units from capture design/dependence, examine block-length sensitivity and report assumptions. Separate different nonstationary regimes rather than resampling them indiscriminately. [5]

Ordinary row bootstrap, unqualified row-level McNemar or t-tests on overlapping CV folds can overstate evidence. McNemar is an option only when the paired observational units satisfy its independence assumptions and the chosen endpoint matches the hypothesis. Repeated training seeds measure algorithm randomness, not independent network sampling.

**Decision logic:**
- FAIL if a hard provenance/schema/resource gate fails or quality is demonstrably below a predeclared guardrail.
- PASS only if support is adequate and the predeclared primary improvement/non-inferiority criterion and all safety constraints pass.
- INCONCLUSIVE if labels/support/independent units or uncertainty are inadequate.

For a non-inferiority gate, define a clinically/operationally meaningful margin before comparison and require the uncertainty bound to satisfy it. For an improvement gate, require a practical effect, not merely a small p-value. The actual margin, confidence level and multiplicity policy need advisor/team agreement and calibration; no arbitrary values are supplied here.

Rare attack classes may have too few examples for a reliable recall interval. Report that limitation; an aggregate F1 win cannot waive it silently. Human approval may authorize a clearly labeled limited experiment, but does not turn inconclusive evidence into a scientific PASS.

## Promotion contract, reproducibility and sources

## Candidate → production
Use explicit states: `registered → evaluated_pass → staged → canary → serving → retained_predecessor → archived`; failures can become `rejected`, `inconclusive` or `quarantined`. These are application states/tags, not old MLflow registry stages.

Promotion requires all of:
1. Valid data/label/extractor lineage and no evaluation contamination.
2. Exact preprocessing/model/class-map/threshold bundle with trusted checksum.
3. Predeclared paired quality and resource gates passed.
4. Evidence bound to the current predecessor and policy.
5. Required approval still valid, or explicitly permitted full-auto policy.
6. Candidate readiness and observed canary behavior satisfy policy.
7. Applied routing confirmed; predecessor retained during stabilization.

Only after observed rollout success update a `champion` alias as a retryable projection. If alias update fails, the UI reports registry/deployment divergence while serving identity remains authoritative. Rollback re-applies the retained release and route; it is not merely `set_alias(old_version)`.

## Reproducibility checklist
Fresh machine/worktree: exact Git checkout → DVC pull → verify split/label/extractor hashes → install locked environment → reproduce training/evaluation under declared seed/hardware policy → compare output tolerances → load exact model bundle in serving → run known input fixtures. Bitwise equality may not hold across different LightGBM builds/hardware; state the reproducibility level honestly.

Keep archived releases' images, models and DVC dependencies until retention expiry. Test restores before deleting old caches. A backup that has never been restored is unverified.

### Sources
1. [MLflow registry/aliases](https://mlflow.org/docs/latest/ml/model-registry/workflow/).
2. [DVC pipeline file specification](https://doc.dvc.org/user-guide/project-structure/dvcyaml-files).
3. [DVC remote storage](https://doc.dvc.org/user-guide/data-management/remote-storage).
4. [DVC checkout](https://doc.dvc.org/command-reference/checkout) and [commit](https://doc.dvc.org/command-reference/commit).
5. [Dependent-data bootstrap methodology, JTECH](https://doi.org/10.1175/JTECH-D-20-0069.1) — methodological support, not a ready-made IDS promotion standard.
6. [sklearn cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html) and [model persistence](https://scikit-learn.org/stable/model_persistence.html).
7. [LightGBM reproducibility-related parameters](https://lightgbm.readthedocs.io/en/stable/Parameters.html).

The comparison and promotion contract is a proposed project policy. See 07 for splits/features and 09 for deployment transitions.
