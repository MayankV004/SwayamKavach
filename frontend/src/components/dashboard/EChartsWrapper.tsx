"use client";

import React, { useSyncExternalStore } from "react";
import ReactECharts, { EChartsOption } from "echarts-for-react";
import { useDashboard } from "@/context/DashboardContext";

const subscribe = () => () => {};

interface EChartsWrapperProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
}

export function EChartsWrapper({
  option,
  style = { height: "360px", width: "100%" },
  className = "",
  loading = false,
}: EChartsWrapperProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const { theme } = useDashboard();

  if (!isMounted) {
    return (
      <div
        style={style}
        className={`flex items-center justify-center rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924]/60 border border-[#EAE7ED] dark:border-[#282534] ${className}`}
      >
        <div className="text-xs text-[#85818D] dark:text-[#A5A0AF] flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-[#E76552] border-t-transparent animate-spin" />
          <span>Initializing visualization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ReactECharts
        option={option}
        style={style}
        theme={theme === "dark" ? "dark" : undefined}
        showLoading={loading}
        loadingOption={{
          text: "Evaluating telemetry...",
          color: "#E76552",
          textColor: theme === "dark" ? "#F2F1F6" : "#25232B",
          maskColor: theme === "dark" ? "rgba(22, 21, 29, 0.7)" : "rgba(255, 255, 255, 0.7)",
        }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
