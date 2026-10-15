"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioRunResult } from "@/types/contracts";

interface ScenarioInjectionCardProps {
  runningScenario: boolean;
  scenarioResult: ScenarioRunResult | null;
  onExecuteScenario: (scenario: string) => void;
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
}: ScenarioInjectionCardProps) {
  return (
    <Card className="border-zinc-200 bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                SIMULATION
              </span>
              <CardTitle className="text-sm font-bold font-mono">
                Streaming Drift &amp; Attack Injection Engine
              </CardTitle>
            </div>
            <CardDescription className="mt-1 font-mono text-[11px]">
              Inject deterministic traffic scenarios into the DARI decision loop to evaluate self-healing invariants.
            </CardDescription>
          </div>
          {runningScenario && (
            <Badge variant="secondary" className="animate-pulse font-mono text-xs">
              [ EXECUTING... ]
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Scenario buttons grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onExecuteScenario(sc.id)}
              disabled={runningScenario}
              className="p-3 text-left rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-400 disabled:opacity-50 transition-all duration-150 group cursor-pointer text-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold font-mono text-zinc-950">
                  {sc.label}
                </span>
                <Badge variant={sc.badgeVariant} className="text-[9px] px-1 py-0 font-mono">
                  {sc.action}
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 leading-tight">
                {sc.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Execution Result Terminal / Inspector */}
        {scenarioResult && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-100 p-4 font-mono text-xs space-y-2.5 animate-fade-in shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-white">
                &gt; EXECUTION_RESULT: {scenarioResult.scenario}
              </span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-400 bg-emerald-950/40 text-[10px] font-mono">
                ACTION: {scenarioResult.chosen_action}
              </Badge>
            </div>

            <div className="text-zinc-300 text-[11px] leading-relaxed">
              {scenarioResult.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-zinc-850">
              <div className="text-zinc-400">
                Action Reason: <span className="text-zinc-200">{scenarioResult.action_reason}</span>
              </div>
              <div className="text-zinc-400">
                Deployment Action: <span className="text-emerald-400 font-medium">{scenarioResult.deployment_action}</span>
              </div>
            </div>

            {scenarioResult.evaluation_verdict && (
              <div className="text-[11px] text-amber-300 pt-1">
                [ GATE VERDICT ]: {scenarioResult.evaluation_verdict}
              </div>
            )}

            <div className="text-[10px] text-zinc-500 pt-1 flex items-center justify-between border-t border-zinc-900">
              <span className="text-emerald-400">
                Safety Invariants Preserved: {scenarioResult.safety_invariants_preserved ? "TRUE" : "FALSE"}
              </span>
              <span>{new Date(scenarioResult.executed_at).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
