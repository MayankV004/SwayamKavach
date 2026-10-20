import { Node, Edge, MarkerType } from "@xyflow/react";

export interface LangGraphNodeMetadata {
  id: string;
  title: string;
  subtitle: string;
  category:
    | "entry"
    | "ingestion"
    | "diagnosis"
    | "decision"
    | "repair"
    | "validation"
    | "deployment"
    | "terminal";
  purpose: string;
  invariants: string;
  associatedTool: string;
  inputFields: string[];
  outputFields: string[];
  routingConditions: string;
  defaultDuration: string;
}

export const LANGGRAPH_NODES_METADATA: Record<string, LangGraphNodeMetadata> = {
  start: {
    id: "start",
    title: "Graph Entry Point",
    subtitle: "Trigger on Stream Window or Telemetry Event",
    category: "entry",
    purpose: "Initiates the autonomous self-healing lifecycle upon incoming flow batch or watchdog wake-up.",
    invariants: "Non-blocking invocation; state is initialized with immutable context and audit tracking.",
    associatedTool: "FastAPI Lifecycle Router / Background Stream Manager",
    inputFields: ["batch_id", "timestamp", "sensor_id"],
    outputFields: ["audit_trail", "status"],
    routingConditions: "Unconditional transition to MonitorNode.",
    defaultDuration: "2 ms",
  },
  monitor: {
    id: "monitor",
    title: "Monitor Node",
    subtitle: "Window Extraction (S Samples)",
    category: "ingestion",
    purpose: "Extracts latest sliding window from continuous IoT traffic with schema validation and delayed label alignment.",
    invariants: "Zero synthetic substitution. Null values strictly preserved. Missing features trigger schema rejection.",
    associatedTool: "WindowSelector (swayamkavach.monitoring.window)",
    inputFields: ["window_size (S)", "database_connection"],
    outputFields: ["window_id", "sample_count", "features_records", "scores", "y_true", "window_end_at"],
    routingConditions: "Unconditional transition to DamageCalculatorNode.",
    defaultDuration: "14 ms",
  },
  damage: {
    id: "damage",
    title: "7D Damage Calculator",
    subtitle: "F_t = [D_X, D_Y, D_B, Q, L, S, R]",
    category: "diagnosis",
    purpose: "Computes the explicit 7-dimensional damage fingerprint separating distribution drift from actual performance degradation.",
    invariants: "Drift alone (D_X) never triggers retraining. Boundary damage (D_B) and performance damage (D_Y) must be validated with data quality (Q) and persistence (R).",
    associatedTool: "DamageCalculator & PersistenceTracker",
    inputFields: ["features_records", "scores", "y_true", "history_persistence"],
    outputFields: ["fingerprint (D_X, D_Y, D_B, Q, L, S, R)", "persistence_count"],
    routingConditions: "Unconditional transition to DARISelectorNode.",
    defaultDuration: "45 ms",
  },
  selector: {
    id: "selector",
    title: "DARI Solver & Policy Router",
    subtitle: "Feasibility Filtering → Net Utility Optimization",
    category: "decision",
    purpose: "Deterministic utility solver selecting the lowest feasible intervention tier that satisfies security and recall constraints.",
    invariants: "Rule 5: Hard constraints filter unsafe actions before scoring. A3 is never default. Deterministic tie-breaking on tie or missing evidence.",
    associatedTool: "DARISolver (swayamkavach.dari.selector)",
    inputFields: ["fingerprint", "policy_config (Q_min, S_min, L_min, R_min)"],
    outputFields: ["selection_result", "chosen_action (A0, A1, A2, A3)", "explanation"],
    routingConditions: "Branches to CalibrateNode (A1), AdaptNode (A2), RetrainNode (A3), or AuditNode (A0).",
    defaultDuration: "8 ms",
  },
  calibrate: {
    id: "calibrate",
    title: "Action A1: Calibrate Node",
    subtitle: "Hot Threshold Optimization (θ*)",
    category: "repair",
    purpose: "Computes optimal operating threshold θ* under constraint FPR ≤ 5.0% and initiates atomic zero-downtime reload across serving slots.",
    invariants: "Rolls back to baseline threshold immediately if any serving slot fails readiness handshake.",
    associatedTool: "ThresholdCalibrator (swayamkavach.dari.calibrator)",
    inputFields: ["scores", "y_true", "max_acceptable_fpr (0.05)"],
    outputFields: ["calibration_result", "proposed_threshold", "confirmed_threshold", "calibration_state"],
    routingConditions: "Converges to AuditNode after dual-slot verification.",
    defaultDuration: "35 ms",
  },
  adapt: {
    id: "adapt",
    title: "Action A2: Subspace Adapter",
    subtitle: "Localized Candidate Adaptation",
    category: "repair",
    purpose: "Executes targeted local subspace adaptation for isolated attack clusters without altering the global decision surface.",
    invariants: "Sufficient localized sample support required (S >= 100). Preserves champion model until candidate is verified.",
    associatedTool: "LocalSubspaceAdapter (swayamkavach.dari.adapter)",
    inputFields: ["features_records", "y_true", "candidate_release_id"],
    outputFields: ["candidate_release_id", "adaptation_result", "lifecycle_stage"],
    routingConditions: "Routes to EvaluateCandidateNode if build succeeded; skips to AuditNode if deferred.",
    defaultDuration: "320 ms",
  },
  retrain: {
    id: "retrain",
    title: "Action A3: Subprocess Retrainer",
    subtitle: "Resource-Bounded Full Retraining",
    category: "repair",
    purpose: "Spawns resource-bounded isolated subprocess (max 2 threads, 180s timeout) to train candidate model R2.",
    invariants: "Triggered strictly when R >= 2, Q >= 0.95, L >= 0.80, S >= 1000, and broad damage confirmed. CPU and thread caps strictly enforced.",
    associatedTool: "SubprocessRetrainer (swayamkavach.dari.retrainer)",
    inputFields: ["train_partition", "target_candidate_release", "timeout_seconds (180)"],
    outputFields: ["candidate_release_id", "retraining_result", "lifecycle_stage"],
    routingConditions: "Routes to EvaluateCandidateNode if build succeeded; skips to AuditNode if failed.",
    defaultDuration: "1,850 ms",
  },
  evaluate_candidate: {
    id: "evaluate_candidate",
    title: "Statistical Non-Regression Gate",
    subtitle: "Wilcoxon & McNemar Paired Testing",
    category: "validation",
    purpose: "Rigorous statistical validation comparing candidate against champion on sealed validation split before canary staging.",
    invariants: "Rule 5: Never promote based on training loss or LLM recommendation. Requires PASS verdict (Critical Recall ≥ 95%, p < 0.05). Inconclusive/Fail strictly rejected.",
    associatedTool: "ModelComparator (swayamkavach.evaluation.compare)",
    inputFields: ["champion_bundle", "candidate_bundle", "val_partition", "thresholds"],
    outputFields: ["evaluation_report", "verdict (PASS/FAIL/INCONCLUSIVE)", "approval_hash"],
    routingConditions: "PASS branches to CanaryDispatch; FAIL/INCONCLUSIVE branches to AuditNode with candidate blocked.",
    defaultDuration: "120 ms",
  },
  canary_dispatch: {
    id: "canary_dispatch",
    title: "Two-Slot Canary Deployment",
    subtitle: "5% → 25% → 50% → 100% Rollout",
    category: "deployment",
    purpose: "Progressively dispatches production traffic to staged candidate slot with sub-second dual-slot reverse proxy routing.",
    invariants: "Champion retained warm in opposite slot. SLA watchdog breach triggers automated rollback in < 1.0s.",
    associatedTool: "CanaryController (swayamkavach.deployment.canary)",
    inputFields: ["active_slot", "candidate_slot", "canary_weight", "approval_signature"],
    outputFields: ["canary_weight", "active_slot", "standby_slot", "routing_state"],
    routingConditions: "Converges to AuditNode after each stage advance or rollback.",
    defaultDuration: "15 ms",
  },
  audit: {
    id: "audit",
    title: "Authoritative Audit Node",
    subtitle: "Durable PostgreSQL State Record",
    category: "terminal",
    purpose: "Persists cryptographically signed audit trail, fingerprint snapshots, and active deployment pointers to durable database.",
    invariants: "Rule 8: Idempotent state transition; atomic transaction with rollback on DB connection error.",
    associatedTool: "LifecycleStateRecordDB & EvaluationReportRecordDB",
    inputFields: ["audit_trail", "fingerprint", "chosen_action", "evaluation_report"],
    outputFields: ["lifecycle_record_id", "status: completed"],
    routingConditions: "Terminates at Graph End (__end__).",
    defaultDuration: "18 ms",
  },
  end: {
    id: "end",
    title: "Graph Convergence (END)",
    subtitle: "Steady-State Intrusion Monitoring",
    category: "terminal",
    purpose: "Signifies successful execution cycle. System returns to continuous sliding-window telemetry surveillance.",
    invariants: "All safety gates validated, serving runtime healthy, champion model serving requests.",
    associatedTool: "SwayamKavach Control Plane",
    inputFields: ["final_state"],
    outputFields: ["monitoring_active"],
    routingConditions: "Terminal state.",
    defaultDuration: "0 ms",
  },
};

export type NodeExecutionStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "active";

export function getInitialNodes(): Node[] {
  return [
    {
      id: "start",
      type: "langGraphNode",
      position: { x: 380, y: 30 },
      data: {
        nodeId: "start",
        title: "Entry Point",
        subtitle: "Stream Ingestion Trigger",
        category: "entry",
        status: "completed",
        actionBadge: "TRIGGER",
      },
    },
    {
      id: "monitor",
      type: "langGraphNode",
      position: { x: 380, y: 140 },
      data: {
        nodeId: "monitor",
        title: "Stream Monitor",
        subtitle: "Window Ingestion (S flows)",
        category: "ingestion",
        status: "completed",
        actionBadge: "S=2000",
      },
    },
    {
      id: "damage",
      type: "langGraphNode",
      position: { x: 380, y: 260 },
      data: {
        nodeId: "damage",
        title: "7D Damage Calculator",
        subtitle: "F_t = [D_X, D_Y, D_B, Q, L, S, R]",
        category: "diagnosis",
        status: "completed",
        actionBadge: "DIAGNOSE",
      },
    },
    {
      id: "selector",
      type: "langGraphNode",
      position: { x: 380, y: 380 },
      data: {
        nodeId: "selector",
        title: "DARI Solver & Policy",
        subtitle: "Feasibility → Utility → Tie-Break",
        category: "decision",
        status: "active",
        actionBadge: "SOLVER",
      },
    },
    // Action branches
    {
      id: "calibrate",
      type: "langGraphNode",
      position: { x: 140, y: 520 },
      data: {
        nodeId: "calibrate",
        title: "A1: Calibrate Node",
        subtitle: "Hot Threshold Optimization (θ*)",
        category: "repair",
        status: "idle",
        actionBadge: "ACTION A1",
      },
    },
    {
      id: "adapt",
      type: "langGraphNode",
      position: { x: 380, y: 520 },
      data: {
        nodeId: "adapt",
        title: "A2: Subspace Adapter",
        subtitle: "Local Subspace Retargeting",
        category: "repair",
        status: "idle",
        actionBadge: "ACTION A2",
      },
    },
    {
      id: "retrain",
      type: "langGraphNode",
      position: { x: 620, y: 520 },
      data: {
        nodeId: "retrain",
        title: "A3: Subprocess Retrain",
        subtitle: "Bounded CPU Retraining Runner",
        category: "repair",
        status: "idle",
        actionBadge: "ACTION A3",
      },
    },
    // Evaluation Gate
    {
      id: "evaluate_candidate",
      type: "langGraphNode",
      position: { x: 500, y: 670 },
      data: {
        nodeId: "evaluate_candidate",
        title: "Statistical Gate Check",
        subtitle: "Non-Regression (Recall ≥ 95%)",
        category: "validation",
        status: "idle",
        actionBadge: "SAFETY GATE",
      },
    },
    // Canary Dispatch
    {
      id: "canary_dispatch",
      type: "langGraphNode",
      position: { x: 500, y: 810 },
      data: {
        nodeId: "canary_dispatch",
        title: "Two-Slot Canary Router",
        subtitle: "5% → 25% → 50% → 100% Rollout",
        category: "deployment",
        status: "idle",
        actionBadge: "CANARY",
      },
    },
    // Authoritative Audit
    {
      id: "audit",
      type: "langGraphNode",
      position: { x: 260, y: 940 },
      data: {
        nodeId: "audit",
        title: "Authoritative Audit",
        subtitle: "Durable DB Lifecycle Persistence",
        category: "terminal",
        status: "idle",
        actionBadge: "AUDIT DB",
      },
    },
    {
      id: "end",
      type: "langGraphNode",
      position: { x: 260, y: 1060 },
      data: {
        nodeId: "end",
        title: "Graph Convergence",
        subtitle: "Steady-State Surveillance Active",
        category: "terminal",
        status: "idle",
        actionBadge: "STEADY STATE",
      },
    },
  ];
}

export function getInitialEdges(): Edge[] {
  return [
    {
      id: "e-start-monitor",
      source: "start",
      target: "monitor",
      animated: true,
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
      id: "e-monitor-damage",
      source: "monitor",
      target: "damage",
      animated: true,
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
      id: "e-damage-selector",
      source: "damage",
      target: "selector",
      animated: true,
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Conditional branches from Selector
    {
      id: "e-selector-audit-a0",
      source: "selector",
      target: "audit",
      label: "A0: Nominal (No Retrain)",
      type: "smoothstep",
      style: { strokeWidth: 2, strokeDasharray: "4 4" },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
      id: "e-selector-calibrate",
      source: "selector",
      target: "calibrate",
      label: "A1: Boundary Shift",
      type: "smoothstep",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
      id: "e-selector-adapt",
      source: "selector",
      target: "adapt",
      label: "A2: Local Cluster",
      type: "smoothstep",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
      id: "e-selector-retrain",
      source: "selector",
      target: "retrain",
      label: "A3: Severe Degradation",
      type: "smoothstep",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Calibrate to Audit
    {
      id: "e-calibrate-audit",
      source: "calibrate",
      target: "audit",
      label: "Threshold Synchronized",
      type: "smoothstep",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Candidate builds to Evaluation Gate
    {
      id: "e-adapt-eval",
      source: "adapt",
      target: "evaluate_candidate",
      label: "Candidate Built",
      type: "smoothstep",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
      id: "e-retrain-eval",
      source: "retrain",
      target: "evaluate_candidate",
      label: "Candidate Built",
      type: "smoothstep",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Evaluation outcomes
    {
      id: "e-eval-canary",
      source: "evaluate_candidate",
      target: "canary_dispatch",
      label: "PASS: Staged for Canary",
      type: "smoothstep",
      style: { strokeWidth: 2, stroke: "#10B981" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#10B981" },
    },
    {
      id: "e-eval-audit-fail",
      source: "evaluate_candidate",
      target: "audit",
      label: "FAIL / INCONCLUSIVE (Blocked)",
      type: "smoothstep",
      style: { strokeWidth: 2, stroke: "#EF4444", strokeDasharray: "4 4" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#EF4444" },
    },
    // Canary to Audit
    {
      id: "e-canary-audit",
      source: "canary_dispatch",
      target: "audit",
      label: "Traffic Shift / Rollback Audited",
      type: "smoothstep",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Audit to End
    {
      id: "e-audit-end",
      source: "audit",
      target: "end",
      style: { strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
  ];
}
