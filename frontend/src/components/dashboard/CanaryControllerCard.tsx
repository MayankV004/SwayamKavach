"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LifecycleState } from "@/types/contracts";
import { RotateCcw, ArrowRight } from "lucide-react";

interface CanaryControllerCardProps {
  lifecycle: LifecycleState;
  actingCanary: boolean;
  canaryActionStatus: string | null;
  onAdvanceCanary: () => void;
  onRollbackCanary: () => void;
}

export function CanaryControllerCard({
  lifecycle,
  actingCanary,
  canaryActionStatus,
  onAdvanceCanary,
  onRollbackCanary,
}: CanaryControllerCardProps) {
  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const champPct = 100 - canaryPct;

  const isSlotAPrimary = lifecycle.active_slot === "A";
  const slotAIsChamp = isSlotAPrimary;
  const slotAWeight = slotAIsChamp ? champPct : canaryPct;
  const slotBWeight = slotAIsChamp ? canaryPct : champPct;

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardHeader className="pb-4 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                02
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                Two-Slot Canary Deployment Controller
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-zinc-500 pl-7">
              Multi-stage traffic routing controller: 5% → 25% → 50% → 100% with immediate warm rollback
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold border-zinc-200 bg-zinc-50 self-start sm:self-auto">
            Canary Weight: <span className="font-bold text-zinc-950 ml-1 tabular-nums">{canaryPct}%</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Slot Traffic Distribution visualizer with Big Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Slot A */}
          <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-zinc-900">Serving Slot A (:8001)</span>
              <Badge variant={slotAIsChamp ? "default" : "purple"} className="text-xs px-2 py-0.5">
                {slotAIsChamp ? "Champion" : "Canary"}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl font-extrabold text-zinc-950 tabular-nums">
                {slotAWeight}%
              </div>
              <div className="text-xs font-bold text-zinc-700">
                {slotAIsChamp ? lifecycle.champion_release : lifecycle.candidate_release || "Idle"}
              </div>
            </div>
            <div className="mt-3">
              <Progress value={slotAWeight} className="h-2 bg-zinc-200/80 rounded-full" indicatorClassName="bg-zinc-950" />
            </div>
          </div>

          {/* Slot B */}
          <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-zinc-900">Serving Slot B (:8002)</span>
              <Badge variant={!slotAIsChamp ? "default" : "secondary"} className="text-xs px-2 py-0.5">
                {!slotAIsChamp ? "Champion" : "Canary"}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl font-extrabold text-zinc-950 tabular-nums">
                {slotBWeight}%
              </div>
              <div className="text-xs font-bold text-zinc-700">
                {!slotAIsChamp ? lifecycle.champion_release : lifecycle.candidate_release || "Standby"}
              </div>
            </div>
            <div className="mt-3">
              <Progress value={slotBWeight} className="h-2 bg-zinc-200/80 rounded-full" indicatorClassName="bg-zinc-950" />
            </div>
          </div>
        </div>

        {/* Feedback message banner */}
        {canaryActionStatus && (
          <div className="p-3 rounded-lg text-xs bg-zinc-900 text-zinc-100 border border-zinc-800 flex items-center justify-between shadow-xs animate-fade-in">
            <span className="font-medium">Controller Status: {canaryActionStatus}</span>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase">Updated</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="default"
            size="sm"
            onClick={onAdvanceCanary}
            disabled={actingCanary || !lifecycle.candidate_release}
            className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold h-9 gap-2 shadow-xs"
          >
            <ArrowRight className="h-4 w-4" />
            <span>
              {actingCanary ? "Updating Routing Weights..." : "Advance Canary Stage (5% → 25% → 50% → 100%)"}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRollbackCanary}
            disabled={actingCanary}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 text-xs font-semibold h-9 gap-2"
            title="Immediately restore 100% traffic to Champion"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Warm Rollback (100% Champion)</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
