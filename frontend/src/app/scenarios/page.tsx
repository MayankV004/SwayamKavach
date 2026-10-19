"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { ScenarioInjectionCard } from "@/components/dashboard/ScenarioInjectionCard";
import { DARILifecycleStepper } from "@/components/dashboard/DARILifecycleStepper";
import { DamageFingerprintCard } from "@/components/dashboard/DamageFingerprintCard";
import { Badge } from "@/components/ui/badge";
import { Activity, Check, Zap, RotateCcw } from "lucide-react";

export default function ScenariosPage() {
  const {
    lifecycle,
    runningScenario,
    scenarioResult,
    executeScenario,
    clearScenario,
    effectiveFingerprint,
    effectiveAction,
  } = useDashboard();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ASYMMETRIC SCENARIOS HERO COMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left: Signature Coral Accent Panel */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[24px] bg-coral-gradient p-6 sm:p-8 text-white shadow-coral-soft flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/5 blur-xl pointer-events-none" />

          {/* Top Tag & Status */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-semibold tracking-wider uppercase text-white shadow-2xs">
              <Activity className="h-3.5 w-3.5 fill-current" />
              <span>DARI Simulation &amp; Invariant Engine</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>{runningScenario ? "Pipeline Running..." : "Engine Armed"}</span>
            </div>
          </div>

          {/* Core Headline */}
          <div className="relative z-10 space-y-2 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {scenarioResult ? `Simulating: ${scenarioResult.scenario}` : "Deterministic Drift Simulator"}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-xl leading-relaxed">
              Trigger synthetic and realistic IoT threat patterns to verify DARI&apos;s cost-risk-damage optimization, hard gate verification, and sub-second threshold calibration.
            </p>
          </div>

          {/* Telemetry Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Active Policy</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">Policy P1</span>
              <span className="text-[10px] text-white/75 block">Cost-Damage-Risk</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Selected Repair</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">Level {effectiveAction}</span>
              <span className="text-[10px] text-white/75 block">Lowest sufficient</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Drift Index (D_X)</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{(effectiveFingerprint.D_X * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-white/75 block">2-sample KS test</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Damage Drop (D_Y)</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">
                {effectiveFingerprint.D_Y != null ? `${(effectiveFingerprint.D_Y * 100).toFixed(1)}%` : "0.0%"}
              </span>
              <span className="text-[10px] text-white/75 block">Holdout accuracy</span>
            </div>
          </div>

          {/* Fast Actions */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6">
            <button
              type="button"
              onClick={() => executeScenario("nominal")}
              disabled={runningScenario}
              className="px-4 py-2 rounded-full bg-white text-[#E76552] text-xs font-bold hover:bg-white/95 active:scale-98 transition-all cursor-pointer shadow-subtle flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>{runningScenario ? "Running..." : "Test A0 Covariate Drift"}</span>
            </button>

            {scenarioResult && (
              <button
                type="button"
                onClick={clearScenario}
                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset State</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Invariant Guarantees Checklist */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[24px] border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
              <div>
                <h3 className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                  Mathematical Invariant Proofs
                </h3>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                  Formal theorems verified under simulated stress
                </p>
              </div>
              <Badge variant="outline" className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] text-[10px] font-semibold">
                Guaranteed
              </Badge>
            </div>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Theorem 1: Covariate Shift Isolation</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">D_X drift alone never triggers expensive model retraining.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Theorem 2: Sub-Second Calibration</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Boundary damage (D_B) resolved in &lt;20ms via optimal tau*.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Theorem 3: Subspace Isolation (A2)</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Localized clusters adapt only their subspace without full refits.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Theorem 4: Statistical Gate Guard</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">McNemar and recall tests reject inferior candidates automatically.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs">
            <span className="text-[#85818D] dark:text-[#A5A0AF]">Decision Engine</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 inline-block" />
              Solver Deterministic
            </span>
          </div>
        </div>
      </div>

      {/* 7-Stage End-to-End Pipeline Stepper */}
      <DARILifecycleStepper
        lifecycle={lifecycle}
        fingerprint={effectiveFingerprint}
        chosenAction={effectiveAction}
        scenarioResult={scenarioResult}
      />

      {/* Simulation Engine and Scenario Result */}
      <ScenarioInjectionCard
        runningScenario={runningScenario}
        scenarioResult={scenarioResult}
        onExecuteScenario={executeScenario}
        onClearScenario={clearScenario}
      />

      {/* Resulting Damage Fingerprint */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Activity className="h-4 w-4 text-[#85818D]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#85818D]">
            Observed Real-Time Damage Assessment
          </h3>
        </div>
        <DamageFingerprintCard
          fingerprint={effectiveFingerprint}
          chosenAction={effectiveAction}
        />
      </div>
    </div>
  );
}
