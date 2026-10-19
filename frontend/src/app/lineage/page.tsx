"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";
import {
  ExternalLink,
  ShieldCheck,
  Layers,
  Copy,
  Check,
  GitBranch,
  Database,
  Lock,
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
      {/* 60/40 Asymmetric Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 60% Card: Coral Gradient Banner */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[24px] bg-coral-gradient p-6 sm:p-7 text-white shadow-coral-soft flex flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient decorative backdrop */}
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-black/10 blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {/* Category Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Layers className="h-3.5 w-3.5 text-white" />
                <span>MLflow Model Registry &amp; DVC Lineage</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white/95">
                <Lock className="h-3 w-3" />
                <span>Release R1 • SHA-256 Verified</span>
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                Cryptographic Model Lineage &amp; Provenance
              </h1>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-xl">
                Every deployed artifact is cryptographically hashed, linked to immutable DVC dataset splits,
                calibrated with precision-recall thresholds, and tracked in MLflow.
              </p>
            </div>

            {/* Telemetry Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <div className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Registered Model</div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">swayamkavach_ids</div>
                <div className="text-[10px] text-white/60 mt-0.5">MLflow Artifact</div>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <div className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Production Alias</div>
                <div className="text-sm font-bold text-white mt-0.5">champion (v1)</div>
                <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">Slot A Active</div>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <div className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Classifier Architecture</div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">HistGradientBoosting</div>
                <div className="text-[10px] text-white/60 mt-0.5">scikit-learn 1.4+</div>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <div className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Decision Threshold</div>
                <div className="text-sm font-bold text-white mt-0.5 tabular-nums">&theta; = 0.4200</div>
                <div className="text-[10px] text-white/60 mt-0.5">PR-Calibrated</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-5 relative z-10">
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(MLFLOW_URL, "_blank", "noopener,noreferrer")}
              className="bg-white hover:bg-white/90 text-[#E76552] text-xs font-bold gap-1.5 h-8.5 rounded-full px-4 shadow-subtle cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <span>Open MLflow Registry (:5000)</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${BACKEND_ROOT_URL}/docs`, "_blank", "noopener,noreferrer")}
              className="border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold gap-1.5 h-8.5 rounded-full px-4 backdrop-blur-md cursor-pointer"
            >
              <span>API Swagger Docs (:8000)</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right 40% Card: Provenance & Audit Checklist */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[24px] border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-6 shadow-subtle flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#25232B] dark:text-[#F2F1F6]">
                  Provenance &amp; Audit Guardrails
                </h3>
                <p className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
                  Mathematical reproducibility requirements
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5 text-xs text-[#25232B] dark:text-[#F2F1F6]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div>
                  <span className="font-semibold block">Immutable Bundle Hashing</span>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight block mt-0.5">
                    Model weights are SHA-256 hashed and verified before mounting to serving slots.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-[#25232B] dark:text-[#F2F1F6]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div>
                  <span className="font-semibold block">Split Manifest Integrity</span>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight block mt-0.5">
                    Strict temporal split manifest prevents training-test leakage across datasets.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-[#25232B] dark:text-[#F2F1F6]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div>
                  <span className="font-semibold block">Calibrated Decision Boundary</span>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight block mt-0.5">
                    Precision-recall curve calibrated threshold (&theta; = 0.4200) locked into manifest.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-[#25232B] dark:text-[#F2F1F6]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div>
                  <span className="font-semibold block">Zero Promotion Without Testing</span>
                  <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-tight block mt-0.5">
                    Statistical superiority and critical-class recall must pass on held-out splits.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EFF4] dark:border-[#282534] mt-2 flex items-center justify-between text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
            <span>Registry Status: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Clean &amp; Verified</strong></span>
            <span>Audited: <strong className="text-[#25232B] dark:text-[#F2F1F6]">2026-Q1</strong></span>
          </div>
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

      {/* DARI Architectural Invariants - 4-Column Modern Bento Grid */}
      <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
        <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                <ShieldCheck className="h-3.5 w-3.5 text-white" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                DARI Core Architectural Invariants
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1E1B24] text-[#85818D] dark:text-[#A5A0AF]">
              System Policy Axioms
            </Badge>
          </div>
          <CardDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
            Formal system constraints and safety invariants enforced across every step of the adaptive MLOps lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Invariant 1 */}
            <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 hover:shadow-2xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[11px] font-bold text-[#E76552]">
                  01
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                  Drift Isolation
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">
                Drift Separation
              </h4>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                Distribution drift (D_X) alone must <strong className="text-[#25232B] dark:text-[#F2F1F6]">NEVER</strong> trigger full model retraining. When security recall (D_Y) remains uncompromised, system persists in Level A0 nominal monitoring.
              </p>
            </div>

            {/* Invariant 2 */}
            <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 hover:shadow-2xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[11px] font-bold text-[#E76552]">
                  02
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                  Intervention Ladder
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">
                Lowest Feasible Action
              </h4>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                DARI always selects the lowest intervention rung (A0 &rarr; A1 &rarr; A2 &rarr; A3) that satisfies security bounds. Hard constraints filter infeasible actions before utility scoring.
              </p>
            </div>

            {/* Invariant 3 */}
            <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 hover:shadow-2xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[11px] font-bold text-[#E76552]">
                  03
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                  Statistical Gate
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">
                McNemar Acceptance
              </h4>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                No candidate model is promoted simply because training completed. Candidates must prove statistical superiority and critical recall bounds on held-out splits.
              </p>
            </div>

            {/* Invariant 4 */}
            <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-2 hover:shadow-2xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[11px] font-bold text-[#E76552]">
                  04
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                  Dual-Slot Failover
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#25232B] dark:text-[#F2F1F6]">
                Warm Instant Rollback
              </h4>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                The champion remains warm in its serving slot throughout canary flight (5% &rarr; 25% &rarr; 50% &rarr; 100%). Any watchdog breach triggers an immediate 0-downtime rollback.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

