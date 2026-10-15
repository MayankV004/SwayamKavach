"use client";

import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SpecModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpecModal({ open, onOpenChange }: SpecModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
            DARI
          </span>
          <DialogTitle className="text-base font-bold font-mono">
            DARI System Architecture &amp; Invariants
          </DialogTitle>
        </div>
        <DialogDescription className="font-mono text-[11px]">
          Damage-Aware Retraining &amp; Intervention (DARI) policy guarantees and operational lifecycle rules.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-xs font-mono">
        {/* Core Invariant 1 */}
        <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950">
              Invariant 1: Drift Separation
            </span>
            <Badge variant="outline" className="text-[10px] bg-white font-mono">
              Drift ≠ Retrain
            </Badge>
          </div>
          <p className="text-zinc-600 text-[11px] leading-relaxed">
            Distribution drift (D_X) alone must NEVER trigger Level A3 full model retraining. When security recall (D_Y) remains uncompromised, system persists in Level A0 (nominal monitoring).
          </p>
        </div>

        {/* Core Invariant 2 */}
        <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950">
              Invariant 2: Lowest Feasible Intervention
            </span>
            <Badge variant="outline" className="text-[10px] bg-white font-mono">
              A0 → A1 → A2 → A3
            </Badge>
          </div>
          <p className="text-zinc-600 text-[11px] leading-relaxed">
            DARI always selects the lowest intervention ladder rung that satisfies security bounds. Hard constraints filter infeasible actions before utility scoring.
          </p>
        </div>

        {/* Core Invariant 3 */}
        <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950">
              Invariant 3: Zero Promotion Without Statistical Pass
            </span>
            <Badge variant="destructive" className="text-[10px] font-mono">
              Hard Gate
            </Badge>
          </div>
          <p className="text-zinc-600 text-[11px] leading-relaxed">
            No candidate model is promoted simply because training completed. Candidates must pass statistical superiority and critical-class recall tests on held-out splits.
          </p>
        </div>

        {/* Core Invariant 4 */}
        <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950">
              Invariant 4: Dual-Slot Canary &amp; Warm Rollback
            </span>
            <Badge variant="purple" className="text-[10px] font-mono">
              5% → 25% → 50% → 100%
            </Badge>
          </div>
          <p className="text-zinc-600 text-[11px] leading-relaxed">
            The previous champion model remains warm in its serving slot throughout canary evaluation. Any SLA breach or watchdog alarm executes an immediate 0-downtime rollback.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="default"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs"
        >
          CLOSE SPECIFICATION
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
