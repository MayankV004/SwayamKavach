"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertRecord } from "@/types/contracts";

interface AlertsTableProps {
  alerts: AlertRecord[];
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter === "all") return true;
    return alert.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive" className="font-mono text-[10px] uppercase">critical</Badge>;
      case "high":
        return <Badge variant="warning" className="font-mono text-[10px] uppercase">high</Badge>;
      case "medium":
        return <Badge variant="secondary" className="font-mono text-[10px] uppercase">medium</Badge>;
      default:
        return <Badge variant="outline" className="font-mono text-[10px] uppercase">low</Badge>;
    }
  };

  return (
    <Card className="border-zinc-200 bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                AUDIT
              </span>
              <CardTitle className="text-sm font-bold font-mono">
                Security Intrusion Alert Feed
              </CardTitle>
            </div>
            <CardDescription className="mt-1 font-mono text-[11px]">
              Live advisory detections committed by the inference consumer from incoming network flows.
            </CardDescription>
          </div>

          {/* Filter pills without icons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
            <span className="text-zinc-600 text-[11px] mr-1">FILTER:</span>
            <button
              onClick={() => setSeverityFilter("all")}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                severityFilter === "all"
                  ? "bg-zinc-950 text-white font-medium"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              ALL ({alerts.length})
            </button>
            <button
              onClick={() => setSeverityFilter("critical")}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                severityFilter === "critical"
                  ? "bg-red-700 text-white font-medium"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              CRITICAL
            </button>
            <button
              onClick={() => setSeverityFilter("high")}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                severityFilter === "high"
                  ? "bg-amber-700 text-white font-medium"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              HIGH
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 font-mono border border-dashed border-zinc-200 rounded-lg">
            NO ALERTS MATCHING FILTER CRITERIA.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Alert ID</th>
                  <th className="py-2.5 px-3">Trigger Event</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Model Score</th>
                  <th className="py-2.5 px-3">Release</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Detected Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.alert_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-zinc-950">{alert.alert_id}</td>
                    <td className="py-2.5 px-3 text-zinc-500 max-w-[140px] truncate" title={alert.event_id}>
                      {alert.event_id}
                    </td>
                    <td className="py-2.5 px-3">{getSeverityBadge(alert.severity)}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">
                      {(alert.score * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600">{alert.release_id}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-700 font-medium">{alert.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
