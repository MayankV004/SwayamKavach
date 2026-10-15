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

interface ModelLineageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelLineageModal({ open, onOpenChange }: ModelLineageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
            LINEAGE
          </span>
          <DialogTitle className="text-base font-bold font-mono">
            Release R1 Lineage &amp; MLflow Registry Manifest
          </DialogTitle>
        </div>
        <DialogDescription className="font-mono text-[11px]">
          Cryptographic dataset provenance, estimator parameters, and model registry alias tags.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs font-mono">
        {/* MLflow Registry Card */}
        <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <span className="font-bold text-zinc-950">
              [ MLFLOW MODEL REGISTRY ]
            </span>
            <Badge variant="default" className="text-[10px] bg-zinc-950 text-white font-mono">
              Alias: champion
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
            <div>Registered Model: <span className="font-semibold text-zinc-900">swayamkavach_ids</span></div>
            <div>Registry Version: <span className="font-semibold text-zinc-900">Version 1</span></div>
            <div>Tracking URI: <span className="text-zinc-800">sqlite:///mlflow.db</span></div>
            <div>Estimator: <span className="text-zinc-800">HistGradientBoosting</span></div>
          </div>
        </div>

        {/* Cryptographic Artifact Hashes */}
        <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1.5 text-[11px]">
          <div className="font-bold text-zinc-900 mb-1">
            [ ARTIFACT CHECKSUMS &amp; DVC REFERENCES ]
          </div>
          <div className="text-zinc-500">
            Bundle SHA256: <span className="text-zinc-800 break-all">3639259c6fcc97ab90b13384fc9d44ce81cad8a34a0d9fcd3eaffab7fe1e6f39</span>
          </div>
          <div className="text-zinc-500">
            Dataset Source: <span className="text-zinc-800">TON_IoT Network Telemetry (147,730 training samples)</span>
          </div>
          <div className="text-zinc-500">
            Decision Threshold: <span className="font-bold text-zinc-900">0.4200 (Precision-recall tuned)</span>
          </div>
        </div>

        {/* Sealed Evaluation Scores */}
        <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50">
          <div className="font-bold text-zinc-900 mb-2">
            [ SEALED HOLDOUT TEST SET PERFORMANCE ]
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-white border border-zinc-200">
              <div className="text-zinc-500 text-[10px]">Test Accuracy</div>
              <div className="text-zinc-950 font-bold text-sm">99.66%</div>
            </div>
            <div className="p-2 rounded bg-white border border-zinc-200">
              <div className="text-zinc-500 text-[10px]">Test Recall</div>
              <div className="text-zinc-950 font-bold text-sm">99.78%</div>
            </div>
            <div className="p-2 rounded bg-white border border-zinc-200">
              <div className="text-zinc-500 text-[10px]">Test F1 Score</div>
              <div className="text-zinc-950 font-bold text-sm">0.9978</div>
            </div>
            <div className="p-2 rounded bg-white border border-zinc-200">
              <div className="text-zinc-500 text-[10px]">False Alarm</div>
              <div className="text-emerald-700 font-bold text-sm">0.73%</div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="default"
          size="sm"
          onClick={() => window.open(MLFLOW_URL, "_blank", "noopener,noreferrer")}
          className="bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs"
        >
          OPEN FULL RUN IN MLFLOW ↗
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
