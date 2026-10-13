"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Cpu,
  Layers,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Zap,
} from "lucide-react";
import { AlertRecord, DamageFingerprint, LifecycleState, RepairAction } from "@/types/contracts";

export default function Dashboard() {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingBatch, setSubmittingBatch] = useState<boolean>(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  // DARI state
  const [lifecycle] = useState<LifecycleState>({
    champion_release: "R1",
    active_slot: "A",
    candidate_release: undefined,
    candidate_slot: undefined,
    canary_weight: 0.0,
    last_fingerprint: {
      D_X: 0.08,
      D_Y: 0.03,
      D_B: 0.14,
      Q: 0.99,
      L: 0.94,
      S: 1520,
      R: 1,
    },
    chosen_action: "A0",
    updated_at: "2026-10-14T00:00:00Z",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/health");
      setBackendHealthy(res.ok);
    } catch {
      setBackendHealthy(false);
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/alerts?limit=10");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const sendTestBatch = async () => {
    setSubmittingBatch(true);
    setBatchFeedback(null);
    try {
      const batchId = `ui-test-${Date.now().toString().slice(-6)}`;
      const payload = {
        batch_id: batchId,
        sensor_id: "zeek-sensor-lab-1",
        schema_version: "ton-conn-5-v1",
        extractor_id: "zeek-pinned-v1",
        events: [
          {
            event_id: `evt-${batchId}-1`,
            sensor_id: "zeek-sensor-lab-1",
            event_time: new Date().toISOString(),
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
            event_time: new Date().toISOString(),
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

      const res = await fetch("http://localhost:8000/api/v1/ingestion/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const receipt = await res.json();
        setBatchFeedback(`Accepted 2 events (${receipt.status}). Processing in queue.`);
        setTimeout(loadData, 1500);
      } else {
        setBatchFeedback("Failed to ingest batch. Verify backend is running.");
      }
    } catch (e: any) {
      setBatchFeedback(`Connection error: ${e.message}`);
    } finally {
      setSubmittingBatch(false);
    }
  };

  const getActionBadge = (action: RepairAction) => {
    switch (action) {
      case "A0":
        return {
          label: "A0: NOMINAL MONITORING",
          desc: "Covariate drift within acceptable boundary. Zero compute consumed.",
          color: "border-emerald-500/40 bg-emerald-950/40 text-emerald-400",
        };
      case "A1":
        return {
          label: "A1: THRESHOLD CALIBRATION",
          desc: "Sub-second boundary adjustment without retraining.",
          color: "border-cyan-500/40 bg-cyan-950/40 text-cyan-400",
        };
      case "A2":
        return {
          label: "A2: TARGETED ADAPTATION",
          desc: "Localized subspace repair for isolated novel cluster.",
          color: "border-amber-500/40 bg-amber-950/40 text-amber-400",
        };
      case "A3":
        return {
          label: "A3: FULL RETRAINING",
          desc: "Broad structural degradation. Retraining champion pipeline.",
          color: "border-rose-500/40 bg-rose-950/40 text-rose-400",
        };
    }
  };

  const fp = lifecycle.last_fingerprint as DamageFingerprint;
  const actionBadge = getActionBadge(lifecycle.chosen_action || "A0");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 max-w-7xl mx-auto">
      {/* Top Banner / Navigation */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                SwayamKavach
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                MVP v0.1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous IoT Intrusion Detection & Damage-Aware Retraining (DARI)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealthy ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="text-slate-300">
              Backend: {backendHealthy ? "Online (:8000)" : "Offline"}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300">
            Env: <span className="text-cyan-400 font-medium">Local Staging / Replay</span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Release</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{lifecycle.champion_release}</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Slot {lifecycle.active_slot} (100% Traffic)
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Canary Routing</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {lifecycle.canary_weight * 100}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Slot B: {lifecycle.candidate_release || "Idle / Standby"}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">DARI Policy Status</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {lifecycle.chosen_action || "A0"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Normal Operating Baseline</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Alerts</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{alerts.length}</div>
          <div className="text-xs text-slate-400 mt-1">Advisory security detections</div>
        </div>
      </section>

      {/* Main Grid: DARI Fingerprint & Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* DARI 7-Dimensional Damage Fingerprint */}
        <section className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" /> DARI Damage Fingerprint & Repair Ladder
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-dimensional damage assessment: Drift alone does not trigger full retraining.
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${actionBadge.color}`}>
              {actionBadge.label}
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            {actionBadge.desc}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-xs text-slate-400">Distribution Drift (D_X)</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {(fp.D_X * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${fp.D_X * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-xs text-slate-400">Performance Drop (D_Y)</span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                {fp.D_Y ? `${(fp.D_Y * 100).toFixed(1)}%` : "—"}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${(fp.D_Y || 0) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-xs text-slate-400">Boundary Uncertainty (D_B)</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {(fp.D_B * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${fp.D_B * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-xs text-slate-400">Data Quality (Q)</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {(fp.Q * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${fp.Q * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-xs text-slate-400">Label Freshness (L)</span>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                {(fp.L * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${fp.L * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
              <span className="text-xs text-slate-400">Window Samples (S)</span>
              <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                {fp.S.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-2">Persistence R = {fp.R} windows</div>
            </div>
          </div>
        </section>

        {/* Live Simulation Card */}
        <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-400" /> Ingestion & E2E Spike
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Trigger a test batch with 1 benign flow and 1 high-byte attack flow into the FastAPI
              endpoint (:8000).
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-1 mb-4">
              <div>Schema: ton-conn-5-v1</div>
              <div>Destination: POST /api/v1/ingestion/batches</div>
              <div>Target: Serving Slot A (R1)</div>
            </div>
          </div>

          <div>
            {batchFeedback && (
              <div className="text-xs p-2.5 rounded-lg mb-3 bg-cyan-950/50 border border-cyan-800/50 text-cyan-300">
                {batchFeedback}
              </div>
            )}

            <button
              onClick={sendTestBatch}
              disabled={submittingBatch || !backendHealthy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 font-semibold text-sm text-white transition-colors"
            >
              <Send className="w-4 h-4" />
              {submittingBatch ? "Submitting Batch..." : "Inject Test Flows"}
            </button>
          </div>
        </section>
      </div>

      {/* Intrusion Alerts Table */}
      <section className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" /> Recent Security Intrusion Alerts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live advisory detections committed by the inference consumer.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {alerts.length}</span>
        </div>

        {alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
            No active intrusion alerts. Inject test flows above or replay TON_IoT traffic.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Trigger Event</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Model Score</th>
                  <th className="py-3 px-4">Release</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detected At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {alerts.map((alert) => (
                  <tr key={alert.alert_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-200">{alert.alert_id}</td>
                    <td className="py-3 px-4 text-slate-400">{alert.event_id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          alert.severity === "critical"
                            ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                            : alert.severity === "high"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                            : "bg-blue-950/80 text-blue-400 border border-blue-800/60"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">
                      {(alert.score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-300">{alert.release_id}</td>
                    <td className="py-3 px-4 text-emerald-400">{alert.status}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
