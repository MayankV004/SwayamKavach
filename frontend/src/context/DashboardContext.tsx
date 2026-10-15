"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AlertRecord,
  BenchmarkReport,
  LifecycleState,
  ScenarioRunResult,
} from "@/types/contracts";
import {
  fetchHealth,
  fetchAlerts,
  fetchLifecycleState,
  fetchBenchmarkReport,
  runDriftScenario,
  advanceCanaryRollout,
  rollbackCanaryRollout,
  ingestFlowBatch,
} from "@/lib/api";

interface DashboardContextType {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  backendHealthy: boolean | null;
  alerts: AlertRecord[];
  loading: boolean;
  submittingBatch: boolean;
  batchFeedback: string | null;
  actingCanary: boolean;
  canaryActionStatus: string | null;
  runningScenario: boolean;
  scenarioResult: ScenarioRunResult | null;
  benchmarkReport: BenchmarkReport | null;
  loadingBenchmark: boolean;
  lifecycle: LifecycleState;
  loadData: () => Promise<void>;
  refreshBenchmark: () => Promise<void>;
  sendTestBatch: () => Promise<void>;
  advanceCanary: () => Promise<void>;
  rollbackCanary: () => Promise<void>;
  executeScenario: (scenario: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingBatch, setSubmittingBatch] = useState<boolean>(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  const [canaryActionStatus, setCanaryActionStatus] = useState<string | null>(null);
  const [actingCanary, setActingCanary] = useState<boolean>(false);

  const [runningScenario, setRunningScenario] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioRunResult | null>(null);

  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState<boolean>(false);

  const [lifecycle, setLifecycle] = useState<LifecycleState>({
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
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const loadData = useCallback(async () => {
    try {
      const health = await fetchHealth();
      setBackendHealthy(health.status === "healthy" || health.status === "ok");
    } catch {
      setBackendHealthy(false);
    }

    try {
      const alertData = await fetchAlerts(50);
      setAlerts(alertData);
    } catch (e) {
      console.error(e);
    }

    try {
      const lc = await fetchLifecycleState();
      setLifecycle(lc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBenchmark = useCallback(async () => {
    setLoadingBenchmark(true);
    try {
      const data = await fetchBenchmarkReport(10);
      if (data) setBenchmarkReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBenchmark(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      await loadData();
      if (!ignore) {
        void refreshBenchmark();
      }
    }

    void initialLoad();

    const interval = setInterval(() => {
      void loadData();
    }, 10000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [loadData, refreshBenchmark]);

  const sendTestBatch = async () => {
    setSubmittingBatch(true);
    setBatchFeedback(null);
    try {
      const batchId = `ui-probe-${Date.now().toString().slice(-6)}`;
      const payload = {
        batch_id: batchId,
        sensor_id: "zeek-sensor-lab-1",
        schema_version: "ton-conn-5-v1",
        extractor_id: "zeek-pinned-v1",
        events: [
          {
            event_id: `evt-${batchId}-1`,
            sensor_id: "zeek-sensor-lab-1",
            event_time: "2026-10-15T10:00:00Z",
            features: {
              duration: 2.4,
              src_bytes: 420,
              dst_bytes: 840,
              src_ip_bytes: 500,
              dst_ip_bytes: 920,
              src_pkts: 6,
              dst_pkts: 10,
              proto: "tcp",
              service: "http",
              conn_state: "SF",
              missed_bytes: 0,
            },
            identifiers: {
              src_ip: "192.168.1.105",
              dst_ip: "10.0.0.1",
              src_port: 54320,
              dst_port: 80,
            },
          },
          {
            event_id: `evt-${batchId}-2`,
            sensor_id: "zeek-sensor-lab-1",
            event_time: "2026-10-15T10:00:01Z",
            features: {
              duration: 65.0,
              src_bytes: 45000,
              dst_bytes: 89000,
              src_ip_bytes: 46200,
              dst_ip_bytes: 91400,
              src_pkts: 320,
              dst_pkts: 480,
              proto: "tcp",
              service: "-",
              conn_state: "S0",
              missed_bytes: 140,
            },
            identifiers: {
              src_ip: "172.16.0.44",
              dst_ip: "10.0.0.1",
              src_port: 41200,
              dst_port: 445,
            },
          },
        ],
      };

      const receipt = await ingestFlowBatch(payload);
      setBatchFeedback(
        `Accepted 2 events (${receipt.status}). Batch ID: ${receipt.batch_id}`
      );
      setTimeout(loadData, 1200);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setBatchFeedback(`Ingestion error: ${message}`);
    } finally {
      setSubmittingBatch(false);
    }
  };

  const advanceCanary = async () => {
    setActingCanary(true);
    setCanaryActionStatus(null);
    try {
      const state = await advanceCanaryRollout();
      setCanaryActionStatus(
        `Advanced canary rollout to ${(state.canary_weight * 100).toFixed(0)}%`
      );
      await loadData();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setCanaryActionStatus(`Advance rejected: ${message}`);
    } finally {
      setActingCanary(false);
    }
  };

  const rollbackCanary = async () => {
    setActingCanary(true);
    setCanaryActionStatus(null);
    try {
      await rollbackCanaryRollout("Operator emergency rollback from control plane");
      setCanaryActionStatus(
        "Warm rollback executed: 100% traffic restored to Champion."
      );
      await loadData();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setCanaryActionStatus(`Rollback failed: ${message}`);
    } finally {
      setActingCanary(false);
    }
  };

  const executeScenario = async (scenario: string) => {
    setRunningScenario(true);
    setScenarioResult(null);
    try {
      const data = await runDriftScenario(scenario);
      setScenarioResult(data);
      await loadData();
    } catch (e: unknown) {
      console.error("Scenario execution error:", e);
    } finally {
      setRunningScenario(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        backendHealthy,
        alerts,
        loading,
        submittingBatch,
        batchFeedback,
        actingCanary,
        canaryActionStatus,
        runningScenario,
        scenarioResult,
        benchmarkReport,
        loadingBenchmark,
        lifecycle,
        loadData,
        refreshBenchmark,
        sendTestBatch,
        advanceCanary,
        rollbackCanary,
        executeScenario,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
