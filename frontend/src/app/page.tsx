"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OverviewPage() {
  const { lifecycle, alerts } = useDashboard();

  const canaryPct = Math.round(lifecycle.canary_weight * 100);

  return (
    <div className="space-y-6">
      {/* High-Level Executive KPI Grid */}
      <MetricsOverview lifecycle={lifecycle} alerts={alerts} />

      {/* DARI 7-Dimensional Damage Fingerprint */}
      <DamageFingerprintCard
        fingerprint={lifecycle.last_fingerprint}
        chosenAction={lifecycle.chosen_action}
      />

      {/* Two-Column Spacious Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canary Snapshot Card */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                    ROUTING
                  </span>
                  <CardTitle className="text-sm font-bold font-mono">
                    Canary Traffic Routing Snapshot
                  </CardTitle>
                </div>
                <CardDescription className="mt-1 font-mono text-[11px]">
                  Dual-slot serving architecture: Slot A (:8001) and Slot B (:8002).
                </CardDescription>
              </div>
              <Link
                href="/canary"
                className="text-xs font-mono font-medium text-zinc-900 hover:underline"
              >
                [ OPEN CONTROLLER → ]
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 font-mono text-xs space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                <div className="text-zinc-600 text-[11px]">Slot A (Champion)</div>
                <div className="text-base font-bold text-zinc-950 mt-1">
                  {lifecycle.champion_release}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                  {100 - canaryPct}% Serving Traffic
                </div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                <div className="text-zinc-600 text-[11px]">Slot B (Canary)</div>
                <div className="text-base font-bold text-zinc-950 mt-1">
                  {lifecycle.candidate_release || "Standby"}
                </div>
                <div className="text-[11px] text-zinc-700 font-semibold mt-1">
                  {canaryPct}% Serving Traffic
                </div>
              </div>
            </div>
            <div className="text-[11px] text-zinc-600 pt-1">
              Staged rollout schedule: 5% → 25% → 50% → 100% with automated sub-second watchdog rollback.
            </div>
          </CardContent>
        </Card>

        {/* Quick Threat Snapshot Card */}
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                    SECURITY
                  </span>
                  <CardTitle className="text-sm font-bold font-mono">
                    Recent Intrusion Detections
                  </CardTitle>
                </div>
                <CardDescription className="mt-1 font-mono text-[11px]">
                  Real-time sliding window: {alerts.length} advisory alerts committed.
                </CardDescription>
              </div>
              <Link
                href="/alerts"
                className="text-xs font-mono font-medium text-zinc-900 hover:underline"
              >
                [ VIEW ALL ALERTS → ]
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 font-mono text-xs">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                NO ACTIVE INTRUSIONS. SYSTEM NOMINAL.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "high"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[9px] uppercase px-1 py-0 font-mono"
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-semibold text-zinc-900">{alert.alert_id}</span>
                      <span className="text-zinc-500 text-[11px]">({alert.event_id})</span>
                    </div>
                    <span className="font-bold text-zinc-950">
                      {(alert.score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Launchpad to other routes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          href="/scenarios"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 transition-all font-mono text-xs space-y-1 block"
        >
          <div className="font-bold text-zinc-950">[ 03 ] Drift Simulator →</div>
          <p className="text-zinc-600 text-[11px] font-sans">
            Inject synthetic boundary shift, cluster attacks, and verify self-healing invariants.
          </p>
        </Link>

        <Link
          href="/ingestion"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 transition-all font-mono text-xs space-y-1 block"
        >
          <div className="font-bold text-zinc-950">[ 04 ] Packet Ingestion Probe →</div>
          <p className="text-zinc-600 text-[11px] font-sans">
            Inject TON_IoT 5-feature packets to test stream consumer and serving latency.
          </p>
        </Link>

        <Link
          href="/benchmarks"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 transition-all font-mono text-xs space-y-1 block"
        >
          <div className="font-bold text-zinc-950">[ 05 ] Empirical Scoreboard →</div>
          <p className="text-zinc-600 text-[11px] font-sans">
            Compare DARI against periodic retrain, drift retrain, and fixed baseline policies.
          </p>
        </Link>
      </div>
    </div>
  );
}
