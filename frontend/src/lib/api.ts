/**
 * Client API utilities for SwayamKavach Next.js dashboard.
 */

import {
  AlertRecord,
  BatchReceiptResponse,
  BenchmarkReport,
  LifecycleState,
  ScenarioRunResult,
} from "@/types/contracts";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const BACKEND_ROOT_URL =
  process.env.NEXT_PUBLIC_BACKEND_ROOT || "http://localhost:8000";
export const MLFLOW_URL =
  process.env.NEXT_PUBLIC_MLFLOW_URL || "http://localhost:5000";

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch {
    return { status: "disconnected", service: "backend-offline" };
  }
}

export async function fetchAlerts(limit: number = 20): Promise<AlertRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/alerts?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch alerts");
    return await res.json();
  } catch (error) {
    console.error("Alerts fetch error:", error);
    return [];
  }
}

export async function fetchLifecycleState(): Promise<LifecycleState> {
  try {
    const res = await fetch(`${API_BASE_URL}/lifecycle`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch lifecycle state");
    return await res.json();
  } catch (error) {
    console.error("Lifecycle fetch error, falling back to nominal default:", error);
    return {
      champion_release: "R1",
      active_slot: "A",
      candidate_release: undefined,
      candidate_slot: undefined,
      canary_weight: 0.0,
      last_fingerprint: {
        D_X: 0.012,
        D_Y: 0.008,
        D_B: 0.045,
        Q: 0.999,
        L: 0.985,
        S: 2000,
        R: 1,
      },
      chosen_action: "A0",
      updated_at: "2026-10-15T00:00:00Z",
    };
  }
}

export async function fetchBenchmarkReport(
  n_windows: number = 10
): Promise<BenchmarkReport | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/experiments/benchmark?n_windows=${n_windows}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to fetch benchmark");
    return await res.json();
  } catch (error) {
    console.error("Benchmark fetch error:", error);
    return null;
  }
}

export async function runDriftScenario(
  scenario: string
): Promise<ScenarioRunResult> {
  const res = await fetch(`${API_BASE_URL}/experiments/scenarios/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Scenario execution failed" }));
    throw new Error(err.detail || "Scenario execution failed");
  }
  return await res.json();
}

export async function advanceCanaryRollout(): Promise<LifecycleState> {
  const res = await fetch(`${API_BASE_URL}/deployment/canary/advance`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Canary advance failed" }));
    throw new Error(err.detail || "Canary advance failed");
  }
  return await res.json();
}

export async function rollbackCanaryRollout(
  reason: string = "Operator initiated warm rollback"
): Promise<{ status: string; champion_release: string }> {
  const res = await fetch(`${API_BASE_URL}/deployment/canary/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Rollback failed" }));
    throw new Error(err.detail || "Rollback failed");
  }
  return await res.json();
}

export async function ingestFlowBatch(
  payload: Record<string, unknown>
): Promise<BatchReceiptResponse> {
  const res = await fetch(`${API_BASE_URL}/ingestion/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Ingestion failed" }));
    throw new Error(err.message || "Ingestion failed");
  }
  return await res.json();
}
