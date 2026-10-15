"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertRecord, LifecycleState, RepairAction } from "@/types/contracts";

interface MetricsOverviewProps {
  lifecycle: LifecycleState;
  alerts: AlertRecord[];
}

export function MetricsOverview({ lifecycle, alerts }: MetricsOverviewProps) {
  const criticalAlertsCount = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  ).length;

  const getActionInfo = (action: RepairAction = "A0") => {
    switch (action) {
      case "A0":
        return {
          title: "A0 · NOMINAL MONITORING",
          desc: "Covariate drift within acceptable boundary. Zero compute cost.",
          badgeVariant: "success" as const,
        };
      case "A1":
        return {
          title: "A1 · THRESHOLD CALIBRATION",
          desc: "Sub-second boundary adjustment without pipeline rebuild.",
          badgeVariant: "info" as const,
        };
      case "A2":
        return {
          title: "A2 · TARGETED ADAPTATION",
          desc: "Localized subspace repair for isolated cluster shift.",
          badgeVariant: "warning" as const,
        };
      case "A3":
        return {
          title: "A3 · FULL RETRAINING",
          desc: "Broad structural degradation. Retraining champion pipeline.",
          badgeVariant: "destructive" as const,
        };
    }
  };

  const actionInfo = getActionInfo(lifecycle.chosen_action);
  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const championTrafficPct = 100 - canaryPct;

  return (
    <div className="border-y border-zinc-200 py-6 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        {/* 1. Champion Release */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-zinc-900">
                01 / CHAMPION MODEL
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                SLOT {lifecycle.active_slot}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-zinc-950">
                {lifecycle.champion_release}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                HIST_GB
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-zinc-600">
            <span className="text-emerald-700 font-medium">
              {championTrafficPct}% SERVING TRAFFIC
            </span>
            <span className="text-zinc-400">alias: champion</span>
          </div>
        </div>

        {/* 2. Canary Staged Rollout */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-zinc-900">
                02 / CANARY ROUTING
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                SLOT {lifecycle.candidate_slot || (lifecycle.active_slot === "A" ? "B" : "A")}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-zinc-950">
                {canaryPct}%
              </span>
              <Badge
                variant={canaryPct > 0 ? "purple" : "secondary"}
                className="font-mono text-[10px] uppercase rounded-none px-1.5 py-0"
              >
                {canaryPct > 0 ? "Active Canary" : "Standby"}
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-zinc-600">
            <span className="truncate max-w-[150px]">
              Cand: {lifecycle.candidate_release || "None staged"}
            </span>
            <span className="text-zinc-400">5% → 100%</span>
          </div>
        </div>

        {/* 3. DARI Repair Ladder Status */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-zinc-900">
                03 / REPAIR ACTION
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                POLICY P1
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-zinc-950">
                {lifecycle.chosen_action || "A0"}
              </span>
              <Badge
                variant={actionInfo.badgeVariant}
                className="font-mono text-[10px] uppercase rounded-none px-1.5 py-0"
              >
                {actionInfo.title.split(" · ")[1] || "Nominal"}
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-zinc-600">
            <span className="truncate">
              {lifecycle.chosen_action === "A0" ? "Zero compute consumed" : "Intervention active"}
            </span>
            <span className="text-zinc-400">ladder</span>
          </div>
        </div>

        {/* 4. Active Threat Telemetry */}
        <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-zinc-900">
                04 / THREAT ALERTS
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                STREAM
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-zinc-950">
                {alerts.length}
              </span>
              {criticalAlertsCount > 0 ? (
                <Badge variant="destructive" className="font-mono text-[10px] uppercase rounded-none px-1.5 py-0">
                  {criticalAlertsCount} High/Crit
                </Badge>
              ) : (
                <Badge variant="success" className="font-mono text-[10px] uppercase rounded-none px-1.5 py-0">
                  Clean
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-zinc-600">
            <span>Advisory feed</span>
            <span className="text-zinc-400">fastapi :8000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
