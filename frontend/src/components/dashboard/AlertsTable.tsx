"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertRecord } from "@/types/contracts";
import { Filter, ShieldAlert } from "lucide-react";

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
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold px-2.5 py-0.5">Critical</Badge>;
      case "high":
        return <Badge variant="warning" className="text-[10px] uppercase font-bold px-2.5 py-0.5">High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-[10px] uppercase font-medium px-2.5 py-0.5">Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-medium px-2.5 py-0.5 border-[#EAE7ED] dark:border-[#282534] text-[#85818D] dark:text-[#A5A0AF]">Low</Badge>;
    }
  };

  return (
    <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
      <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                <ShieldAlert className="h-3.5 w-3.5 text-white" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Security Intrusion Alert Feed
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
              Live advisory detections committed by the inference consumer from incoming network flows
            </CardDescription>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs p-1 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] border border-[#EAE7ED] dark:border-[#282534]">
            <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium px-2 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Filter:</span>
            </span>
            <button
              onClick={() => setSeverityFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                severityFilter === "all"
                  ? "bg-[#E76552] text-white shadow-coral-soft font-semibold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setSeverityFilter("critical")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                severityFilter === "critical"
                  ? "bg-red-700 text-white shadow-xs font-semibold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter("high")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                severityFilter === "high"
                  ? "bg-amber-700 text-white shadow-xs font-semibold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              High
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#85818D] dark:text-[#A5A0AF] border border-dashed border-[#EAE7ED] dark:border-[#282534] rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924]/50">
            No incident alerts matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FC] dark:bg-[#1E1B24] border-b border-[#EAE7ED] dark:border-[#282534] text-[11px] font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Trigger Event</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Release</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detected Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFF4] dark:divide-[#282534] text-xs">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.alert_id} className="hover:bg-[#FAF9FC] dark:hover:bg-[#1E1B24]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono text-xs">{alert.alert_id}</td>
                    <td className="py-3 px-4 text-[#85818D] dark:text-[#A5A0AF] max-w-[140px] truncate font-mono text-[11px]" title={alert.event_id}>
                      {alert.event_id}
                    </td>
                    <td className="py-3 px-4">{getSeverityBadge(alert.severity)}</td>
                    <td className="py-3 px-4 font-bold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
                      {(alert.score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-[#85818D] dark:text-[#A5A0AF] font-medium">{alert.release_id}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{alert.status}</span>
                    </td>
                    <td className="py-3 px-4 text-[#85818D] dark:text-[#A5A0AF] font-medium">
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
