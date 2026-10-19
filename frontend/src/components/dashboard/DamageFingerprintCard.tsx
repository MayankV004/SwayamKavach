"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DamageFingerprint, RepairAction } from "@/types/contracts";
import { Activity, Info, ShieldCheck } from "lucide-react";

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
          colorClass: "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40",
          accentColor: "emerald",
        };
      case "A1":
        return {
          badge: "A1 · Threshold Calibration",
          variant: "info" as const,
          explanation:
            "Boundary uncertainty shifted. Sub-second threshold recalibration executed without heavy model refit.",
          colorClass: "text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40",
          accentColor: "sky",
        };
      case "A2":
        return {
          badge: "A2 · Targeted Adaptation",
          variant: "warning" as const,
          explanation:
            "Localized subspace damage isolated to novel attack cluster. Targeted partition retrained.",
          colorClass: "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
          accentColor: "amber",
        };
      case "A3":
        return {
          badge: "A3 · Full Retraining",
          variant: "destructive" as const,
          explanation:
            "Broad multi-dimensional degradation detected with sufficient high-quality labeled evidence.",
          colorClass: "text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40",
          accentColor: "rose",
        };
    }
  };

  const actionDetails = getActionDetails(chosenAction);

  // Status helpers for 7D signals
  const dxAlert = fp.D_X > 0.05;
  const dyAlert = (fp.D_Y || 0) > 0.02;
  const dbAlert = fp.D_B > 0.10;
  const qHealthy = fp.Q >= 0.95;
  const lHealthy = fp.L >= 0.90;
  const sHealthy = fp.S >= 1000;
  const rPersistent = fp.R >= 2;

  const TIERS = [
    {
      key: "A0",
      name: "A0: Nominal Monitor",
      desc: "0 compute · Continuous inference",
      activeBorder: "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
    {
      key: "A1",
      name: "A1: Calibrate Margin",
      desc: "< 1s latency · Threshold recalibration",
      activeBorder: "border-sky-500/60 bg-sky-500/10 text-sky-800 dark:text-sky-300",
      dot: "bg-sky-500",
    },
    {
      key: "A2",
      name: "A2: Adapt Subspace",
      desc: "Targeted partition retraining",
      activeBorder: "border-amber-500/60 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      dot: "bg-amber-500",
    },
    {
      key: "A3",
      name: "A3: Full Retrain",
      desc: "Broad repair · Complete refit",
      activeBorder: "border-rose-500/60 bg-rose-500/10 text-rose-800 dark:text-rose-300",
      dot: "bg-rose-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-5 animate-fade-up">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 flex items-center justify-center text-[#E76552] border border-[#F7C6BF]/40 dark:border-[#E76552]/30 shadow-2xs shrink-0">
            <Activity className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Damage Fingerprint &amp; Repair Vector Telemetry
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-beacon" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
              Continuous 7-dimensional damage estimation &amp; damage-aware repair (DARI) policy ladder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className={`text-xs px-3 py-1 font-bold shadow-2xs ${actionDetails.colorClass}`}
          >
            {actionDetails.badge}
          </Badge>
        </div>
      </div>

      {/* DARI Policy Action Ladder */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider px-0.5">
          <span>DARI Intervention Ladder</span>
          <span>Lowest Feasible Action Principle</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TIERS.map((tier) => {
            const isCurrent = chosenAction === tier.key;
            return (
              <div
                key={tier.key}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? `${tier.activeBorder} shadow-2xs ring-1 ring-[#E76552]/20 font-bold`
                    : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[#85818D] dark:text-[#A5A0AF] opacity-75"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{tier.name}</span>
                  {isCurrent ? (
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tier.dot}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${tier.dot}`} />
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D5D2DA] dark:bg-[#3E3A4D]" />
                  )}
                </div>
                <p className="text-[11px] mt-1 text-[#85818D] dark:text-[#A5A0AF] font-normal leading-tight">
                  {tier.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Rationale Callout Banner */}
      <div className="rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] border-l-4 border-l-[#E76552] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-[#E76552] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[#25232B] dark:text-[#F2F1F6]">
            <strong className="text-[#25232B] dark:text-[#F2F1F6] mr-1.5">Decision Policy Rationale:</strong>
            <span className="text-[#85818D] dark:text-[#A5A0AF]">{actionDetails.explanation}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>SLA Guardrails Preserved</span>
          </span>
        </div>
      </div>

      {/* 7 Dimensions Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. D_X (Distribution Damage) */}
        <div className="interactive-card rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono">D_X</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-semibold uppercase tracking-wider">covariate</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums transition-colors ${
              dxAlert ? "text-amber-600 dark:text-amber-400" : "text-[#25232B] dark:text-[#F2F1F6] group-hover:text-[#E76552]"
            }`}>
              {(fp.D_X * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={Math.min(100, fp.D_X * 100 * 5)}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={dxAlert ? "bg-amber-500" : "bg-[#85818D] dark:bg-[#A5A0AF]"}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>2-sample KS</span>
              <span className={`font-semibold ${dxAlert ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {dxAlert ? "Drift" : "Nominal"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. D_Y (Performance Damage) */}
        <div className="interactive-card rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono">D_Y</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-semibold uppercase tracking-wider">recall</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums transition-colors ${
              dyAlert ? "text-rose-600 dark:text-rose-400" : "text-[#25232B] dark:text-[#F2F1F6] group-hover:text-rose-600"
            }`}>
              {fp.D_Y !== undefined && fp.D_Y !== null ? `${(fp.D_Y * 100).toFixed(1)}%` : "0.0%"}
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={Math.min(100, (fp.D_Y || 0) * 100 * 10)}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={dyAlert ? "bg-rose-500" : "bg-[#85818D] dark:bg-[#A5A0AF]"}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>Accuracy drop</span>
              <span className={`font-semibold ${dyAlert ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {dyAlert ? "Degraded" : "Intact"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. D_B (Boundary Uncertainty) */}
        <div className="interactive-card rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono">D_B</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-semibold uppercase tracking-wider">margin</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums transition-colors ${
              dbAlert ? "text-sky-600 dark:text-sky-400" : "text-[#25232B] dark:text-[#F2F1F6] group-hover:text-sky-600"
            }`}>
              {(fp.D_B * 100).toFixed(1)}%
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={Math.min(100, fp.D_B * 100 * 4)}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={dbAlert ? "bg-sky-500" : "bg-[#85818D] dark:bg-[#A5A0AF]"}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>Threshold &theta;</span>
              <span className={`font-semibold ${dbAlert ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {dbAlert ? "Shift" : "Calibrated"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Q (Data Quality) */}
        <div className="interactive-card rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono">Q</span>
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
              indicatorClassName={qHealthy ? "bg-emerald-500" : "bg-rose-500"}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>Zero null values</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Valid</span>
            </div>
          </div>
        </div>

        {/* 5. L (Label Reliability) */}
        <div className="interactive-card rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono">L</span>
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
              indicatorClassName={lHealthy ? "bg-emerald-500" : "bg-amber-500"}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>Confidence</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
            </div>
          </div>
        </div>

        {/* 6. S (Sample Sufficiency) */}
        <div className="interactive-card rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono">S</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-semibold uppercase tracking-wider">volume</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
              {fp.S.toLocaleString()}
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={Math.min(100, (fp.S / 2000) * 100)}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={sHealthy ? "bg-emerald-500" : "bg-[#85818D] dark:bg-[#A5A0AF]"}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>Window quota</span>
              <span className={`font-semibold ${sHealthy ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                {sHealthy ? "Sufficient" : "Low"}
              </span>
            </div>
          </div>
        </div>

        {/* 7. R (Temporal Persistence) */}
        <div className="interactive-card rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs group">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] font-mono">R</span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-semibold uppercase tracking-wider">temporal</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
              rPersistent ? "text-amber-600 dark:text-amber-400" : "text-[#25232B] dark:text-[#F2F1F6]"
            }`}>
              {fp.R}
            </div>
          </div>
          <div className="mt-3">
            <Progress
              value={Math.min(100, (fp.R / 3) * 100)}
              className="h-1.5 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden"
              indicatorClassName={rPersistent ? "bg-amber-500" : "bg-emerald-500"}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>Consecutive</span>
              <span className={`font-semibold ${rPersistent ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {rPersistent ? "Persistent" : "Transient"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

