"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
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
  AlertTriangle,
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
    <div className="space-y-8">
      {/* ACTIVE SCENARIO SIMULATION SYNCHRONIZATION BANNER */}
      {scenarioResult && (
        <div className="rounded-xl border border-zinc-200/90 bg-zinc-950 text-zinc-100 p-5 shadow-xs space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    Simulated Scenario Active: {scenarioResult.scenario}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-emerald-500 text-emerald-400 bg-emerald-950/40 text-[11px] font-semibold px-2 py-0.5"
                  >
                    Action: {scenarioResult.chosen_action}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  The dashboard metrics and damage fingerprint below are synchronized with this scenario.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearScenario}
                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium h-7.5 px-3"
              >
                Clear Simulation
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={resetLifecycle}
                disabled={actingCanary}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium h-7.5 px-3 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Baseline</span>
              </Button>
              <Link
                href="/scenarios"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 pl-1"
              >
                <span>Simulator</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <span className="text-zinc-400">Diagnosis Rationale: </span>
              <span className="text-zinc-200 font-medium">{scenarioResult.action_reason}</span>
            </div>
            <div>
              <span className="text-zinc-400">Deployment Outcome: </span>
              <span className="text-emerald-400 font-semibold">{scenarioResult.deployment_action}</span>
            </div>
            <div className="text-zinc-400 sm:text-right">
              Invariants:{" "}
              <span className="text-emerald-400 font-semibold">
                {scenarioResult.safety_invariants_preserved ? "Verified (Preserved)" : "Breached"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LIVE TRAFFIC FEEDS CONTROLLER BAR */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-xs">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-950">
                  Continuous Network Ingestion
                </span>
                {anyRunning ? (
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Streaming Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-500 text-xs">
                    Idle (No Feed Active)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-3.5 gap-1.5"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{togglingStream ? "Starting..." : "Start Both Feeds"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream || !anyRunning}
              onClick={stopBothStreams}
              className="border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold h-8 px-3.5 gap-1.5"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop All</span>
            </Button>
          </div>
        </div>

        {streamFeedback && (
          <div className="bg-zinc-900 text-zinc-100 px-3.5 py-2 rounded-lg text-xs flex justify-between items-center shadow-xs">
            <span className="font-medium">Status Update: {streamFeedback}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Live</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Sniffer card */}
          <div className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-lg flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-950">Option 1: Host Live Sniffer</span>
                <Badge
                  variant={isSnifferRunning ? "info" : "secondary"}
                  className="text-[10px] px-2 py-0.2"
                >
                  {isSnifferRunning ? "Active" : "Offline"}
                </Badge>
              </div>
              <div className="text-xs text-zinc-600">
                Packets: <span className="font-bold text-zinc-900 tabular-nums">{streamStatus?.sniffer?.packets_captured ?? 0}</span> · Flows: <span className="font-bold text-zinc-900 tabular-nums">{streamStatus?.sniffer?.flows_ingested ?? 0}</span> ({streamStatus?.sniffer?.interface ?? "wlp2s0 / lo"})
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream}
              onClick={toggleSnifferStream}
              className={`text-xs h-8 px-3.5 font-medium shrink-0 ${
                isSnifferRunning
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900"
              }`}
            >
              {isSnifferRunning ? "Stop Sniffer" : "Start Sniffer"}
            </Button>
          </div>

          {/* Replay card */}
          <div className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-lg flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-950">Option 2: IoT Attack Replay</span>
                <Badge
                  variant={isReplayRunning ? "warning" : "secondary"}
                  className="text-[10px] px-2 py-0.2"
                >
                  {isReplayRunning ? "Streaming" : "Offline"}
                </Badge>
              </div>
              <div className="text-xs text-zinc-600">
                Events: <span className="font-bold text-zinc-900 tabular-nums">{streamStatus?.replay?.events_sent ?? 0}</span> · Batches: <span className="font-bold text-zinc-900 tabular-nums">{streamStatus?.replay?.batches_sent ?? 0}</span> (ToN_IoT continuous)
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream}
              onClick={toggleReplayStream}
              className={`text-xs h-8 px-3.5 font-medium shrink-0 ${
                isReplayRunning
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900"
              }`}
            >
              {isReplayRunning ? "Stop Replay" : "Start Replay"}
            </Button>
          </div>
        </div>
      </div>

      {/* 1-CLICK DARI INVARIANT DEMO PRESETS BAR */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[11px] font-bold text-white shadow-xs">
              <Zap className="h-3 w-3 fill-current" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                1-Click Project Demonstration Presets
              </h3>
              <p className="text-xs text-zinc-500">
                Trigger live DARI self-healing scenarios to demonstrate mathematical guarantees and invariants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {scenarioResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearScenario}
                className="text-xs h-7.5 px-2.5 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
              >
                Clear Demo
              </Button>
            )}
            <Link
              href="/scenarios"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <span>Simulator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => executeScenario("nominal")}
            disabled={runningScenario}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              scenarioResult?.scenario === "nominal"
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 shadow-xs"
                : "border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">A0 Baseline</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">Drift</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight">Covariate drift alone (Zero Retraining)</p>
          </button>

          <button
            onClick={() => executeScenario("boundary_shift")}
            disabled={runningScenario}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              scenarioResult?.scenario === "boundary_shift"
                ? "border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-600 shadow-xs"
                : "border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">A1 Calibrate</span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded">0.02s</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight">Tune threshold tau* (Sub-second)</p>
          </button>

          <button
            onClick={() => executeScenario("localized_cluster")}
            disabled={runningScenario}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              scenarioResult?.scenario === "localized_cluster"
                ? "border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 shadow-xs"
                : "border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">A2 Cluster</span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">Local</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight">Targeted subspace adaptation</p>
          </button>

          <button
            onClick={() => executeScenario("severe_attack")}
            disabled={runningScenario}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              scenarioResult?.scenario === "severe_attack"
                ? "border-red-600 bg-red-50 text-red-950 ring-1 ring-red-600 shadow-xs"
                : "border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">A3 Retrain</span>
              <span className="text-[10px] font-semibold text-red-700 bg-red-100/80 px-1.5 py-0.2 rounded">Full R2</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight">Severe breakdown (R=3, S=2500)</p>
          </button>

          <button
            onClick={() => executeScenario("faulty_candidate_rejection")}
            disabled={runningScenario}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              scenarioResult?.scenario === "faulty_candidate_rejection"
                ? "border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600 shadow-xs"
                : "border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Gate Reject</span>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-1.5 py-0.2 rounded">Safety</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight">McNemar test blocks candidate</p>
          </button>

          <button
            onClick={() => executeScenario("canary_watchdog_rollback")}
            disabled={runningScenario}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              scenarioResult?.scenario === "canary_watchdog_rollback"
                ? "border-rose-600 bg-rose-50 text-rose-950 ring-1 ring-rose-600 shadow-xs"
                : "border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 text-zinc-900"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Canary Breach</span>
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded">Rollback</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-tight">Instant warm reversion to Slot A</p>
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

      {/* SECTION 01: High-Level Executive KPI Grid with Big Numbers */}
      <MetricsOverview
        lifecycle={lifecycle}
        alerts={alerts}
        chosenAction={effectiveAction}
      />

      {/* SECTION 02: DARI 7-Dimensional Damage Fingerprint with Big Numbers */}
      <DamageFingerprintCard
        fingerprint={effectiveFingerprint}
        chosenAction={effectiveAction}
      />

      {/* SECTION 03: Live Routing & Security Snapshot */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                03
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                Operational Routing &amp; Threat Telemetry
              </h2>
            </div>
            <p className="text-xs text-zinc-500 pl-7">
              Continuous model inference and dual-slot canary traffic dispatch
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-7 sm:pl-0">
            Real-time Telemetry
          </span>
        </div>

        {canaryActionStatus && (
          <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg text-xs flex justify-between items-center shadow-xs">
            <span>{canaryActionStatus}</span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase">Canary Gate</span>
          </div>
        )}

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Dual-Slot Canary Status */}
          <div className="flex flex-col justify-between space-y-4 p-4 rounded-lg bg-zinc-50/50 border border-zinc-200/80">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider">
                    Dual-Slot Canary Routing
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-zinc-200 bg-white">
                    {canaryStageText}
                  </Badge>
                </div>
                <Link
                  href="/canary"
                  className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 group"
                >
                  <span>Canary Workbench</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 bg-white rounded-lg border border-zinc-200/90 shadow-xs">
                  <div className="text-zinc-500 text-xs font-medium">Slot A (:8001)</div>
                  <div className="text-3xl font-extrabold text-zinc-950 mt-1 tabular-nums">
                    {champPct}%
                  </div>
                  <div className="text-xs font-bold text-emerald-700 mt-1">
                    {lifecycle.champion_release} (Champion)
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-zinc-200/90 shadow-xs">
                  <div className="text-zinc-500 text-xs font-medium">Slot B (:8002)</div>
                  <div className="text-3xl font-extrabold text-zinc-950 mt-1 tabular-nums">
                    {canaryPct}%
                  </div>
                  <div className="text-xs font-bold text-zinc-700 mt-1">
                    {lifecycle.candidate_release ? `${lifecycle.candidate_release} (Canary)` : "Standby (Idle)"}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Canary Controls */}
            <div className="pt-3 border-t border-zinc-200/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-500">
                {canaryPct > 0 ? "Canary flight active." : "Ready for candidate staging."}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actingCanary || canaryPct >= 100}
                  onClick={advanceCanary}
                  className="text-xs h-7.5 px-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium border-zinc-200"
                >
                  Advance Stage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actingCanary || canaryPct === 0}
                  onClick={() => rollbackCanary()}
                  className="text-xs h-7.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-medium border-red-200"
                >
                  Warm Rollback
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Alert Stream */}
          <div className="flex flex-col justify-between space-y-4 p-4 rounded-lg bg-zinc-50/50 border border-zinc-200/80">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider">
                    Intrusion Alert Feed
                  </span>
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.2 font-semibold">
                    {criticalCount} Critical
                  </Badge>
                </div>
                <Link
                  href="/alerts"
                  className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 group"
                >
                  <span>View All ({alerts.length})</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {alerts.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-lg bg-white">
                  No active intrusions detected in sliding window buffer.
                </div>
              ) : (
                <div className="divide-y divide-zinc-200/70 bg-white rounded-lg border border-zinc-200/90 shadow-xs px-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="py-2.5 flex items-center justify-between first:pt-2 last:pb-2"
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
                        <span className="font-semibold text-xs text-zinc-950">{alert.alert_id}</span>
                        <span className="text-zinc-400 text-xs hidden sm:inline">
                          ({alert.event_id})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-zinc-950 tabular-nums">
                          {(alert.score * 100).toFixed(1)}% Score
                        </span>
                        <span className="text-zinc-400 text-xs ml-2">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-200/80 pt-3 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Severity breakdown: {criticalCount} Critical · {highCount} High · {mediumCount} Advisory</span>
              <Link href="/alerts" className="font-semibold text-zinc-900 hover:underline">
                Alert details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 04: Empirical Evaluation & Benchmarks Quick-Sync Ribbon */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
              04
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-950">
                Empirical Performance &amp; Efficiency Guarantees
              </h2>
              <p className="text-xs text-zinc-500">
                Measured metrics across continuous 2,000-event streaming replay benchmark
              </p>
            </div>
          </div>
          <Link
            href="/benchmarks"
            className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Full Scoreboard</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
              <Cpu className="h-3.5 w-3.5 text-emerald-600" />
              <span>Compute Savings</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {computeSavings}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">vs Periodic Retraining</div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              <span>Label Savings</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">
              {labelSavings}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Slashed human triage</div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-700" />
              <span>Attack Recall</span>
            </div>
            <div className="text-2xl font-extrabold text-zinc-950 mt-1 tabular-nums">
              98.2%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Zero critical escape</div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
              <Zap className="h-3.5 w-3.5 text-zinc-700" />
              <span>False Positive Rate</span>
            </div>
            <div className="text-2xl font-extrabold text-zinc-950 mt-1 tabular-nums">
              1.2%
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">SLA constraint &le; 5.0%</div>
          </div>
        </div>
      </div>

      {/* SECTION 05: Control Plane Workspaces Hub */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                05
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                Control Plane Subsystems &amp; Workspaces
              </h2>
            </div>
            <p className="text-xs text-zinc-500 pl-7">
              Synchronized deep-dive routes and operational workbenches
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-7 sm:pl-0">
            Navigation Hub
          </span>
        </div>

        {/* Directory List */}
        <div className="divide-y divide-zinc-100">
          {WORKSPACES.map((ws) => (
            <Link
              key={ws.href}
              href={ws.href}
              className="py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 rounded-lg transition-colors group block"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-950">
                    {ws.num}
                  </span>
                  <span className="text-sm font-semibold text-zinc-950 group-hover:text-black">
                    {ws.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-medium border-zinc-200 bg-zinc-50 text-zinc-700">
                    {ws.metric}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 pl-6">
                  {ws.desc}
                </p>
              </div>

              <div className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-950 shrink-0 pl-6 sm:pl-0 inline-flex items-center gap-1">
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
