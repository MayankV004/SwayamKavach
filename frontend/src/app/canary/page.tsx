"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { CanaryControllerCard } from "@/components/dashboard/CanaryControllerCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, Layers, Server } from "lucide-react";

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
        <Card className="border-zinc-200/90 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-zinc-600" />
              <CardTitle className="text-base font-bold text-zinc-950">
                Canary Stage Schedule &amp; Verification
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500">
              Multi-phase statistical validation schedule before production promotion
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 1: Shadow Canary (5%)</span>
                <Badge variant="outline" className="text-[10px] bg-white">Window 1</Badge>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Initial pilot probe. 95% traffic stays on Champion. Verifies latency and error budgets.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 2: Staged 25%</span>
                <Badge variant="outline" className="text-[10px] bg-white">Window 2</Badge>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Statistically powered sample to verify class recall and false alarm bounds on active flows.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 3: Expanded 50%</span>
                <Badge variant="outline" className="text-[10px] bg-white">Window 3</Badge>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Symmetric load testing across Slot A and Slot B before final promotion authorization.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1">
              <div className="flex items-center justify-between font-semibold text-zinc-900">
                <span>Stage 4: Full Promotion 100%</span>
                <Badge variant="default" className="text-[10px] bg-zinc-950 text-white">Promoted</Badge>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Candidate promoted to Champion. Previous champion kept warm in standby slot for instant rollback.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/90 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-600" />
              <CardTitle className="text-base font-bold text-zinc-950">
                Automated Watchdog &amp; SLA Guardrails
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500">
              Safety invariants that trigger instant zero-downtime warm rollback
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            <div className="p-3.5 rounded-lg border border-red-200/80 bg-red-50/40 space-y-1">
              <div className="flex items-center gap-2 text-red-900 font-bold">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Critical Class Recall Invariant</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed pl-6">
                If the candidate model misses more than 1% of critical security attack classes, traffic routes back to Champion immediately.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-amber-200/80 bg-amber-50/40 space-y-1">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>False Positive Rate (FPR) Threshold</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed pl-6">
                If candidate false alarm rate exceeds 1.5x of Champion baseline, rollout halts and reverts automatically.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-900 font-bold">
                <Server className="h-4 w-4 text-zinc-600" />
                <span>Active Serving Endpoints</span>
              </div>
              <div className="text-xs text-zinc-600 space-y-1 pl-6 pt-0.5">
                <div>Primary Slot A: <span className="font-semibold text-zinc-800">http://localhost:8001/health</span></div>
                <div>Standby Slot B: <span className="font-semibold text-zinc-800">http://localhost:8002/health</span></div>
                <div>Routing Authority: <span className="font-semibold text-zinc-800">FastAPI Control Plane (:8000)</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
