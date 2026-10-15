"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { AlertsTable } from "@/components/dashboard/AlertsTable";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, AlertTriangle, ShieldCheck, Bell } from "lucide-react";

export default function AlertsPage() {
  const { alerts } = useDashboard();

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  return (
    <div className="space-y-6">
      {/* Alert Severity Metric Breakdown with Big Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        <Card className="border-zinc-200/90 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Total Alerts
              </span>
            </div>
            <div className="text-4xl lg:text-5xl font-extrabold text-zinc-950 tabular-nums my-1">
              {alerts.length}
            </div>
            <div className="text-xs text-zinc-400 mt-2 font-medium">
              Active window buffer
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200/90 bg-red-50/30 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                Critical Severity
              </span>
            </div>
            <div className="text-4xl lg:text-5xl font-extrabold text-red-900 tabular-nums my-1">
              {criticalCount}
            </div>
            <div className="text-xs text-red-600 mt-2 font-medium">
              Immediate operator triage
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/90 bg-amber-50/30 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                High Severity
              </span>
            </div>
            <div className="text-4xl lg:text-5xl font-extrabold text-amber-900 tabular-nums my-1">
              {highCount}
            </div>
            <div className="text-xs text-amber-600 mt-2 font-medium">
              Probable intrusion activity
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/90 bg-white shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Medium &amp; Low Advisory
              </span>
            </div>
            <div className="text-4xl lg:text-5xl font-extrabold text-zinc-900 tabular-nums my-1">
              {mediumCount + lowCount}
            </div>
            <div className="text-xs text-zinc-400 mt-2 font-medium">
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
