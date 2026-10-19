"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioRunResult } from "@/types/contracts";
import {
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldCheck,
  Activity,
  Cpu,
  Wrench,
} from "lucide-react";

interface ScenarioInjectionCardProps {
  runningScenario: boolean;
  scenarioResult: ScenarioRunResult | null;
  onExecuteScenario: (scenario: string) => void;
  onClearScenario?: () => void;
}

const SCENARIOS = [
  {
    id: "nominal",
    label: "Nominal Stream",
    action: "A0 Baseline",
    badgeVariant: "success" as const,
    subtitle: "Covariate Drift (D_X=0.015, D_Y=0.005)",
    desc: "Feature shift without performance drop. Proves invariant: Drift alone does NOT trigger retraining.",
    highlightColor: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
  },
  {
    id: "boundary_shift",
    label: "Boundary Shift",
    action: "A1 Calibrate",
    badgeVariant: "info" as const,
    subtitle: "Score Ambiguity (D_B=0.480)",
    desc: "Uncertainty around threshold theta. Recalibrates decision threshold in 0.02s without model retrain.",
    highlightColor: "border-sky-200 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40",
  },
  {
    id: "localized_cluster",
    label: "Port Cluster Shift",
    action: "A2 Local",
    badgeVariant: "warning" as const,
    subtitle: "Targeted Cluster (D_Y=0.075, S=1800)",
    desc: "Novel isolated attack cluster. Local subspace adapter repairs targeted region on holdout split.",
    highlightColor: "border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40",
  },
  {
    id: "severe_attack",
    label: "Multi-Class Attack",
    action: "A3 Retrain",
    badgeVariant: "destructive" as const,
    subtitle: "Severe Persistent (D_Y=0.220, R=3)",
    desc: "Persistent structural degradation across attack classes. Triggers full pipeline retraining.",
    highlightColor: "border-red-200 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40",
  },
  {
    id: "faulty_candidate_rejection",
    label: "Gate Rejection",
    action: "Safety Gate",
    badgeVariant: "outline" as const,
    subtitle: "Statistical Rejection (McNemar Fail)",
    desc: "Candidate model regresses attack recall. McNemar test fails and blocks canary staging at the gate.",
    highlightColor: "border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40",
  },
  {
    id: "canary_watchdog_rollback",
    label: "Canary Rollback",
    action: "Watchdog",
    badgeVariant: "destructive" as const,
    subtitle: "SLA Violation at 5% Canary",
    desc: "Candidate container exceeds latency SLA during canary flight. Triggers zero-downtime warm rollback to Slot A.",
    highlightColor: "border-[#E76552]/30 dark:border-[#E76552]/40 bg-[#FDF0EE]/60 dark:bg-[#E76552]/10 hover:bg-[#FDF0EE] dark:hover:bg-[#E76552]/20",
  },
];

export function ScenarioInjectionCard({
  runningScenario,
  scenarioResult,
  onExecuteScenario,
  onClearScenario,
}: ScenarioInjectionCardProps) {
  const activeScenarioId = scenarioResult?.scenario;

  return (
    <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
      <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                <Activity className="h-3.5 w-3.5 text-white" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Deterministic Drift &amp; Attack Injection Engine
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
              Select any scenario below to verify SwayamKavach&apos;s mathematical self-healing invariants across the full DARI lifecycle.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {runningScenario ? (
              <Badge variant="secondary" className="animate-pulse text-xs px-3 py-1 font-semibold">
                Executing Simulation Pipeline...
              </Badge>
            ) : scenarioResult && onClearScenario ? (
              <button
                onClick={onClearScenario}
                className="text-xs font-medium text-[#25232B] dark:text-[#F2F1F6] hover:text-[#E76552] dark:hover:text-[#E76552] px-3 py-1.5 rounded-full border border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] hover:bg-[#EFEFF4] dark:hover:bg-[#282534] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Simulation</span>
              </button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Scenarios 6-card interactive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => onExecuteScenario(sc.id)}
                disabled={runningScenario}
                className={`p-4 text-left rounded-2xl border transition-all duration-150 cursor-pointer space-y-2 relative flex flex-col justify-between ${
                  isSelected
                    ? "border-[#E76552] bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#25232B] dark:text-[#F2F1F6] shadow-sm ring-1 ring-[#E76552]"
                    : `${sc.highlightColor} border-[#EAE7ED] dark:border-[#282534]`
                } disabled:opacity-50`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span
                      className={`font-bold text-xs ${
                        isSelected ? "text-[#E76552] dark:text-[#F7A89B]" : "text-[#25232B] dark:text-[#F2F1F6]"
                      }`}
                    >
                      {sc.label}
                    </span>
                    <Badge
                      variant={sc.badgeVariant}
                      className="text-[10px] px-2 py-0.2 font-semibold shrink-0"
                    >
                      {sc.action}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF]">
                    {sc.subtitle}
                  </div>
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    isSelected ? "text-[#5D5966] dark:text-[#B5B2C0]" : "text-[#85818D] dark:text-[#A5A0AF]"
                  }`}
                >
                  {sc.desc}
                </p>

                <div
                  className={`pt-2 border-t flex items-center justify-between text-[11px] font-semibold ${
                    isSelected
                      ? "border-[#F7C6BF] dark:border-[#E76552]/30 text-[#E76552] dark:text-[#F7A89B]"
                      : "border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]"
                  }`}
                >
                  <span>{isSelected ? "Active Scenario" : "Click to Simulate"}</span>
                  <Play
                    className={`h-3 w-3 fill-current ${
                      isSelected ? "text-[#E76552] dark:text-[#F7A89B]" : "text-[#85818D] dark:text-[#A5A0AF]"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Real-Time Scenario Execution Breakdown (Visual Multi-Step Audit) */}
        {scenarioResult && (
          <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[#25232B] dark:text-[#F2F1F6] p-5 space-y-4 animate-fade-in shadow-2xs text-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EAE7ED] dark:border-[#282534] gap-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">
                      Executed: {scenarioResult.scenario}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold px-2.5 py-0.5"
                    >
                      Action: {scenarioResult.chosen_action}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                    {scenarioResult.description}
                  </p>
                </div>
              </div>

              {onClearScenario && (
                <button
                  onClick={onClearScenario}
                  className="self-start sm:self-auto text-xs font-medium px-3 py-1 rounded-full border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#201D2A] text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#282534] transition-colors cursor-pointer"
                >
                  Clear Simulation
                </button>
              )}
            </div>

            {/* 4-Column Timeline Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] font-semibold text-[11px]">
                  <Activity className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>1. Injected Damage</span>
                </div>
                <div className="text-[#25232B] dark:text-[#F2F1F6] text-xs font-mono">
                  D_X: {scenarioResult.fingerprint.D_X.toFixed(3)}
                  <br />
                  D_Y: {scenarioResult.fingerprint.D_Y != null ? Number(scenarioResult.fingerprint.D_Y).toFixed(3) : "None (Unlabelled)"}
                  <br />
                  D_B: {scenarioResult.fingerprint.D_B.toFixed(3)}
                  <br />
                  R: {scenarioResult.fingerprint.R} window(s)
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] font-semibold text-[11px]">
                  <Cpu className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>2. DARI Optimization</span>
                </div>
                <div className="text-[#25232B] dark:text-[#F2F1F6] text-xs">
                  <span className="text-[#E76552] font-bold block mb-1">
                    Chosen: {scenarioResult.chosen_action}
                  </span>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] line-clamp-3 leading-relaxed">
                    {scenarioResult.action_reason}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] font-semibold text-[11px]">
                  <Wrench className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>3. Repair Action</span>
                </div>
                <div className="text-[#25232B] dark:text-[#F2F1F6] text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-1">
                    {scenarioResult.deployment_action}
                  </span>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] block">
                    Compute: {String(scenarioResult.details?.compute_consumed_seconds ?? "0.00")}s
                  </span>
                  {scenarioResult.evaluation_verdict && (
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
                      Verdict: {scenarioResult.evaluation_verdict}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] font-semibold text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>4. Invariant Preserved</span>
                </div>
                <div className="text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                    {scenarioResult.safety_invariants_preserved ? "Verified (True)" : "Breached (False)"}
                  </span>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] block leading-relaxed">
                    Closed-loop safety boundaries respected end-to-end.
                  </span>
                </div>
              </div>
            </div>

            {/* Footer timestamp */}
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] pt-2 border-t border-[#EAE7ED] dark:border-[#282534] flex items-center justify-between">
              <span>Synchronized with Overview, Canary, and Lineage workspaces</span>
              <span>Executed at {new Date(scenarioResult.executed_at).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
