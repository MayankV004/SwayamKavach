"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DamageFingerprint, RepairAction } from "@/types/contracts";

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
          badge: "A0 · NOMINAL MONITORING",
          variant: "success" as const,
          explanation:
            "Covariate drift remains within acceptable safety margin. Zero compute or labeling cost consumed.",
        };
      case "A1":
        return {
          badge: "A1 · THRESHOLD CALIBRATION",
          variant: "info" as const,
          explanation:
            "Boundary uncertainty shifted. Sub-second threshold recalibration executed without heavy model refit.",
        };
      case "A2":
        return {
          badge: "A2 · TARGETED ADAPTATION",
          variant: "warning" as const,
          explanation:
            "Localized subspace damage isolated to novel attack cluster. Targeted partition retrained.",
        };
      case "A3":
        return {
          badge: "A3 · FULL RETRAINING",
          variant: "destructive" as const,
          explanation:
            "Broad multi-dimensional degradation detected with sufficient high-quality labeled evidence.",
        };
    }
  };

  const actionDetails = getActionDetails(chosenAction);

  return (
    <div className="space-y-4">
      {/* Section Separator Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-900 pb-2.5 gap-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-950">
            {"// 02"}
          </span>
          <h2 className="text-sm font-bold font-mono tracking-wider text-zinc-950 uppercase">
            Damage Fingerprint &amp; Repair Assessment
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-zinc-500 hidden sm:inline">
            7-DIMENSIONAL COVARIATE &amp; REPAIR VECTOR
          </span>
          <Badge
            variant={actionDetails.variant}
            className="font-mono text-xs px-2 py-0.5 rounded-none uppercase font-semibold"
          >
            {actionDetails.badge}
          </Badge>
        </div>
      </div>

      {/* Decision Reason Callout (Borderless, clean rule) */}
      <div className="border-l-2 border-zinc-950 pl-4 py-1 font-mono text-xs text-zinc-700 bg-zinc-50/50">
        <span className="font-bold text-zinc-950 uppercase">[ DECISION REASON ]: </span>
        <span>{actionDetails.explanation}</span>
      </div>

      {/* 6 Dimensions in Open Grid with Hairline Dividers */}
      <div className="border-y border-zinc-200 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-white">
        {/* 1. D_X */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase">Drift (D_X)</span>
              <span className="text-[10px] text-zinc-400">covariate</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-950">
              {(fp.D_X * 100).toFixed(1)}%
            </div>
          </div>
          <Progress
            value={fp.D_X * 100}
            className="h-1 mt-4 rounded-none bg-zinc-100"
            indicatorClassName={fp.D_X > 0.15 ? "bg-amber-600" : "bg-zinc-950"}
          />
        </div>

        {/* 2. D_Y */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase">Damage (D_Y)</span>
              <span className="text-[10px] text-zinc-400">recall drop</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-950">
              {fp.D_Y !== undefined ? `${(fp.D_Y * 100).toFixed(1)}%` : "0.0%"}
            </div>
          </div>
          <Progress
            value={(fp.D_Y || 0) * 100}
            className="h-1 mt-4 rounded-none bg-zinc-100"
            indicatorClassName={(fp.D_Y || 0) > 0.05 ? "bg-red-600" : "bg-zinc-950"}
          />
        </div>

        {/* 3. D_B */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase">Boundary (D_B)</span>
              <span className="text-[10px] text-zinc-400">uncertainty</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-950">
              {(fp.D_B * 100).toFixed(1)}%
            </div>
          </div>
          <Progress
            value={fp.D_B * 100}
            className="h-1 mt-4 rounded-none bg-zinc-100"
            indicatorClassName={fp.D_B > 0.1 ? "bg-blue-600" : "bg-zinc-950"}
          />
        </div>

        {/* 4. Q */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase">Quality (Q)</span>
              <span className="text-[10px] text-zinc-400">schema valid</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-950">
              {(fp.Q * 100).toFixed(1)}%
            </div>
          </div>
          <Progress
            value={fp.Q * 100}
            className="h-1 mt-4 rounded-none bg-zinc-100"
            indicatorClassName="bg-emerald-600"
          />
        </div>

        {/* 5. L */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1 font-mono">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase">Labels (L)</span>
              <span className="text-[10px] text-zinc-400">freshness</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-950">
              {(fp.L * 100).toFixed(1)}%
            </div>
          </div>
          <Progress
            value={fp.L * 100}
            className="h-1 mt-4 rounded-none bg-zinc-100"
            indicatorClassName="bg-emerald-600"
          />
        </div>

        {/* 6. S & R */}
        <div className="p-4 flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-semibold text-zinc-900 uppercase">Samples (S)</span>
              <span className="text-[10px] text-zinc-400">R={fp.R}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-950">
              {fp.S.toLocaleString()}
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 mt-4 uppercase">
            Persistence: {fp.R} windows
          </div>
        </div>
      </div>
    </div>
  );
}
