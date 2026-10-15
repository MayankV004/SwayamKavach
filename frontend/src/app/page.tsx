"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { Badge } from "@/components/ui/badge";

export default function OverviewPage() {
  const { lifecycle, alerts } = useDashboard();

  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const champPct = 100 - canaryPct;

  const WORKSPACES = [
    {
      num: "02",
      name: "DUAL-SLOT CANARY CONTROLLER",
      desc: "Staged 5% → 25% → 50% → 100% routing across Slot A (:8001) and Slot B (:8002) with warm rollback.",
      href: "/canary",
      metric: `Weight: ${canaryPct}%`,
    },
    {
      num: "03",
      name: "STREAMING DRIFT SIMULATOR",
      desc: "Execute deterministic drift patterns (boundary shift, cluster attack, watchdog breach) to verify DARI invariants.",
      href: "/scenarios",
      metric: "6 Scenarios",
    },
    {
      num: "04",
      name: "TRAFFIC INGESTION PROBE",
      desc: "Submit synthetic TON_IoT 5-feature packets into POST /api/v1/ingestion/batches to inspect queue latency.",
      href: "/ingestion",
      metric: "ton-conn-5-v1",
    },
    {
      num: "05",
      name: "EMPIRICAL BENCHMARKS",
      desc: "Comparative scoreboard over continuous 2,000-event windows (+71.4% compute savings, +93.2% label savings).",
      href: "/benchmarks",
      metric: "DARI vs Baselines",
    },
    {
      num: "06",
      name: "SECURITY AUDIT FEED",
      desc: "Live stream of advisory intrusion records with severity classification and model confidence scores.",
      href: "/alerts",
      metric: `${alerts.length} Incidents`,
    },
    {
      num: "07",
      name: "RELEASE LINEAGE & MLFLOW",
      desc: "Cryptographic bundle hashes, DVC dataset revisions, and registered MLflow model version 1 metadata.",
      href: "/lineage",
      metric: "R1 Champion",
    },
  ];

  return (
    <div className="space-y-10">
      {/* SECTION 01: High-Level Executive KPI Grid (Borderless with hairline dividers) */}
      <MetricsOverview lifecycle={lifecycle} alerts={alerts} />

      {/* SECTION 02: DARI 7-Dimensional Damage Fingerprint (Borderless) */}
      <DamageFingerprintCard
        fingerprint={lifecycle.last_fingerprint}
        chosenAction={lifecycle.chosen_action}
      />

      {/* SECTION 03: Live Routing & Security Snapshot (Borderless split with hairline rule) */}
      <div className="space-y-4">
        {/* Section Separator Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-900 pb-2.5 gap-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-950">
              {"// 03"}
            </span>
            <h2 className="text-sm font-bold font-mono tracking-wider text-zinc-950 uppercase">
              Operational Routing &amp; Threat Telemetry
            </h2>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">
            CONTINUOUS INFERENCE &amp; DUAL-SLOT DISPATCH
          </span>
        </div>

        {/* 2-Column Split Bounded by Hairline Rules */}
        <div className="border-y border-zinc-200 grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-zinc-200 bg-white">
          {/* Left Column: Dual-Slot Canary Status */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-3">
                <span className="font-bold text-zinc-900 uppercase">Dual-Slot Traffic Split</span>
                <Link
                  href="/canary"
                  className="text-zinc-600 hover:text-zinc-950 hover:underline"
                >
                  [ OPEN CANARY → ]
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-3 bg-zinc-50 border border-zinc-200">
                  <div className="text-zinc-500 text-[10px] uppercase">Slot A (:8001)</div>
                  <div className="text-lg font-bold text-zinc-950 mt-1">
                    {lifecycle.champion_release}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold mt-1">
                    {champPct}% TRAFFIC (CHAMPION)
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 border border-zinc-200">
                  <div className="text-zinc-500 text-[10px] uppercase">Slot B (:8002)</div>
                  <div className="text-lg font-bold text-zinc-950 mt-1">
                    {lifecycle.candidate_release || "STANDBY"}
                  </div>
                  <div className="text-xs text-zinc-700 font-semibold mt-1">
                    {canaryPct}% TRAFFIC (CANARY)
                  </div>
                </div>
              </div>
            </div>

            <p className="font-mono text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">
              Automated rollback guarantee: If candidate drops below 99% recall on critical attack classes, traffic reverts 100% to Champion within sub-second watchdog latency.
            </p>
          </div>

          {/* Right Column: Recent Alert Stream */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-3">
                <span className="font-bold text-zinc-900 uppercase">Recent Intrusion Detections</span>
                <Link
                  href="/alerts"
                  className="text-zinc-600 hover:text-zinc-950 hover:underline"
                >
                  [ VIEW ALL ({alerts.length}) → ]
                </Link>
              </div>

              {alerts.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 font-mono text-xs border border-dashed border-zinc-200">
                  NO ACTIVE INTRUSIONS DETECTED.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 font-mono text-xs">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0"
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
                          className="text-[9px] uppercase px-1 py-0 rounded-none font-mono"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="font-semibold text-zinc-950">{alert.alert_id}</span>
                        <span className="text-zinc-400 text-[11px] hidden sm:inline">
                          ({alert.event_id})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-zinc-950">
                          {(alert.score * 100).toFixed(1)}%
                        </span>
                        <span className="text-zinc-400 text-[10px] ml-2">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="font-mono text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">
              Consumer worker process triaging Zeek connection flows via background inference pipeline.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 04: Control Plane Workspaces (Borderless Directory with Hairline Rows) */}
      <div className="space-y-4">
        {/* Section Separator Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-zinc-900 pb-2.5 gap-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-950">
              {"// 04"}
            </span>
            <h2 className="text-sm font-bold font-mono tracking-wider text-zinc-950 uppercase">
              Control Plane Subsystems &amp; Workspaces
            </h2>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">
            DEDICATED DEEP-DIVE ROUTES
          </span>
        </div>

        {/* Directory List with Hairline Row Separators */}
        <div className="border-y border-zinc-200 divide-y divide-zinc-200 bg-white">
          {WORKSPACES.map((ws) => (
            <Link
              key={ws.href}
              href={ws.href}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 transition-colors group block"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-zinc-400 group-hover:text-zinc-950">
                    [ {ws.num} ]
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-950 uppercase tracking-wide">
                    {ws.name}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-none bg-zinc-100 text-zinc-700">
                    {ws.metric}
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-500 pl-8">
                  {ws.desc}
                </p>
              </div>

              <div className="font-mono text-xs font-semibold text-zinc-600 group-hover:text-zinc-950 shrink-0 pl-8 sm:pl-0">
                LAUNCH WORKSPACE →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
