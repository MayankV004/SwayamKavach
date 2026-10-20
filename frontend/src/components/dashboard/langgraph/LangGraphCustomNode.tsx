"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Activity,
  Zap,
  Cpu,
  ShieldCheck,
  RotateCcw,
  GitFork,
  Database,
  CheckCircle2,
  XCircle,
  Play,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CustomNodeData {
  nodeId: string;
  title: string;
  subtitle: string;
  category: string;
  status: "idle" | "running" | "completed" | "failed" | "skipped" | "active";
  actionBadge?: string;
  telemetryNote?: string;
}

function renderNodeIcon(nodeId: string, className: string = "h-3.5 w-3.5") {
  switch (nodeId) {
    case "start":
      return <Play className={className} />;
    case "monitor":
      return <Activity className={className} />;
    case "damage":
      return <Zap className={className} />;
    case "selector":
      return <Cpu className={className} />;
    case "calibrate":
      return <RotateCcw className={className} />;
    case "adapt":
      return <GitFork className={className} />;
    case "retrain":
      return <Terminal className={className} />;
    case "evaluate_candidate":
      return <ShieldCheck className={className} />;
    case "canary_dispatch":
      return <GitFork className={className} />;
    case "audit":
      return <Database className={className} />;
    case "end":
      return <CheckCircle2 className={className} />;
    default:
      return <Activity className={className} />;
  }
}

function renderStatusBadge(status: CustomNodeData["status"]) {
  switch (status) {
    case "active":
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-[#E76552] dark:text-[#E76552] uppercase px-1.5 py-0.5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/10 border border-[#E76552]/30">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E76552] animate-ping" />
          ACTIVE
        </span>
      );
    case "running":
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          RUNNING
        </span>
      );
    case "completed":
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-2.5 w-2.5" />
          DONE
        </span>
      );
    case "failed":
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-red-700 dark:text-red-400 uppercase px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800">
          <XCircle className="h-2.5 w-2.5" />
          BLOCKED
        </span>
      );
    case "skipped":
      return (
        <span className="text-[9px] font-medium text-[#85818D] dark:text-[#A5A0AF] uppercase px-1.5 py-0.5 rounded-full bg-[#F5F4F7] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534]">
          SKIPPED
        </span>
      );
    case "idle":
    default:
      return (
        <span className="text-[9px] font-medium text-[#85818D] dark:text-[#A5A0AF] uppercase px-1.5 py-0.5 rounded-full bg-[#F5F4F7] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534]">
          READY
        </span>
      );
  }
}

export function LangGraphCustomNode({
  data,
  selected,
}: {
  data: CustomNodeData;
  selected?: boolean;
}) {
  // Node category border accent
  const getCategoryStyles = () => {
    if (data.status === "active") {
      return "border-[#E76552] ring-2 ring-[#E76552]/20 shadow-md";
    }
    if (data.status === "failed") {
      return "border-red-500 ring-2 ring-red-500/20";
    }
    if (selected) {
      return "border-[#E76552] ring-2 ring-[#E76552]/30 shadow-subtle";
    }
    switch (data.category) {
      case "entry":
      case "terminal":
        return "border-[#D5D2DA] dark:border-[#3E3A4D]";
      case "diagnosis":
        return "border-sky-500/40 dark:border-sky-500/30";
      case "decision":
        return "border-amber-500/40 dark:border-amber-500/30";
      case "repair":
        return "border-purple-500/40 dark:border-purple-500/30";
      case "validation":
        return "border-emerald-500/40 dark:border-emerald-500/30";
      case "deployment":
        return "border-[#E76552]/40 dark:border-[#E76552]/30";
      default:
        return "border-[#EAE7ED] dark:border-[#282534]";
    }
  };

  return (
    <div
      className={`w-[220px] rounded-xl border bg-white dark:bg-[#16151D] p-3 shadow-2xs hover:shadow-subtle transition-all cursor-pointer ${getCategoryStyles()}`}
    >
      {/* Target Handle on Top */}
      {data.nodeId !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2.5 !w-2.5 !border-2 !border-white dark:!border-[#16151D] !bg-[#85818D] dark:!bg-[#A5A0AF]"
        />
      )}

      {/* Top Header: Badge & Status */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        {data.actionBadge ? (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 font-bold border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[#25232B] dark:text-[#F2F1F6]"
          >
            {data.actionBadge}
          </Badge>
        ) : (
          <span />
        )}
        {renderStatusBadge(data.status)}
      </div>

      {/* Node Title & Icon */}
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-lg text-white shrink-0 ${
            data.status === "active"
              ? "bg-[#E76552]"
              : data.status === "completed"
              ? "bg-emerald-600 dark:bg-emerald-500"
              : data.status === "failed"
              ? "bg-red-600"
              : "bg-[#85818D] dark:bg-[#3E3A4D]"
          }`}
        >
          {renderNodeIcon(data.nodeId)}
        </span>
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] truncate">
            {data.title}
          </div>
          <div className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] truncate font-medium">
            {data.subtitle}
          </div>
        </div>
      </div>

      {/* Live Telemetry Note if available */}
      {data.telemetryNote && (
        <div className="mt-2 pt-1.5 border-t border-[#F0EFF4] dark:border-[#282534] text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
          {data.telemetryNote}
        </div>
      )}

      {/* Source Handle on Bottom */}
      {data.nodeId !== "end" && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2.5 !w-2.5 !border-2 !border-white dark:!border-[#16151D] !bg-[#85818D] dark:!bg-[#A5A0AF]"
        />
      )}
    </div>
  );
}
