"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";
import { ExternalLink, ShieldCheck } from "lucide-react";

export default function LineagePage() {
  return (
    <div className="space-y-6">
      {/* MLflow Registry & Action Banner */}
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardHeader className="pb-4 border-b border-zinc-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                  07
                </span>
                <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                  MLflow Model Registry &amp; Release Lineage
                </CardTitle>
              </div>
              <CardDescription className="mt-1 text-xs text-zinc-500 pl-7">
                Registered model versions, immutable DVC dataset artifacts, and experiment tracking server
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open(MLFLOW_URL, "_blank", "noopener,noreferrer")}
                className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold gap-1.5 h-8.5"
              >
                <span>Open MLflow Registry (:5000)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${BACKEND_ROOT_URL}/docs`, "_blank", "noopener,noreferrer")}
                className="border-zinc-200 hover:bg-zinc-100 text-zinc-900 text-xs font-semibold gap-1.5 h-8.5"
              >
                <span>API Docs (:8000)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 text-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">Registered Model</div>
              <div className="text-base font-bold text-zinc-950 mt-1">swayamkavach_ids</div>
              <div className="text-[11px] text-zinc-400 mt-1">Registry Artifact Name</div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">Active Production Alias</div>
              <div className="text-base font-bold text-zinc-950 mt-1">champion</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Resolved to Version 1</div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">Tracking URI</div>
              <div className="text-base font-bold text-zinc-950 mt-1 truncate font-mono text-xs">sqlite:///mlflow.db</div>
              <div className="text-[11px] text-zinc-400 mt-1">Local persistent SQLite store</div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">Classifier Pipeline</div>
              <div className="text-base font-bold text-zinc-950 mt-1">HistGradientBoosting</div>
              <div className="text-[11px] text-zinc-400 mt-1">Scikit-learn estimator</div>
            </div>
          </div>

          {/* Cryptographic Artifact Hashes */}
          <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-2.5">
            <div className="font-bold text-zinc-950 text-sm border-b border-zinc-200/80 pb-2">
              Cryptographic Audit Checksums &amp; Dataset Provenance
            </div>
            <div className="text-xs text-zinc-600 space-y-1.5 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-zinc-500 font-medium min-w-36">Release Identifier:</span>
                <span className="text-zinc-950 font-bold">R1</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="text-zinc-500 font-medium min-w-36">Bundle SHA-256:</span>
                <span className="text-zinc-900 font-mono text-[11px] break-all">3639259c6fcc97ab90b13384fc9d44ce81cad8a34a0d9fcd3eaffab7fe1e6f39</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-zinc-500 font-medium min-w-36">Dataset Split Manifest:</span>
                <span className="text-zinc-900 font-medium">manifests/splits/split_manifest_v1.json (147,730 training samples)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-zinc-500 font-medium min-w-36">Optimal Decision Threshold:</span>
                <span className="text-zinc-950 font-bold">0.4200 (Precision-recall calibrated)</span>
              </div>
            </div>
          </div>

          {/* Sealed Holdout Test Scores with Big Numbers */}
          <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-3">
            <div className="font-bold text-zinc-950 text-sm border-b border-zinc-200/80 pb-2">
              Sealed Holdout Test Set Performance Verification
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-xs">
                <div className="text-zinc-500 text-xs font-medium">Test Accuracy</div>
                <div className="text-3xl lg:text-4xl font-extrabold text-zinc-950 mt-1 tabular-nums">99.66%</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-xs">
                <div className="text-zinc-500 text-xs font-medium">Test Recall</div>
                <div className="text-3xl lg:text-4xl font-extrabold text-zinc-950 mt-1 tabular-nums">99.78%</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-xs">
                <div className="text-zinc-500 text-xs font-medium">Test F1 Score</div>
                <div className="text-3xl lg:text-4xl font-extrabold text-zinc-950 mt-1 tabular-nums">0.9978</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-xs">
                <div className="text-zinc-500 text-xs font-medium">False Alarm (FPR)</div>
                <div className="text-3xl lg:text-4xl font-extrabold text-emerald-700 mt-1 tabular-nums">0.73%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DARI Architectural Invariants */}
      <Card className="border-zinc-200/90 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-zinc-600" />
            <CardTitle className="text-base font-bold text-zinc-950">
              DARI Core Architectural Invariants
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Formal system constraints enforced across the adaptive MLOps lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs space-y-3">
          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1">
            <span className="font-bold text-zinc-950 text-sm block">Invariant 1: Drift Separation</span>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Distribution drift (D_X) alone must NEVER trigger Level A3 full model retraining. When security recall (D_Y) remains uncompromised, system persists in Level A0 (nominal monitoring).
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1">
            <span className="font-bold text-zinc-950 text-sm block">Invariant 2: Lowest Feasible Intervention Ladder</span>
            <p className="text-xs text-zinc-600 leading-relaxed">
              DARI always selects the lowest intervention rung (A0 → A1 → A2 → A3) that satisfies security bounds. Hard constraints filter infeasible actions before utility scoring.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1">
            <span className="font-bold text-zinc-950 text-sm block">Invariant 3: Zero Promotion Without Statistical Acceptance</span>
            <p className="text-xs text-zinc-600 leading-relaxed">
              No candidate model is promoted simply because training completed. Candidates must pass statistical superiority and critical-class recall tests on held-out splits.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1">
            <span className="font-bold text-zinc-950 text-sm block">Invariant 4: Dual-Slot Canary &amp; Warm Rollback</span>
            <p className="text-xs text-zinc-600 leading-relaxed">
              The previous champion model remains warm in its serving slot throughout canary evaluation. Any SLA breach or watchdog alarm executes an immediate 0-downtime rollback.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
