"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AlertRecord,
  BenchmarkReport,
  DamageFingerprint,
  LifecycleState,
  RepairAction,
  ScenarioRunResult,
  StreamStatus,
} from "@/types/contracts";
import {
  fetchHealth,
  fetchAlerts,
  fetchLifecycleState,
  resetLifecycleState,
  fetchBenchmarkReport,
  runDriftScenario,
  advanceCanaryRollout,
  rollbackCanaryRollout,
  ingestFlowBatch,
  fetchStreamStatus,
  startReplayStream,
  stopReplayStream,
  startSnifferStream,
  stopSnifferStream,
  startAllStreams,
  stopAllStreams,
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
  effectiveFingerprint: DamageFingerprint;
  effectiveAction: RepairAction;
  streamStatus: StreamStatus | null;
  togglingStream: boolean;
  streamFeedback: string | null;
  loadData: () => Promise<void>;
  refreshBenchmark: () => Promise<void>;
  sendTestBatch: () => Promise<void>;
  advanceCanary: () => Promise<void>;
  rollbackCanary: () => Promise<void>;
  executeScenario: (scenario: string) => Promise<void>;
  clearScenario: () => void;
  resetLifecycle: () => Promise<void>;
  toggleReplayStream: () => Promise<void>;
  toggleSnifferStream: () => Promise<void>;
  startBothStreams: () => Promise<void>;
  stopBothStreams: () => Promise<void>;
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

  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [togglingStream, setTogglingStream] = useState<boolean>(false);
  const [streamFeedback, setStreamFeedback] = useState<string | null>(null);

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
    }

    try {
      const stream = await fetchStreamStatus();
      setStreamStatus(stream);
    } catch {
      // ignore if stream route offline
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
    }, streamStatus?.any_active ? 2000 : 5000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [loadData, refreshBenchmark, streamStatus?.any_active]);

  const sendTestBatch = async () => {
    setSubmittingBatch(true);
    setBatchFeedback(null);
    try {
      const batchId = `ui-probe-${Date.now().toString().slice(-6)}`;
      const payload = {
        batch_id: batchId,
        sensor_id: "zeek-sensor-lab-1",
        schema_version: "ton-conn-11-v1",
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
      if (data?.fingerprint) {
        setLifecycle((prev) => ({
          ...prev,
          last_fingerprint: data.fingerprint,
          chosen_action: data.chosen_action,
        }));
      }
      await loadData();
    } catch (e: unknown) {
      console.error("Scenario execution error:", e);
    } finally {
      setRunningScenario(false);
    }
  };

  const toggleReplayStream = async () => {
    setTogglingStream(true);
    setStreamFeedback(null);
    try {
      if (streamStatus?.replay?.is_running) {
        await stopReplayStream();
        setStreamFeedback("IoT Replay Stream stopped.");
      } else {
        await startReplayStream();
        setStreamFeedback("IoT Replay Stream started (streaming ToN_IoT packets).");
      }
      const s = await fetchStreamStatus();
      setStreamStatus(s);
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStreamFeedback(`Replay toggle error: ${msg}`);
    } finally {
      setTogglingStream(false);
    }
  };

  const toggleSnifferStream = async () => {
    setTogglingStream(true);
    setStreamFeedback(null);
    try {
      if (streamStatus?.sniffer?.is_running) {
        await stopSnifferStream();
        setStreamFeedback("Host Live Sniffer stopped.");
      } else {
        await startSnifferStream();
        setStreamFeedback("Host Live Sniffer started (capturing real WiFi/LAN packets).");
      }
      const s = await fetchStreamStatus();
      setStreamStatus(s);
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStreamFeedback(`Sniffer toggle error: ${msg}`);
    } finally {
      setTogglingStream(false);
    }
  };

  const startBothStreams = async () => {
    setTogglingStream(true);
    setStreamFeedback(null);
    try {
      await startAllStreams();
      setStreamFeedback("Both streams active: IoT Replay + Host Live WiFi Sniffer.");
      const s = await fetchStreamStatus();
      setStreamStatus(s);
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStreamFeedback(`Error starting all streams: ${msg}`);
    } finally {
      setTogglingStream(false);
    }
  };

  const stopBothStreams = async () => {
    setTogglingStream(true);
    setStreamFeedback(null);
    try {
      await stopAllStreams();
      setStreamFeedback("All network streams stopped.");
      const s = await fetchStreamStatus();
      setStreamStatus(s);
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStreamFeedback(`Error stopping all streams: ${msg}`);
    } finally {
      setTogglingStream(false);
    }
  };

  const DEFAULT_NOMINAL_FP: DamageFingerprint = {
    D_X: 0.012,
    D_Y: 0.008,
    D_B: 0.045,
    Q: 0.999,
    L: 0.985,
    S: 2000,
    R: 1,
  };

  const effectiveFingerprint: DamageFingerprint =
    scenarioResult?.fingerprint || lifecycle.last_fingerprint || DEFAULT_NOMINAL_FP;
  const effectiveAction: RepairAction =
    scenarioResult?.chosen_action || lifecycle.chosen_action || "A0";

  const clearScenario = () => {
    setScenarioResult(null);
    void loadData();
  };

  const resetLifecycle = async () => {
    setActingCanary(true);
    setCanaryActionStatus(null);
    try {
      const state = await resetLifecycleState();
      setLifecycle(state);
      setScenarioResult(null);
      setCanaryActionStatus("Lifecycle reset to baseline: Champion R1 on Slot A, Canary 0%.");
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setCanaryActionStatus(`Reset failed: ${msg}`);
    } finally {
      setActingCanary(false);
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
        effectiveFingerprint,
        effectiveAction,
        streamStatus,
        togglingStream,
        streamFeedback,
        loadData,
        refreshBenchmark,
        sendTestBatch,
        advanceCanary,
        rollbackCanary,
        executeScenario,
        clearScenario,
        resetLifecycle,
        toggleReplayStream,
        toggleSnifferStream,
        startBothStreams,
        stopBothStreams,
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
