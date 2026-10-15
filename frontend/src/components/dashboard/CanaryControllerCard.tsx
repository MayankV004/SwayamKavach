"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LifecycleState } from "@/types/contracts";

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
    <Card className="border-zinc-200 bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                ROUTING
              </span>
              <CardTitle className="text-sm font-bold font-mono">
                Two-Slot Canary Deployment Controller
              </CardTitle>
            </div>
            <CardDescription className="mt-1 font-mono text-[11px]">
              Multi-stage traffic controller: 5% → 25% → 50% → 100% with immediate warm rollback.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-zinc-300 bg-zinc-50">
            Canary Weight: {canaryPct}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Slot Traffic Distribution visualizer */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          {/* Slot A */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="font-semibold text-zinc-900">Serving Slot A (:8001)</span>
              <Badge variant={slotAIsChamp ? "default" : "purple"} className="text-[10px] px-1.5 py-0">
                {slotAIsChamp ? "Champion" : "Canary"}
              </Badge>
            </div>
            <div className="text-base font-bold text-zinc-950 mt-1">
              {slotAIsChamp ? lifecycle.champion_release : lifecycle.candidate_release || "Idle"}
            </div>
            <div className="text-xs text-zinc-600 mt-1 font-sans">
              Routing Weight: <span className="font-semibold font-mono text-zinc-900">{slotAWeight}%</span>
            </div>
            <Progress value={slotAWeight} className="h-1.5 mt-2 bg-zinc-200" indicatorClassName="bg-zinc-900" />
          </div>

          {/* Slot B */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60">
            <div className="flex items-center justify-between text-zinc-600 mb-1">
              <span className="font-semibold text-zinc-900">Serving Slot B (:8002)</span>
              <Badge variant={!slotAIsChamp ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                {!slotAIsChamp ? "Champion" : "Canary"}
              </Badge>
            </div>
            <div className="text-base font-bold text-zinc-950 mt-1">
              {!slotAIsChamp ? lifecycle.champion_release : lifecycle.candidate_release || "Standby"}
            </div>
            <div className="text-xs text-zinc-600 mt-1 font-sans">
              Routing Weight: <span className="font-semibold font-mono text-zinc-900">{slotBWeight}%</span>
            </div>
            <Progress value={slotBWeight} className="h-1.5 mt-2 bg-zinc-200" indicatorClassName="bg-zinc-900" />
          </div>
        </div>

        {/* Feedback message banner */}
        {canaryActionStatus && (
          <div className="p-2.5 rounded-lg text-xs bg-zinc-100 border border-zinc-200 text-zinc-800 font-mono animate-fade-in">
            [ STATUS ]: {canaryActionStatus}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="default"
            size="sm"
            onClick={onAdvanceCanary}
            disabled={actingCanary || !lifecycle.candidate_release}
            className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs font-medium"
          >
            {actingCanary ? "UPDATING ROUTING..." : "ADVANCE CANARY STAGE (5% → 25% → 50% → 100%)"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRollbackCanary}
            disabled={actingCanary}
            className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 font-mono text-xs font-medium"
            title="Immediately restore 100% traffic to Champion"
          >
            WARM ROLLBACK (100% CHAMPION)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
