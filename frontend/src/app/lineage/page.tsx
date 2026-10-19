"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";
import {
  ExternalLink,
  Copy,
  Check,
  GitBranch,
  Database,
} from "lucide-react";

export default function LineagePage() {
  const [copiedHash, setCopiedHash] = useState(false);

  const bundleSha256 = "3639259c6fcc97ab90b13384fc9d44ce81cad8a34a0d9fcd3eaffab7fe1e6f39";

  const handleCopyHash = () => {
    navigator.clipboard.writeText(bundleSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Model Provenance Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="text-xs border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1 font-semibold"
        >
          Release R1 • SHA-256 Verified
        </Badge>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(MLFLOW_URL, "_blank", "noopener,noreferrer")}
            className="border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] text-xs font-semibold h-8 px-3.5 rounded-full gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>MLflow Registry (:5000)</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`${BACKEND_ROOT_URL}/docs`, "_blank", "noopener,noreferrer")}
            className="border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] text-xs font-semibold h-8 px-3.5 rounded-full gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>API Docs (:8000)</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Sealed Holdout Test Scores with Modern KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#85818D] dark:text-[#A5A0AF]">Holdout Accuracy</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Superior
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-2 tabular-nums">
              99.66%
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">
              Evaluated on 36,933 unseen test flows
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#85818D] dark:text-[#A5A0AF]">Attack Recall</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Critical SLA
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-2 tabular-nums">
              99.78%
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">
              Zero undetected high-severity breaches
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#85818D] dark:text-[#A5A0AF]">Macro F1 Score</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Harmonic
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-2 tabular-nums">
              0.9978
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">
              Precision-recall harmonic mean
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#85818D] dark:text-[#A5A0AF]">False Alarm Rate (FPR)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Low Noise
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
              0.73%
            </div>
            <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1">
              Exceeds &le; 1.5% operational limit
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bento Row: Cryptographic Checksums & Model Registry Artifacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Cryptographic Checksums */}
        <Card className="lg:col-span-7 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                  <Database className="h-3.5 w-3.5 text-white" />
                </span>
                <CardTitle className="text-base font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                  Cryptographic Audit Checksums &amp; Provenance
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1E1B24] text-[#85818D] dark:text-[#A5A0AF]">
                SHA-256 Validated
              </Badge>
            </div>
            <CardDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
              Immutable hashes of the production bundle, training dataset, and split manifests
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs">
            {/* Release & Bundle Hash Card */}
            <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#85818D] dark:text-[#A5A0AF] font-medium">Release ID:</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#E76552] text-white font-bold text-xs shadow-xs">
                    R1
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#201D2A] text-[#25232B] dark:text-[#F2F1F6] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  {copiedHash ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-[#85818D]" />
                      <span>Copy Bundle Hash</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] block mb-1 font-medium">
                  Model Bundle SHA-256 Digest:
                </span>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] font-mono text-[11px] text-[#25232B] dark:text-[#F2F1F6] break-all select-all">
                  {bundleSha256}
                </div>
              </div>
            </div>

            {/* Split Manifest & Hyperparameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]">
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] font-medium block">
                  Dataset Split Manifest
                </span>
                <span className="font-mono text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] mt-1 block truncate">
                  split_manifest_v1.json
                </span>
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-0.5 block">
                  147,730 training samples (TON_IoT)
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]">
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] font-medium block">
                  Optimal Decision Boundary
                </span>
                <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] mt-1 block">
                  &theta; = 0.4200 (Precision-Recall)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
                  Maximizes critical attack recall
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]">
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] font-medium block">
                  Feature Dimensionality
                </span>
                <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] mt-1 block">
                  11 Continuous Traffic Metrics
                </span>
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-0.5 block">
                  Normalized flow duration &amp; packet rates
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]">
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] font-medium block">
                  Serving Framework &amp; Runtime
                </span>
                <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] mt-1 block">
                  FastAPI 0.110 + ONNX/Joblib
                </span>
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-0.5 block">
                  &lt; 5ms median inference latency
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (5 cols): Model Version History & Registry Releases */}
        <Card className="lg:col-span-5 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                <GitBranch className="h-3.5 w-3.5 text-white" />
              </span>
              <CardTitle className="text-base font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Model Version History
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
              Registry release lifecycle and serving slot assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            {/* Version 1 - Champion */}
            <div className="p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 dark:border-emerald-600/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">Version 1 (R1)</span>
                  <Badge variant="default" className="text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase">
                    Champion
                  </Badge>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Slot A Active</span>
              </div>
              <div className="text-xs text-[#85818D] dark:text-[#A5A0AF] space-y-0.5">
                <div>Model: <strong className="text-[#25232B] dark:text-[#F2F1F6]">HistGradientBoostingClassifier</strong></div>
                <div>Hash: <span className="font-mono text-[10px]">3639259c6f...e1e6f39</span></div>
                <div>Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Traffic Routed</span></div>
              </div>
            </div>

            {/* Version 2-rc1 - Candidate */}
            <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">Version 2-rc1</span>
                  <Badge variant="outline" className="text-[10px] border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 font-bold uppercase">
                    Candidate
                  </Badge>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">Slot B Warm</span>
              </div>
              <div className="text-xs text-[#85818D] dark:text-[#A5A0AF] space-y-0.5">
                <div>Intervention: <strong className="text-[#25232B] dark:text-[#F2F1F6]">Level A1 / A2 Adaptation</strong></div>
                <div>Gate Status: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Ready for Canary Staging</span></div>
                <div>Canary Weight: <span className="font-mono text-[10px]">Dynamic (0% - 100%)</span></div>
              </div>
            </div>

            {/* Version 0 - Baseline */}
            <div className="p-3.5 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 opacity-75">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">Version 0</span>
                  <Badge variant="outline" className="text-[10px] border-[#EAE7ED] dark:border-[#282534] text-[#85818D] dark:text-[#A5A0AF] font-bold uppercase">
                    Archived
                  </Badge>
                </div>
                <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">Retired Baseline</span>
              </div>
              <div className="text-xs text-[#85818D] dark:text-[#A5A0AF] space-y-0.5">
                <div>Origin: <strong className="text-[#25232B] dark:text-[#F2F1F6]">Initial UNSW/TON_IoT Model</strong></div>
                <div>Superceded By: <span className="font-semibold text-[#25232B] dark:text-[#F2F1F6]">Release R1 (v1)</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


