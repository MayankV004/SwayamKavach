"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertRecord, LifecycleState, RepairAction } from "@/types/contracts";

interface MetricsOverviewProps {
  lifecycle: LifecycleState;
  alerts: AlertRecord[];
  chosenAction?: RepairAction;
}

export function MetricsOverview({ lifecycle, alerts, chosenAction }: MetricsOverviewProps) {
  const criticalAlertsCount = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  ).length;

  const getActionInfo = (action: RepairAction = "A0") => {
    switch (action) {
      case "A0":
        return {
          title: "Nominal Monitoring",
          desc: "Covariate drift within acceptable boundary. Zero compute cost.",
          badgeVariant: "success" as const,
        };
      case "A1":
        return {
          title: "Threshold Calibration",
          desc: "Sub-second boundary adjustment without pipeline rebuild.",
          badgeVariant: "info" as const,
        };
      case "A2":
        return {
          title: "Targeted Adaptation",
          desc: "Localized subspace repair for isolated cluster shift.",
          badgeVariant: "warning" as const,
        };
      case "A3":
        return {
          title: "Full Retraining",
          desc: "Broad structural degradation. Retraining champion pipeline.",
          badgeVariant: "destructive" as const,
        };
    }
  };

  const currentAction: RepairAction = chosenAction || lifecycle.chosen_action || "A0";
  const actionInfo = getActionInfo(currentAction);
  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const championTrafficPct = 100 - canaryPct;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Champion Release */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                01
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Champion Model
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-zinc-200 bg-zinc-50 text-zinc-600">
              Slot {lifecycle.active_slot}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {lifecycle.champion_release}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
              HistGradientBoosting
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
          <span className="font-semibold text-emerald-700">
            {championTrafficPct}% Serving Traffic
          </span>
          <span className="text-zinc-400">alias: champion</span>
        </div>
      </div>

      {/* 2. Canary Staged Rollout */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                02
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Canary Routing
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-zinc-200 bg-zinc-50 text-zinc-600">
              Slot {lifecycle.candidate_slot || (lifecycle.active_slot === "A" ? "B" : "A")}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {canaryPct}%
            </span>
            <Badge
              variant={canaryPct > 0 ? "purple" : "secondary"}
              className="text-xs font-medium"
            >
              {canaryPct > 0 ? "Canary Staged" : "Standby"}
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
          <span className="truncate max-w-[160px] font-medium text-zinc-700">
            {lifecycle.candidate_release ? `Candidate: ${lifecycle.candidate_release}` : "Standby (Idle)"}
          </span>
          <span className="text-zinc-400">5% → 100%</span>
        </div>
      </div>

      {/* 3. DARI Repair Ladder Status */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                03
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Repair Action
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-zinc-200 bg-zinc-50 text-zinc-600">
              Policy P1
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {currentAction}
            </span>
            <Badge
              variant={actionInfo.badgeVariant}
              className="text-xs font-medium"
            >
              {actionInfo.title}
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
          <span className="truncate font-medium text-zinc-700">
            {currentAction === "A0" ? "Zero compute consumed" : "Intervention active"}
          </span>
          <span className="text-zinc-400">ladder</span>
        </div>
      </div>

      {/* 4. Active Threat Telemetry */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                04
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Threat Alerts
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-zinc-200 bg-zinc-50 text-zinc-600">
              Live Stream
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {alerts.length}
            </span>
            {criticalAlertsCount > 0 ? (
              <Badge variant="destructive" className="text-xs font-medium">
                {criticalAlertsCount} Critical &amp; High
              </Badge>
            ) : (
              <Badge variant="success" className="text-xs font-medium">
                Clean State
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
          <span className="font-medium text-zinc-700">Real-time advisory feed</span>
          <span className="text-zinc-400">:8000</span>
        </div>
      </div>
    </div>
  );
}
