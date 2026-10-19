"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { AlertsTable } from "@/components/dashboard/AlertsTable";
import { Badge } from "@/components/ui/badge";

export default function AlertsPage() {
  const { alerts, lifecycle } = useDashboard();

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Alert Feed Status Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="text-xs border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6] px-3 py-1 font-semibold"
        >
          Serving Champion: Slot {lifecycle.active_slot} ({lifecycle.champion_release})
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs px-3 py-1 font-semibold ${
            criticalCount > 0
              ? "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300"
              : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
          }`}
        >
          {criticalCount > 0 ? `${criticalCount} Actionable Critical Intrusions` : "Zero Critical Escape"}
        </Badge>
      </div>

      {/* 4-Card Clean Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">Total Ingested Alerts</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums block">
            {alerts.length}
          </span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1 block">Sliding window buffer</span>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">Critical Intrusions</span>
          <span className={`text-2xl sm:text-3xl font-extrabold mt-1 tabular-nums block ${criticalCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-[#25232B] dark:text-[#F2F1F6]"}`}>
            {criticalCount}
          </span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block font-medium">Requires triage</span>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">High Severity</span>
          <span className={`text-2xl sm:text-3xl font-extrabold mt-1 tabular-nums block ${highCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-[#25232B] dark:text-[#F2F1F6]"}`}>
            {highCount}
          </span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1 block">Probable attack flows</span>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">Advisory &amp; Medium</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums block">
            {mediumCount + lowCount}
          </span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1 block">Statistical deviations</span>
        </div>
      </div>



      {/* Main Alerts Table */}
      <AlertsTable alerts={alerts} />
    </div>
  );
}
