"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MLFLOW_URL } from "@/lib/api";
import { ExternalLink, Layers, Copy, Check } from "lucide-react";

interface ModelLineageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelLineageModal({ open, onOpenChange }: ModelLineageModalProps) {
  const [copied, setCopied] = useState(false);
  const hash = "3639259c6fcc97ab90b13384fc9d44ce81cad8a34a0d9fcd3eaffab7fe1e6f39";

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
            <Layers className="h-3.5 w-3.5 text-white" />
          </span>
          <DialogTitle className="text-base sm:text-lg font-bold text-[#25232B] dark:text-[#F2F1F6]">
            Release R1 Lineage &amp; MLflow Registry Manifest
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
          Cryptographic dataset provenance, estimator parameters, and model registry alias tags
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
        {/* MLflow Registry Card */}
        <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#EAE7ED] dark:border-[#282534] pb-2">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">
              MLflow Model Registry Metadata
            </span>
            <Badge variant="default" className="text-xs bg-[#E76552] text-white font-semibold shadow-xs">
              Alias: champion
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-[#85818D] dark:text-[#A5A0AF]">
            <div>Registered Model: <span className="font-semibold text-[#25232B] dark:text-[#F2F1F6]">swayamkavach_ids</span></div>
            <div>Registry Version: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Version 1 (Active)</span></div>
            <div>Tracking URI: <span className="font-mono text-[11px] text-[#25232B] dark:text-[#F2F1F6]">sqlite:///mlflow.db</span></div>
            <div>Estimator: <span className="font-semibold text-[#25232B] dark:text-[#F2F1F6]">HistGradientBoosting</span></div>
          </div>
        </div>

        {/* Cryptographic Artifact Hashes */}
        <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-[#EAE7ED] dark:border-[#282534] pb-2">
            <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">
              Artifact Checksums &amp; DVC References
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#E76552] hover:underline cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copied" : "Copy Hash"}</span>
            </button>
          </div>
          <div className="text-[#85818D] dark:text-[#A5A0AF]">
            Bundle SHA256: <span className="text-[#25232B] dark:text-[#F2F1F6] font-mono text-[11px] break-all">{hash}</span>
          </div>
          <div className="text-[#85818D] dark:text-[#A5A0AF]">
            Dataset Source: <span className="text-[#25232B] dark:text-[#F2F1F6] font-medium">ToN_IoT Network Telemetry (147,730 training samples)</span>
          </div>
          <div className="text-[#85818D] dark:text-[#A5A0AF]">
            Decision Threshold: <span className="font-bold text-[#25232B] dark:text-[#F2F1F6]">0.4200 (Precision-recall tuned)</span>
          </div>
        </div>

        {/* Sealed Evaluation Scores with Big Numbers */}
        <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-3">
          <div className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm border-b border-[#EAE7ED] dark:border-[#282534] pb-2">
            Sealed Holdout Test Set Performance
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
              <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">Test Accuracy</div>
              <div className="text-[#25232B] dark:text-[#F2F1F6] font-extrabold text-2xl mt-1 tabular-nums">99.66%</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
              <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">Test Recall</div>
              <div className="text-[#25232B] dark:text-[#F2F1F6] font-extrabold text-2xl mt-1 tabular-nums">99.78%</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
              <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">Test F1 Score</div>
              <div className="text-[#25232B] dark:text-[#F2F1F6] font-extrabold text-2xl mt-1 tabular-nums">0.9978</div>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
              <div className="text-[#85818D] dark:text-[#A5A0AF] text-xs font-medium">False Alarm</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-2xl mt-1 tabular-nums">0.73%</div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="default"
          size="sm"
          onClick={() => window.open(MLFLOW_URL, "_blank", "noopener,noreferrer")}
          className="bg-[#E76552] hover:bg-[#D8523E] text-white text-xs font-semibold gap-1.5 rounded-full px-4 shadow-coral-soft cursor-pointer active:scale-98 transition-all"
        >
          <span>Open Full Run in MLflow (:5000)</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
