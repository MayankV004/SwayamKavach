"use client";

import React, { useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import {
  CandidateModelSummary,
  VERIFIED_MODEL_BENCHMARKS,
} from "@/types/modelBenchmarks";
import { ModelPerformanceBarChart } from "@/components/dashboard/ModelPerformanceBarChart";
import { ModelRadarChart } from "@/components/dashboard/ModelRadarChart";
import { ModelConfusionMatrixHeatmap } from "@/components/dashboard/ModelConfusionMatrixHeatmap";
import { ModelComparisonTable } from "@/components/dashboard/ModelComparisonTable";
import { AttackSensitivityBarChart } from "@/components/dashboard/AttackSensitivityBarChart";
import { Cpu, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ModelBenchmarkSuite() {
  const { modelBenchmarks, loadingModelBenchmarks } = useDashboard();

  // Parse candidate models from API if available, else use verified R1 manifest baseline
  const models: CandidateModelSummary[] = useMemo(() => {
    if (!modelBenchmarks?.model_comparison) {
      return VERIFIED_MODEL_BENCHMARKS;
    }

    const comp = modelBenchmarks.model_comparison;
    const modelConfigs = [
      {
        id: "DecisionTree" as const,
        name: "Decision Tree",
        family: "CART (scikit-learn)",
        hyperparameters: "max_depth=8, criterion='gini', random_state=42",
        training_duration_s: 0.42,
        inference_latency_ms: 0.08,
        model_size_kb: 48,
        is_champion: false,
      },
      {
        id: "HistGradientBoosting" as const,
        name: "HistGradientBoosting",
        family: "Histogram GBDT (scikit-learn)",
        hyperparameters: "max_iter=80, l2_reg=0.0, random_state=42",
        training_duration_s: 1.85,
        inference_latency_ms: 0.22,
        model_size_kb: 420,
        is_champion: true,
      },
      {
        id: "LightGBM" as const,
        name: "LightGBM",
        family: "Gradient Boosting (Microsoft)",
        hyperparameters: "n_estimators=100, lr=0.05, num_leaves=31, random_state=42",
        training_duration_s: 1.2,
        inference_latency_ms: 0.18,
        model_size_kb: 380,
        is_champion: false,
      },
    ];

    return modelConfigs.map((cfg) => {
      const data = comp[cfg.id];
      if (data) {
        return {
          ...cfg,
          calibrated_threshold: data.calibrated_threshold,
          default_metrics: data.val_metrics_default_0_50,
          calibrated_metrics: data.val_metrics_calibrated,
          attack_recalls: data.val_per_attack_recall,
        };
      }
      // fallback to verified
      const fallback = VERIFIED_MODEL_BENCHMARKS.find((m) => m.id === cfg.id)!;
      return fallback;
    });
  }, [modelBenchmarks]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
            <Cpu className="h-3.5 w-3.5 text-white" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
              Compact Baseline Model Evaluation &amp; MLflow Benchmarks
            </h2>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Comparative evaluation of Decision Tree, HistGradientBoosting, and LightGBM on sealed partitions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-semibold"
          >
            <Sparkles className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
            Verified Manifest R1
          </Badge>
          {loadingModelBenchmarks && (
            <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] animate-pulse">
              Syncing manifest...
            </span>
          )}
        </div>
      </div>

      {/* Grid: Grouped Bar Chart + Multi-Metric Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelPerformanceBarChart models={models} />
        <ModelRadarChart models={models} />
      </div>

      {/* Confusion Matrix Heatmap */}
      <ModelConfusionMatrixHeatmap models={models} />

      {/* Per-Attack Sensitivity Breakdown */}
      <AttackSensitivityBarChart models={models} />

      {/* Detailed Table */}
      <ModelComparisonTable models={models} />
    </div>
  );
}
