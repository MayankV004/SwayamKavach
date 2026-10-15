"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { AlertsTable } from "@/components/dashboard/AlertsTable";
import { Card, CardContent } from "@/components/ui/card";

export default function AlertsPage() {
  const { alerts } = useDashboard();

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  return (
    <div className="space-y-6">
      {/* Alert Severity Metric Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-4 font-mono">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Total Incident Alerts
            </div>
            <div className="text-2xl font-bold text-zinc-950 mt-1">
              {alerts.length}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Active window buffer
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-4 font-mono">
            <div className="text-[11px] text-red-700 uppercase tracking-wider font-semibold">
              Critical Severity
            </div>
            <div className="text-2xl font-bold text-red-900 mt-1">
              {criticalCount}
            </div>
            <div className="text-[10px] text-red-600 mt-1">
              Immediate operator triage
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-4 font-mono">
            <div className="text-[11px] text-amber-700 uppercase tracking-wider font-semibold">
              High Severity
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {highCount}
            </div>
            <div className="text-[10px] text-amber-600 mt-1">
              Probable intrusion activity
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-4 font-mono">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
              Medium / Low Advisory
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">
              {mediumCount + lowCount}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Anomalous packet flows
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Alerts Table */}
      <AlertsTable alerts={alerts} />
    </div>
  );
}
