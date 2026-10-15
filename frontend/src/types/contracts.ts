/**
 * SwayamKavach frontend TypeScript contracts.
 * Matches schemas/flow_event.py, schemas/prediction.py, schemas/alert.py, schemas/lifecycle.py.
 */

export interface TONConnectionFeatures {
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  src_ip_bytes: number;
  dst_ip_bytes: number;
  src_pkts?: number;
  dst_pkts?: number;
  proto?: string;
  service?: string;
  conn_state?: string;
  missed_bytes?: number;
}

export interface NetworkIdentifiers {
  src_ip?: string;
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
}

export interface FlowEvent {
  event_id: string;
  sensor_id: string;
  capture_id?: string;
  event_time: string;
  feature_ready_at: string;
  features: TONConnectionFeatures;
  identifiers?: NetworkIdentifiers;
}

export interface BatchReceiptResponse {
  batch_id: string;
  status: "accepted" | "rejected" | "duplicate";
  accepted_count: number;
  rejected_count: number;
  received_at: string;
  message?: string;
}

export interface PredictionResult {
  event_id: string;
  score: number;
  prediction: number; // 0 = Benign, 1 = Attack
  prediction_purpose: "production" | "shadow" | "canary" | "evaluation";
  release_id: string;
  model_version: string;
  slot_id: string;
  predicted_at: string;
}

export interface AlertRecord {
  alert_id: string;
  event_id: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  release_id: string;
  status: "active" | "acknowledged" | "resolved" | "false_positive";
  created_at: string;
  metadata?: Record<string, unknown>;
}

export type RepairAction = "A0" | "A1" | "A2" | "A3";

export interface DamageFingerprint {
  D_X: number;
  D_Y?: number;
  D_B: number;
  Q: number;
  L: number;
  S: number;
  R: number;
}

export interface LifecycleState {
  champion_release: string;
  active_slot: "A" | "B";
  candidate_release?: string;
  candidate_slot?: "A" | "B";
  canary_weight: number;
  last_fingerprint?: DamageFingerprint;
  chosen_action?: RepairAction;
  updated_at: string;
}

export interface BenchmarkPolicyResult {
  policy: string;
  cumulative_recall: number;
  cumulative_fpr: number;
  action_counts: Record<string, number>;
  full_retrain_count: number;
  unnecessary_retrains: number;
  unnecessary_retrain_rate: number;
  total_compute_seconds: number;
  compute_savings_pct: number;
  labels_consumed: number;
  label_savings_pct: number;
  mean_recovery_time_s: number;
}

export interface BenchmarkReport {
  report_id: string;
  total_windows_evaluated: number;
  total_events_evaluated: number;
  results: Record<string, BenchmarkPolicyResult>;
  summary_verdict: string;
  created_at: string;
}

export interface ScenarioRunResult {
  scenario: string;
  description: string;
  fingerprint: DamageFingerprint;
  chosen_action: RepairAction;
  action_reason: string;
  evaluation_verdict: string | null;
  deployment_action: string;
  safety_invariants_preserved: boolean;
  details: Record<string, unknown>;
  executed_at: string;
}

export interface ReplayStreamStatus {
  is_running: boolean;
  batches_sent: number;
  events_sent: number;
  batch_size: number;
  last_batch_time: string | null;
}

export interface SnifferStreamStatus {
  is_running: boolean;
  packets_captured: number;
  flows_ingested: number;
  active_flows_in_buffer: number;
  last_packet_time: string | null;
  interface: string;
}

export interface StreamStatus {
  replay: ReplayStreamStatus;
  sniffer: SnifferStreamStatus;
  any_active: boolean;
  both_active: boolean;
}

