"use client";

import React, { useState } from "react";
import { EChartsOption } from "echarts-for-react";
import { EChartsWrapper } from "@/components/dashboard/EChartsWrapper";
import { CandidateModelSummary } from "@/types/modelBenchmarks";
import { useDashboard } from "@/context/DashboardContext";
import { BarChart3, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ModelPerformanceBarChartProps {
  models: CandidateModelSummary[];
}

type MetricView = "primary" | "auc" | "fpr" | "all";
type ThresholdView = "calibrated" | "default";

export function ModelPerformanceBarChart({ models }: ModelPerformanceBarChartProps) {
  const { theme } = useDashboard();
  const [metricView, setMetricView] = useState<MetricView>("primary");
  const [thresholdView, setThresholdView] = useState<ThresholdView>("calibrated");

  const isDark = theme === "dark";

  // Palette matching design system
  const colors = {
    DecisionTree: isDark ? "#38BDF8" : "#0284C7", // Sky
    HistGradientBoosting: "#E76552", // Coral (Champion)
    LightGBM: isDark ? "#A78BFA" : "#7C3AED", // Violet
  };

  const getMetricDefinitions = () => {
    switch (metricView) {
      case "primary":
        return [
          { key: "accuracy", label: "Accuracy", scale: "pct", min: 99.0 },
          { key: "precision", label: "Precision", scale: "pct", min: 99.0 },
          { key: "recall", label: "Recall", scale: "pct", min: 99.0 },
          { key: "f1", label: "F1-Score", scale: "pct", min: 99.0 },
        ];
      case "auc":
        return [
          { key: "roc_auc", label: "ROC-AUC", scale: "pct", min: 99.5 },
          { key: "pr_auc", label: "PR-AUC", scale: "pct", min: 99.5 },
        ];
      case "fpr":
        return [
          { key: "fpr", label: "False Positive Rate (FPR)", scale: "pct", min: 0.0, max: 2.0 },
        ];
      case "all":
      default:
        return [
          { key: "accuracy", label: "Accuracy", scale: "pct", min: 98.5 },
          { key: "precision", label: "Precision", scale: "pct", min: 98.5 },
          { key: "recall", label: "Recall", scale: "pct", min: 98.5 },
          { key: "f1", label: "F1-Score", scale: "pct", min: 98.5 },
          { key: "roc_auc", label: "ROC-AUC", scale: "pct", min: 98.5 },
          { key: "pr_auc", label: "PR-AUC", scale: "pct", min: 98.5 },
          { key: "fpr", label: "FPR (Fall-out)", scale: "pct", min: 0.0 },
        ];
    }
  };

  const metrics = getMetricDefinitions();
  const categories = metrics.map((m) => m.label);

  const series = models.map((model) => {
    const metricSource =
      thresholdView === "calibrated" ? model.calibrated_metrics : model.default_metrics;

    const data = metrics.map((m) => {
      const val = (metricSource as unknown as Record<string, number>)[m.key];
      return +(val * 100).toFixed(3);
    });

    const modelColor = colors[model.id] || "#E76552";

    return {
      name: model.name + (model.is_champion ? " (Champion)" : ""),
      type: "bar",
      barMaxWidth: 30,
      barGap: "25%",
      itemStyle: {
        color: modelColor,
        borderRadius: [4, 4, 0, 0],
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: modelColor + "55",
        },
      },
      data,
    };
  });

  const option: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "#1B1924" : "#FFFFFF",
      borderColor: isDark ? "#282534" : "#EAE7ED",
      borderWidth: 1,
      textStyle: {
        color: isDark ? "#F2F1F6" : "#25232B",
        fontSize: 12,
      },
      formatter: (params: unknown) => {
        const items = params as Array<{
          seriesName: string;
          marker: string;
          value: number;
          name: string;
        }>;
        if (!items || items.length === 0) return "";
        let res = `<div class="font-bold text-xs mb-1.5 pb-1 border-b ${
          isDark ? "border-[#282534]" : "border-[#EAE7ED]"
        }">${items[0].name}</div>`;
        items.forEach((item) => {
          res += `
            <div class="flex items-center justify-between gap-4 py-0.5 text-xs">
              <span class="flex items-center gap-1.5">
                ${item.marker}
                <span>${item.seriesName}</span>
              </span>
              <span class="font-mono font-bold">${item.value.toFixed(3)}%</span>
            </div>
          `;
        });
        return res;
      },
    },
    legend: {
      top: 0,
      right: 0,
      icon: "roundRect",
      itemWidth: 14,
      itemHeight: 10,
      textStyle: {
        color: isDark ? "#A5A0AF" : "#85818D",
        fontSize: 11,
      },
    },
    grid: {
      left: "2%",
      right: "2%",
      bottom: "5%",
      top: "16%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLine: {
        lineStyle: {
          color: isDark ? "#282534" : "#EAE7ED",
        },
      },
      axisTick: { show: false },
      axisLabel: {
        color: isDark ? "#A5A0AF" : "#85818D",
        fontSize: 11,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      min: (val: { min: number }) => {
        if (metricView === "fpr") return 0;
        return Math.max(98.0, Math.floor(val.min));
      },
      max: (val: { max: number }) => {
        if (metricView === "fpr") return Math.ceil(val.max * 1.2 * 10) / 10;
        return 100;
      },
      axisLine: { show: false },
      splitLine: {
        lineStyle: {
          color: isDark ? "#282534" : "#F0EFF4",
          type: "dashed",
        },
      },
      axisLabel: {
        color: isDark ? "#85818D" : "#A5A0AF",
        fontSize: 10,
        formatter: "{value}%",
      },
    },
    series,
  };

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
              <BarChart3 className="h-3.5 w-3.5 text-white" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
              Model Performance Comparison (Grouped Bar Analysis)
            </h3>
          </div>
          <p className="mt-1 text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
            Empirical evaluation across Decision Tree, HistGradientBoosting, and LightGBM on 31,656 validation flows
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Threshold Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[11px]">
            <button
              onClick={() => setThresholdView("calibrated")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                thresholdView === "calibrated"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              Calibrated θ*
            </button>
            <button
              onClick={() => setThresholdView("default")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                thresholdView === "default"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              Default θ=0.50
            </button>
          </div>

          {/* Metric View Tabs */}
          <div className="flex items-center p-0.5 rounded-lg border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[11px]">
            <button
              onClick={() => setMetricView("primary")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                metricView === "primary"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              Primary
            </button>
            <button
              onClick={() => setMetricView("auc")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                metricView === "auc"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              AUC Curves
            </button>
            <button
              onClick={() => setMetricView("fpr")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                metricView === "fpr"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              False Alarm (FPR)
            </button>
            <button
              onClick={() => setMetricView("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                metricView === "all"
                  ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                  : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Interactive EChart Container */}
      <div className="pt-2">
        <EChartsWrapper option={option} style={{ height: "340px", width: "100%" }} />
      </div>

      {/* Explanatory callout */}
      <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] flex items-center justify-between text-xs text-[#85818D] dark:text-[#A5A0AF]">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF] shrink-0" />
          <span>
            Operating thresholds calibrated on validation evidence:{" "}
            <strong className="text-[#25232B] dark:text-[#F2F1F6]">θ* = 0.40</strong> (DecisionTree),{" "}
            <strong className="text-[#25232B] dark:text-[#F2F1F6]">θ* = 0.42</strong> (HistGradientBoosting),{" "}
            <strong className="text-[#25232B] dark:text-[#F2F1F6]">θ* = 0.46</strong> (LightGBM).
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] hidden sm:inline-flex border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
          Max FPR ≤ 5.0% enforced
        </Badge>
      </div>
    </div>
  );
}
