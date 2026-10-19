"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScenarioRunResult, DamageFingerprint, RepairAction } from "@/types/contracts";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GitFork,
  Cpu,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface LangGraphDriftVisualizerProps {
  scenarioResult: ScenarioRunResult | null;
  runningScenario: boolean;
  fingerprint: DamageFingerprint;
  chosenAction: RepairAction;
}

export function LangGraphDriftVisualizer({
  scenarioResult,
  runningScenario,
  fingerprint,
  chosenAction,
}: LangGraphDriftVisualizerProps) {
  // Determine state of each node based on active scenarioResult
  const isScenarioActive = !!scenarioResult;
  const isRollback = scenarioResult?.scenario === "canary_watchdog_rollback";
  const isGateReject = scenarioResult?.scenario === "faulty_candidate_rejection";

  const stages = [
    {
      id: "ingest",
      num: "01",
      title: "Stream Ingestion",
      subtitle: isScenarioActive ? `Injected: ${scenarioResult.scenario}` : "TON_IoT 11-feature flow",
      status: runningScenario ? "Processing..." : "Active Stream",
      badgeVariant: "default" as const,
      icon: Activity,
      details: `Sliding Window S=${fingerprint.S}`,
      color: "border-sky-500/30 bg-sky-50/30 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300",
    },
    {
      id: "detect",
      num: "02",
      title: "Drift Detection",
      subtitle: `KS-Test D_X = ${(fingerprint.D_X * 100).toFixed(1)}%`,
      status: fingerprint.D_X > 0.05 ? "Drift Detected" : "Nominal Stability",
      badgeVariant: fingerprint.D_X > 0.05 ? ("warning" as const) : ("outline" as const),
      icon: Zap,
      details: fingerprint.D_X > 0.05 ? "Covariate shift confirmed" : "Null hypothesis retained",
      color: fingerprint.D_X > 0.05 ? "border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" : "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#85818D] dark:text-[#A5A0AF]",
    },
    {
      id: "diagnose",
      num: "03",
      title: "7D Diagnosis",
      subtitle: `D_Y=${fingerprint.D_Y != null ? (fingerprint.D_Y * 100).toFixed(1) + "%" : "Unlabelled"}`,
      status: "Damage Fingerprint",
      badgeVariant: "outline" as const,
      icon: Sparkles,
      details: `D_B=${fingerprint.D_B.toFixed(2)}, R=${fingerprint.R}, Q=${(fingerprint.Q * 100).toFixed(0)}%`,
      color: "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6]",
    },
    {
      id: "policy",
      num: "04",
      title: "DARI Policy",
      subtitle: `Selected Action: ${chosenAction}`,
      status: chosenAction === "A0" ? "A0 (No Retrain)" : chosenAction === "A1" ? "A1 (Calibrate)" : chosenAction === "A2" ? "A2 (Local)" : "A3 (Retrain)",
      badgeVariant: chosenAction === "A0" ? ("success" as const) : chosenAction === "A3" ? ("destructive" as const) : ("warning" as const),
      icon: Cpu,
      details: "Cost-damage-risk utility optimization",
      color: chosenAction === "A0" ? "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300" : "border-[#E76552]/30 bg-[#FDF0EE]/40 dark:bg-[#E76552]/10 text-[#E76552]",
    },
    {
      id: "gate",
      num: "05",
      title: "Statistical Gate",
      subtitle: isGateReject ? "McNemar Test FAILED" : "Held-Out Split Validation",
      status: isGateReject ? "Candidate Blocked" : "Verified (PASS)",
      badgeVariant: isGateReject ? ("destructive" as const) : ("success" as const),
      icon: isGateReject ? XCircle : ShieldCheck,
      details: isGateReject ? "Recall regression detected" : "Critical recall ≥ 95.0% enforced",
      color: isGateReject ? "border-purple-500/40 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300" : "border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
    },
    {
      id: "deploy",
      num: "06",
      title: "Serving Dispatch",
      subtitle: isRollback ? "Watchdog SLA Breach" : isGateReject ? "Promotion Blocked" : "Dual-Slot Router",
      status: isRollback ? "Instant Warm Rollback" : isGateReject ? "Retained Champion" : "Candidate Staged",
      badgeVariant: isRollback ? ("destructive" as const) : ("default" as const),
      icon: isRollback ? RotateCcw : GitFork,
      details: isRollback ? "Reverted to Champion in < 1.0s" : "Slot A (:8001) / Slot B (:8002)",
      color: isRollback ? "border-red-500/40 bg-red-50/40 dark:bg-red-950/20 text-red-700 dark:text-red-300" : "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6]",
    },
  ];

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <Cpu className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
              LangGraph Closed-Loop Orchestration
            </h3>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Deterministic state machine tracking drift injection, diagnosis, policy selection, and deployment gates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="text-[10px] font-semibold border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
            {runningScenario ? "Graph Executing..." : isScenarioActive ? "Simulation Synchronized" : "Steady-State Ready"}
          </Badge>
        </div>
      </div>

      {/* Interactive Horizontal Pipeline Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 relative shadow-2xs hover:shadow-subtle ${stage.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#85818D] dark:text-[#A5A0AF]">
                  {stage.num}
                </span>
                <Badge variant={stage.badgeVariant} className="text-[9px] px-1.5 py-0 font-semibold uppercase">
                  {stage.status}
                </Badge>
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{stage.title}</span>
                </div>
                <div className="text-[11px] font-medium text-[#25232B] dark:text-[#F2F1F6] mt-0.5 truncate">
                  {stage.subtitle}
                </div>
              </div>

              <div className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] pt-1 border-t border-[#EAE7ED]/60 dark:border-[#282534] truncate">
                {stage.details}
              </div>

              {idx < stages.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[#85818D] dark:text-[#A5A0AF] pointer-events-none">
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Execution Outcome Callout */}
      {scenarioResult && (
        <div className="rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            {scenarioResult.safety_invariants_preserved ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-[#25232B] dark:text-[#F2F1F6]">
                Execution Rationale:
              </span>{" "}
              <span className="text-[#85818D] dark:text-[#A5A0AF]">{scenarioResult.action_reason}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-medium">
            <span className="text-[#85818D] dark:text-[#A5A0AF]">Deployment:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{scenarioResult.deployment_action}</span>
          </div>
        </div>
      )}
    </div>
  );
}
