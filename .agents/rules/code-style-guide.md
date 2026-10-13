---
trigger: always_on
---

# SwayamKavach — Senior Engineering Rules

Apply these rules to every code change in this repository. Act as a senior engineer maintaining a research-grade, safety-conscious IoT intrusion-detection and adaptive MLOps system. Prioritize correctness, clarity, reproducibility, and safe model lifecycle management.

## 1. Work like a senior engineer

1. Inspect repository structure, related modules/callers, config, tests, and README before editing. Follow existing patterns unless a concrete reason justifies change.
2. Trace data contracts and control flow end to end. Do not invent APIs, settings, datasets, metrics, or commands.
3. Make the smallest complete change. Avoid unrelated cleanup, speculative abstractions, mass renaming, and broad rewrites.
4. Preserve public interfaces unless change is required; update affected callers and tests. Never discard user changes. Keep the diff focused and review it before finishing.
5. For multi-module work, state a short plan. If a request conflicts with safety invariants, explain and choose the safe behavior. Ask only when an essential decision cannot be inferred.
6. Avoid new dependencies if existing code or the standard library is enough. Check compatibility and lockfiles before changes.

## 2. Clean code standards

- Prefer readable, direct code. Keep functions/classes focused and separate ingestion, validation, features, damage estimation, selection, training, evaluation, orchestration, and deployment.
- Keep business logic out of CLI/API handlers, notebooks, and LangGraph wrappers; call tested domain logic instead.
- Avoid giant functions/classes, deep nesting, hidden globals, circular imports, duplicated policy logic, and hidden side effects. Use explicit inputs, outputs, and dependencies.
- Extract helpers for meaningful behavior or real duplication, not trivial one-off lines. Make file/network/database/training/deployment side effects obvious.
- No fake success paths, unexplained TODOs, commented-out code, empty exception handlers, or placeholders in completed work.
- Follow repo conventions and configured tools; do not reformat unrelated files or add competing formatters/linters.

### Python conventions

- Follow PEP 8. Use `snake_case` for modules, functions, variables and methods; `PascalCase` for classes; `UPPER_SNAKE_CASE` for constants.
- Type public functions and meaningful internal APIs. Reuse existing typed models/protocols; avoid `Any` unless justified.
- Choose meaningful domain names (`damage_fingerprint`, `candidate_model`, `critical_recall`, `repair_level`) over vague names. Prefer early returns and `pathlib.Path`.
- Document public APIs when contracts, units, assumptions, or failures are not obvious. Comments explain *why*, not each line. Use existing format/lint/type tools; follow the project's idioms for other languages.

## 3. Errors, logs, and operations

- Validate inputs and fail explicitly; never silently substitute values that change a security/repair decision. Catch only meaningful exceptions. No bare `except`, swallowed errors, or empty handlers; preserve causes when re-raising.
- Use the project's logger, not `print`. Log useful operation IDs/outcomes/reasons without secrets or sensitive packet data. Distinguish `failed`, `rejected`, `inconclusive`, and `succeeded`.
- Use bounded retries, timeouts, and idempotency for external/expensive operations. Do not retry deterministic validation failures blindly. Report job progress and status; never claim a command ran unless it did.

## 4. ML and data quality

- Treat traffic and labels as untrusted input. Validate schema, columns, types, ranges, missingness, timestamps, class labels, and window boundaries before using a window.
- Keep preprocessing consistent between training/inference and fit transforms on training data only. Prevent test/validation leakage and preserve temporal ordering for stream evaluation unless random shuffling is justified.
- Record seeds, dataset/split/schema versions, configuration, model version, code revision, and relevant library versions for reproducibility. Never tune against the final test set.
- Validate saved artifact metadata before use; do not unsafe-deserialize untrusted artifacts. Avoid unnecessary copies of large windows and use vectorization when clear. Move reusable notebook logic into tested modules. Never fabricate results; label synthetic data/results.

## 5. DARI invariants — must preserve

The system flow is:

`Monitor → Detect → Diagnose → Select Repair → Build Candidate → Validate → Canary → Promote or Roll Back`

DARI is a damage-aware repair-selection policy, not a replacement classifier or merely another drift detector.

### Evidence and damage fingerprint

- Keep the fingerprint explicit: `D_X` (distribution damage), `D_Y` (performance damage), `D_B` (boundary/uncertainty damage), `Q` (data quality), `L` (label reliability), `S` (sample sufficiency), and `R` (persistence).
- Separate drift evidence from actual model damage. Drift alone must not trigger full retraining.
- Validate evidence, data quality, label reliability, sample sufficiency, and persistence before repair selection. Treat missing, stale, insufficient, or low-quality evidence explicitly; never assume it is healthy.
- Keep thresholds, hard constraints, persistence/cooldown windows, and utility weights in validated config where appropriate; avoid magic numbers and duplicate policy logic.

### Repair selection

Preserve these action meanings:
- **A0:** no repair; continue monitoring if security behavior remains acceptable.
- **A1:** threshold adjustment or calibration.
- **A2:** local/targeted adaptation when evidence and data are sufficient.
- **A3:** full retraining for broad/severe degradation with sufficient suitable data.

Rules:
- A3 is not the default. Choose the lowest feasible intervention that satisfies security constraints.
- Filter unsafe or infeasible actions *before* scoring feasible actions. Hard constraints are not soft utility penalties.
- Keep recovery, intervention cost, and deployment risk distinct. Record the fingerprint, feasible actions/rejection reasons, score components, chosen action, and policy/config version for audit.
- Define deterministic behavior for ties, missing evidence, and no feasible action. Critical violations use an explicit safe/emergency path. Build only the selected candidate unless a controlled experiment needs more; do not retrain just to compare against a cheaper repair.

### Validation, canary, promotion, rollback

- Never promote a candidate just because training completed or an LLM recommends it.
- Compare candidates with the champion using configured hard security constraints and statistical acceptance tests, including critical-class recall/FPR limits.
- Keep `PASS`, `FAIL`, and `INCONCLUSIVE` distinct. Reject failures; gather evidence or defer when inconclusive. Only `PASS` may enter canary.
- Keep the champion available until promotion completes and retain everything needed for rollback. Follow configured stages (currently designed as shadow/canary: 5% → 25% → 50% → 100%); stop and roll back on a critical breach.
- Make deployment state changes auditable and idempotent. Update reference models/windows only under a tested policy; use persistence/cooldown to prevent oscillation.

## 6. LangGraph and LLM boundaries

- LangGraph orchestrates deterministic domain logic; it is not the security authority.
- Keep nodes small with typed contracts; each has one responsibility. Safety gates (data, feasibility, constraints, statistics, promotion, rollback) must be deterministic and testable.
- An LLM may explain structured evidence or coordinate approved work, but never invent metrics, override policy, choose on unsupported grounds, or bypass safety gates. Validate generated output against schemas/allow-lists.
- Make side-effecting nodes idempotent and persist enough state for safe recovery. Distinguish operational errors from candidate rejection.

## 7. Tests and evaluation

- Add or update tests for every behavior change. Importing or running once is not enough.
- Test core logic without network access or expensive training; mock external dependencies at boundaries. Cover malformed/empty windows, missing labels, bad quality, insufficient samples, threshold edges, ties, transient/persistent drift, and failures.
- For DARI, test: drift with stable security → A0; boundary shift → A1; supported local damage → A2; supported broad damage → A3; insufficient evidence → no unsafe repair; hard constraint breach → safe path; `FAIL` → reject; `INCONCLUSIVE` → no promotion; canary breach → rollback. Verify unsafe actions cannot win on utility and LLM output cannot bypass gates.
- Use small deterministic fixtures; separate expensive benchmarks. Never alter expected values just to make tests pass. Run relevant tests and configured checks; report exactly what ran/passed/failed/skipped.

## 8. Security and configuration

- Never hardcode secrets. Use approved config/environment mechanisms and keep secret files out of version control. Validate external input/config at boundaries and allow-list repair actions, workflow states, paths, and deployment targets.
- Do not delete data/artifacts, rewrite Git history, change production resources, or deploy without authorization. Explain new dependencies; follow the lockfile. Never weaken IDS safety limits to pass tests or inflate aggregate accuracy.
- Log only necessary audit/debug evidence; minimize retention of raw traffic and sensitive labels. Fail fast on invalid config; use enums/domain types for states where supported. Version artifact/data contracts when needed and preserve API fields/metric definitions unless change is intended. Document metric units/averaging.

## 9. Documentation and definition of done

- Update docs/sample config/API contracts when behavior changes. Keep claims traceable to code, config, and data; separate results from hypotheses and compare baselines fairly.
- Before finishing, review the diff for unrelated edits, dead code, duplication, secrets, and interface changes. Run available relevant tests/format/lint/type checks and verify DARI safety invariants. Summarize what changed, checks actually run and results, plus unresolved risks.

When uncertain, inspect more of the codebase, preserve established behavior and safety constraints, and prefer the smallest reversible change.