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
