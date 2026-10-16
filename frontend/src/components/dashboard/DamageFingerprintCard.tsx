"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DamageFingerprint, RepairAction } from "@/types/contracts";
import { Info } from "lucide-react";

interface DamageFingerprintCardProps {
  fingerprint?: DamageFingerprint;
  chosenAction?: RepairAction;
}

export function DamageFingerprintCard({
  fingerprint,
  chosenAction = "A0",
}: DamageFingerprintCardProps) {
  const fp: DamageFingerprint = fingerprint || {
    D_X: 0.012,
    D_Y: 0.008,
    D_B: 0.045,
    Q: 0.999,
    L: 0.985,
    S: 2000,
    R: 1,
  };

  const getActionDetails = (action: RepairAction) => {
    switch (action) {
      case "A0":
        return {
          badge: "A0 · Nominal Monitoring",
          variant: "success" as const,
          explanation:
            "Covariate drift remains within acceptable safety margins. Zero compute or labeling cost consumed.",
        };
      case "A1":
        return {
          badge: "A1 · Threshold Calibration",
          variant: "info" as const,
          explanation:
            "Boundary uncertainty shifted. Sub-second threshold recalibration executed without heavy model refit.",
        };
      case "A2":
        return {
          badge: "A2 · Targeted Adaptation",
          variant: "warning" as const,
          explanation:
            "Localized subspace damage isolated to novel attack cluster. Targeted partition retrained.",
        };
      case "A3":
        return {
          badge: "A3 · Full Retraining",
          variant: "destructive" as const,
          explanation:
            "Broad multi-dimensional degradation detected with sufficient high-quality labeled evidence.",
        };
    }
  };

  const actionDetails = getActionDetails(chosenAction);

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
              02
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
              Damage Fingerprint &amp; Repair Assessment
            </h2>
          </div>
          <p className="text-xs text-zinc-500 pl-7">
            7-dimensional covariate drift, performance damage, and repair vector telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto pl-7 sm:pl-0">
          <Badge
            variant={actionDetails.variant}
            className="text-xs px-3 py-1 font-semibold"
          >
            {actionDetails.badge}
          </Badge>
        </div>
      </div>

      {/* Decision Reason Callout */}
      <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 p-3.5 flex items-start gap-3">
        <Info className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-zinc-700">
          <span className="font-bold text-zinc-950 mr-1.5">Decision Rationale:</span>
          <span>{actionDetails.explanation}</span>
        </div>
      </div>

      {/* 7 Dimensions Grid with Big Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. D_X */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-4 flex flex-col justify-between hover:bg-zinc-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-900">Drift (D_X)</span>
              <span className="text-[10px] text-zinc-400 font-medium">covariate</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {(fp.D_X * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={fp.D_X * 100}
              className="h-1.5 bg-zinc-200/80 rounded-full"
              indicatorClassName={fp.D_X > 0.15 ? "bg-amber-600" : "bg-zinc-950"}
            />
            <span className="text-[10px] text-zinc-400 mt-1.5 block">Kolmogorov-Smirnov</span>
          </div>
        </div>

        {/* 2. D_Y */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-4 flex flex-col justify-between hover:bg-zinc-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-900">Damage (D_Y)</span>
              <span className="text-[10px] text-zinc-400 font-medium">recall drop</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {fp.D_Y !== undefined ? `${(fp.D_Y * 100).toFixed(1)}%` : "0.0%"}
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={(fp.D_Y || 0) * 100}
              className="h-1.5 bg-zinc-200/80 rounded-full"
              indicatorClassName={(fp.D_Y || 0) > 0.05 ? "bg-red-600" : "bg-zinc-950"}
            />
            <span className="text-[10px] text-zinc-400 mt-1.5 block">Accuracy drop</span>
          </div>
        </div>

        {/* 3. D_B */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-4 flex flex-col justify-between hover:bg-zinc-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-900">Boundary (D_B)</span>
              <span className="text-[10px] text-zinc-400 font-medium">uncertainty</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {(fp.D_B * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={fp.D_B * 100}
              className="h-1.5 bg-zinc-200/80 rounded-full"
              indicatorClassName={fp.D_B > 0.1 ? "bg-blue-600" : "bg-zinc-950"}
            />
            <span className="text-[10px] text-zinc-400 mt-1.5 block">Threshold margin</span>
          </div>
        </div>

        {/* 4. Q */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-4 flex flex-col justify-between hover:bg-zinc-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-900">Quality (Q)</span>
              <span className="text-[10px] text-zinc-400 font-medium">schema valid</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {(fp.Q * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={fp.Q * 100}
              className="h-1.5 bg-zinc-200/80 rounded-full"
              indicatorClassName="bg-emerald-600"
            />
            <span className="text-[10px] text-zinc-400 mt-1.5 block">Zero null values</span>
          </div>
        </div>

        {/* 5. L */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-4 flex flex-col justify-between hover:bg-zinc-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-900">Labels (L)</span>
              <span className="text-[10px] text-zinc-400 font-medium">freshness</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {(fp.L * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={fp.L * 100}
              className="h-1.5 bg-zinc-200/80 rounded-full"
              indicatorClassName="bg-emerald-600"
            />
            <span className="text-[10px] text-zinc-400 mt-1.5 block">Confidence score</span>
          </div>
        </div>

        {/* 6. S */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-4 flex flex-col justify-between hover:bg-zinc-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-900">Samples (S)</span>
              <span className="text-[10px] text-zinc-400 font-medium">volume</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {fp.S.toLocaleString()}
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={Math.min(100, (fp.S / 2000) * 100)}
              className="h-1.5 bg-zinc-200/80 rounded-full"
              indicatorClassName="bg-zinc-950"
            />
            <span className="text-[10px] text-zinc-400 mt-1.5 block">Window quota</span>
          </div>
        </div>

        {/* 7. R */}
        <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-4 flex flex-col justify-between hover:bg-zinc-50 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-900">Persistence (R)</span>
              <span className="text-[10px] text-zinc-400 font-medium">temporal</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
              {fp.R}
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={Math.min(100, (fp.R / 3) * 100)}
              className="h-1.5 bg-zinc-200/80 rounded-full"
              indicatorClassName={fp.R >= 2 ? "bg-amber-600" : "bg-emerald-600"}
            />
            <span className="text-[10px] text-zinc-400 mt-1.5 block">Consecutive windows</span>
          </div>
        </div>
      </div>
    </div>
  );
}
