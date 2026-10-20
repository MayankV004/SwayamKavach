"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LifecycleState } from "@/types/contracts";
import { RotateCcw, ArrowRight, GitFork, Server } from "lucide-react";

interface CanaryControllerCardProps {
  lifecycle: LifecycleState;
  actingCanary: boolean;
  canaryActionStatus: string | null;
  onAdvanceCanary: () => void;
  onRollbackCanary: () => void;
  onResetLifecycle?: () => void;
}

export function CanaryControllerCard({
  lifecycle,
  actingCanary,
  canaryActionStatus,
  onAdvanceCanary,
  onRollbackCanary,
  onResetLifecycle,
}: CanaryControllerCardProps) {
  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const champPct = 100 - canaryPct;

  const isSlotAPrimary = lifecycle.active_slot === "A";
  const slotAIsChamp = isSlotAPrimary;
  const slotAWeight = slotAIsChamp ? champPct : canaryPct;
  const slotBWeight = slotAIsChamp ? canaryPct : champPct;

  const stageNumber =
    canaryPct === 0
      ? 0
      : canaryPct <= 5
      ? 1
      : canaryPct <= 25
      ? 2
      : canaryPct <= 50
      ? 3
      : 4;

  return (
    <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle overflow-hidden">
      <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                <GitFork className="h-3.5 w-3.5 text-white" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Two-Slot Canary Deployment Controller
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
              Multi-stage traffic routing controller: 5% → 25% → 50% → 100% with immediate warm rollback
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] self-start sm:self-auto shadow-2xs">
            Canary Weight: <span className="font-extrabold text-[#25232B] dark:text-[#F2F1F6] ml-1 tabular-nums">{canaryPct}%</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Slot Traffic Distribution visualizer with Big Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Slot A */}
          <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
                <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">Serving Slot A (:8001)</span>
              </div>
              <Badge variant={slotAIsChamp ? "default" : "purple"} className="text-xs px-2.5 py-0.5 shadow-2xs font-semibold">
                {slotAIsChamp ? "Champion (Active)" : "Canary (Staged)"}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
                {slotAWeight}%
              </div>
              <div className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">
                {slotAIsChamp ? lifecycle.champion_release : lifecycle.candidate_release || "Idle"}
              </div>
            </div>
            <div className="mt-3">
              <Progress value={slotAWeight} className="h-2 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden" indicatorClassName={slotAIsChamp ? "bg-emerald-600 dark:bg-emerald-500" : "bg-[#E76552]"} />
            </div>
          </div>

          {/* Slot B */}
          <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
                <span className="font-bold text-xs text-[#25232B] dark:text-[#F2F1F6]">Serving Slot B (:8002)</span>
              </div>
              <Badge variant={!slotAIsChamp ? "default" : "secondary"} className="text-xs px-2.5 py-0.5 shadow-2xs font-semibold">
                {!slotAIsChamp ? "Champion (Active)" : "Canary (Standby)"}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
                {slotBWeight}%
              </div>
              <div className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">
                {!slotAIsChamp ? lifecycle.champion_release : lifecycle.candidate_release || "Standby (Idle)"}
              </div>
            </div>
            <div className="mt-3">
              <Progress value={slotBWeight} className="h-2 bg-[#EAE7ED] dark:bg-[#282534] rounded-full overflow-hidden" indicatorClassName={!slotAIsChamp ? "bg-emerald-600 dark:bg-emerald-500" : "bg-[#E76552]"} />
            </div>
          </div>
        </div>

        {/* 4-Stage Canary Stepper Pill Rail */}
        <div className="p-4 rounded-2xl bg-[#F5F4F7] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6]">Canary Staging Progress</span>
            <span className="text-[#85818D] dark:text-[#A5A0AF] font-medium">Stage {stageNumber} of 4</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className={`p-2.5 rounded-xl border text-center transition-all ${canaryPct >= 5 ? "bg-white dark:bg-[#16151D] border-[#E76552] dark:border-[#E76552] shadow-2xs ring-1 ring-[#E76552]/20" : "bg-white/50 dark:bg-[#16151D]/50 border-[#EAE7ED] dark:border-[#282534] opacity-60"}`}>
              <div className="text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">Stage 1</div>
              <div className="text-xs font-extrabold text-[#25232B] dark:text-[#F2F1F6]">5% Pilot</div>
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition-all ${canaryPct >= 25 ? "bg-white dark:bg-[#16151D] border-[#E76552] dark:border-[#E76552] shadow-2xs ring-1 ring-[#E76552]/20" : "bg-white/50 dark:bg-[#16151D]/50 border-[#EAE7ED] dark:border-[#282534] opacity-60"}`}>
              <div className="text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">Stage 2</div>
              <div className="text-xs font-extrabold text-[#25232B] dark:text-[#F2F1F6]">25% Staged</div>
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition-all ${canaryPct >= 50 ? "bg-white dark:bg-[#16151D] border-[#E76552] dark:border-[#E76552] shadow-2xs ring-1 ring-[#E76552]/20" : "bg-white/50 dark:bg-[#16151D]/50 border-[#EAE7ED] dark:border-[#282534] opacity-60"}`}>
              <div className="text-[10px] uppercase font-bold text-[#85818D] dark:text-[#A5A0AF]">Stage 3</div>
              <div className="text-xs font-extrabold text-[#25232B] dark:text-[#F2F1F6]">50% Split</div>
            </div>
            <div className={`p-2.5 rounded-xl border text-center transition-all ${canaryPct >= 100 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-300 shadow-2xs" : "bg-white/50 dark:bg-[#16151D]/50 border-[#EAE7ED] dark:border-[#282534] opacity-60"}`}>
              <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">Stage 4</div>
              <div className="text-xs font-extrabold text-[#25232B] dark:text-[#F2F1F6]">100% Promo</div>
            </div>
          </div>
        </div>

        {/* Feedback message banner */}
        {canaryActionStatus && (
          <div className="p-3.5 rounded-2xl text-xs bg-[#FAF9FC] dark:bg-[#1B1924] text-[#25232B] dark:text-[#F2F1F6] border border-[#EAE7ED] dark:border-[#282534] flex items-center justify-between shadow-2xs animate-fade-in">
            <span className="font-medium">Controller Status: {canaryActionStatus}</span>
            <span className="text-[10px] text-[#E76552] font-semibold uppercase">Updated</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="default"
            size="sm"
            onClick={onAdvanceCanary}
            disabled={actingCanary || canaryPct >= 100}
            className="flex-1 bg-[#E76552] hover:bg-[#D8523E] text-white text-xs font-bold h-9.5 rounded-full gap-2 shadow-coral-soft cursor-pointer active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="h-4 w-4" />
            <span>
              {actingCanary
                ? "Updating Routing Weights..."
                : canaryPct === 0
                ? "Stage Candidate R2 (5% Pilot)"
                : canaryPct === 5
                ? "Advance Canary Stage (→ 25%)"
                : canaryPct === 25
                ? "Advance Canary Stage (→ 50%)"
                : canaryPct === 50
                ? "Advance to Promotion (→ 100% Champion)"
                : "Canary Flight Complete (100% Promoted)"}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRollbackCanary}
            disabled={actingCanary || canaryPct === 0}
            className="border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold h-9.5 rounded-full gap-2 cursor-pointer shadow-2xs"
            title="Immediately restore 100% traffic to Champion"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Warm Rollback (100% Champion)</span>
          </Button>

          {onResetLifecycle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetLifecycle}
              disabled={actingCanary}
              className="border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] text-xs font-bold h-9.5 rounded-full gap-2 cursor-pointer shadow-2xs"
              title="Reset deployment back to baseline: Champion R1 on Slot A"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Baseline (Slot A / R1)</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
