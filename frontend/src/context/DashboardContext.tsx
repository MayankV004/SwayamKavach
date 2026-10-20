"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AlertRecord,
  BenchmarkReport,
  DamageFingerprint,
  EvaluationReport,
  LifecycleState,
  RepairAction,
  ScenarioRunResult,
  StreamStatus,
} from "@/types/contracts";
import { ModelBenchmarkResponse } from "@/types/modelBenchmarks";
import {
  fetchHealth,
  fetchAlerts,
  fetchLifecycleState,
  resetLifecycleState,
  fetchBenchmarkReport,
  fetchModelBenchmarks,
  fetchLatestEvaluationReport,
  runCandidateComparison,
  runDriftScenario,
  stageCandidateRollout,
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
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark", event?: React.MouseEvent | MouseEvent) => void;
  toggleTheme: (event?: React.MouseEvent | MouseEvent) => void;
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
  modelBenchmarks: ModelBenchmarkResponse | null;
  loadingModelBenchmarks: boolean;
  evaluationReport: EvaluationReport | null;
  loadingEvaluation: boolean;
  lifecycle: LifecycleState;
  effectiveFingerprint: DamageFingerprint;
  effectiveAction: RepairAction;
  streamStatus: StreamStatus | null;
  togglingStream: boolean;
  streamFeedback: string | null;
  loadData: () => Promise<void>;
  refreshBenchmark: () => Promise<void>;
  refreshModelBenchmarks: () => Promise<void>;
  refreshEvaluation: () => Promise<void>;
  runComparison: (candidateId?: string) => Promise<void>;
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
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("swayamkavach-theme");
        if (stored === "dark" || stored === "light") {
          return stored;
        }
        if (document.documentElement.classList.contains("dark")) {
          return "dark";
        }
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
          return "dark";
        }
      } catch {
        // ignore
      }
    }
    return "light";
  });

  // Sync document element class and color-scheme with theme state
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
      document.documentElement.classList.add("theme-ready");
    }
  }, [theme]);

  const applyThemeWithTransition = useCallback(
    (targetTheme: "light" | "dark", event?: React.MouseEvent | MouseEvent) => {
      let x = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
      let y = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

      if (event && event.clientX !== undefined && event.clientY !== undefined && (event.clientX > 0 || event.clientY > 0)) {
        x = event.clientX;
        y = event.clientY;
      } else if (typeof document !== "undefined") {
        // Fallback: look for active theme button
        const activeBtn = document.activeElement as HTMLElement | null;
        if (activeBtn && activeBtn.getBoundingClientRect) {
          const rect = activeBtn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
          }
        }
      }

      const updateDom = () => {
        setThemeState(targetTheme);
        try {
          localStorage.setItem("swayamkavach-theme", targetTheme);
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", targetTheme === "dark");
            document.documentElement.style.colorScheme = targetTheme;
          }
        } catch {
          // ignore
        }
      };

      // Native hardware-accelerated View Transition Circular Ripple (Butter smooth 60/120fps)
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const doc = document;
        const win = window;
        const docWithVT = doc as unknown as {
          startViewTransition?: (cb: () => Promise<void> | void) => { ready?: Promise<void> };
        };

        if (typeof docWithVT.startViewTransition === "function") {
          const endRadius = Math.hypot(
            Math.max(x, win.innerWidth - x),
            Math.max(y, win.innerHeight - y)
          );

          const transition = docWithVT.startViewTransition(async () => {
            updateDom();
          });

          transition.ready?.then(() => {
            doc.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 450,
                easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          });
        } else {
          // Fallback for browsers without native View Transitions
          const maxDim = Math.max(win.innerWidth, win.innerHeight) * 2.4;
          const wave = doc.createElement("div");
          wave.className = "theme-ripple-wave";
          wave.style.width = `${maxDim}px`;
          wave.style.height = `${maxDim}px`;
          wave.style.left = `${x}px`;
          wave.style.top = `${y}px`;
          wave.style.background =
            targetTheme === "dark"
              ? "radial-gradient(circle, rgba(231,101,82,0.25) 0%, rgba(22,21,29,0.92) 55%, rgba(15,14,19,0.98) 100%)"
              : "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(245,244,247,0.9) 55%, rgba(231,101,82,0.18) 100%)";
          doc.body.appendChild(wave);
          updateDom();
          setTimeout(() => wave.remove(), 450);
        }
      } else {
        updateDom();
      }
    },
    []
  );

  const setTheme = useCallback(
    (newTheme: "light" | "dark", event?: React.MouseEvent | MouseEvent) => {
      applyThemeWithTransition(newTheme, event);
    },
    [applyThemeWithTransition]
  );

  const toggleTheme = useCallback(
    (event?: React.MouseEvent | MouseEvent) => {
      const nextTheme = theme === "light" ? "dark" : "light";
      applyThemeWithTransition(nextTheme, event);
    },
    [theme, applyThemeWithTransition]
  );

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

  const [modelBenchmarks, setModelBenchmarks] = useState<ModelBenchmarkResponse | null>(null);
  const [loadingModelBenchmarks, setLoadingModelBenchmarks] = useState<boolean>(false);

  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState<boolean>(false);

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
      setLifecycle((prev) => {
        if (
          prev &&
          prev.updated_at === lc.updated_at &&
          prev.chosen_action === lc.chosen_action &&
          prev.canary_weight === lc.canary_weight &&
          prev.active_slot === lc.active_slot &&
          prev.champion_release === lc.champion_release &&
          prev.candidate_release === lc.candidate_release &&
          prev.candidate_slot === lc.candidate_slot
        ) {
          return prev;
        }
        return lc;
      });
    } catch (e) {
      console.error(e);
    }

    try {
      const ev = await fetchLatestEvaluationReport();
      if (ev) {
        setEvaluationReport((prev) => {
          if (
            prev &&
            prev.report_id === ev.report_id &&
            prev.created_at === ev.created_at &&
            prev.verdict === ev.verdict
          ) {
            return prev;
          }
          return ev;
        });
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const mb = await fetchModelBenchmarks();
      if (mb) {
        setModelBenchmarks((prev) => {
          if (
            prev &&
            prev.release_id === mb.release_id &&
            prev.packaged_at === mb.packaged_at &&
            prev.training_rows === mb.training_rows
          ) {
            return prev;
          }
          return mb;
        });
      }
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
      if (data) {
        setBenchmarkReport((prev) => {
          if (
            prev &&
            prev.report_id === data.report_id &&
            prev.created_at === data.created_at &&
            prev.total_windows_evaluated === data.total_windows_evaluated
          ) {
            return prev;
          }
          return data;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBenchmark(false);
    }
  }, []);

  const refreshModelBenchmarks = useCallback(async () => {
    setLoadingModelBenchmarks(true);
    try {
      const data = await fetchModelBenchmarks();
      if (data) {
        setModelBenchmarks((prev) => {
          if (
            prev &&
            prev.release_id === data.release_id &&
            prev.packaged_at === data.packaged_at &&
            prev.training_rows === data.training_rows
          ) {
            return prev;
          }
          return data;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingModelBenchmarks(false);
    }
  }, []);

  const refreshEvaluation = useCallback(async () => {
    setLoadingEvaluation(true);
    try {
      const data = await fetchLatestEvaluationReport();
      if (data) setEvaluationReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvaluation(false);
    }
  }, []);

  const runComparison = useCallback(async (candidateId: string = "R2-candidate") => {
    setLoadingEvaluation(true);
    try {
      const rep = await runCandidateComparison(candidateId, "R1");
      setEvaluationReport(rep);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvaluation(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      await loadData();
      if (!ignore) {
        void refreshBenchmark();
        void refreshEvaluation();
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
  }, [loadData, refreshBenchmark, refreshEvaluation, streamStatus?.any_active]);


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
      const canaryPct = Math.round((lifecycle?.canary_weight || 0) * 100);
      if (!lifecycle.candidate_release || canaryPct === 0) {
        setCanaryActionStatus("Staging Candidate R2 into Slot B (5% pilot)...");
        const state = await stageCandidateRollout("R2");
        setLifecycle(state);
        setCanaryActionStatus(
          "Candidate R2 staged in Slot B: 5% pilot traffic routed."
        );
      } else {
        const state = await advanceCanaryRollout();
        setLifecycle(state);
        const newPct = Math.round(state.canary_weight * 100);
        setCanaryActionStatus(
          newPct >= 100
            ? "Candidate promoted to 100% Champion!"
            : `Advanced canary rollout to ${newPct}%`
        );
      }
      await loadData();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setCanaryActionStatus(`Canary action rejected: ${message}`);
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
  const effectiveEvaluationReport: EvaluationReport | null =
    (scenarioResult?.details?.eval_report as EvaluationReport | undefined) || evaluationReport;

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
        theme,
        setTheme,
        toggleTheme,
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
        modelBenchmarks,
        loadingModelBenchmarks,
        evaluationReport: effectiveEvaluationReport,
        loadingEvaluation,
        lifecycle,
        effectiveFingerprint,
        effectiveAction,
        streamStatus,
        togglingStream,
        streamFeedback,
        loadData,
        refreshBenchmark,
        refreshModelBenchmarks,
        refreshEvaluation,
        runComparison,
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
