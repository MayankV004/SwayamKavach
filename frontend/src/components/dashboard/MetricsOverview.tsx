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
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle flex flex-col justify-between hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-canvas hover:-translate-y-0.5 transition-all duration-200 group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF] group-hover:bg-coral-gradient group-hover:text-white group-hover:shadow-coral-soft transition-all">
                01
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                Champion Model
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6]">
              Slot {lifecycle.active_slot}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums group-hover:text-[#E76552] transition-colors">
              {lifecycle.champion_release}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6]">
              HistGradientBoosting
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs text-[#85818D] dark:text-[#A5A0AF]">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 inline-block" />
            {championTrafficPct}% Serving Traffic
          </span>
          <span className="text-[11px] font-mono text-[#85818D] dark:text-[#A5A0AF]">alias: champion</span>
        </div>
      </div>

      {/* 2. Canary Staged Rollout */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle flex flex-col justify-between hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-canvas hover:-translate-y-0.5 transition-all duration-200 group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF] group-hover:bg-coral-gradient group-hover:text-white group-hover:shadow-coral-soft transition-all">
                02
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                Canary Routing
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6]">
              Slot {lifecycle.candidate_slot || (lifecycle.active_slot === "A" ? "B" : "A")}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums group-hover:text-[#E76552] transition-colors">
              {canaryPct}%
            </span>
            <Badge
              variant={canaryPct > 0 ? "purple" : "secondary"}
              className="text-xs font-semibold shadow-2xs"
            >
              {canaryPct > 0 ? "Canary Staged" : "Standby (0%)"}
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs text-[#85818D] dark:text-[#A5A0AF]">
          <span className="truncate max-w-[160px] font-medium text-[#25232B] dark:text-[#F2F1F6]">
            {lifecycle.candidate_release ? `Candidate: ${lifecycle.candidate_release}` : "Standby (Idle)"}
          </span>
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF]">5% → 100%</span>
        </div>
      </div>

      {/* 3. DARI Repair Ladder Status */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle flex flex-col justify-between hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-canvas hover:-translate-y-0.5 transition-all duration-200 group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF] group-hover:bg-coral-gradient group-hover:text-white group-hover:shadow-coral-soft transition-all">
                03
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                Repair Action
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6]">
              Policy P1
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums group-hover:text-[#E76552] transition-colors">
              {currentAction}
            </span>
            <Badge
              variant={actionInfo.badgeVariant}
              className="text-xs font-semibold shadow-2xs"
            >
              {actionInfo.title}
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs text-[#85818D] dark:text-[#A5A0AF]">
          <span className="truncate font-medium text-[#25232B] dark:text-[#F2F1F6]">
            {currentAction === "A0" ? "Zero compute consumed" : "Intervention active"}
          </span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">ladder</span>
        </div>
      </div>

      {/* 4. Active Threat Telemetry */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle flex flex-col justify-between hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-canvas hover:-translate-y-0.5 transition-all duration-200 group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF] group-hover:bg-coral-gradient group-hover:text-white group-hover:shadow-coral-soft transition-all">
                04
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                Threat Alerts
              </span>
            </div>
            <Badge variant="outline" className="text-[11px] font-medium border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6]">
              Live Stream
            </Badge>
          </div>

          <div className="flex items-baseline gap-2.5 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums group-hover:text-[#E76552] transition-colors">
              {alerts.length}
            </span>
            {criticalAlertsCount > 0 ? (
              <Badge variant="destructive" className="text-xs font-semibold shadow-2xs">
                {criticalAlertsCount} Critical &amp; High
              </Badge>
            ) : (
              <Badge variant="success" className="text-xs font-semibold shadow-2xs">
                Clean State
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs text-[#85818D] dark:text-[#A5A0AF]">
          <span className="font-medium text-[#25232B] dark:text-[#F2F1F6]">Real-time advisory feed</span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">:8000</span>
        </div>
      </div>
    </div>
  );
}
