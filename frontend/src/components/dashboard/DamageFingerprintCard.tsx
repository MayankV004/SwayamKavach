"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <Card className="border-zinc-200 bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                DARI
              </span>
              <CardTitle className="text-sm font-bold font-mono">
                7-Dimensional Damage Fingerprint
              </CardTitle>
            </div>
            <CardDescription className="mt-1 font-mono text-[11px]">
              Multi-dimensional damage assessment: Drift alone (D_X) does not trigger retraining.
            </CardDescription>
          </div>
          <Badge variant={actionDetails.variant} className="font-mono text-xs px-2.5 py-1 self-start sm:self-auto">
            {actionDetails.badge}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Policy Invariant Explanation Banner */}
        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs mb-4 font-mono">
          <span className="font-semibold text-zinc-900">[ DECISION REASON ]: </span>
          <span className="text-zinc-600">{actionDetails.explanation}</span>
        </div>

        {/* 7-Dimensional Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. D_X */}
          <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="text-[11px] font-mono font-medium">Drift (D_X)</span>
              <span className="text-[10px] font-mono text-zinc-600">covariate</span>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {(fp.D_X * 100).toFixed(1)}%
            </div>
            <Progress
              value={fp.D_X * 100}
              className="h-1.5 mt-2 bg-zinc-100"
              indicatorClassName={fp.D_X > 0.15 ? "bg-amber-600" : "bg-zinc-900"}
            />
          </div>

          {/* 2. D_Y */}
          <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="text-[11px] font-mono font-medium">Damage (D_Y)</span>
              <span className="text-[10px] font-mono text-zinc-600">recall drop</span>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {fp.D_Y !== undefined ? `${(fp.D_Y * 100).toFixed(1)}%` : "0.0%"}
            </div>
            <Progress
              value={(fp.D_Y || 0) * 100}
              className="h-1.5 mt-2 bg-zinc-100"
              indicatorClassName={(fp.D_Y || 0) > 0.05 ? "bg-red-600" : "bg-zinc-900"}
            />
          </div>

          {/* 3. D_B */}
          <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="text-[11px] font-mono font-medium">Boundary (D_B)</span>
              <span className="text-[10px] font-mono text-zinc-600">uncertainty</span>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {(fp.D_B * 100).toFixed(1)}%
            </div>
            <Progress
              value={fp.D_B * 100}
              className="h-1.5 mt-2 bg-zinc-100"
              indicatorClassName={fp.D_B > 0.1 ? "bg-blue-600" : "bg-zinc-900"}
            />
          </div>

          {/* 4. Q */}
          <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="text-[11px] font-mono font-medium">Quality (Q)</span>
              <span className="text-[10px] font-mono text-zinc-600">schema valid</span>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {(fp.Q * 100).toFixed(1)}%
            </div>
            <Progress
              value={fp.Q * 100}
              className="h-1.5 mt-2 bg-zinc-100"
              indicatorClassName="bg-emerald-600"
            />
          </div>

          {/* 5. L */}
          <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="text-[11px] font-mono font-medium">Labels (L)</span>
              <span className="text-[10px] font-mono text-zinc-600">freshness</span>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {(fp.L * 100).toFixed(1)}%
            </div>
            <Progress
              value={fp.L * 100}
              className="h-1.5 mt-2 bg-zinc-100"
              indicatorClassName="bg-emerald-600"
            />
          </div>

          {/* 6. S & R */}
          <div className="p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="text-[11px] font-mono font-medium">Samples (S)</span>
              <span className="text-[10px] font-mono text-zinc-600">R={fp.R}</span>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {fp.S.toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-600 font-mono mt-2">
              Persistence R = {fp.R} windows
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
