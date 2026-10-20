"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { CanaryControllerCard } from "@/components/dashboard/CanaryControllerCard";
import { InteractiveLangGraphFlow } from "@/components/dashboard/langgraph/InteractiveLangGraphFlow";
import { CandidateEvaluationComparisonCard } from "@/components/dashboard/CandidateEvaluationComparisonCard";
import { Badge } from "@/components/ui/badge";
import { Server } from "lucide-react";

export default function CanaryPage() {
  const {
    lifecycle,
    actingCanary,
    canaryActionStatus,
    advanceCanary,
    rollbackCanary,
    resetLifecycle,
    evaluationReport,
    loadingEvaluation,
    runComparison,
  } = useDashboard();

  const isSlotAPrimary = lifecycle.active_slot === "A";
  const slotAIsChamp = isSlotAPrimary;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Dedicated Canary Controller Card */}
      <CanaryControllerCard
        lifecycle={lifecycle}
        actingCanary={actingCanary}
        canaryActionStatus={canaryActionStatus}
        onAdvanceCanary={advanceCanary}
        onRollbackCanary={rollbackCanary}
        onResetLifecycle={resetLifecycle}
      />

      {/* Interactive LangGraph Orchestration & Decision Flow */}
      <InteractiveLangGraphFlow />

      {/* Pre-Promotion Statistical Gate & Non-Regression Evaluation Scoreboard */}
      <CandidateEvaluationComparisonCard
        report={evaluationReport}
        loading={loadingEvaluation}
        onRunComparison={() => runComparison(lifecycle.candidate_release || "R2-candidate")}
      />

      {/* Active Serving Topology & Local Endpoints */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
          <div className="flex items-center gap-2.5">
            <Server className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
            <h3 className="text-sm font-bold text-[#25232B] dark:text-[#F2F1F6]">
              Active Serving Topology &amp; Microservice Endpoints
            </h3>
          </div>
          <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
            Dual-Process Warm
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-[#85818D] dark:text-[#A5A0AF]">
          <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534]">
            <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">
              {slotAIsChamp ? "Primary Slot A (Active)" : "Standby Slot A (Staged)"}
            </span>
            <span className="font-mono font-semibold text-xs text-[#25232B] dark:text-[#F2F1F6] block mt-0.5">http://localhost:8001</span>
            <span className={`block text-[10px] mt-1 font-medium ${slotAIsChamp ? "text-emerald-600 dark:text-emerald-400" : "text-[#85818D] dark:text-[#A5A0AF]"}`}>
              {slotAIsChamp
                ? `Champion Model (${lifecycle.champion_release})`
                : lifecycle.candidate_release
                ? `Candidate (${lifecycle.candidate_release})`
                : "Warm Standby Ready"}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534]">
            <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">
              {!slotAIsChamp ? "Primary Slot B (Active)" : "Standby Slot B (Staged)"}
            </span>
            <span className="font-mono font-semibold text-xs text-[#25232B] dark:text-[#F2F1F6] block mt-0.5">http://localhost:8002</span>
            <span className={`block text-[10px] mt-1 font-medium ${!slotAIsChamp ? "text-emerald-600 dark:text-emerald-400" : "text-[#85818D] dark:text-[#A5A0AF]"}`}>
              {!slotAIsChamp
                ? `Champion Model (${lifecycle.champion_release})`
                : lifecycle.candidate_release
                ? `Candidate (${lifecycle.candidate_release})`
                : "Warm Standby Ready"}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534]">
            <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">Routing Control Plane</span>
            <span className="font-mono font-semibold text-xs text-[#25232B] dark:text-[#F2F1F6] block mt-0.5">http://localhost:8000</span>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Sub-second Routing Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
