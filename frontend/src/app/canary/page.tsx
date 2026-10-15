"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { CanaryControllerCard } from "@/components/dashboard/CanaryControllerCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CanaryPage() {
  const { lifecycle, actingCanary, canaryActionStatus, advanceCanary, rollbackCanary } =
    useDashboard();

  return (
    <div className="space-y-6">
      {/* Dedicated Canary Controller Card */}
      <CanaryControllerCard
        lifecycle={lifecycle}
        actingCanary={actingCanary}
        canaryActionStatus={canaryActionStatus}
        onAdvanceCanary={advanceCanary}
        onRollbackCanary={rollbackCanary}
      />

      {/* Deep-dive Architecture & Safety Rules for Canary Staging */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold font-mono">
              [ CANARY STAGE SPECIFICATION ]
            </CardTitle>
            <CardDescription className="font-mono text-[11px]">
              Multi-phase statistical validation schedule before promotion.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 font-mono text-xs space-y-3">
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 1: Shadow / Canary 5%</span>
                <Badge variant="outline" className="text-[10px] bg-white">Window 1</Badge>
              </div>
              <p className="text-[11px] text-zinc-600">
                Initial pilot probe. 95% traffic stays on Champion. Verifies latency and error budgets.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 2: Staged 25%</span>
                <Badge variant="outline" className="text-[10px] bg-white">Window 2</Badge>
              </div>
              <p className="text-[11px] text-zinc-600">
                Statistically powered sample to verify class recall and false alarm bounds on active flows.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 3: Expanded 50%</span>
                <Badge variant="outline" className="text-[10px] bg-white">Window 3</Badge>
              </div>
              <p className="text-[11px] text-zinc-600">
                Symmetric load testing across Slot A and Slot B before final promotion authorization.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 4: Full Promotion 100%</span>
                <Badge variant="default" className="text-[10px] bg-zinc-950 text-white">Promoted</Badge>
              </div>
              <p className="text-[11px] text-zinc-600">
                Candidate promoted to Champion. Previous champion kept warm in standby slot for instant rollback.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold font-mono">
              [ AUTOMATED WATCHDOG &amp; SLA RULES ]
            </CardTitle>
            <CardDescription className="font-mono text-[11px]">
              Safety invariants that trigger instant warm rollback.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 font-mono text-xs space-y-3">
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 space-y-1">
              <span className="font-bold text-red-900">Critical Class Recall Drop</span>
              <p className="text-[11px] text-red-800">
                If the candidate model misses more than 1% of critical security attack classes, traffic routes back to Champion immediately.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
              <span className="font-bold text-amber-900">False Positive Rate (FPR) Breach</span>
              <p className="text-[11px] text-amber-800">
                If candidate false alarm rate exceeds 1.5x of Champion baseline, rollout halts and reverts.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-900">Serving Endpoints</span>
              <div className="text-[11px] text-zinc-600 space-y-0.5 pt-1">
                <div>Primary Slot A: http://localhost:8001/health</div>
                <div>Standby Slot B: http://localhost:8002/health</div>
                <div>Routing Authority: FastAPI Control Plane (:8000)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
