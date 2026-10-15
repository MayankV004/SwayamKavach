"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  Radio,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default function OverviewPage() {
  const {
    lifecycle,
    alerts,
    streamStatus,
    togglingStream,
    streamFeedback,
    toggleReplayStream,
    toggleSnifferStream,
    startBothStreams,
    stopBothStreams,
  } = useDashboard();

  const isReplayRunning = streamStatus?.replay?.is_running ?? false;
  const isSnifferRunning = streamStatus?.sniffer?.is_running ?? false;
  const anyRunning = streamStatus?.any_active ?? false;
  const bothRunning = streamStatus?.both_active ?? false;

  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const champPct = 100 - canaryPct;

  const WORKSPACES = [
    {
      num: "02",
      name: "Dual-Slot Canary Controller",
      desc: "Staged 5% → 25% → 50% → 100% routing across Slot A (:8001) and Slot B (:8002) with instant warm rollback.",
      href: "/canary",
      metric: `Weight: ${canaryPct}%`,
    },
    {
      num: "03",
      name: "Streaming Drift Simulator",
      desc: "Execute deterministic drift patterns (boundary shift, cluster attack, watchdog breach) to verify DARI invariants.",
      href: "/scenarios",
      metric: "6 Scenarios",
    },
    {
      num: "04",
      name: "Traffic Ingestion Probe",
      desc: "Submit synthetic TON_IoT 5-feature packets into POST /api/v1/ingestion/batches to inspect queue latency.",
      href: "/ingestion",
      metric: "ton-conn-5-v1",
    },
    {
      num: "05",
      name: "Empirical Benchmarks",
      desc: "Comparative scoreboard over continuous 2,000-event windows (+71.4% compute savings, +93.2% label savings).",
      href: "/benchmarks",
      metric: "DARI vs Baselines",
    },
    {
      num: "06",
      name: "Security Audit Feed",
      desc: "Live stream of advisory intrusion records with severity classification and model confidence scores.",
      href: "/alerts",
      metric: `${alerts.length} Incidents`,
    },
    {
      num: "07",
      name: "Release Lineage & MLflow",
      desc: "Cryptographic bundle hashes, DVC dataset revisions, and registered MLflow model version 1 metadata.",
      href: "/lineage",
      metric: "R1 Champion",
    },
  ];

  return (
    <div className="space-y-8">
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
                Packets: <span className="font-bold text-zinc-900 tabular-nums">{streamStatus?.sniffer?.packets_captured ?? 0}</span> · Flows: <span className="font-bold text-zinc-900 tabular-nums">{streamStatus?.sniffer?.flows_ingested ?? 0}</span> ({streamStatus?.sniffer?.interface ?? "wlp2s0 (or any)"})
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

      {/* SECTION 01: High-Level Executive KPI Grid with Big Numbers */}
      <MetricsOverview lifecycle={lifecycle} alerts={alerts} />

      {/* SECTION 02: DARI 7-Dimensional Damage Fingerprint with Big Numbers */}
      <DamageFingerprintCard
        fingerprint={lifecycle.last_fingerprint}
        chosenAction={lifecycle.chosen_action}
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

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Dual-Slot Canary Status */}
          <div className="flex flex-col justify-between space-y-4 p-4 rounded-lg bg-zinc-50/50 border border-zinc-200/80">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider">
                  Dual-Slot Traffic Split
                </span>
                <Link
                  href="/canary"
                  className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 group"
                >
                  <span>Configure Canary</span>
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
                    {lifecycle.candidate_release || "Standby (Idle)"}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-200/80 pt-3">
              Automated rollback guarantee: If candidate drops below 99% recall on critical attack classes, traffic reverts 100% to Champion within sub-second watchdog latency.
            </p>
          </div>

          {/* Right Column: Recent Alert Stream */}
          <div className="flex flex-col justify-between space-y-4 p-4 rounded-lg bg-zinc-50/50 border border-zinc-200/80">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider">
                  Recent Intrusion Detections
                </span>
                <Link
                  href="/alerts"
                  className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1 group"
                >
                  <span>View All Alerts ({alerts.length})</span>
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
                      className="py-3 flex items-center justify-between first:pt-2.5 last:pb-2.5"
                    >
                      <div className="flex items-center gap-2.5">
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

            <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-200/80 pt-3">
              Consumer worker process triaging network connection flows via background inference pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 04: Control Plane Workspaces */}
      <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                04
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                Control Plane Subsystems &amp; Workspaces
              </h2>
            </div>
            <p className="text-xs text-zinc-500 pl-7">
              Dedicated deep-dive routes and operational workbenches
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
