"use client";

import React, { useState } from "react";
import { CandidateModelSummary } from "@/types/modelBenchmarks";
import { Badge } from "@/components/ui/badge";
import { Table, Trophy, ArrowUpDown, Shield } from "lucide-react";

interface ModelComparisonTableProps {
  models: CandidateModelSummary[];
}

type SortField =
  | "name"
  | "accuracy"
  | "precision"
  | "recall"
  | "f1"
  | "roc_auc"
  | "fpr"
  | "training_duration_s"
  | "inference_latency_ms"
  | "model_size_kb";

export function ModelComparisonTable({ models }: ModelComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>("f1");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [metricMode, setMetricMode] = useState<"calibrated" | "default">("calibrated");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // For FPR, training duration, latency, size, default asc (lower is better)
      if (["fpr", "training_duration_s", "inference_latency_ms", "model_size_kb"].includes(field)) {
        setSortAsc(true);
      } else {
        setSortAsc(false);
      }
    }
  };

  const getMetric = (m: CandidateModelSummary, field: SortField) => {
    const metrics = metricMode === "calibrated" ? m.calibrated_metrics : m.default_metrics;
    switch (field) {
      case "name":
        return m.name;
      case "accuracy":
        return metrics.accuracy;
      case "precision":
        return metrics.precision;
      case "recall":
        return metrics.recall;
      case "f1":
        return metrics.f1;
      case "roc_auc":
        return metrics.roc_auc;
      case "fpr":
        return metrics.fpr;
      case "training_duration_s":
        return m.training_duration_s;
      case "inference_latency_ms":
        return m.inference_latency_ms;
      case "model_size_kb":
        return m.model_size_kb;
      default:
        return 0;
    }
  };

  // Find best values for visual distinction
  const bestValues = {
    accuracy: Math.max(...models.map((m) => (metricMode === "calibrated" ? m.calibrated_metrics.accuracy : m.default_metrics.accuracy))),
    precision: Math.max(...models.map((m) => (metricMode === "calibrated" ? m.calibrated_metrics.precision : m.default_metrics.precision))),
    recall: Math.max(...models.map((m) => (metricMode === "calibrated" ? m.calibrated_metrics.recall : m.default_metrics.recall))),
    f1: Math.max(...models.map((m) => (metricMode === "calibrated" ? m.calibrated_metrics.f1 : m.default_metrics.f1))),
    roc_auc: Math.max(...models.map((m) => (metricMode === "calibrated" ? m.calibrated_metrics.roc_auc : m.default_metrics.roc_auc))),
    fpr: Math.min(...models.map((m) => (metricMode === "calibrated" ? m.calibrated_metrics.fpr : m.default_metrics.fpr))),
    training_duration_s: Math.min(...models.map((m) => m.training_duration_s)),
    inference_latency_ms: Math.min(...models.map((m) => m.inference_latency_ms)),
    model_size_kb: Math.min(...models.map((m) => m.model_size_kb)),
  };

  const sortedModels = [...models].sort((a, b) => {
    const valA = getMetric(a, sortField);
    const valB = getMetric(b, sortField);
    if (typeof valA === "string" && typeof valB === "string") {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
  });

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
            <Table className="h-3.5 w-3.5 text-white" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
              Compact Baseline Model Comparison &amp; Architectural Specifications
            </h3>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Cross-model evaluation under identical bounded hyperparameter search budgets
            </p>
          </div>
        </div>

        <div className="flex items-center p-0.5 rounded-lg border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[11px] self-start sm:self-auto">
          <button
            onClick={() => setMetricMode("calibrated")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              metricMode === "calibrated"
                ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
            }`}
          >
            Calibrated θ*
          </button>
          <button
            onClick={() => setMetricMode("default")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              metricMode === "default"
                ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
            }`}
          >
            Default θ=0.50
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF9FC] dark:bg-[#1E1B24] border-b border-[#EAE7ED] dark:border-[#282534] text-[11px] font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-3.5 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>Model / Estimator</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3">Hyperparameters</th>
              <th className="py-3 px-3 text-center">θ*</th>
              <th
                onClick={() => handleSort("accuracy")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>Accuracy</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("precision")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>Precision</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("recall")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>Recall</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("f1")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>F1-Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("roc_auc")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>ROC-AUC</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("fpr")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>FPR</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("training_duration_s")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>Fit Time</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("inference_latency_ms")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>Latency</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("model_size_kb")}
                className="py-3 px-3 cursor-pointer hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              >
                <div className="flex items-center gap-1">
                  <span>Size</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-3.5 text-right">Status / Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EFF4] dark:divide-[#282534] text-xs">
            {sortedModels.map((m) => {
              const metrics = metricMode === "calibrated" ? m.calibrated_metrics : m.default_metrics;
              const isBestF1 = Math.abs(metrics.f1 - bestValues.f1) < 0.00001;
              const isBestRecall = Math.abs(metrics.recall - bestValues.recall) < 0.00001;
              const isBestFpr = Math.abs(metrics.fpr - bestValues.fpr) < 0.00001;
              const isBestRoc = Math.abs(metrics.roc_auc - bestValues.roc_auc) < 0.00001;
              const isBestFit = Math.abs(m.training_duration_s - bestValues.training_duration_s) < 0.01;

              return (
                <tr
                  key={m.id}
                  className={`transition-colors ${
                    m.is_champion
                      ? "bg-[#FAF9FC] dark:bg-[#1E1B24]/90 font-semibold text-[#25232B] dark:text-[#F2F1F6]"
                      : "hover:bg-[#FAF9FC]/60 dark:hover:bg-[#1E1B24]/40 text-[#25232B] dark:text-[#F2F1F6]"
                  }`}
                >
                  <td className="py-3 px-3.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {m.is_champion && (
                        <Trophy className="h-3.5 w-3.5 text-[#E76552] shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block font-normal">
                      {m.family}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-[11px] text-[#85818D] dark:text-[#A5A0AF] font-mono max-w-[180px] truncate">
                    {m.hyperparameters}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-bold text-[#25232B] dark:text-[#F2F1F6]">
                    {metricMode === "calibrated" ? m.calibrated_threshold.toFixed(2) : "0.50"}
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    {(metrics.accuracy * 100).toFixed(2)}%
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    {(metrics.precision * 100).toFixed(2)}%
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <span className={isBestRecall ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>
                      {(metrics.recall * 100).toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <span className={isBestF1 ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>
                      {(metrics.f1 * 100).toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <span className={isBestRoc ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>
                      {(metrics.roc_auc * 100).toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <span className={isBestFpr ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>
                      {(metrics.fpr * 100).toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums text-[#85818D] dark:text-[#A5A0AF]">
                    <span className={isBestFit ? "text-sky-600 dark:text-sky-400 font-bold" : ""}>
                      {m.training_duration_s.toFixed(2)}s
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums text-[#85818D] dark:text-[#A5A0AF]">
                    {m.inference_latency_ms.toFixed(2)}ms
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums text-[#85818D] dark:text-[#A5A0AF]">
                    {m.model_size_kb} KB
                  </td>

                  <td className="py-3 px-3.5 text-right">
                    {m.is_champion ? (
                      <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-[#E76552] text-white font-bold shadow-xs">
                        CHAMPION
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[#EAE7ED] dark:border-[#282534] text-[#85818D] dark:text-[#A5A0AF]">
                        CANDIDATE
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#85818D] dark:text-[#A5A0AF] gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Champion selection rule: highest PR-AUC and calibrated F1 with constraint FPR ≤ 5.0% and Critical Recall ≥ 95.0%.
          </span>
        </div>
        <div className="font-medium text-[#25232B] dark:text-[#F2F1F6]">
          147,730 Training Rows • 31,656 Val Rows
        </div>
      </div>
    </div>
  );
}
