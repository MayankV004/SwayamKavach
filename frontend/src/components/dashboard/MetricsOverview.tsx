"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Champion Release */}
      <Card className="border-zinc-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-600 mb-2 font-mono">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              [ 01 ] Champion Release
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
              HIST_GB
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-950">
              {lifecycle.champion_release}
            </span>
            <Badge variant="outline" className="font-mono text-[10px] bg-zinc-50 border-zinc-200">
              Slot {lifecycle.active_slot}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-zinc-100 pt-2 text-zinc-600">
            <span className="font-mono font-medium text-emerald-700">
              {championTrafficPct}% Serving Traffic
            </span>
            <span className="font-mono text-[11px] text-zinc-600">alias: champion</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Canary Staged Rollout */}
      <Card className="border-zinc-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-600 mb-2 font-mono">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              [ 02 ] Dual-Slot Routing
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
              SLOT B
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-950">
              {canaryPct}%
            </span>
            <Badge
              variant={canaryPct > 0 ? "purple" : "secondary"}
              className="font-mono text-[10px]"
            >
              {canaryPct > 0 ? "Active Canary" : "Standby"}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-zinc-100 pt-2 text-zinc-600">
            <span className="truncate max-w-[140px] font-mono text-[11px]">
              Cand: {lifecycle.candidate_release || "None staged"}
            </span>
            <span className="font-mono text-[11px] text-zinc-600">
              Slot {lifecycle.candidate_slot || (lifecycle.active_slot === "A" ? "B" : "A")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. DARI Repair Ladder Status */}
      <Card className="border-zinc-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-600 mb-2 font-mono">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              [ 03 ] DARI Action
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
              POLICY P1
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-950">
              {lifecycle.chosen_action || "A0"}
            </span>
            <Badge variant={actionInfo.badgeVariant} className="font-mono text-[10px]">
              {actionInfo.title.split(" · ")[1] || "Nominal"}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-zinc-100 pt-2 text-zinc-600 font-mono text-[11px]">
            <span className="truncate">
              {lifecycle.chosen_action === "A0" ? "Zero compute consumed" : "Intervention active"}
            </span>
            <span className="text-zinc-600">DARI Ladder</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Active Threat Telemetry */}
      <Card className="border-zinc-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-zinc-600 mb-2 font-mono">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              [ 04 ] Detections
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
              REALTIME
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-950">
              {alerts.length}
            </span>
            {criticalAlertsCount > 0 ? (
              <Badge variant="destructive" className="font-mono text-[10px]">
                {criticalAlertsCount} High/Crit
              </Badge>
            ) : (
              <Badge variant="success" className="font-mono text-[10px]">
                Nominal Clean
              </Badge>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-zinc-100 pt-2 text-zinc-600 font-mono text-[11px]">
            <span>Advisory feed</span>
            <span className="text-zinc-600">consumer :8000</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
