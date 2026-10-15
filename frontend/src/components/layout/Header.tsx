"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "OPERATIONAL OVERVIEW",
    subtitle: "Autonomous IoT IDS telemetry and DARI damage fingerprint ladder",
  },
  "/canary": {
    title: "DUAL-SLOT CANARY ROLLOUT",
    subtitle: "Staged routing controller (5% → 25% → 50% → 100%) & instant warm rollback",
  },
  "/scenarios": {
    title: "DRIFT & ATTACK SIMULATOR",
    subtitle: "Deterministic streaming scenario injection into self-healing control loop",
  },
  "/ingestion": {
    title: "TRAFFIC INGESTION PROBE",
    subtitle: "TON_IoT 5-feature stream batch testing via POST /api/v1/ingestion/batches",
  },
  "/benchmarks": {
    title: "EMPIRICAL BENCHMARKS",
    subtitle: "Evaluation scoreboard across continuous 2,000-event streaming replay windows",
  },
  "/alerts": {
    title: "INTRUSION ALERT AUDIT FEED",
    subtitle: "Real-time security advisory detections committed by the inference consumer",
  },
  "/lineage": {
    title: "MODEL LINEAGE & SPECIFICATION",
    subtitle: "DVC dataset hashes, MLflow model registry manifest & DARI safety invariants",
  },
};

export function Header() {
  const pathname = usePathname();
  const { backendHealthy, lifecycle, loading, loadData } = useDashboard();

  const routeInfo = ROUTE_TITLES[pathname] || {
    title: "CONTROL PLANE",
    subtitle: "SwayamKavach Adaptive MLOps and IoT Intrusion Detection Platform",
  };

  const canaryPct = Math.round(lifecycle.canary_weight * 100);

  return (
    <header className="h-14 border-b border-zinc-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
      {/* Route Title & Breadcrumb */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold tracking-wider text-zinc-950 uppercase">
            {"//"} {routeInfo.title}
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-600">
            {lifecycle.champion_release} · Slot {lifecycle.active_slot}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 truncate hidden md:block">
          {routeInfo.subtitle}
        </p>
      </div>

      {/* Right Controls & Telemetry Pills (Clean, no icons) */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-700">
          <span
            className={`h-2 w-2 rounded-full ${
              backendHealthy ? "bg-emerald-600" : "bg-red-600"
            }`}
          />
          <span>API :8000</span>
          <span className={backendHealthy ? "text-emerald-700 font-semibold" : "text-red-700 font-semibold"}>
            {backendHealthy ? "OK" : "ERR"}
          </span>
        </div>

        {/* Canary Pill */}
        <div className="hidden lg:flex items-center px-2 py-1 rounded border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-700">
          <span>CANARY: </span>
          <span className="font-bold text-zinc-950 ml-1">{canaryPct}%</span>
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1 rounded bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-mono text-[11px] font-medium transition-colors cursor-pointer select-none"
        >
          {loading ? "SYNCING..." : "REFRESH"}
        </button>
      </div>
    </header>
  );
}
