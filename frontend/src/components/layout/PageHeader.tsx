"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, GitBranch } from "lucide-react";

const ROUTE_INFO: Record<string, { category: string; title: string; subtitle: string }> = {
  "/": {
    category: "Monitoring",
    title: "Operational Overview",
    subtitle: "Continuous self-healing intrusion detection telemetry & DARI damage ladder",
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
    subtitle: "TON_IoT 11-feature stream batch testing via POST /api/v1/ingestion/batches",
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

export function PageHeader() {
  const pathname = usePathname();
  const { lifecycle, loading, loadData, effectiveAction } = useDashboard();

  const current = ROUTE_INFO[pathname] || {
    category: "Control Plane",
    title: "SwayamKavach Dashboard",
    subtitle: "Adaptive MLOps and IoT Intrusion Detection Platform",
  };

  const canaryPct = Math.round(lifecycle.canary_weight * 100);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4 border-b border-[#EAE7ED]/80 dark:border-[#282534]/80">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
          <span>{current.category}</span>
          <span>•</span>
          <span className="text-[#25232B] dark:text-[#F2F1F6] font-mono">
            Slot {lifecycle.active_slot} ({lifecycle.champion_release})
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
          {current.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#85818D] dark:text-[#A5A0AF] max-w-2xl">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        {/* Active Policy Badge */}
        <Badge
          variant="outline"
          className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] font-medium text-xs px-3 py-1.5"
        >
          <span className="text-[#85818D] dark:text-[#A5A0AF] mr-1.5 font-normal">Active Policy:</span>
          <strong>{effectiveAction || lifecycle.chosen_action || "A0"}</strong>
        </Badge>

        {/* Canary Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-xs font-medium text-[#25232B] dark:text-[#F2F1F6]">
          <GitBranch className="h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF]" />
          <span className="text-[#85818D] dark:text-[#A5A0AF]">Canary:</span>
          <span className="font-bold tabular-nums">{canaryPct}%</span>
        </div>

        {/* Manual Refresh Sync */}
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E76552] hover:bg-[#D8523E] disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer select-none shadow-coral-soft active:scale-98"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Syncing..." : "Sync"}</span>
        </button>
      </div>
    </div>
  );
}
