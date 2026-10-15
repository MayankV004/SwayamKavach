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
import { MLFLOW_URL } from "@/lib/api";
import { ExternalLink } from "lucide-react";

interface ModelLineageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelLineageModal({ open, onOpenChange }: ModelLineageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
            07
          </span>
          <DialogTitle className="text-base sm:text-lg font-bold text-zinc-950">
            Release R1 Lineage &amp; MLflow Registry Manifest
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-zinc-500 pl-7">
          Cryptographic dataset provenance, estimator parameters, and model registry alias tags
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
        {/* MLflow Registry Card */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
            <span className="font-bold text-zinc-950 text-sm">
              MLflow Model Registry Metadata
            </span>
            <Badge variant="default" className="text-xs bg-zinc-950 text-white font-semibold">
              Alias: champion
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-zinc-600">
            <div>Registered Model: <span className="font-semibold text-zinc-900">swayamkavach_ids</span></div>
            <div>Registry Version: <span className="font-semibold text-zinc-900">Version 1</span></div>
            <div>Tracking URI: <span className="font-mono text-[11px] text-zinc-800">sqlite:///mlflow.db</span></div>
            <div>Estimator: <span className="font-semibold text-zinc-800">HistGradientBoosting</span></div>
          </div>
        </div>

        {/* Cryptographic Artifact Hashes */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-2 text-xs">
          <div className="font-bold text-zinc-950 text-sm border-b border-zinc-200/80 pb-2">
            Artifact Checksums &amp; DVC References
          </div>
          <div className="text-zinc-500">
            Bundle SHA256: <span className="text-zinc-800 font-mono text-[11px] break-all">3639259c6fcc97ab90b13384fc9d44ce81cad8a34a0d9fcd3eaffab7fe1e6f39</span>
          </div>
          <div className="text-zinc-500">
            Dataset Source: <span className="text-zinc-800 font-medium">ToN_IoT Network Telemetry (147,730 training samples)</span>
          </div>
          <div className="text-zinc-500">
            Decision Threshold: <span className="font-bold text-zinc-900">0.4200 (Precision-recall tuned)</span>
          </div>
        </div>

        {/* Sealed Evaluation Scores with Big Numbers */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 space-y-3">
          <div className="font-bold text-zinc-950 text-sm border-b border-zinc-200/80 pb-2">
            Sealed Holdout Test Set Performance
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 rounded-lg bg-white border border-zinc-200/90 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">Test Accuracy</div>
              <div className="text-zinc-950 font-extrabold text-2xl mt-1 tabular-nums">99.66%</div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-zinc-200/90 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">Test Recall</div>
              <div className="text-zinc-950 font-extrabold text-2xl mt-1 tabular-nums">99.78%</div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-zinc-200/90 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">Test F1 Score</div>
              <div className="text-zinc-950 font-extrabold text-2xl mt-1 tabular-nums">0.9978</div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-zinc-200/90 shadow-xs">
              <div className="text-zinc-500 text-xs font-medium">False Alarm</div>
              <div className="text-emerald-700 font-extrabold text-2xl mt-1 tabular-nums">0.73%</div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="default"
          size="sm"
          onClick={() => window.open(MLFLOW_URL, "_blank", "noopener,noreferrer")}
          className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold gap-1.5"
        >
          <span>Open Full Run in MLflow</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
