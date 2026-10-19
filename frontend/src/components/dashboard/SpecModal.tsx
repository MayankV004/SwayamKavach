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
import { ShieldCheck } from "lucide-react";

interface SpecModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpecModal({ open, onOpenChange }: SpecModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </span>
          <DialogTitle className="text-base sm:text-lg font-bold text-[#25232B] dark:text-[#F2F1F6]">
            DARI System Architecture &amp; Invariants
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
          Damage-Aware Retraining &amp; Intervention policy guarantees and operational lifecycle rules
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-xs">
        {/* Core Invariant 1 */}
        <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">
              Invariant 1: Drift Separation
            </span>
            <Badge variant="outline" className="text-xs border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#85818D] dark:text-[#A5A0AF] font-medium">
              Drift &ne; Retrain
            </Badge>
          </div>
          <p className="text-[#85818D] dark:text-[#A5A0AF] text-xs leading-relaxed">
            Distribution drift (D_X) alone must <strong className="text-[#25232B] dark:text-[#F2F1F6]">NEVER</strong> trigger Level A3 full model retraining. When security recall (D_Y) remains uncompromised, system persists in Level A0 (nominal monitoring).
          </p>
        </div>

        {/* Core Invariant 2 */}
        <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">
              Invariant 2: Lowest Feasible Intervention
            </span>
            <Badge variant="outline" className="text-xs border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#85818D] dark:text-[#A5A0AF] font-medium">
              A0 &rarr; A1 &rarr; A2 &rarr; A3
            </Badge>
          </div>
          <p className="text-[#85818D] dark:text-[#A5A0AF] text-xs leading-relaxed">
            DARI always selects the lowest intervention ladder rung that satisfies security bounds. Hard constraints filter infeasible actions before utility scoring.
          </p>
        </div>

        {/* Core Invariant 3 */}
        <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">
              Invariant 3: Zero Promotion Without Statistical Pass
            </span>
            <Badge variant="destructive" className="text-xs font-semibold">
              Hard Gate
            </Badge>
          </div>
          <p className="text-[#85818D] dark:text-[#A5A0AF] text-xs leading-relaxed">
            No candidate model is promoted simply because training completed. Candidates must pass statistical superiority and critical-class recall tests on held-out splits.
          </p>
        </div>

        {/* Core Invariant 4 */}
        <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">
              Invariant 4: Dual-Slot Canary &amp; Warm Rollback
            </span>
            <Badge variant="purple" className="text-xs font-semibold">
              5% &rarr; 25% &rarr; 50% &rarr; 100%
            </Badge>
          </div>
          <p className="text-[#85818D] dark:text-[#A5A0AF] text-xs leading-relaxed">
            The previous champion model remains warm in its serving slot throughout canary evaluation. Any SLA breach or watchdog alarm executes an immediate 0-downtime rollback.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="default"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="bg-[#E76552] hover:bg-[#D8523E] text-white text-xs font-semibold rounded-full px-5 shadow-coral-soft cursor-pointer active:scale-98 transition-all"
        >
          Close Specification
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
