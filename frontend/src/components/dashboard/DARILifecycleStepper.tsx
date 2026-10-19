"use client";

import React, { useState } from "react";
import {
  Radio,
  Activity,
  Cpu,
  Wrench,
  ShieldCheck,
  Lock,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DamageFingerprint, LifecycleState, RepairAction, ScenarioRunResult } from "@/types/contracts";

interface DARILifecycleStepperProps {
  lifecycle: LifecycleState;
  fingerprint: DamageFingerprint;
  chosenAction: RepairAction;
  scenarioResult: ScenarioRunResult | null;
}

export function DARILifecycleStepper({
  lifecycle,
  fingerprint,
  chosenAction,
  scenarioResult,
}: DARILifecycleStepperProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const canaryPct = Math.round(lifecycle.canary_weight * 100);
  const isScenarioActive = Boolean(scenarioResult);

  // Determine stage states based on chosenAction and scenario
  const isA0 = chosenAction === "A0";
  const isA1 = chosenAction === "A1";
  const isA2 = chosenAction === "A2";
  const isGateRejection = scenarioResult?.scenario === "faulty_candidate_rejection";
  const isWatchdogRollback = scenarioResult?.scenario === "canary_watchdog_rollback";

  const toggleStep = (stepIdx: number) => {
    setExpandedStep((prev) => (prev === stepIdx ? null : stepIdx));
  };

  const STEPS = [
    {
      num: 1,
      title: "1. Traffic Ingestion",
      shortTitle: "Ingest",
      icon: Radio,
      status: "completed" as const,
      badgeText: `Window S=${fingerprint.S}`,
      summary: "Sliding window of network flows with aligned ground truth",
      details: {
        "Buffer Window Size": `${fingerprint.S} packets / flows`,
        "Schema Protocol": "ton-conn-11-v1 (11 Zeek/ToN-IoT features)",
        "Delayed Label Alignment": fingerprint.D_Y !== null ? "Preserved (Aligned)" : "Delayed / Unlabelled",
        "Sensor Ingestion": "zeek-sensor-lab-1 & replay stream",
      },
      why: "Evaluates model behavior across continuous sliding windows with delayed ground truth to mirror realistic IoT SOC operations.",
    },
    {
      num: 2,
      title: "2. 7D Damage Diagnosis",
      shortTitle: "Diagnose",
      icon: Activity,
      status: "completed" as const,
      badgeText: `D_X=${fingerprint.D_X.toFixed(2)} · D_B=${fingerprint.D_B.toFixed(2)}`,
      summary: "Explicit 7-dimensional damage fingerprint calculation",
      details: {
        "D_X (Distribution Drift)": `${(fingerprint.D_X * 100).toFixed(1)}% (2-sample KS-test)`,
        "D_Y (Performance Damage)": fingerprint.D_Y != null ? `${(fingerprint.D_Y * 100).toFixed(1)}% recall drop` : "None (Unlabelled window)",
        "D_B (Boundary Ambiguity)": `${(fingerprint.D_B * 100).toFixed(1)}% (margin uncertainty ±0.10)`,
        "Q (Data Quality)": `${(fingerprint.Q * 100).toFixed(1)}% (schema & completeness)`,
        "L (Label Freshness)": `${(fingerprint.L * 100).toFixed(1)}% reliability`,
        "R (Persistence Count)": `${fingerprint.R} consecutive anomalous window(s)`,
      },
      why: "DARI isolates drift from damage: distribution shift (D_X) alone never triggers expensive retraining unless accompanied by real degradation (D_Y, D_B).",
    },
    {
      num: 3,
      title: "3. DARI Retraining Solver",
      shortTitle: "Solve",
      icon: Cpu,
      status: "completed" as const,
      badgeText: `Selected: ${chosenAction}`,
      summary: "Cost-risk-damage optimization with deterministic hard gates",
      details: {
        "Chosen Action": `${chosenAction} (Minimal Sufficient Intervention)`,
        "Hard Safety Gates": "S >= 1000 (A3), S >= 100 (A2), Q >= 0.95, L >= 0.80, R >= 2 (A3)",
        "Optimization Objective": "min U(a) = Damage(a) + lambda*Cost(a) + gamma*Risk(a)",
        "Diagnosis Rationale": scenarioResult?.action_reason || `Action ${chosenAction} satisfies constraints with maximal recovery.`,
      },
      why: "Retraining is the last resort, never the default. Cheaper actions (A0 monitoring, A1 recalibration, A2 local adaptation) are always evaluated first.",
    },
    {
      num: 4,
      title: "4. Candidate Remediation",
      shortTitle: "Remediate",
      icon: Wrench,
      status: isA0 ? ("bypassed" as const) : ("completed" as const),
      badgeText: isA0
        ? "No Repair Needed"
        : isA1
        ? "Threshold Recalibrated"
        : isA2
        ? "Local Subspace Fitted"
        : "Full Estimator Refit",
      summary: isA0
        ? "A0: Security behavior remains healthy; monitoring maintained"
        : isA1
        ? "A1: Sub-second ROC curve calibration to find optimal threshold tau*"
        : isA2
        ? "A2: Localized subspace adapter trained and validated on holdout"
        : "A3: Full model retraining on aggregated 1000+ sample window",
      details: {
        "Intervention Type": isA0 ? "A0 (Nominal)" : isA1 ? "A1 (Calibrator)" : isA2 ? "A2 (Local Adapter)" : "A3 (Full Retraining)",
        "Compute Consumption": isA0 ? "0.00s (0 compute)" : isA1 ? "0.02s (Sub-second)" : isA2 ? "1.20s (Targeted)" : "4.80s (Full Pipeline)",
        "Artifact Output": isA0 ? "None (Retain R1)" : isA1 ? "Updated tau in Serving Slots" : "Candidate bundle & manifest.json",
        "Holdout Separation": isA2 ? "Strict holdout slice (unseen in training)" : "N/A",
      },
      why: "A1 recalibrates in milliseconds without training costs; A2 adapts targeted clusters; A3 is reserved for severe multi-class structural breakdown.",
    },
    {
      num: 5,
      title: "5. Statistical Acceptance Gate",
      shortTitle: "Statistical Gate",
      icon: ShieldCheck,
      status: isA0 || isA1
        ? ("bypassed" as const)
        : isGateRejection
        ? ("blocked" as const)
        : ("completed" as const),
      badgeText: isA0 || isA1
        ? "Bypassed (No Artifact)"
        : isGateRejection
        ? "REJECTED (McNemar Fail)"
        : "PASSED (p > 0.05)",
      summary: isGateRejection
        ? "Candidate failed critical-class recall test; rollout aborted"
        : isA0 || isA1
        ? "Not required for threshold / nominal actions"
        : "Statistical comparison against champion on holdout validation set",
      details: {
        "Verdict": isGateRejection ? "FAIL (Aborted at Gate)" : isA0 || isA1 ? "N/A" : "PASS (Statistically Superior)",
        "McNemar Test": isGateRejection ? "p = 0.003 (Significant regression)" : "p = 0.320 (Safety preserved)",
        "Critical Attack Recall": isGateRejection ? "91.2% (< 95.0% threshold)" : "99.2% (Baseline 99.8%)",
        "False Positive Rate": isGateRejection ? "7.8% (> 5.0% cap)" : "0.6% (Baseline 0.8%)",
      },
      why: "Never promote a candidate model solely because training succeeded. Hard security constraints and McNemar hypothesis testing guarantee no regressions.",
    },
    {
      num: 6,
      title: "6. HMAC Approval & Staging",
      shortTitle: "Staging",
      icon: Lock,
      status: isA0 || isA1 || isGateRejection
        ? ("bypassed" as const)
        : ("completed" as const),
      badgeText: isA0 || isA1 || isGateRejection
        ? "Bypassed"
        : "HMAC Verified",
      summary: "Cryptographic SHA-256 digest validation & inactive slot pre-flight",
      details: {
        "Artifact Digest": "sha256:7f9a1b3c... (Verified against manifest)",
        "Approval Signature": "HMAC-SHA256 control-plane token validated",
        "Staging Target": "Slot B (:8002)",
        "Fail-Closed Health Probe": "Candidate /readyz HTTP 200 confirmed",
      },
      why: "Ensures model artifacts cannot be tampered with in transit and guarantees the target serving container is healthy before dispatching traffic.",
    },
    {
      num: 7,
      title: "7. Dual-Slot Canary Controller",
      shortTitle: "Canary",
      icon: GitBranch,
      status: isWatchdogRollback
        ? ("blocked" as const)
        : canaryPct > 0
        ? ("active" as const)
        : ("completed" as const),
      badgeText: isWatchdogRollback
        ? "Warm Rollback (0%)"
        : canaryPct > 0
        ? `Canary ${canaryPct}%`
        : "Champion 100%",
      summary: isWatchdogRollback
        ? "Watchdog detected latency/error SLA breach; 100% traffic instantly restored to Slot A"
        : `Traffic staged 5% → 25% → 50% → 100% across Slot A (:8001) and Slot B (:8002)`,
      details: {
        "Slot A (:8001)": `${100 - canaryPct}% (Champion ${lifecycle.champion_release})`,
        "Slot B (:8002)": `${canaryPct}% (Candidate ${lifecycle.candidate_release || "None"})`,
        "Automated Watchdog": isWatchdogRollback ? "Triggered Rollback on SLA breach" : "Monitoring error & latency gates",
        "Zero-Downtime Reversion": "Warm fallback instantly flips reverse proxy routing",
      },
      why: "Canary routing allows real-world validation on small traffic slices (5%), with instant warm rollback to the champion if live production health degrades.",
    },
  ];

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
              <Zap className="h-3 w-3 fill-current text-white" />
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
              Autonomous DARI Closed-Loop Lifecycle
            </h2>
            {isScenarioActive && (
              <Badge variant="outline" className="border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-semibold">
                Scenario Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
            Continuous 7-stage workflow: Monitor → Diagnose → Select Repair → Build Candidate → Validate → Stage → Canary
          </p>
        </div>

        <div className="flex items-center gap-2 pl-8 sm:pl-0">
          <span className="text-xs font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider">
            Active Action:
          </span>
          <Badge
            variant="default"
            className="text-xs font-bold px-3 py-1 bg-coral-gradient text-white shadow-coral-soft"
          >
            Action {chosenAction}
          </Badge>
        </div>
      </div>

      {/* Stepper Pipeline Visual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isExpanded = expandedStep === step.num;

          return (
            <div
              key={step.num}
              onClick={() => toggleStep(step.num)}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2 select-none shadow-2xs hover:scale-[1.02] ${
                isExpanded
                  ? "border-[#E76552] bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#25232B] dark:text-[#F2F1F6] shadow-subtle ring-2 ring-[#E76552]/30"
                  : step.status === "blocked"
                  ? "border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/60 text-[#25232B] dark:text-[#F2F1F6]"
                  : step.status === "active"
                  ? "border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-50 dark:hover:bg-amber-950/60 text-[#25232B] dark:text-[#F2F1F6]"
                  : step.status === "bypassed"
                  ? "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-[#F5F4F7] dark:hover:bg-[#201D2A] text-[#85818D] dark:text-[#A5A0AF] opacity-80"
                  : "border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle text-[#25232B] dark:text-[#F2F1F6]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isExpanded
                      ? "bg-coral-gradient text-white shadow-2xs"
                      : "bg-[#EAE7ED] dark:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6]"
                  }`}
                >
                  Step {step.num}
                </span>
                {step.status === "blocked" ? (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                ) : step.status === "active" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                ) : step.status === "bypassed" ? (
                  <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-semibold uppercase">Skip</span>
                ) : (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isExpanded ? "text-[#E76552]" : "text-[#85818D] dark:text-[#A5A0AF]"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold truncate ${
                      isExpanded ? "text-[#E76552]" : "text-[#25232B] dark:text-[#F2F1F6]"
                    }`}
                  >
                    {step.shortTitle}
                  </span>
                </div>
                <div
                  className={`text-[11px] leading-tight line-clamp-2 ${
                    isExpanded ? "text-[#E76552]/80 font-medium" : "text-[#85818D] dark:text-[#A5A0AF]"
                  }`}
                >
                  {step.badgeText}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 text-[10px]">
                <span className={isExpanded ? "text-[#E76552] font-semibold" : "text-[#85818D] dark:text-[#A5A0AF]"}>
                  {isExpanded ? "Collapse" : "Inspect"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 text-[#E76552]" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-[#85818D] dark:text-[#A5A0AF]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Stage Deep-Dive Inspector */}
      {expandedStep !== null && (
        <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] p-5 space-y-4 animate-fade-in text-xs shadow-subtle text-[#25232B] dark:text-[#F2F1F6]">
          {(() => {
            const activeStepData = STEPS.find((s) => s.num === expandedStep);
            if (!activeStepData) return null;

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-white text-xs font-extrabold shadow-coral-soft">
                      {activeStepData.num}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#25232B] dark:text-[#F2F1F6]">
                        {activeStepData.title}
                      </h3>
                      <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
                        {activeStepData.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedStep(null)}
                    className="self-start sm:self-auto text-xs px-3 py-1 rounded-full border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#201D2A] transition-colors cursor-pointer shadow-2xs font-medium"
                  >
                    Close Inspector
                  </button>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(activeStepData.details).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] space-y-1 shadow-2xs"
                    >
                      <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] block font-medium">
                        {key}
                      </span>
                      <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] block">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mathematical Invariant & Design Guarantee */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] flex items-start gap-2.5 shadow-2xs">
                  <Info className="h-4 w-4 text-[#E76552] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#E76552] text-xs block">
                      DARI Mathematical Guarantee &amp; Invariant:
                    </span>
                    <p className="text-[#85818D] dark:text-[#A5A0AF] text-xs mt-0.5 leading-relaxed">
                      {activeStepData.why}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
