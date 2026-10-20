"use client";

import React from "react";
import { LANGGRAPH_NODES_METADATA } from "@/components/dashboard/langgraph/graphData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Shield,
  ArrowRight,
  Clock,
  Wrench,
} from "lucide-react";

interface NodeDetailsPanelProps {
  selectedNodeId: string | null;
  onClose: () => void;
  status?: string;
  telemetryData?: Record<string, unknown>;
}

export function NodeDetailsPanel({
  selectedNodeId,
  onClose,
  status = "ready",
  telemetryData,
}: NodeDetailsPanelProps) {
  if (!selectedNodeId) return null;

  const meta = LANGGRAPH_NODES_METADATA[selectedNodeId];
  if (!meta) return null;

  return (
    <div className="rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-4 shadow-subtle space-y-4 animate-fade-in text-xs">
      {/* Top Header */}
      <div className="flex items-start justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[#25232B] dark:text-[#F2F1F6]">
              {meta.title}
            </h4>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-bold border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]"
            >
              {meta.category}
            </Badge>
          </div>
          <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
            {meta.subtitle}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 rounded-full hover:bg-[#FAF9FC] dark:hover:bg-[#1E1B24] text-[#85818D] dark:text-[#A5A0AF] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Purpose & Description */}
      <div>
        <span className="block font-bold text-[11px] uppercase tracking-wide text-[#85818D] dark:text-[#A5A0AF] mb-1">
          Node Purpose
        </span>
        <p className="text-xs text-[#25232B] dark:text-[#F2F1F6] leading-relaxed">
          {meta.purpose}
        </p>
      </div>

      {/* Strict Security Invariants */}
      <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] mb-1">
          <Shield className="h-3.5 w-3.5" />
          <span>DARI Security Invariant Enforced</span>
        </div>
        <p className="text-[11px] text-[#25232B] dark:text-[#F2F1F6] leading-snug">
          {meta.invariants}
        </p>
      </div>

      {/* Associated Tool / Implementation */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534]">
        <Wrench className="h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF] shrink-0" />
        <div>
          <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">
            Domain Implementation
          </span>
          <span className="font-mono text-xs text-[#25232B] dark:text-[#F2F1F6]">
            {meta.associatedTool}
          </span>
        </div>
      </div>

      {/* State Contracts: Inputs & Outputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-2.5 rounded-lg bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] space-y-1">
          <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">
            Input State Fields
          </span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-[#25232B] dark:text-[#F2F1F6]">
            {meta.inputFields.map((f) => (
              <li key={f} className="truncate">
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-2.5 rounded-lg bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] space-y-1">
          <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">
            Output State Fields
          </span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-[#25232B] dark:text-[#F2F1F6]">
            {meta.outputFields.map((f) => (
              <li key={f} className="truncate">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Routing Conditions */}
      <div>
        <span className="block font-bold text-[10px] uppercase tracking-wide text-[#85818D] dark:text-[#A5A0AF] mb-1">
          Routing &amp; Transitions
        </span>
        <div className="text-[11px] text-[#25232B] dark:text-[#F2F1F6] flex items-center gap-1.5 p-2 rounded-lg bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534]">
          <ArrowRight className="h-3 w-3 text-[#E76552] shrink-0" />
          <span>{meta.routingConditions}</span>
        </div>
      </div>

      {/* Telemetry & Execution Meta */}
      <div className="flex items-center justify-between text-[11px] text-[#85818D] dark:text-[#A5A0AF] pt-2 border-t border-[#F0EFF4] dark:border-[#282534]">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>Est. Latency: <strong className="font-mono text-[#25232B] dark:text-[#F2F1F6]">{meta.defaultDuration}</strong></span>
        </div>
        <div>
          Execution Status:{" "}
          <strong className="uppercase font-bold text-emerald-600 dark:text-emerald-400">
            {status}
          </strong>
        </div>
      </div>

      {/* Live Runtime Telemetry if present */}
      {telemetryData && Object.keys(telemetryData).length > 0 && (
        <div className="p-2.5 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] space-y-1">
          <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">
            Live Node Telemetry
          </span>
          <pre className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto p-1.5 rounded bg-[#FAF9FC] dark:bg-[#1B1924]">
            {JSON.stringify(telemetryData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
