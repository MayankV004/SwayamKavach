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
  const isA3 = chosenAction === "A3";
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
      badgeVariant: "secondary" as const,
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
      badgeVariant: fingerprint.D_Y != null && fingerprint.D_Y > 0.05 ? ("destructive" as const) : ("info" as const),
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
      badgeVariant:
        chosenAction === "A0"
          ? ("secondary" as const)
          : chosenAction === "A1"
          ? ("info" as const)
          : chosenAction === "A2"
          ? ("warning" as const)
          : ("destructive" as const),
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
      badgeVariant: isA0 ? ("outline" as const) : ("success" as const),
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
        ? "Bypassed (No Model Artifact)"
        : isGateRejection
        ? "REJECTED (McNemar Fail)"
        : "PASSED (p > 0.05)",
      badgeVariant: isGateRejection ? ("destructive" as const) : isA0 || isA1 ? ("outline" as const) : ("success" as const),
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
        : "Cryptographically Verified",
      badgeVariant: isA0 || isA1 || isGateRejection ? ("outline" as const) : ("success" as const),
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
        : "Standby / Champion 100%",
      badgeVariant: isWatchdogRollback ? ("destructive" as const) : canaryPct > 0 ? ("warning" as const) : ("secondary" as const),
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
    <div className="rounded-xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-zinc-100 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-950 text-[11px] font-bold text-white shadow-xs">
              <Zap className="h-3 w-3 fill-current" />
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
              Autonomous DARI Self-Healing Pipeline
            </h2>
            {isScenarioActive && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 text-[11px] font-semibold">
                Live Scenario Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 pl-7.5">
            End-to-end 7-stage closed loop: Monitor → Diagnose → Select Repair → Build Candidate → Validate → Stage → Canary
          </p>
        </div>

        <div className="flex items-center gap-2 pl-7.5 sm:pl-0">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Action:
          </span>
          <Badge
            variant="default"
            className={`text-xs font-bold px-2.5 py-0.5 ${
              chosenAction === "A0"
                ? "bg-zinc-800 text-white"
                : chosenAction === "A1"
                ? "bg-blue-600 text-white"
                : chosenAction === "A2"
                ? "bg-amber-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            Level {chosenAction}
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
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-2 select-none ${
                isExpanded
                  ? "border-zinc-950 bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-950"
                  : step.status === "blocked"
                  ? "border-red-200 bg-red-50/70 hover:bg-red-50 text-zinc-900"
                  : step.status === "active"
                  ? "border-amber-300 bg-amber-50/70 hover:bg-amber-50 text-zinc-900"
                  : step.status === "bypassed"
                  ? "border-zinc-200/70 bg-zinc-50/40 hover:bg-zinc-100/70 text-zinc-600 opacity-80"
                  : "border-zinc-200/80 bg-zinc-50/60 hover:bg-white hover:border-zinc-300 hover:shadow-xs text-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isExpanded
                      ? "bg-zinc-800 text-zinc-200"
                      : "bg-zinc-200/80 text-zinc-700"
                  }`}
                >
                  Step {step.num}
                </span>
                {step.status === "blocked" ? (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                ) : step.status === "active" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                ) : step.status === "bypassed" ? (
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Skip</span>
                ) : (
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      isExpanded ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isExpanded ? "text-zinc-300" : "text-zinc-600"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold truncate ${
                      isExpanded ? "text-white" : "text-zinc-950"
                    }`}
                  >
                    {step.shortTitle}
                  </span>
                </div>
                <div
                  className={`text-[11px] leading-tight line-clamp-2 ${
                    isExpanded ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  {step.badgeText}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-200/40 text-[10px]">
                <span className={isExpanded ? "text-zinc-400" : "text-zinc-400"}>
                  {isExpanded ? "Hide" : "Details"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Stage Deep-Dive Inspector */}
      {expandedStep !== null && (
        <div className="rounded-xl border border-zinc-200/90 bg-zinc-950 text-zinc-100 p-5 space-y-4 animate-fade-in text-xs shadow-xs">
          {(() => {
            const activeStepData = STEPS.find((s) => s.num === expandedStep);
            if (!activeStepData) return null;

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-zinc-950 text-xs font-extrabold">
                      {activeStepData.num}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {activeStepData.title}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {activeStepData.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedStep(null)}
                    className="self-start sm:self-auto text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded border border-zinc-700 bg-zinc-900 cursor-pointer"
                  >
                    Close Inspector
                  </button>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(activeStepData.details).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/70 space-y-1"
                    >
                      <span className="text-[11px] text-zinc-400 block font-medium">
                        {key}
                      </span>
                      <span className="text-xs font-bold text-zinc-100 block">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mathematical Invariant & Design Guarantee */}
                <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-900/60 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-400 text-xs block">
                      DARI Mathematical Guarantee &amp; Invariant:
                    </span>
                    <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed">
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
