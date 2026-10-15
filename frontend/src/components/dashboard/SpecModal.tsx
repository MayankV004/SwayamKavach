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
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
            01
          </span>
          <DialogTitle className="text-base sm:text-lg font-bold text-zinc-950">
            DARI System Architecture &amp; Invariants
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-zinc-500 pl-7">
          Damage-Aware Retraining &amp; Intervention policy guarantees and operational lifecycle rules
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-xs">
        {/* Core Invariant 1 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950 text-sm">
              Invariant 1: Drift Separation
            </span>
            <Badge variant="outline" className="text-xs bg-white font-medium">
              Drift ≠ Retrain
            </Badge>
          </div>
          <p className="text-zinc-600 text-xs leading-relaxed">
            Distribution drift (D_X) alone must NEVER trigger Level A3 full model retraining. When security recall (D_Y) remains uncompromised, system persists in Level A0 (nominal monitoring).
          </p>
        </div>

        {/* Core Invariant 2 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950 text-sm">
              Invariant 2: Lowest Feasible Intervention
            </span>
            <Badge variant="outline" className="text-xs bg-white font-medium">
              A0 → A1 → A2 → A3
            </Badge>
          </div>
          <p className="text-zinc-600 text-xs leading-relaxed">
            DARI always selects the lowest intervention ladder rung that satisfies security bounds. Hard constraints filter infeasible actions before utility scoring.
          </p>
        </div>

        {/* Core Invariant 3 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950 text-sm">
              Invariant 3: Zero Promotion Without Statistical Pass
            </span>
            <Badge variant="destructive" className="text-xs font-semibold">
              Hard Gate
            </Badge>
          </div>
          <p className="text-zinc-600 text-xs leading-relaxed">
            No candidate model is promoted simply because training completed. Candidates must pass statistical superiority and critical-class recall tests on held-out splits.
          </p>
        </div>

        {/* Core Invariant 4 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-950 text-sm">
              Invariant 4: Dual-Slot Canary &amp; Warm Rollback
            </span>
            <Badge variant="purple" className="text-xs font-semibold">
              5% → 25% → 50% → 100%
            </Badge>
          </div>
          <p className="text-zinc-600 text-xs leading-relaxed">
            The previous champion model remains warm in its serving slot throughout canary evaluation. Any SLA breach or watchdog alarm executes an immediate 0-downtime rollback.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="default"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold"
        >
          Close Specification
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
