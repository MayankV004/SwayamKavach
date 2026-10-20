"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

export function GraphLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-white/90 dark:bg-[#16151D]/90 backdrop-blur-sm p-3 text-xs shadow-subtle transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full font-bold text-xs text-[#25232B] dark:text-[#F2F1F6] cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-[#E76552]" />
          <span>Workflow Legend &amp; Node Semantics</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF]" />}
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-[#F0EFF4] dark:border-[#282534] space-y-3 animate-fade-in">
          {/* Node Types */}
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF] mb-1.5">
              Node Classification
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
                <span>Diagnosis (D_X, D_B, Q)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span>DARI Solver (A0–A3)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-purple-500" />
                <span>Remediation Tiers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span>Non-Regression Gate</span>
              </div>
            </div>
          </div>

          {/* Execution Statuses */}
          <div>
            <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF] mb-1.5">
              Execution Status
            </span>
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-semibold">
                DONE: Successfully completed
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/10 text-[#E76552] border border-[#E76552]/30 font-semibold">
                ACTIVE: Currently traversing
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 font-semibold">
                BLOCKED: Gate check rejected
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF9FC] dark:bg-[#1B1924] text-[#85818D] dark:text-[#A5A0AF] border border-[#EAE7ED] dark:border-[#282534]">
                SKIPPED: Non-selected tier
              </span>
            </div>
          </div>

          {/* Edge Semantics */}
          <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
            <span className="font-semibold text-[#25232B] dark:text-[#F2F1F6]">Edge Types:</span> Solid arrows indicate deterministic node pipelines; dashed arrows indicate conditional DARI routing branches based on the 7D damage fingerprint.
          </div>
        </div>
      )}
    </div>
  );
}
