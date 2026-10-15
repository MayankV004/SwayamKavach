"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertRecord } from "@/types/contracts";
import { Filter } from "lucide-react";

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
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold px-2 py-0.5">Critical</Badge>;
      case "high":
        return <Badge variant="warning" className="text-[10px] uppercase font-bold px-2 py-0.5">High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-[10px] uppercase font-medium px-2 py-0.5">Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-medium px-2 py-0.5">Low</Badge>;
    }
  };

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardHeader className="pb-4 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                06
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                Security Intrusion Alert Feed
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-zinc-500 pl-7">
              Live advisory detections committed by the inference consumer from incoming network flows
            </CardDescription>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-zinc-500 text-xs font-medium mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter:</span>
            </span>
            <button
              onClick={() => setSeverityFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                severityFilter === "all"
                  ? "bg-zinc-950 text-white font-semibold"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setSeverityFilter("critical")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                severityFilter === "critical"
                  ? "bg-red-700 text-white font-semibold"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter("high")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                severityFilter === "high"
                  ? "bg-amber-700 text-white font-semibold"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              High
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
            No incident alerts matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200/90 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Trigger Event</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Model Confidence</th>
                  <th className="py-3 px-4">Release</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detected Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.alert_id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-950 font-mono text-xs">{alert.alert_id}</td>
                    <td className="py-3 px-4 text-zinc-500 max-w-[140px] truncate font-mono text-[11px]" title={alert.event_id}>
                      {alert.event_id}
                    </td>
                    <td className="py-3 px-4">{getSeverityBadge(alert.severity)}</td>
                    <td className="py-3 px-4 font-bold text-zinc-900 tabular-nums">
                      {(alert.score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-zinc-600 font-medium">{alert.release_id}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-semibold">{alert.status}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-medium">
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
