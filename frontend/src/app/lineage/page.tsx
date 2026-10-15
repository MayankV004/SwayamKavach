"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";

export default function LineagePage() {
  return (
    <div className="space-y-6">
      {/* MLflow Registry & Action Banner */}
      <Card className="border-zinc-200 bg-white">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                  MLFLOW
                </span>
                <CardTitle className="text-sm font-bold font-mono">
                  MLflow Model Registry &amp; Release Lineage
                </CardTitle>
              </div>
              <CardDescription className="mt-1 font-mono text-[11px]">
                Registered model versions, immutable DVC artifacts, and experiment tracking server.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open(MLFLOW_URL, "_blank", "noopener,noreferrer")}
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs"
              >
                OPEN MLFLOW REGISTRY [:5000] ↗
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${BACKEND_ROOT_URL}/docs`, "_blank", "noopener,noreferrer")}
                className="border-zinc-300 hover:bg-zinc-100 text-zinc-900 font-mono text-xs"
              >
                API DOCS [:8000] ↗
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 font-mono text-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="text-zinc-500 text-[11px]">Registered Model</div>
              <div className="text-sm font-bold text-zinc-950 mt-1">swayamkavach_ids</div>
              <div className="text-[10px] text-zinc-400 mt-1">Registry Name</div>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="text-zinc-500 text-[11px]">Active Alias</div>
              <div className="text-sm font-bold text-zinc-950 mt-1">champion</div>
              <div className="text-[10px] text-emerald-700 mt-1 font-semibold">Pointing to Version 1</div>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="text-zinc-500 text-[11px]">Tracking URI</div>
              <div className="text-sm font-bold text-zinc-950 mt-1 truncate">sqlite:///mlflow.db</div>
              <div className="text-[10px] text-zinc-400 mt-1">Local persistent store</div>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="text-zinc-500 text-[11px]">Model Class</div>
              <div className="text-sm font-bold text-zinc-950 mt-1">HistGradientBoosting</div>
              <div className="text-[10px] text-zinc-400 mt-1">Scikit-learn pipeline</div>
            </div>
          </div>

          {/* Cryptographic Artifact Hashes */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
            <div className="font-bold text-zinc-950 border-b border-zinc-200 pb-1.5">
              [ CRYPTOGRAPHIC AUDIT CHECKSUMS &amp; PROVENANCE ]
            </div>
            <div className="text-[11px] text-zinc-600 space-y-1">
              <div>
                <span className="text-zinc-500">Release ID: </span>
                <span className="text-zinc-900 font-semibold">R1</span>
              </div>
              <div>
                <span className="text-zinc-500">Bundle SHA-256: </span>
                <span className="text-zinc-900 break-all">3639259c6fcc97ab90b13384fc9d44ce81cad8a34a0d9fcd3eaffab7fe1e6f39</span>
              </div>
              <div>
                <span className="text-zinc-500">Dataset Split Manifest: </span>
                <span className="text-zinc-900">manifests/splits/split_manifest_v1.json (147,730 training samples)</span>
              </div>
              <div>
                <span className="text-zinc-500">Optimal Decision Threshold: </span>
                <span className="text-zinc-900 font-semibold">0.4200 (Precision-recall calibrated)</span>
              </div>
            </div>
          </div>

          {/* Sealed Holdout Test Scores */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50">
            <div className="font-bold text-zinc-950 mb-3 border-b border-zinc-200 pb-1.5">
              [ SEALED HOLDOUT TEST SET PERFORMANCE ]
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded bg-white border border-zinc-200">
                <div className="text-zinc-500 text-[10px]">Test Accuracy</div>
                <div className="text-zinc-950 font-bold text-base mt-0.5">99.66%</div>
              </div>
              <div className="p-2.5 rounded bg-white border border-zinc-200">
                <div className="text-zinc-500 text-[10px]">Test Recall</div>
                <div className="text-zinc-950 font-bold text-base mt-0.5">99.78%</div>
              </div>
              <div className="p-2.5 rounded bg-white border border-zinc-200">
                <div className="text-zinc-500 text-[10px]">Test F1 Score</div>
                <div className="text-zinc-950 font-bold text-base mt-0.5">0.9978</div>
              </div>
              <div className="p-2.5 rounded bg-white border border-zinc-200">
                <div className="text-zinc-500 text-[10px]">False Alarm (FPR)</div>
                <div className="text-emerald-700 font-bold text-base mt-0.5">0.73%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DARI Architectural Invariants */}
      <Card className="border-zinc-200 bg-white">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <CardTitle className="text-sm font-bold font-mono">
            [ DARI CORE ARCHITECTURAL INVARIANTS ]
          </CardTitle>
          <CardDescription className="font-mono text-[11px]">
            Formal system constraints enforced across the MLOps lifecycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 font-mono text-xs space-y-3">
          <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
            <span className="font-bold text-zinc-950">Invariant 1: Drift Separation</span>
            <p className="text-[11px] text-zinc-600">
              Distribution drift (D_X) alone must NEVER trigger Level A3 full model retraining. When security recall (D_Y) remains uncompromised, system persists in Level A0 (nominal monitoring).
            </p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
            <span className="font-bold text-zinc-950">Invariant 2: Lowest Feasible Intervention Ladder</span>
            <p className="text-[11px] text-zinc-600">
              DARI always selects the lowest intervention rung (A0 → A1 → A2 → A3) that satisfies security bounds. Hard constraints filter infeasible actions before utility scoring.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
            <span className="font-bold text-zinc-950">Invariant 3: Zero Promotion Without Statistical Acceptance</span>
            <p className="text-[11px] text-zinc-600">
              No candidate model is promoted simply because training completed. Candidates must pass statistical superiority and critical-class recall tests on held-out splits.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
            <span className="font-bold text-zinc-950">Invariant 4: Dual-Slot Canary &amp; Warm Rollback</span>
            <p className="text-[11px] text-zinc-600">
              The previous champion model remains warm in its serving slot throughout canary evaluation. Any SLA breach or watchdog alarm executes an immediate 0-downtime rollback.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
