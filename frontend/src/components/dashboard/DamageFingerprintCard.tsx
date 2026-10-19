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
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF]">
              02
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
              Damage Fingerprint &amp; Repair Assessment
            </h2>
          </div>
          <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-7">
            7-dimensional covariate drift, performance damage, and repair vector telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto pl-7 sm:pl-0">
          <Badge
            variant={actionDetails.variant}
            className="text-xs px-3 py-1 font-semibold shadow-2xs"
          >
            {actionDetails.badge}
          </Badge>
        </div>
      </div>

      {/* Decision Reason Callout */}
      <div className="rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] p-3.5 flex items-start gap-3 shadow-2xs">
        <div className="h-6 w-6 rounded-full bg-[#F0EFF4] dark:bg-[#282534] flex items-center justify-center shrink-0 mt-0.5 text-[#25232B] dark:text-[#F2F1F6]">
          <Info className="h-3.5 w-3.5 stroke-[2]" />
        </div>
        <div className="text-xs leading-relaxed text-[#25232B] dark:text-[#F2F1F6]">
          <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] mr-1.5">Decision Rationale:</span>
          <span className="text-[#85818D] dark:text-[#A5A0AF]">{actionDetails.explanation}</span>
        </div>
      </div>

      {/* 7 Dimensions Grid with Big Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. D_X */}
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-4 flex flex-col justify-between hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">Drift (D_X)</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-medium uppercase tracking-wider">covariate</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums group-hover:text-[#E76552] transition-colors">
              {(fp.D_X * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={fp.D_X * 100}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={fp.D_X > 0.15 ? "bg-amber-600" : "bg-[#85818D] dark:bg-[#A5A0AF]"}
            />
            <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-1.5 block">2-sample KS test</span>
          </div>
        </div>

        {/* 2. D_Y */}
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-4 flex flex-col justify-between hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">Damage (D_Y)</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-medium uppercase tracking-wider">recall</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums group-hover:text-red-600 transition-colors">
              {fp.D_Y !== undefined && fp.D_Y !== null ? `${(fp.D_Y * 100).toFixed(1)}%` : "0.0%"}
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={(fp.D_Y || 0) * 100}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={(fp.D_Y || 0) > 0.05 ? "bg-red-600" : "bg-[#85818D] dark:bg-[#A5A0AF]"}
            />
            <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-1.5 block">Accuracy drop</span>
          </div>
        </div>

        {/* 3. D_B */}
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-4 flex flex-col justify-between hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">Boundary (D_B)</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-medium uppercase tracking-wider">margin</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums group-hover:text-sky-600 transition-colors">
              {(fp.D_B * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={fp.D_B * 100}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={fp.D_B > 0.1 ? "bg-sky-600" : "bg-[#85818D] dark:bg-[#A5A0AF]"}
            />
            <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-1.5 block">Threshold margin</span>
          </div>
        </div>

        {/* 4. Q */}
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-4 flex flex-col justify-between hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">Quality (Q)</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">schema</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
              {(fp.Q * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={fp.Q * 100}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName="bg-emerald-600 dark:bg-emerald-500"
            />
            <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-1.5 block">Zero null values</span>
          </div>
        </div>

        {/* 5. L */}
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-4 flex flex-col justify-between hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">Labels (L)</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">freshness</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
              {(fp.L * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={fp.L * 100}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName="bg-emerald-600 dark:bg-emerald-500"
            />
            <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-1.5 block">Confidence score</span>
          </div>
        </div>

        {/* 6. S */}
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-4 flex flex-col justify-between hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">Samples (S)</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-medium uppercase tracking-wider">volume</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
              {fp.S.toLocaleString()}
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={Math.min(100, (fp.S / 2000) * 100)}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName="bg-[#85818D] dark:bg-[#A5A0AF]"
            />
            <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-1.5 block">Window quota</span>
          </div>
        </div>

        {/* 7. R */}
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-4 flex flex-col justify-between hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">Persistence (R)</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-medium uppercase tracking-wider">temporal</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
              {fp.R}
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={Math.min(100, (fp.R / 3) * 100)}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={fp.R >= 2 ? "bg-amber-600" : "bg-emerald-600 dark:bg-emerald-500"}
            />
            <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-1.5 block">Consecutive windows</span>
          </div>
        </div>
      </div>
    </div>
  );
}
