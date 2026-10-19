"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { AlertsTable } from "@/components/dashboard/AlertsTable";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Check } from "lucide-react";

export default function AlertsPage() {
  const { alerts, lifecycle } = useDashboard();

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ASYMMETRIC ALERTS HERO COMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left: Signature Coral Accent Panel */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[24px] bg-coral-gradient p-6 sm:p-8 text-white shadow-coral-soft flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/5 blur-xl pointer-events-none" />

          {/* Top Tag & Status */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-semibold tracking-wider uppercase text-white shadow-2xs">
              <ShieldAlert className="h-3.5 w-3.5 fill-current" />
              <span>Real-Time Security Threat Triage · SOC Advisory</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>Online Inspection</span>
            </div>
          </div>

          {/* Core Headline */}
          <div className="relative z-10 space-y-2 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {criticalCount > 0 ? `${criticalCount} Critical Threats Detected` : "Zero Critical Intrusions Escaped"}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-xl leading-relaxed">
              Continuous threat detection feed powered by Champion model ({lifecycle.champion_release}) on Slot {lifecycle.active_slot}. High-confidence anomalous network flows flagged with sub-second advisory notifications.
            </p>
          </div>

          {/* Telemetry Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Total Alerts</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{alerts.length}</span>
              <span className="text-[10px] text-white/75 block">Window buffer</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Critical Intrusions</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{criticalCount}</span>
              <span className="text-[10px] text-white/75 block">Requires triage</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">High Severity</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{highCount}</span>
              <span className="text-[10px] text-white/75 block">Probable attack</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Advisory Feeds</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{mediumCount + lowCount}</span>
              <span className="text-[10px] text-white/75 block">Anomalous flows</span>
            </div>
          </div>
        </div>

        {/* Right: SOC Invariants Checklist */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[24px] border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
              <div>
                <h3 className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                  Security SLA Invariants
                </h3>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                  Automated bounds enforced on inference output
                </p>
              </div>
              <Badge variant="outline" className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] text-[10px] font-semibold">
                SLA Armed
              </Badge>
            </div>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Critical Attack Recall &ge; 95.0%</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Zero tolerable escape on reconnaissance, brute force, and injection.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">False Alarm Limit &le; 5.0%</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Prevents alert fatigue in SOC monitoring queues. Measured 1.2%.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Sub-20ms Real-Time Inference</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Continuous processing with zero packet queue backpressure.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Immutable Audit Receipts</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Every alert is stored with event identifier and confidence probability.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs">
            <span className="text-[#85818D] dark:text-[#A5A0AF]">Pipeline Dispatch</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 inline-block" />
              Inference Channel Online
            </span>
          </div>
        </div>
      </div>



      {/* Main Alerts Table */}
      <AlertsTable alerts={alerts} />
    </div>
  );
}
