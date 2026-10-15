"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ScenarioInjectionCard } from "@/components/dashboard/ScenarioInjectionCard";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, ShieldCheck } from "lucide-react";

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
        <div className="flex items-center gap-2 px-1">
          <Activity className="h-4 w-4 text-zinc-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Observed Real-Time Damage Assessment
          </h3>
        </div>
        <DamageFingerprintCard
          fingerprint={lifecycle.last_fingerprint}
          chosenAction={lifecycle.chosen_action}
        />
      </div>

      {/* Scenario Descriptions & Mathematical Guarantees */}
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-zinc-600" />
            <CardTitle className="text-base font-bold text-zinc-950">
              DARI Scenario Matrix &amp; Mathematical Invariants
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Formal behavior mapping and guarantees for each simulated traffic drift pattern
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
              <span className="font-bold text-zinc-950 text-sm block">A0 Nominal (Covariate Drift)</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Tests that feature shifts (D_X) with intact accuracy (D_Y ≈ 0) result in Level A0, proving that drift alone does not trigger expensive retraining.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
              <span className="font-bold text-zinc-950 text-sm block">A1 Boundary Calibration</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Tests threshold tuning on probability score distribution shifts (D_B &gt; threshold) without retraining the underlying model estimator.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
              <span className="font-bold text-zinc-950 text-sm block">A2 Localized Adaptation</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Tests subspace isolation for localized attack bursts (e.g. novel port scanning clusters) when evidence is bounded.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
              <span className="font-bold text-zinc-950 text-sm block">A3 Full Retraining</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Triggered only when broad multi-class performance degradation (D_Y &gt; 0.05) occurs with sufficient high-quality labeled samples (S, Q, L).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
              <span className="font-bold text-zinc-950 text-sm block">Gate Rejection Invariant</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Verifies that an inferior candidate model that fails statistical acceptance tests is rejected at the gate and never staged into canary.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
              <span className="font-bold text-zinc-950 text-sm block">Canary Watchdog Invariant</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Verifies that an active canary rollout that violates safety constraints in production is immediately aborted with zero traffic loss.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
