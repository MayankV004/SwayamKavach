"use client";

import React, { useState } from "react";
import { EChartsOption } from "echarts-for-react";
import { EChartsWrapper } from "@/components/dashboard/EChartsWrapper";
import { CandidateModelSummary } from "@/types/modelBenchmarks";
import { useDashboard } from "@/context/DashboardContext";
import { Compass } from "lucide-react";

interface ModelRadarChartProps {
  models: CandidateModelSummary[];
}

export function ModelRadarChart({ models }: ModelRadarChartProps) {
  const { theme } = useDashboard();
  const [activeThreshold, setActiveThreshold] = useState<"calibrated" | "default">("calibrated");

  const isDark = theme === "dark";

  const indicators = [
    { name: "Accuracy", min: 99.2, max: 100 },
    { name: "Precision", min: 99.2, max: 100 },
    { name: "Recall", min: 99.2, max: 100 },
    { name: "F1-Score", min: 99.2, max: 100 },
    { name: "ROC-AUC", min: 99.5, max: 100 },
    { name: "PR-AUC", min: 99.5, max: 100 },
  ];

  const colors = {
    DecisionTree: isDark ? "#38BDF8" : "#0284C7",
    HistGradientBoosting: "#E76552", // Coral (Champion)
    LightGBM: isDark ? "#A78BFA" : "#7C3AED",
  };

  const seriesData = models.map((model) => {
    const m = activeThreshold === "calibrated" ? model.calibrated_metrics : model.default_metrics;
    const modelColor = colors[model.id] || "#E76552";

    return {
      value: [
        +(m.accuracy * 100).toFixed(3),
        +(m.precision * 100).toFixed(3),
        +(m.recall * 100).toFixed(3),
        +(m.f1 * 100).toFixed(3),
        +(m.roc_auc * 100).toFixed(3),
        +(m.pr_auc * 100).toFixed(3),
      ],
      name: model.name + (model.is_champion ? " (Champion)" : ""),
      itemStyle: {
        color: modelColor,
      },
      lineStyle: {
        width: model.is_champion ? 2.5 : 1.8,
        color: modelColor,
      },
      areaStyle: {
        color: modelColor + (model.is_champion ? "33" : "18"),
      },
    };
  });

  const option: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "#1B1924" : "#FFFFFF",
      borderColor: isDark ? "#282534" : "#EAE7ED",
      borderWidth: 1,
      textStyle: {
        color: isDark ? "#F2F1F6" : "#25232B",
        fontSize: 12,
      },
      formatter: (params: unknown) => {
        const item = params as {
          name: string;
          value: number[];
        };
        if (!item || !item.value) return "";
        let res = `<div class="font-bold text-xs mb-1.5 pb-1 border-b ${
          isDark ? "border-[#282534]" : "border-[#EAE7ED]"
        }">${item.name}</div>`;
        indicators.forEach((ind, i) => {
          res += `
            <div class="flex items-center justify-between gap-4 py-0.5 text-xs">
              <span class="text-[#85818D] dark:text-[#A5A0AF]">${ind.name}:</span>
              <span class="font-mono font-bold">${item.value[i].toFixed(3)}%</span>
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
    radar: {
      indicator: indicators,
      shape: "polygon",
      splitNumber: 4,
      radius: "68%",
      center: ["50%", "56%"],
      axisName: {
        color: isDark ? "#A5A0AF" : "#85818D",
        fontSize: 11,
        fontWeight: 600,
      },
      splitLine: {
        lineStyle: {
          color: isDark ? "#282534" : "#EAE7ED",
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: isDark
            ? ["rgba(255, 255, 255, 0.01)", "rgba(255, 255, 255, 0.025)"]
            : ["rgba(0, 0, 0, 0.01)", "rgba(0, 0, 0, 0.02)"],
        },
      },
      axisLine: {
        lineStyle: {
          color: isDark ? "#282534" : "#EAE7ED",
        },
      },
    },
    series: [
      {
        name: "Model Profile",
        type: "radar",
        symbol: "circle",
        symbolSize: 4,
        data: seriesData,
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
            <Compass className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
              Multi-Metric Balance Radar
            </h3>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Comparative trade-off profile across shared discrimination and detection metrics
            </p>
          </div>
        </div>

        {/* Threshold Toggle */}
        <div className="flex items-center p-0.5 rounded-lg border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[11px] self-start sm:self-auto">
          <button
            onClick={() => setActiveThreshold("calibrated")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              activeThreshold === "calibrated"
                ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
            }`}
          >
            Calibrated θ*
          </button>
          <button
            onClick={() => setActiveThreshold("default")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              activeThreshold === "default"
                ? "bg-white dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] shadow-2xs font-bold"
                : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
            }`}
          >
            Default θ=0.50
          </button>
        </div>
      </div>

      <div className="pt-2">
        <EChartsWrapper option={option} style={{ height: "340px", width: "100%" }} />
      </div>

      <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] pt-1 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between">
        <span>Axes scaled between 99.2% and 100.0% to reflect high-assurance IDS performance</span>
        <span className="font-medium text-[#25232B] dark:text-[#F2F1F6]">31,656 Holdout Windows</span>
      </div>
    </div>
  );
}
