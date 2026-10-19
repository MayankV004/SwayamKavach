"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ScenarioInjectionCard } from "@/components/dashboard/ScenarioInjectionCard";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { LangGraphDriftVisualizer } from "@/components/dashboard/LangGraphDriftVisualizer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function ScenariosPage() {
  const {
    runningScenario,
    scenarioResult,
    executeScenario,
    clearScenario,
    effectiveFingerprint,
    effectiveAction,
  } = useDashboard();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {scenarioResult && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs shadow-2xs animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6]">
              Simulation Active: {scenarioResult.scenario}
            </span>
            <Badge variant="outline" className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#16151D] text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
              Action Level: {scenarioResult.chosen_action}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearScenario}
            className="text-xs font-semibold h-7 px-3 rounded-full border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] cursor-pointer gap-1.5 shadow-2xs"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Simulation</span>
          </Button>
        </div>
      )}

      {/* 1. TOP SECTION: 7-DIMENSIONAL DAMAGE FINGERPRINT STATS */}
      <DamageFingerprintCard
        fingerprint={effectiveFingerprint}
        chosenAction={effectiveAction}
      />

      {/* 2. SECOND SECTION: DRIFT INJECTIONS FOR SIMULATION */}
      <ScenarioInjectionCard
        runningScenario={runningScenario}
        scenarioResult={scenarioResult}
        onExecuteScenario={executeScenario}
        onClearScenario={clearScenario}
      />

      {/* 3. THIRD SECTION: LANGGRAPH ORCHESTRATION & DRIFT LIFECYCLE VISUALIZATION */}
      <LangGraphDriftVisualizer
        scenarioResult={scenarioResult}
        runningScenario={runningScenario}
        fingerprint={effectiveFingerprint}
        chosenAction={effectiveAction}
      />
    </div>
  );
}
