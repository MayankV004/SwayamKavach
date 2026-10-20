"use client";

import React from "react";
import { EChartsOption } from "echarts-for-react";
import { EChartsWrapper } from "@/components/dashboard/EChartsWrapper";
import { CandidateModelSummary } from "@/types/modelBenchmarks";
import { useDashboard } from "@/context/DashboardContext";
import { ShieldAlert } from "lucide-react";

interface AttackSensitivityBarChartProps {
  models: CandidateModelSummary[];
}

const ATTACK_CLASSES = [
  "backdoor",
  "ddos",
  "dos",
  "injection",
  "mitm",
  "normal",
  "password",
  "ransomware",
  "scanning",
  "xss",
];

export function AttackSensitivityBarChart({ models }: AttackSensitivityBarChartProps) {
  const { theme } = useDashboard();
  const isDark = theme === "dark";

  const option: EChartsOption = React.useMemo(() => {
    const colors = {
      DecisionTree: isDark ? "#38BDF8" : "#0284C7",
      HistGradientBoosting: "#E76552",
      LightGBM: isDark ? "#A78BFA" : "#7C3AED",
    };

    const series = models.map((model) => {
      const data = ATTACK_CLASSES.map((cls) => {
        const val = model.attack_recalls[cls] ?? 0;
        return +(val * 100).toFixed(2);
      });

      const modelColor = colors[model.id] || "#E76552";

      return {
        id: model.id,
        name: model.name + (model.is_champion ? " (Champion)" : ""),
        type: "bar" as const,
        barMaxWidth: 20,
        barGap: "20%",
        itemStyle: {
          color: modelColor,
          borderRadius: [3, 3, 0, 0],
        },
        data,
      };
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        backgroundColor: isDark ? "#1B1924" : "#FFFFFF",
        borderColor: isDark ? "#282534" : "#EAE7ED",
        borderWidth: 1,
        textStyle: {
          color: isDark ? "#F2F1F6" : "#25232B",
          fontSize: 12,
        },
        formatter: (params: unknown) => {
          type TooltipItem = { name?: string; seriesName?: string; value?: number | string; marker?: string };
          const items: TooltipItem[] = Array.isArray(params)
            ? (params as TooltipItem[])
            : params
            ? [params as TooltipItem]
            : [];
          if (items.length === 0) return "";
          const first = items[0];
          let res = `<div class="font-bold text-xs mb-1.5 pb-1 border-b ${
            isDark ? "border-[#282534]" : "border-[#EAE7ED]"
          }">Attack Vector: ${(first?.name || "").toUpperCase()}</div>`;
          items.forEach((item) => {
            if (!item || item.value == null) return;
            res += `
              <div class="flex items-center justify-between gap-4 py-0.5 text-xs">
                <span class="flex items-center gap-1.5">
                  ${item.marker || ""}
                  <span>${item.seriesName || ""}</span>
                </span>
                <span class="font-mono font-bold">${Number(item.value).toFixed(2)}%</span>
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
        bottom: "8%",
        top: "16%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: ATTACK_CLASSES.map((c) => c.toUpperCase()),
        axisLine: {
          lineStyle: {
            color: isDark ? "#282534" : "#EAE7ED",
          },
        },
        axisTick: { show: false },
        axisLabel: {
          color: isDark ? "#A5A0AF" : "#85818D",
          fontSize: 10,
          interval: 0,
          rotate: 20,
        },
      },
      yAxis: {
        type: "value",
        min: 90,
        max: 100,
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
  }, [models, isDark]);

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
              Per-Attack Vector Sensitivity &amp; Class Breakdown
            </h3>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Recall sensitivity across 9 attack types + Normal traffic from ToN-IoT telemetry
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <EChartsWrapper option={option} style={{ height: "300px", width: "100%" }} />
      </div>

      <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] pt-1 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between">
        <span>Y-axis scaled from 90% to 100% to examine low-footprint attack resilience (e.g. MitM)</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">SLA: All &gt; 90%</span>
      </div>
    </div>
  );
}
