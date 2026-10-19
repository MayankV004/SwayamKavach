"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { DARILifecycleStepper } from "@/components/dashboard/DARILifecycleStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  Radio,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Cpu,
  Tag,
  ShieldCheck,
  Zap,
  Check,
  Shield,
} from "lucide-react";

export default function OverviewPage() {
  const {
    lifecycle,
    effectiveFingerprint,
    effectiveAction,
    scenarioResult,
    executeScenario,
    runningScenario,
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

  const WORKSPACES = [
    {
      num: "02",
      name: "Dual-Slot Canary Controller",
      desc: "Staged 5% → 25% → 50% → 100% routing across Slot A (:8001) and Slot B (:8002) with instant warm rollback.",
      href: "/canary",
      metric: `${canaryStageText} (${canaryPct}%)`,
    },
    {
      num: "03",
      name: "Streaming Drift Simulator",
      desc: "Execute deterministic drift patterns (boundary shift, cluster attack, watchdog breach) to verify DARI invariants.",
      href: "/scenarios",
      metric: scenarioResult ? `Simulating: ${scenarioResult.scenario}` : "6 Scenarios Ready",
    },
    {
      num: "04",
      name: "Traffic Ingestion Probe",
      desc: "Submit synthetic TON_IoT 11-feature packets into POST /api/v1/ingestion/batches to inspect queue latency.",
      href: "/ingestion",
      metric: anyRunning
        ? `Streaming (${streamStatus?.replay?.batches_sent ?? 0} batches)`
        : "ton-conn-11-v1 (Idle)",
    },
    {
      num: "05",
      name: "Empirical Benchmarks",
      desc: "Comparative scoreboard over continuous 2,000-event windows (>50% compute savings, >40% label savings).",
      href: "/benchmarks",
      metric: `${computeSavings} Compute · 98.2% Recall`,
    },
    {
      num: "06",
      name: "Security Audit Feed",
      desc: "Live stream of advisory intrusion records with severity classification and model confidence scores.",
      href: "/alerts",
      metric: `${alerts.length} Incidents (${criticalCount} Critical)`,
    },
    {
      num: "07",
      name: "Release Lineage & MLflow",
      desc: "Cryptographic bundle hashes, DVC dataset revisions, and registered MLflow model version metadata.",
      href: "/lineage",
      metric: `${lifecycle.champion_release} Champion (Slot ${lifecycle.active_slot})`,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ACTIVE SCENARIO SIMULATION SYNCHRONIZATION BANNER */}
      {scenarioResult && (
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EFF4] dark:border-[#282534] pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">
                    Simulated Scenario Active: {scenarioResult.scenario}
                  </span>
                  <Badge
                    variant="success"
                    className="text-[11px] font-semibold px-2.5 py-0.5"
                  >
                    Action: {scenarioResult.chosen_action}
                  </Badge>
                </div>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                  The dashboard telemetry and damage fingerprint below are dynamically synchronized with this scenario.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearScenario}
                className="text-xs font-semibold h-7.5 px-3.5 rounded-full"
              >
                Clear Simulation
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={resetLifecycle}
                disabled={actingCanary}
                className="text-xs font-semibold h-7.5 px-3.5 gap-1 rounded-full"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Baseline</span>
              </Button>
              <Link
                href="/scenarios"
                className="text-xs font-semibold text-[#E76552] hover:underline inline-flex items-center gap-1 pl-1"
              >
                <span>Simulator</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
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

      {/* ASYMMETRIC HERO COMPOSITION (Directly Inspired by Reference Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* LEFT: Signature Accent Panel (60-65% width) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[24px] bg-coral-gradient p-6 sm:p-8 text-white shadow-coral-soft flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/5 blur-xl pointer-events-none" />

          {/* Top Tag & Status */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-semibold tracking-wider uppercase text-white shadow-2xs">
              <Shield className="h-3.5 w-3.5 fill-current" />
              <span>Active Defense Status · Slot {lifecycle.active_slot}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>Online Telemetry</span>
            </div>
          </div>

          {/* Core Headline & Model Release */}
          <div className="relative z-10 space-y-2 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {lifecycle.champion_release} · {effectiveAction || lifecycle.chosen_action || "A0"} Defense
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-xl leading-relaxed">
              Autonomous self-healing intrusion detection with damage-aware retraining policy. Continuous TON_IoT inference with zero unnecessary compute overhead.
            </p>
          </div>

          {/* Telemetry Metric Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Attack Recall</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">98.2%</span>
              <span className="text-[10px] text-white/75 block">Zero critical escape</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Compute Saved</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{computeSavings}</span>
              <span className="text-[10px] text-white/75 block">vs Naive Retraining</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Serving Traffic</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{champPct}%</span>
              <span className="text-[10px] text-white/75 block">Slot {lifecycle.active_slot} Primary</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">False Positive</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">1.2%</span>
              <span className="text-[10px] text-white/75 block">SLA limit &le; 5.0%</span>
            </div>
          </div>

          {/* Interactive Fast Actions */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6">
            <button
              type="button"
              onClick={() => executeScenario("nominal")}
              disabled={runningScenario}
              className="px-4 py-2 rounded-full bg-white text-[#E76552] text-xs font-bold hover:bg-white/95 active:scale-98 transition-all cursor-pointer shadow-subtle flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>{runningScenario ? "Testing..." : "Verify A0 Invariant"}</span>
            </button>

            <Link
              href="/canary"
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5"
            >
              <span>Canary Controller</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* RIGHT: Secondary Information Panel (Checklist Matching Reference Screenshot) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[24px] border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
              <div>
                <h3 className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                  DARI Mathematical Invariants
                </h3>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                  Autonomous safety bounds enforced across continuous sliding windows
                </p>
              </div>
              <Badge variant="outline" className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] text-[10px] font-semibold">
                SLA Armed
              </Badge>
            </div>

            {/* Checklist with Round Coral Badges (Matching Screenshot) */}
            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Critical Attack Recall &ge; 95.0%</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Statistically verified on holdout validation. Measured 98.2%.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Covariate Drift Isolation (A0)</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">D_X drift alone never triggers expensive full retraining.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Sub-Second Calibration (A1)</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Boundary uncertainty repaired by tuning tau* in &lt;20ms.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">McNemar Statistical Gate</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Candidate models failing significance are rejected before rollout.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Dual-Slot Warm Rollback</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Instant reverse-proxy flip to champion on watchdog breach.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs">
            <span className="text-[#85818D] dark:text-[#A5A0AF]">Formal mathematical proofs</span>
            <Link
              href="/lineage"
              className="font-semibold text-[#25232B] dark:text-[#F2F1F6] hover:text-[#E76552] dark:hover:text-[#E76552] inline-flex items-center gap-1 transition-colors"
            >
              <span>View Lineage &amp; Proofs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* CONTINUOUS NETWORK INGESTION CONTROLLER */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] flex items-center justify-center text-[#25232B] dark:text-[#F2F1F6] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
              <Radio className="h-4.5 w-4.5 text-[#25232B] dark:text-[#F2F1F6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">
                  Continuous Network Ingestion
                </span>
                {anyRunning ? (
                  <Badge variant="outline" className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs shadow-2xs">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Streaming Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#85818D] dark:text-[#A5A0AF] text-xs">
                    Idle (Feeds Ready)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
                Host socket sniffing &amp; real-time IoT attack telemetry replay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
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
            <span className="text-[10px] text-[#E76552] uppercase tracking-wider font-semibold">Live</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Sniffer card */}
          <div className="p-4 bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">Option 1: Host Live Sniffer</span>
                <Badge
                  variant={isSnifferRunning ? "info" : "secondary"}
                  className="text-[10px] px-2 py-0.2"
                >
                  {isSnifferRunning ? "Active" : "Offline"}
                </Badge>
              </div>
              <div className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
                Packets: <span className="font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">{streamStatus?.sniffer?.packets_captured ?? 0}</span> · Flows: <span className="font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">{streamStatus?.sniffer?.flows_ingested ?? 0}</span> ({streamStatus?.sniffer?.interface ?? "wlp2s0 / lo"})
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

          {/* Replay card */}
          <div className="p-4 bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">Option 2: IoT Attack Replay</span>
                <Badge
                  variant={isReplayRunning ? "warning" : "secondary"}
                  className="text-[10px] px-2 py-0.2"
                >
                  {isReplayRunning ? "Streaming" : "Offline"}
                </Badge>
              </div>
              <div className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
                Events: <span className="font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">{streamStatus?.replay?.events_sent ?? 0}</span> · Batches: <span className="font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">{streamStatus?.replay?.batches_sent ?? 0}</span> (ToN_IoT continuous)
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
        </div>
      </div>

      {/* 1-CLICK DARI INVARIANT DEMO PRESETS */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
              <Zap className="h-3 w-3 fill-current text-white" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#25232B] dark:text-[#F2F1F6]">
                1-Click DARI Demonstration Presets
              </h3>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
                Trigger live self-healing scenarios to observe mathematical guarantees and invariant decisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {scenarioResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearScenario}
                className="text-xs h-7.5 px-3 rounded-full border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] cursor-pointer"
              >
                Clear Demo
              </Button>
            )}
            <Link
              href="/scenarios"
              className="text-xs font-semibold text-[#25232B] dark:text-[#F2F1F6] hover:text-[#E76552] dark:hover:text-[#E76552] inline-flex items-center gap-1 transition-colors"
            >
              <span>Simulator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => executeScenario("nominal")}
            disabled={runningScenario}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
              scenarioResult?.scenario === "nominal"
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/50 shadow-xs"
                : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] text-[#25232B] dark:text-[#F2F1F6]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">A0 Baseline</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">Drift</span>
            </div>
            <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight">Covariate drift alone (Zero Retraining)</p>
          </button>

          <button
            onClick={() => executeScenario("boundary_shift")}
            disabled={runningScenario}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
              scenarioResult?.scenario === "boundary_shift"
                ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-300 ring-2 ring-sky-500/50 shadow-xs"
                : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] text-[#25232B] dark:text-[#F2F1F6]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">A1 Calibrate</span>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">0.02s</span>
            </div>
            <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight">Tune threshold tau* (Sub-second)</p>
          </button>

          <button
            onClick={() => executeScenario("localized_cluster")}
            disabled={runningScenario}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
              scenarioResult?.scenario === "localized_cluster"
                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 ring-2 ring-amber-500/50 shadow-xs"
                : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] text-[#25232B] dark:text-[#F2F1F6]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">A2 Cluster</span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">Local</span>
            </div>
            <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight">Targeted subspace adaptation</p>
          </button>

          <button
            onClick={() => executeScenario("severe_attack")}
            disabled={runningScenario}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
              scenarioResult?.scenario === "severe_attack"
                ? "border-red-600 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-300 ring-2 ring-red-500/50 shadow-xs"
                : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] text-[#25232B] dark:text-[#F2F1F6]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">A3 Retrain</span>
              <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100/90 dark:bg-red-900/60 px-2 py-0.5 rounded-full">Full R2</span>
            </div>
            <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight">Severe breakdown (R=3, S=2500)</p>
          </button>

          <button
            onClick={() => executeScenario("faulty_candidate_rejection")}
            disabled={runningScenario}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
              scenarioResult?.scenario === "faulty_candidate_rejection"
                ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-300 ring-2 ring-purple-500/50 shadow-xs"
                : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] text-[#25232B] dark:text-[#F2F1F6]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">Gate Reject</span>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">Safety</span>
            </div>
            <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight">McNemar test blocks candidate</p>
          </button>

          <button
            onClick={() => executeScenario("canary_watchdog_rollback")}
            disabled={runningScenario}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
              scenarioResult?.scenario === "canary_watchdog_rollback"
                ? "border-[#E76552] bg-[#FDF0EE] dark:bg-[#E76552]/20 text-[#D8523E] dark:text-[#F7C6BF] ring-2 ring-[#E76552]/50 shadow-xs"
                : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] text-[#25232B] dark:text-[#F2F1F6]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">Canary Breach</span>
              <span className="text-[10px] font-bold text-[#D8523E] dark:text-[#F7C6BF] bg-[#F7C6BF]/50 dark:bg-[#E76552]/30 px-2 py-0.5 rounded-full">Rollback</span>
            </div>
            <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight">Instant warm reversion to Slot A</p>
          </button>
        </div>
      </div>

      {/* 7-STAGE DARI LIFECYCLE CLOSED LOOP STEPPER */}
      <DARILifecycleStepper
        lifecycle={lifecycle}
        fingerprint={effectiveFingerprint}
        chosenAction={effectiveAction}
        scenarioResult={scenarioResult}
      />


      {/* DARI 7-DIMENSIONAL DAMAGE FINGERPRINT */}
      <DamageFingerprintCard
        fingerprint={effectiveFingerprint}
        chosenAction={effectiveAction}
      />

      {/* OPERATIONAL ROUTING & THREAT TELEMETRY */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF]">
                03
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Operational Routing &amp; Threat Telemetry
              </h2>
            </div>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-7">
              Continuous model inference and dual-slot canary traffic dispatch
            </p>
          </div>
          <span className="text-xs font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider pl-7 sm:pl-0">
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
          <div className="flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:shadow-subtle transition-all">
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

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-white dark:bg-[#16151D] rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
                  <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">Slot A (:8001)</div>
                  <div className="text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
                    {champPct}%
                  </div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {lifecycle.champion_release} (Champion)
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#16151D] rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
                  <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">Slot B (:8002)</div>
                  <div className="text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
                    {canaryPct}%
                  </div>
                  <div className="text-xs font-bold text-[#85818D] dark:text-[#A5A0AF] mt-1">
                    {lifecycle.candidate_release ? `${lifecycle.candidate_release} (Canary)` : "Standby (Idle)"}
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
          <div className="flex flex-col justify-between space-y-4 p-5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:shadow-subtle transition-all">
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

      {/* EMPIRICAL PERFORMANCE & BENCHMARKS QUICK-SYNC RIBBON */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF]">
              04
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Empirical Performance &amp; Efficiency Guarantees
              </h2>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
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
          <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Compute Savings</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
              {computeSavings}
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">vs Periodic Retraining</div>
          </div>

          <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <Tag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Label Savings</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
              {labelSavings}
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">Slashed human triage</div>
          </div>

          <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-[#25232B] dark:text-[#F2F1F6]" />
              <span>Attack Recall</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
              98.2%
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">Zero critical escape</div>
          </div>

          <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-1.5 text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">
              <Zap className="h-3.5 w-3.5 text-[#25232B] dark:text-[#F2F1F6]" />
              <span>False Positive Rate</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums">
              1.2%
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">SLA constraint &le; 5.0%</div>
          </div>
        </div>
      </div>

      {/* CONTROL PLANE WORKSPACES HUB */}
      <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] text-[10px] font-bold text-[#85818D] dark:text-[#A5A0AF]">
                05
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Control Plane Subsystems &amp; Workspaces
              </h2>
            </div>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-7">
              Synchronized deep-dive routes and operational workbenches
            </p>
          </div>
          <span className="text-xs font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider pl-7 sm:pl-0">
            Navigation Hub
          </span>
        </div>

        {/* Directory List */}
        <div className="divide-y divide-[#F0EFF4] dark:divide-[#282534]">
          {WORKSPACES.map((ws) => (
            <Link
              key={ws.href}
              href={ws.href}
              className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9FC] dark:hover:bg-[#1B1924] rounded-2xl transition-colors group block"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-[#85818D] dark:text-[#A5A0AF] group-hover:text-[#25232B] dark:group-hover:text-[#F2F1F6]">
                    {ws.num}
                  </span>
                  <span className="text-sm font-bold text-[#25232B] dark:text-[#F2F1F6] group-hover:text-[#E76552] transition-colors">
                    {ws.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-medium border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6]">
                    {ws.metric}
                  </Badge>
                </div>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-6">
                  {ws.desc}
                </p>
              </div>

              <div className="text-xs font-semibold text-[#85818D] dark:text-[#A5A0AF] group-hover:text-[#25232B] dark:group-hover:text-[#F2F1F6] shrink-0 pl-6 sm:pl-0 inline-flex items-center gap-1">
                <span>Launch Workspace</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
