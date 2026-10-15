"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

const ROUTE_TITLES: Record<string, { title: string; subtitle: string; category: string }> = {
  "/": {
    category: "Monitoring",
    title: "Operational Overview",
    subtitle: "Autonomous IoT IDS telemetry and DARI damage fingerprint ladder",
  },
  "/canary": {
    category: "Deployment",
    title: "Dual-Slot Canary Rollout",
    subtitle: "Staged routing controller (5% → 25% → 50% → 100%) and instant warm rollback",
  },
  "/scenarios": {
    category: "Simulation",
    title: "Drift & Attack Simulator",
    subtitle: "Deterministic streaming scenario injection into self-healing control loop",
  },
  "/ingestion": {
    category: "Data Pipeline",
    title: "Traffic Ingestion Probe",
    subtitle: "TON_IoT 5-feature stream batch testing via POST /api/v1/ingestion/batches",
  },
  "/benchmarks": {
    category: "Evaluation",
    title: "Empirical Benchmarks",
    subtitle: "Evaluation scoreboard across continuous 2,000-event streaming replay windows",
  },
  "/alerts": {
    category: "Security",
    title: "Intrusion Alert Feed",
    subtitle: "Real-time security advisory detections committed by the inference consumer",
  },
  "/lineage": {
    category: "Governance",
    title: "Model Lineage & Specification",
    subtitle: "DVC dataset hashes, MLflow model registry manifest, and DARI safety invariants",
  },
};

export function Header() {
  const pathname = usePathname();
  const { backendHealthy, lifecycle, loading, loadData } = useDashboard();

  const routeInfo = ROUTE_TITLES[pathname] || {
    category: "Control Plane",
    title: "Control Plane",
    subtitle: "SwayamKavach Adaptive MLOps and IoT Intrusion Detection Platform",
  };

  const canaryPct = Math.round(lifecycle.canary_weight * 100);

  return (
    <header className="h-16 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Route Title & Clean Breadcrumb */}
      <div className="flex flex-col justify-center space-y-0.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
            {routeInfo.category}
          </span>
          <span className="text-zinc-300">•</span>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
            {routeInfo.title}
          </h1>
          <Badge
            variant="outline"
            className="text-[11px] font-medium border-zinc-200 bg-zinc-50 text-zinc-700 hidden sm:inline-flex"
          >
            {lifecycle.champion_release} · Slot {lifecycle.active_slot}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500 truncate hidden md:block">
          {routeInfo.subtitle}
        </p>
      </div>

      {/* Right Controls & Telemetry Badges */}
      <div className="flex items-center gap-2.5">
        {/* Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200/90 bg-zinc-50/80 text-xs text-zinc-700">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                backendHealthy ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                backendHealthy ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
          </span>
          <span className="font-medium text-zinc-600">Control Plane</span>
          <span
            className={`font-semibold ${
              backendHealthy ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {backendHealthy ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Canary Pill */}
        <div className="hidden lg:flex items-center px-3 py-1.5 rounded-full border border-zinc-200/90 bg-zinc-50/80 text-xs text-zinc-700">
          <span className="text-zinc-500 mr-1.5 font-medium">Canary Weight</span>
          <span className="font-bold text-zinc-950 tabular-nums">{canaryPct}%</span>
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Syncing..." : "Refresh"}</span>
        </button>
      </div>
    </header>
  );
}
