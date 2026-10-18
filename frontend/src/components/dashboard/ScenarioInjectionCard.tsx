"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioRunResult } from "@/types/contracts";
import { CheckCircle2 } from "lucide-react";

interface ScenarioInjectionCardProps {
  runningScenario: boolean;
  scenarioResult: ScenarioRunResult | null;
  onExecuteScenario: (scenario: string) => void;
  onClearScenario?: () => void;
}

const SCENARIOS = [
  {
    id: "nominal",
    label: "Nominal Traffic",
    action: "A0 Baseline",
    badgeVariant: "success" as const,
    desc: "Covariate drift within acceptable boundary",
  },
  {
    id: "boundary_shift",
    label: "Boundary Shift",
    action: "A1 Calibrate",
    badgeVariant: "info" as const,
    desc: "Uncertainty increase without structural drop",
  },
  {
    id: "localized_cluster",
    label: "Port Cluster Shift",
    action: "A2 Local",
    badgeVariant: "warning" as const,
    desc: "Novel subspace attack requiring localized repair",
  },
  {
    id: "severe_attack",
    label: "Multi-Class Attack",
    action: "A3 Retrain",
    badgeVariant: "destructive" as const,
    desc: "Broad structural degradation across classes",
  },
  {
    id: "faulty_candidate_rejection",
    label: "Gate Rejection",
    action: "Safety Gate",
    badgeVariant: "outline" as const,
    desc: "Faulty candidate fails statistical acceptance",
  },
  {
    id: "canary_watchdog_rollback",
    label: "Canary Breach",
    action: "Watchdog",
    badgeVariant: "destructive" as const,
    desc: "SLA degradation triggers automatic rollback",
  },
];

export function ScenarioInjectionCard({
  runningScenario,
  scenarioResult,
  onExecuteScenario,
  onClearScenario,
}: ScenarioInjectionCardProps) {
  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardHeader className="pb-4 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                03
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                Streaming Drift &amp; Attack Injection Engine
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-zinc-500 pl-7">
              Inject deterministic traffic scenarios into the DARI decision loop to evaluate self-healing invariants
            </CardDescription>
          </div>
          {runningScenario && (
            <Badge variant="secondary" className="animate-pulse text-xs px-3 py-1 font-semibold self-start sm:self-auto">
              Executing Simulation...
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Scenario buttons grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onExecuteScenario(sc.id)}
              disabled={runningScenario}
              className="p-3.5 text-left rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 hover:shadow-xs disabled:opacity-50 transition-all duration-150 cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-950">
                  {sc.label}
                </span>
                <Badge variant={sc.badgeVariant} className="text-[10px] px-2 py-0.2 font-semibold">
                  {sc.action}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 leading-normal">
                {sc.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Execution Result Terminal / Inspector */}
        {scenarioResult && (
          <div className="rounded-xl border border-zinc-200/90 bg-zinc-950 text-zinc-100 p-5 text-xs space-y-3 animate-fade-in shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  Simulation Result: {scenarioResult.scenario}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500 text-emerald-400 bg-emerald-950/40 text-xs font-semibold px-2.5 py-0.5">
                  Action: {scenarioResult.chosen_action}
                </Badge>
                {onClearScenario && (
                  <button
                    onClick={onClearScenario}
                    className="text-zinc-400 hover:text-white text-[11px] px-2 py-0.5 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="text-zinc-300 text-xs leading-relaxed">
              {scenarioResult.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-850">
              <div className="text-zinc-400">
                Action Rationale: <span className="text-zinc-200 font-medium">{scenarioResult.action_reason}</span>
              </div>
              <div className="text-zinc-400">
                Deployment Decision: <span className="text-emerald-400 font-semibold">{scenarioResult.deployment_action}</span>
              </div>
            </div>

            {scenarioResult.evaluation_verdict && (
              <div className="text-xs text-amber-300 pt-1 font-medium">
                Gate Verdict: {scenarioResult.evaluation_verdict}
              </div>
            )}

            <div className="text-xs text-zinc-500 pt-2 flex items-center justify-between border-t border-zinc-900">
              <span className="text-emerald-400 font-medium">
                Safety Invariants Preserved: {scenarioResult.safety_invariants_preserved ? "Verified (True)" : "Breached (False)"}
              </span>
              <span>Executed at {new Date(scenarioResult.executed_at).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
