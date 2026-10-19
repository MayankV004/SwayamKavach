"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { CanaryControllerCard } from "@/components/dashboard/CanaryControllerCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, Server, Check, GitFork, Gauge } from "lucide-react";

export default function CanaryPage() {
  const { lifecycle, actingCanary, canaryActionStatus, advanceCanary, rollbackCanary } =
    useDashboard();

  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const champPct = 100 - canaryPct;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ASYMMETRIC CANARY HERO COMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left: Signature Coral Accent Panel */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[24px] bg-coral-gradient p-6 sm:p-8 text-white shadow-coral-soft flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/5 blur-xl pointer-events-none" />

          {/* Top Tag & Status */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-semibold tracking-wider uppercase text-white shadow-2xs">
              <GitFork className="h-3.5 w-3.5 fill-current" />
              <span>Dual-Slot Reverse-Proxy Routing</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>Zero-Downtime Standby</span>
            </div>
          </div>

          {/* Core Headline */}
          <div className="relative z-10 space-y-2 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Slot {lifecycle.active_slot} Champion · {canaryPct}% Canary Staged
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-xl leading-relaxed">
              Autonomous canary promotion protocol (5% → 25% → 50% → 100%). Traffic is split across Slot A (:8001) and Slot B (:8002) with sub-second warm rollback.
            </p>
          </div>

          {/* Telemetry Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Champion Slot</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">Slot {lifecycle.active_slot}</span>
              <span className="text-[10px] text-white/75 block">{champPct}% Traffic Share</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Canary Slot</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{canaryPct > 0 ? "Active" : "Standby"}</span>
              <span className="text-[10px] text-white/75 block">{canaryPct}% Traffic Share</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Rollback SLA</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">&lt; 1.0s</span>
              <span className="text-[10px] text-white/75 block">Instant proxy pivot</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Candidate Release</span>
              <span className="text-lg sm:text-xl font-extrabold text-white truncate block">
                {lifecycle.candidate_release || "None"}
              </span>
              <span className="text-[10px] text-white/75 block">Staged revision</span>
            </div>
          </div>
        </div>

        {/* Right: Watchdog Invariants Checklist */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[24px] border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
              <div>
                <h3 className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                  Automated Watchdog Guardrails
                </h3>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                  Automated rollback triggers monitored every 500ms
                </p>
              </div>
              <Badge variant="outline" className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] text-[10px] font-semibold">
                SLA Armed
              </Badge>
            </div>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Critical Attack Recall &ge; 95.0%</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Any missed critical intrusion immediately triggers warm reversion.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">False Alarm Ceiling &le; 1.5x Baseline</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Rollout stops if benign network flows are flagged excessively.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Sub-20ms P99 Inference Latency</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Prevents pipeline buffering and backpressure in high-speed IoT links.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Continuous Dual-Process Warmth</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Both slots maintain hot model weights ready for instant traffic shift.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs">
            <span className="text-[#85818D] dark:text-[#A5A0AF]">Reverse Proxy Status</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 inline-block" />
              FastAPI Dispatcher Active
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Canary Controller Card */}
      <CanaryControllerCard
        lifecycle={lifecycle}
        actingCanary={actingCanary}
        canaryActionStatus={canaryActionStatus}
        onAdvanceCanary={advanceCanary}
        onRollbackCanary={rollbackCanary}
      />

      {/* Automated Watchdog & SLA Guardrails Specification */}
      <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
        <CardHeader className="pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
            <CardTitle className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
              Automated Watchdog &amp; SLA Guardrail Specifications
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
            Mathematical invariants enforced continuously by the proxy watchdog to guarantee zero-downtime warm rollback
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-red-900 dark:text-red-300 font-bold">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>Critical Class Recall Invariant</span>
              </div>
              <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                If the candidate model misses more than 1% of critical security attack classes (e.g. Backdoor, Injection, MitM), traffic reverts back to Champion immediately (&lt;1s).
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>False Positive Rate (FPR) Threshold</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                If candidate false alarm rate exceeds 1.5x of the Champion baseline, rollout halts and reverts automatically to prevent SOC operator fatigue.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-[#25232B] dark:text-[#F2F1F6] font-bold">
                <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Real-Time P99 Latency Bound</span>
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                Inference latency is bounded below 20ms. If packet queuing delay spikes during staged routing, traffic shifts back to the primary slot instantly.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-[#25232B] dark:text-[#F2F1F6] font-bold">
              <Server className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
              <span>Active Serving Topology &amp; Endpoints</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#85818D] dark:text-[#A5A0AF] pt-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
                <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">Primary Slot A</span>
                <span className="font-mono font-semibold text-[#25232B] dark:text-[#F2F1F6]">http://localhost:8001</span>
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Healthy &amp; Serving</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
                <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">Standby Slot B</span>
                <span className="font-mono font-semibold text-[#25232B] dark:text-[#F2F1F6]">http://localhost:8002</span>
                <span className="block text-[10px] text-[#85818D] dark:text-[#A5A0AF] mt-0.5">Warm Standby Ready</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
                <span className="block text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">Routing Authority</span>
                <span className="font-mono font-semibold text-[#25232B] dark:text-[#F2F1F6]">FastAPI Control Plane (:8000)</span>
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Sub-millisecond Dispatch</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
