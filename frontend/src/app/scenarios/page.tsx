"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ScenarioInjectionCard } from "@/components/dashboard/ScenarioInjectionCard";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ScenariosPage() {
  const { runningScenario, scenarioResult, executeScenario, lifecycle } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Simulation Engine and Scenario Result */}
      <ScenarioInjectionCard
        runningScenario={runningScenario}
        scenarioResult={scenarioResult}
        onExecuteScenario={executeScenario}
      />

      {/* Resulting Damage Fingerprint */}
      <div className="space-y-2">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-600">
          {"// Observed Real-Time Damage Assessment"}
        </div>
        <DamageFingerprintCard
          fingerprint={lifecycle.last_fingerprint}
          chosenAction={lifecycle.chosen_action}
        />
      </div>

      {/* Scenario Descriptions & Mathematical Guarantees */}
      <Card className="border-zinc-200 bg-white">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <CardTitle className="text-sm font-bold font-mono">
            [ DARI SCENARIO MATRIX &amp; PROOF OF INVARIANTS ]
          </CardTitle>
          <CardDescription className="font-mono text-[11px]">
            Formal behavior mapping for each simulated traffic drift pattern.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">A0 Nominal (Covariate Drift)</span>
              <p className="text-[11px] text-zinc-600">
                Tests that feature shifts (D_X) with intact accuracy (D_Y ≈ 0) result in Level A0, proving that drift alone does not trigger expensive retraining.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">A1 Boundary Calibration</span>
              <p className="text-[11px] text-zinc-600">
                Tests threshold tuning on probability score distribution shifts (D_B &gt; threshold) without retraining the underlying model estimator.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">A2 Localized Adaptation</span>
              <p className="text-[11px] text-zinc-600">
                Tests subspace isolation for localized attack bursts (e.g. novel port scanning clusters) when evidence is bounded.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">A3 Full Retraining</span>
              <p className="text-[11px] text-zinc-600">
                Triggered only when broad multi-class performance degradation (D_Y &gt; 0.05) occurs with sufficient high-quality labeled samples (S, Q, L).
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">Gate Rejection Invariant</span>
              <p className="text-[11px] text-zinc-600">
                Verifies that an inferior candidate model that fails statistical acceptance tests is rejected at the gate and never staged into canary.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">Canary Watchdog Invariant</span>
              <p className="text-[11px] text-zinc-600">
                Verifies that an active canary rollout that violates safety constraints in production is immediately aborted with zero traffic loss.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
