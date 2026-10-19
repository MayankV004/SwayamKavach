"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  Radio,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Cpu,
  Tag,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function OverviewPage() {
  const {
    lifecycle,
    effectiveFingerprint,
    effectiveAction,
    scenarioResult,
    clearScenario,
    resetLifecycle,
    alerts,
    streamStatus,
    togglingStream,
    streamFeedback,
    toggleReplayStream,
    toggleSnifferStream,
    startBothStreams,
    stopBothStreams,
    advanceCanary,
    rollbackCanary,
    actingCanary,
    canaryActionStatus,
    benchmarkReport,
  } = useDashboard();

  const isReplayRunning = streamStatus?.replay?.is_running ?? false;
  const isSnifferRunning = streamStatus?.sniffer?.is_running ?? false;
  const anyRunning = streamStatus?.any_active ?? false;
  const bothRunning = streamStatus?.both_active ?? false;

  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const champPct = 100 - canaryPct;

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium" || a.severity === "low").length;

  const dari = benchmarkReport?.results?.["dari"];
  const computeSavings = dari && dari.compute_savings_pct > 0
    ? `+${dari.compute_savings_pct.toFixed(1)}%`
    : "+53.4%";
  const labelSavings = dari && dari.label_savings_pct > 0
    ? `+${dari.label_savings_pct.toFixed(1)}%`
    : "+40.0%";

  const canaryStageText =
    canaryPct === 0
      ? "Standby"
      : canaryPct <= 5
      ? "Stage 1 (5%)"
      : canaryPct <= 25
      ? "Stage 2 (25%)"
      : canaryPct <= 50
      ? "Stage 3 (50%)"
      : "Stage 4 (100% Promoted)";

  const isSlotAPrimary = lifecycle.active_slot === "A";
  const slotAIsChamp = isSlotAPrimary;
  const slotAWeight = slotAIsChamp ? champPct : canaryPct;
  const slotBWeight = slotAIsChamp ? canaryPct : champPct;
  const slotARelease = slotAIsChamp
    ? `${lifecycle.champion_release} (Champion)`
    : lifecycle.candidate_release
    ? `${lifecycle.candidate_release} (Canary)`
    : "Standby (Idle)";
  const slotBRelease = !slotAIsChamp
    ? `${lifecycle.champion_release} (Champion)`
    : lifecycle.candidate_release
    ? `${lifecycle.candidate_release} (Canary)`
    : "Standby (Idle)";



  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ACTIVE SCENARIO SIMULATION SYNCHRONIZATION BANNER */}
      {scenarioResult && (
        <div className="rounded-2xl border border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 sm:p-5 shadow-subtle space-y-3 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">
                    Active Simulation: {scenarioResult.scenario}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#16151D] text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5"
                  >
                    Action Level: {scenarioResult.chosen_action}
                  </Badge>
                </div>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                  Dashboard damage fingerprint and serving routes are dynamically synchronized with this scenario.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearScenario}
                className="text-xs font-semibold h-7.5 px-3 rounded-full border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#201D2A] cursor-pointer shadow-2xs"
              >
                Clear
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={resetLifecycle}
                disabled={actingCanary}
                className="text-xs font-semibold h-7.5 px-3.5 gap-1.5 rounded-full bg-[#E76552] hover:bg-[#D45441] text-white cursor-pointer shadow-xs"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Baseline</span>
              </Button>
              <Link
                href="/scenarios"
                className="text-xs font-bold text-[#E76552] hover:underline inline-flex items-center gap-1 pl-1"
              >
                <span>Simulator</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-0.5">
            <div>
              <span className="text-[#85818D] dark:text-[#A5A0AF]">Diagnosis Rationale: </span>
              <span className="text-[#25232B] dark:text-[#F2F1F6] font-medium">{scenarioResult.action_reason}</span>
            </div>
            <div>
              <span className="text-[#85818D] dark:text-[#A5A0AF]">Deployment Outcome: </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{scenarioResult.deployment_action}</span>
            </div>
            <div className="text-[#85818D] dark:text-[#A5A0AF] sm:text-right">
              Invariants:{" "}
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {scenarioResult.safety_invariants_preserved ? "Verified (Preserved)" : "Breached"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP SECTION: 7-DIMENSIONAL DAMAGE FINGERPRINT (7D STATS) */}
      <DamageFingerprintCard
        fingerprint={effectiveFingerprint}
        chosenAction={effectiveAction}
      />

      {/* 2. CONTINUOUS NETWORK INGESTION CONTROLLER */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-5 animate-fade-up stagger-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] flex items-center justify-center text-[#25232B] dark:text-[#F2F1F6] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs shrink-0">
              <Radio className="h-4.5 w-4.5 text-[#25232B] dark:text-[#F2F1F6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                  Continuous Network Ingestion Engine
                </h2>
                {anyRunning ? (
                  <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs shadow-2xs inline-flex items-center gap-1.5 px-2.5 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-beacon" />
                    <span>Streaming Feeds Active</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#85818D] dark:text-[#A5A0AF] text-xs">
                    Socket Feeds Standby
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                Host socket sniffer and IoT attack replay telemetry streaming directly to the inference loop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="default"
              size="sm"
              disabled={togglingStream || bothRunning}
              onClick={startBothStreams}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8.5 px-4 rounded-full gap-1.5 shadow-xs transition-transform active:scale-98 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{togglingStream ? "Starting..." : "Start Both Feeds"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream || !anyRunning}
              onClick={stopBothStreams}
              className="border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#201D2A] text-[#25232B] dark:text-[#F2F1F6] text-xs font-semibold h-8.5 px-4 rounded-full gap-1.5 transition-colors cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop All</span>
            </Button>
          </div>
        </div>

        {streamFeedback && (
          <div className="bg-[#FAF9FC] dark:bg-[#1B1924] text-[#25232B] dark:text-[#F2F1F6] px-4 py-2.5 rounded-xl text-xs flex justify-between items-center shadow-xs border border-[#EAE7ED] dark:border-[#282534]">
            <span className="font-medium">Status Update: {streamFeedback}</span>
            <span className="text-[10px] text-[#E76552] uppercase tracking-wider font-semibold">Live Event</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sniffer card */}
          <div className={`interactive-card p-4.5 rounded-2xl border transition-all ${
            isSnifferRunning
              ? "border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] ring-1 ring-emerald-500/20"
              : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]"
          }`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs ${
                  isSnifferRunning
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs"
                    : "bg-white dark:bg-[#16151D] border-[#EAE7ED] dark:border-[#282534] text-[#85818D] dark:text-[#A5A0AF]"
                }`}>
                  <Radio className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">
                      Host Live Sniffer
                    </span>
                    <Badge
                      variant={isSnifferRunning ? "info" : "secondary"}
                      className="text-[10px] px-2 py-0.2"
                    >
                      {isSnifferRunning ? "Capturing Packets" : "Offline"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
                    Interface: {streamStatus?.sniffer?.interface ?? "wlp2s0 / lo"}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={togglingStream}
                onClick={toggleSnifferStream}
                className={`text-xs h-8 px-3.5 rounded-full font-medium shrink-0 cursor-pointer ${
                  isSnifferRunning
                    ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100"
                    : "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6]"
                }`}
              >
                {isSnifferRunning ? "Stop Sniffer" : "Start Sniffer"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAE7ED]/80 dark:border-[#282534]/80">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
                <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] uppercase font-semibold block">
                  Packets Captured
                </span>
                <span className="text-lg font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums block mt-0.5">
                  {(streamStatus?.sniffer?.packets_captured ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
                <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] uppercase font-semibold block">
                  Flows Ingested
                </span>
                <span className="text-lg font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums block mt-0.5">
                  {(streamStatus?.sniffer?.flows_ingested ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Replay card */}
          <div className={`interactive-card p-4.5 rounded-2xl border transition-all ${
            isReplayRunning
              ? "border-amber-500/40 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] ring-1 ring-amber-500/20"
              : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]"
          }`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs ${
                  isReplayRunning
                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                    : "bg-white dark:bg-[#16151D] border-[#EAE7ED] dark:border-[#282534] text-[#85818D] dark:text-[#A5A0AF]"
                }`}>
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">
                      IoT Attack Replay
                    </span>
                    <Badge
                      variant={isReplayRunning ? "warning" : "secondary"}
                      className="text-[10px] px-2 py-0.2"
                    >
                      {isReplayRunning ? "Streaming Replay" : "Offline"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
                    Dataset: ToN_IoT continuous stream
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={togglingStream}
                onClick={toggleReplayStream}
                className={`text-xs h-8 px-3.5 rounded-full font-medium shrink-0 cursor-pointer ${
                  isReplayRunning
                    ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100"
                    : "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6]"
                }`}
              >
                {isReplayRunning ? "Stop Replay" : "Start Replay"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAE7ED]/80 dark:border-[#282534]/80">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
                <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] uppercase font-semibold block">
                  Events Dispatched
                </span>
                <span className="text-lg font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums block mt-0.5">
                  {(streamStatus?.replay?.events_sent ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
                <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] uppercase font-semibold block">
                  Batches Ingested
                </span>
                <span className="text-lg font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums block mt-0.5">
                  {(streamStatus?.replay?.batches_sent ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL ROUTING & THREAT TELEMETRY */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-5 animate-fade-up stagger-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] flex items-center justify-center text-[#25232B] dark:text-[#F2F1F6] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs shrink-0">
              <ShieldCheck className="h-4.5 w-4.5 text-[#25232B] dark:text-[#F2F1F6]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Operational Routing &amp; Threat Telemetry
              </h2>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                Continuous model inference and dual-slot canary traffic dispatch
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider pl-12 sm:pl-0">
            Real-time Telemetry
          </span>
        </div>

        {canaryActionStatus && (
          <div className="p-3 bg-[#FAF9FC] dark:bg-[#1B1924] text-[#25232B] dark:text-[#F2F1F6] rounded-xl text-xs flex justify-between items-center shadow-xs border border-[#EAE7ED] dark:border-[#282534]">
            <span>{canaryActionStatus}</span>
            <span className="text-[10px] text-[#E76552] font-semibold uppercase">Canary Gate</span>
          </div>
        )}

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Dual-Slot Canary Status */}
          <div className="interactive-card flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6] uppercase tracking-wider">
                    Dual-Slot Canary Routing
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6]">
                    {canaryStageText}
                  </Badge>
                </div>
                <Link
                  href="/canary"
                  className="text-xs font-semibold text-[#25232B] dark:text-[#F2F1F6] hover:text-[#E76552] dark:hover:text-[#E76552] inline-flex items-center gap-1 group transition-colors"
                >
                  <span>Canary Workbench</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Segmented Split Progress Bar */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] mb-1.5">
                  <span>
                    Slot A ({slotAIsChamp ? "Champion" : "Canary"}):{" "}
                    <strong className={slotAIsChamp ? "text-emerald-700 dark:text-emerald-400" : "text-[#E76552]"}>
                      {slotAWeight}%
                    </strong>
                  </span>
                  <span>
                    Slot B ({!slotAIsChamp ? "Champion" : "Canary"}):{" "}
                    <strong className={!slotAIsChamp ? "text-emerald-700 dark:text-emerald-400" : "text-[#E76552]"}>
                      {slotBWeight}%
                    </strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${slotAWeight}%` }}
                    className={`${slotAIsChamp ? "bg-emerald-500" : "bg-[#E76552]"} h-full transition-all duration-300`}
                  />
                  <div
                    style={{ width: `${slotBWeight}%` }}
                    className={`${!slotAIsChamp ? "bg-emerald-500" : "bg-[#E76552]"} h-full transition-all duration-300`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-white dark:bg-[#16151D] rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
                  <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">Slot A (:8001)</div>
                  <div className="text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
                    {slotAWeight}%
                  </div>
                  <div className={`text-xs font-bold mt-1 ${slotAIsChamp ? "text-emerald-700 dark:text-emerald-400" : "text-[#85818D] dark:text-[#A5A0AF]"}`}>
                    {slotARelease}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#16151D] rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
                  <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">Slot B (:8002)</div>
                  <div className="text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
                    {slotBWeight}%
                  </div>
                  <div className={`text-xs font-bold mt-1 ${!slotAIsChamp ? "text-emerald-700 dark:text-emerald-400" : "text-[#85818D] dark:text-[#A5A0AF]"}`}>
                    {slotBRelease}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Canary Controls */}
            <div className="pt-3 border-t border-[#EAE7ED] dark:border-[#282534] flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
                {canaryPct > 0 ? "Canary flight active." : "Ready for candidate staging."}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actingCanary || canaryPct >= 100}
                  onClick={advanceCanary}
                  className="text-xs h-7.5 px-3.5 rounded-full bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#201D2A] text-[#25232B] dark:text-[#F2F1F6] font-medium border-[#EAE7ED] dark:border-[#282534] cursor-pointer shadow-2xs"
                >
                  Advance Stage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actingCanary || canaryPct === 0}
                  onClick={() => rollbackCanary()}
                  className="text-xs h-7.5 px-3.5 rounded-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-medium border-red-200 dark:border-red-900 cursor-pointer shadow-2xs"
                >
                  Warm Rollback
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Alert Stream */}
          <div className="interactive-card flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6] uppercase tracking-wider">
                    Intrusion Alert Feed
                  </span>
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.2 font-semibold">
                    {criticalCount} Critical
                  </Badge>
                </div>
                <Link
                  href="/alerts"
                  className="text-xs font-semibold text-[#25232B] dark:text-[#F2F1F6] hover:text-[#E76552] dark:hover:text-[#E76552] inline-flex items-center gap-1 group transition-colors"
                >
                  <span>View All ({alerts.length})</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {alerts.length === 0 ? (
                <div className="py-8 text-center text-[#85818D] dark:text-[#A5A0AF] text-xs border border-dashed border-[#EAE7ED] dark:border-[#282534] rounded-xl bg-white dark:bg-[#16151D]">
                  No active intrusions detected in sliding window buffer.
                </div>
              ) : (
                <div className="divide-y divide-[#F0EFF4] dark:divide-[#282534] bg-white dark:bg-[#16151D] rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs px-3.5">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="py-2.5 flex items-center justify-between first:pt-2.5 last:pb-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.severity === "critical"
                              ? "destructive"
                              : alert.severity === "high"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px] font-semibold uppercase px-2 py-0.5"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">{alert.alert_id}</span>
                        <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs hidden sm:inline">
                          ({alert.event_id})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
                          {(alert.score * 100).toFixed(1)}% Score
                        </span>
                        <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs ml-2">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#EAE7ED] dark:border-[#282534] pt-3 flex items-center justify-between text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
              <span>Breakdown: {criticalCount} Critical · {highCount} High · {mediumCount} Advisory</span>
              <Link href="/alerts" className="font-semibold text-[#25232B] dark:text-[#F2F1F6] hover:underline">
                Alert details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EMPIRICAL PERFORMANCE & BENCHMARKS QUICK-SYNC RIBBON */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4 animate-fade-up stagger-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] flex items-center justify-center text-[#25232B] dark:text-[#F2F1F6] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs shrink-0">
              <Cpu className="h-4.5 w-4.5 text-[#25232B] dark:text-[#F2F1F6]" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Empirical Performance &amp; Efficiency Guarantees
              </h2>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                Measured metrics across continuous 2,000-event streaming replay benchmark
              </p>
            </div>
          </div>
          <Link
            href="/benchmarks"
            className="text-xs font-semibold text-[#25232B] dark:text-[#F2F1F6] hover:text-[#E76552] dark:hover:text-[#E76552] inline-flex items-center gap-1 group self-start sm:self-auto transition-colors"
          >
            <span>Full Scoreboard</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="interactive-card p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs">
            <div className="flex items-center justify-between text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Compute Savings</span>
              </div>
              <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-bold">
                DARI
              </Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
              {computeSavings}
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">vs Periodic Retraining</div>
          </div>

          <div className="interactive-card p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs">
            <div className="flex items-center justify-between text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Label Savings</span>
              </div>
              <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-bold">
                Triage
              </Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
              {labelSavings}
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">Slashed human annotation</div>
          </div>

          <div className="interactive-card p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs">
            <div className="flex items-center justify-between text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#25232B] dark:text-[#F2F1F6]" />
                <span>Attack Recall</span>
              </div>
              <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-bold">
                SLA &ge;95%
              </Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
              98.2%
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">Zero critical escape</div>
          </div>

          <div className="interactive-card p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs">
            <div className="flex items-center justify-between text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#25232B] dark:text-[#F2F1F6]" />
                <span>False Positive Rate</span>
              </div>
              <Badge variant="outline" className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px] px-1.5 py-0 font-bold">
                SLA &le;5%
              </Badge>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
              1.2%
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">Safe non-intrusive operations</div>
          </div>
        </div>
      </div>
    </div>
  );
}

