"use client";

import React, { useState } from "react";
import { EChartsOption } from "echarts-for-react";
import { EChartsWrapper } from "@/components/dashboard/EChartsWrapper";
import { CandidateModelSummary } from "@/types/modelBenchmarks";
import { useDashboard } from "@/context/DashboardContext";
import { Grid, HelpCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ModelConfusionMatrixHeatmapProps {
  models: CandidateModelSummary[];
}

export function ModelConfusionMatrixHeatmap({ models }: ModelConfusionMatrixHeatmapProps) {
  const { theme } = useDashboard();
  const [selectedModelId, setSelectedModelId] = useState<string>("HistGradientBoosting");
  const [thresholdMode, setThresholdMode] = useState<"calibrated" | "default">("calibrated");
  const [displayMode, setDisplayMode] = useState<"raw" | "normalized">("raw");

  const isDark = theme === "dark";

  const activeModel =
    models.find((m) => m.id === selectedModelId) || models[0] || null;

  if (!activeModel) return null;

  const metrics =
    thresholdMode === "calibrated"
      ? activeModel.calibrated_metrics
      : activeModel.default_metrics;

  const { tp, fp, tn, fn } = metrics;
  const totalNormal = tn + fp; // 7,500
  const totalAttack = fn + tp; // 24,156
  const totalAll = totalNormal + totalAttack; // 31,656

  // Rates
  const tnr = totalNormal > 0 ? (tn / totalNormal) * 100 : 0;
  const fpr = totalNormal > 0 ? (fp / totalNormal) * 100 : 0;
  const fnr = totalAttack > 0 ? (fn / totalAttack) * 100 : 0;
  const tpr = totalAttack > 0 ? (tp / totalAttack) * 100 : 0;

  // ECharts Heatmap coordinate system:
  // xAxis: Predicted Class [0: "Predicted Normal", 1: "Predicted Attack"]
  // yAxis: Actual Class [0: "Actual Attack", 1: "Actual Normal"] (ECharts y-axis starts from bottom (0) to top (1))
  // To have Row 0 = Actual Normal (top) and Row 1 = Actual Attack (bottom):
  // Let yAxis categories be ["Actual Attack (1)", "Actual Normal (0)"]
  // y=1 is Actual Normal; y=0 is Actual Attack.
  // Data format: [x, y, value, rawCount, rate, labelType, rowTotal]
  const data = [
    // Actual Normal (y=1)
    [0, 1, displayMode === "raw" ? tn : +tnr.toFixed(2), tn, tnr, "True Negative (TN)", totalNormal],
    [1, 1, displayMode === "raw" ? fp : +fpr.toFixed(2), fp, fpr, "False Positive (FP / False Alarm)", totalNormal],
    // Actual Attack (y=0)
    [0, 0, displayMode === "raw" ? fn : +fnr.toFixed(2), fn, fnr, "False Negative (FN / Missed Attack)", totalAttack],
    [1, 0, displayMode === "raw" ? tp : +tpr.toFixed(2), tp, tpr, "True Positive (TP / Detected Attack)", totalAttack],
  ];

  const option: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      position: "top",
      backgroundColor: isDark ? "#1B1924" : "#FFFFFF",
      borderColor: isDark ? "#282534" : "#EAE7ED",
      borderWidth: 1,
      textStyle: {
        color: isDark ? "#F2F1F6" : "#25232B",
        fontSize: 12,
      },
      formatter: (params: unknown) => {
        const p = params as { data: (number | string)[] };
        const [x, y, , raw, rate, labelType, rowTotal] = p.data;
        const actualClass = y === 1 ? "Normal (0)" : "Attack (1)";
        const predClass = x === 0 ? "Normal (0)" : "Attack (1)";

        return `
          <div class="font-bold text-xs mb-1.5 pb-1 border-b ${
            isDark ? "border-[#282534]" : "border-[#EAE7ED]"
          }">${labelType}</div>
          <div class="text-xs space-y-1">
            <div class="flex justify-between gap-4">
              <span class="text-[#85818D] dark:text-[#A5A0AF]">Actual:</span>
              <span class="font-bold text-[#25232B] dark:text-[#F2F1F6]">${actualClass}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-[#85818D] dark:text-[#A5A0AF]">Predicted:</span>
              <span class="font-bold text-[#25232B] dark:text-[#F2F1F6]">${predClass}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-[#85818D] dark:text-[#A5A0AF]">Flow Count:</span>
              <span class="font-mono font-bold text-[#25232B] dark:text-[#F2F1F6]">${Number(raw).toLocaleString()}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-[#85818D] dark:text-[#A5A0AF]">Row Percentage:</span>
              <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">${Number(rate).toFixed(3)}%</span>
            </div>
            <div class="flex justify-between gap-4 pt-1 border-t ${
              isDark ? "border-[#282534]" : "border-[#EAE7ED]"
            } text-[10px]">
              <span class="text-[#85818D] dark:text-[#A5A0AF]">Row Support:</span>
              <span class="font-mono">${Number(rowTotal).toLocaleString()} flows</span>
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: "14%",
      right: "5%",
      top: "12%",
      bottom: "16%",
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: ["Pred: Normal (0)", "Pred: Attack (1)"],
      position: "bottom",
      splitArea: { show: true },
      axisLine: {
        lineStyle: {
          color: isDark ? "#282534" : "#EAE7ED",
        },
      },
      axisTick: { show: false },
      axisLabel: {
        color: isDark ? "#F2F1F6" : "#25232B",
        fontSize: 12,
        fontWeight: 600,
      },
    },
    yAxis: {
      type: "category",
      data: ["Actual: Attack (1)", "Actual: Normal (0)"],
      splitArea: { show: true },
      axisLine: {
        lineStyle: {
          color: isDark ? "#282534" : "#EAE7ED",
        },
      },
      axisTick: { show: false },
      axisLabel: {
        color: isDark ? "#F2F1F6" : "#25232B",
        fontSize: 12,
        fontWeight: 600,
      },
    },
    visualMap: {
      show: false,
      min: 0,
      max: displayMode === "raw" ? 25000 : 100,
      calculable: false,
      orient: "horizontal",
      left: "center",
      bottom: "0%",
      inRange: {
        color: isDark
          ? ["#1B1924", "#1E2A38", "#1E3A5F", "#E76552"]
          : ["#FAF9FC", "#E0F2FE", "#BAE6FD", "#E76552"],
      },
    },
    series: [
      {
        name: "Confusion Matrix",
        type: "heatmap",
        data,
        label: {
          show: true,
          formatter: (params: unknown) => {
            const p = params as { data: (number | string)[] };
            const [, , , raw, rate, labelType] = p.data;
            const shortTag = (labelType as string).split("(")[1]?.replace(")", "") || "";
            if (displayMode === "raw") {
              return `{tag|${shortTag}}\n{val|${Number(raw).toLocaleString()}}\n{sub|(${Number(rate).toFixed(2)}%)}`;
            } else {
              return `{tag|${shortTag}}\n{val|${Number(rate).toFixed(2)}%}\n{sub|(${Number(raw).toLocaleString()})}`;
            }
          },
          rich: {
            tag: {
              fontSize: 10,
              fontWeight: 700,
              color: isDark ? "#A5A0AF" : "#85818D",
              lineHeight: 14,
            },
            val: {
              fontSize: 15,
              fontWeight: 800,
              color: isDark ? "#FFFFFF" : "#111827",
              lineHeight: 22,
            },
            sub: {
              fontSize: 11,
              color: isDark ? "#C5C2CE" : "#4B5563",
              lineHeight: 16,
            },
          },
        },
        itemStyle: {
          borderColor: isDark ? "#16151D" : "#FFFFFF",
          borderWidth: 3,
          borderRadius: 8,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <Grid className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                Empirical Confusion Matrix Heatmap
              </h3>
              {activeModel.is_champion && (
                <Badge variant="default" className="text-[10px] px-2 py-0.2 bg-[#E76552] text-white font-bold shadow-xs">
                  Champion Model
                </Badge>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
            Convention: Rows = Actual Class • Columns = Predicted Class • Evaluated on 31,656 holdout events
          </p>
        </div>

        {/* Multi-Tab Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Selector Tabs */}
          <div className="flex items-center p-0.5 rounded-lg border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[11px]">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  selectedModelId === m.id
                    ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                    : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Threshold Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[11px]">
            <button
              onClick={() => setThresholdMode("calibrated")}
              className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                thresholdMode === "calibrated"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              θ* = {activeModel.calibrated_threshold}
            </button>
            <button
              onClick={() => setThresholdMode("default")}
              className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                thresholdMode === "default"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              θ = 0.50
            </button>
          </div>

          {/* Raw vs Normalized Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[11px]">
            <button
              onClick={() => setDisplayMode("raw")}
              className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                displayMode === "raw"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              Raw Counts
            </button>
            <button
              onClick={() => setDisplayMode("normalized")}
              className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                displayMode === "normalized"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              Normalized %
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Heatmap + Summary Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Heatmap Column */}
        <div className="lg:col-span-2">
          <EChartsWrapper option={option} style={{ height: "300px", width: "100%" }} />
        </div>

        {/* Derived Binary Classification KPI Panel */}
        <div className="space-y-2.5 p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924]">
          <div className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] flex items-center justify-between pb-2 border-b border-[#EAE7ED] dark:border-[#282534]">
            <span>Classification Diagnostics</span>
            <span className="font-mono text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
              N = {totalAll.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block">Sensitivity (TPR)</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                {tpr.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block mt-0.5">
                TP: {tp.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block">Specificity (TNR)</span>
              <span className="text-base font-extrabold text-[#25232B] dark:text-[#F2F1F6] font-mono block mt-0.5">
                {tnr.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block mt-0.5">
                TN: {tn.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block">Fall-out (FPR)</span>
              <span className="text-base font-extrabold text-[#E76552] font-mono block mt-0.5">
                {fpr.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block mt-0.5">
                FP: {fp.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534]">
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block">Miss Rate (FNR)</span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono block mt-0.5">
                {fnr.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] block mt-0.5">
                FN: {fn.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#85818D] dark:text-[#A5A0AF] leading-snug">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 inline mr-1" />
            <span>
              Threshold optimization strictly enforces <strong>FPR ≤ 5.0%</strong> and <strong>TPR ≥ 95.0%</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Footnote */}
      <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed flex items-start gap-2.5">
        <HelpCircle className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#25232B] dark:text-[#F2F1F6]">Normalization Method:</strong> In normalized mode,
          percentages are calculated along the ground-truth rows (Actual Class). Row 0 (Normal) sums to 100% (Specificity + Fall-out),
          and Row 1 (Attack) sums to 100% (Miss Rate + Recall). All values are generated from sealed offline validation partitions.
        </div>
      </div>
    </div>
  );
}
