"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useDashboard } from "@/context/DashboardContext";
import {
  getInitialNodes,
  getInitialEdges,
} from "@/components/dashboard/langgraph/graphData";
import { LangGraphCustomNode } from "@/components/dashboard/langgraph/LangGraphCustomNode";
import { NodeDetailsPanel } from "@/components/dashboard/langgraph/NodeDetailsPanel";
import { GraphLegend } from "@/components/dashboard/langgraph/GraphLegend";
import { Badge } from "@/components/ui/badge";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export function InteractiveLangGraphFlow() {
  const {
    theme,
    lifecycle,
    effectiveFingerprint,
    effectiveAction,
    scenarioResult,
    runningScenario,
    actingCanary,
  } = useDashboard();

  const isDark = theme === "dark";
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("selector");

  const nodeTypes = useMemo(
    () => ({
      langGraphNode: LangGraphCustomNode,
    }),
    []
  );

  // Compute active node statuses and telemetry dynamically from runtime state
  const computedNodes: Node[] = useMemo(() => {
    const rawNodes = getInitialNodes();
    const action = effectiveAction || "A0";
    const isScenarioActive = Boolean(scenarioResult);
    const isGateReject = scenarioResult?.scenario === "faulty_candidate_rejection";
    const isWatchdogRollback = scenarioResult?.scenario === "canary_watchdog_rollback";

    return rawNodes.map((n) => {
      let status: "idle" | "running" | "completed" | "failed" | "skipped" | "active" = "idle";
      let telemetryNote: string | undefined = undefined;

      // Start, Monitor, Damage always complete in a cycle
      if (n.id === "start" || n.id === "monitor" || n.id === "damage") {
        status = runningScenario ? "running" : "completed";
        if (n.id === "damage") {
          telemetryNote = `D_X=${(effectiveFingerprint.D_X * 100).toFixed(1)}% · D_B=${effectiveFingerprint.D_B.toFixed(2)}`;
        }
      }

      // Selector
      if (n.id === "selector") {
        status = runningScenario ? "running" : "completed";
        telemetryNote = `Action: ${action}`;
      }

      // Repair branches
      if (n.id === "calibrate") {
        if (action === "A1") {
          status = "completed";
          telemetryNote = "θ* calibrated";
        } else {
          status = "skipped";
        }
      }

      if (n.id === "adapt") {
        if (action === "A2") {
          status = "completed";
          telemetryNote = "Candidate release built";
        } else {
          status = "skipped";
        }
      }

      if (n.id === "retrain") {
        if (action === "A3") {
          status = runningScenario ? "running" : "completed";
          telemetryNote = "Candidate release built";
        } else {
          status = "skipped";
        }
      }

      // Evaluation Gate
      if (n.id === "evaluate_candidate") {
        if (action === "A2" || action === "A3") {
          if (isGateReject) {
            status = "failed";
            telemetryNote = "REJECTED (McNemar p < 0.05)";
          } else {
            status = "completed";
            telemetryNote = "PASS (Recall ≥ 95%)";
          }
        } else {
          status = "skipped";
        }
      }

      // Canary Dispatch
      if (n.id === "canary_dispatch") {
        if (actingCanary) {
          status = "active";
          telemetryNote = `Weight: ${Math.round(lifecycle.canary_weight * 100)}%`;
        } else if (isWatchdogRollback) {
          status = "failed";
          telemetryNote = "Watchdog Rollback < 1.0s";
        } else if (action === "A2" || action === "A3") {
          if (isGateReject) {
            status = "skipped";
          } else {
            status = "completed";
            telemetryNote = `Slot ${lifecycle.candidate_slot || "B"} Staged`;
          }
        } else {
          status = "idle";
        }
      }

      // Audit & End
      if (n.id === "audit" || n.id === "end") {
        status = isScenarioActive ? "completed" : "idle";
      }

      // Mark the chosen action or selected node as active
      if (n.id === selectedNodeId) {
        if (status === "idle") status = "active";
      }

      return {
        ...n,
        data: {
          ...n.data,
          status,
          telemetryNote,
        },
      };
    });
  }, [
    effectiveAction,
    effectiveFingerprint,
    scenarioResult,
    runningScenario,
    actingCanary,
    lifecycle,
    selectedNodeId,
  ]);

  // Compute active edges based on chosenAction
  const computedEdges: Edge[] = useMemo(() => {
    const rawEdges = getInitialEdges();
    const action = effectiveAction || "A0";
    const isGateReject = scenarioResult?.scenario === "faulty_candidate_rejection";

    return rawEdges.map((e) => {
      let isPathActive = false;
      let strokeColor = isDark ? "#3E3A4D" : "#D5D2DA";
      let strokeWidth = 2;

      // Pipeline root edges always active
      if (["e-start-monitor", "e-monitor-damage", "e-damage-selector"].includes(e.id)) {
        isPathActive = true;
        strokeColor = "#10B981";
      }

      // Selector branching
      if (action === "A0" && e.id === "e-selector-audit-a0") {
        isPathActive = true;
        strokeColor = "#10B981";
      }
      if (action === "A1" && ["e-selector-calibrate", "e-calibrate-audit"].includes(e.id)) {
        isPathActive = true;
        strokeColor = "#E76552";
      }
      if (action === "A2" && ["e-selector-adapt", "e-adapt-eval"].includes(e.id)) {
        isPathActive = true;
        strokeColor = "#A78BFA";
      }
      if (action === "A3" && ["e-selector-retrain", "e-retrain-eval"].includes(e.id)) {
        isPathActive = true;
        strokeColor = "#E76552";
      }

      // Evaluation outcomes
      if (e.id === "e-eval-canary") {
        if ((action === "A2" || action === "A3") && !isGateReject) {
          isPathActive = true;
          strokeColor = "#10B981";
        }
      }
      if (e.id === "e-eval-audit-fail") {
        if (isGateReject) {
          isPathActive = true;
          strokeColor = "#EF4444";
          strokeWidth = 3;
        }
      }

      // Canary to audit
      if (e.id === "e-canary-audit" && (action === "A2" || action === "A3") && !isGateReject) {
        isPathActive = true;
        strokeColor = "#10B981";
      }

      // Audit to end
      if (e.id === "e-audit-end") {
        isPathActive = true;
        strokeColor = isDark ? "#6B7280" : "#9CA3AF";
      }

      return {
        ...e,
        animated: isPathActive,
        style: {
          ...e.style,
          stroke: isPathActive ? strokeColor : (isDark ? "#282534" : "#EAE7ED"),
          strokeWidth: isPathActive ? strokeWidth : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isPathActive ? strokeColor : (isDark ? "#282534" : "#EAE7ED"),
        },
      };
    });
  }, [effectiveAction, scenarioResult, isDark]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges);

  // Sync state when dependencies change
  React.useEffect(() => {
    setNodes(computedNodes);
  }, [computedNodes, setNodes]);

  React.useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const getActiveTelemetryForSelectedNode = () => {
    if (!selectedNodeId) return undefined;
    switch (selectedNodeId) {
      case "monitor":
        return {
          window_size: effectiveFingerprint.S,
          protocol: "ton-conn-11-v1",
          features_monitored: 11,
        };
      case "damage":
        return {
          distribution_drift_D_X: effectiveFingerprint.D_X,
          boundary_damage_D_B: effectiveFingerprint.D_B,
          performance_damage_D_Y: effectiveFingerprint.D_Y ?? "delayed / unlabelled",
          data_quality_Q: effectiveFingerprint.Q,
          label_reliability_L: effectiveFingerprint.L,
          persistence_count_R: effectiveFingerprint.R,
        };
      case "selector":
        return {
          chosen_action: effectiveAction,
          feasible_actions: effectiveAction === "A3" ? ["A0", "A1", "A2", "A3"] : ["A0", "A1"],
          utility_objective: "max U(A) subject to safety constraints",
        };
      case "canary_dispatch":
        return {
          canary_weight_pct: Math.round(lifecycle.canary_weight * 100),
          active_slot: lifecycle.active_slot,
          candidate_release: lifecycle.candidate_release || "None",
          rollback_sla_limit_seconds: 1.0,
        };
      case "evaluate_candidate":
        return {
          candidate_release: lifecycle.candidate_release || "R2-candidate",
          champion_release: lifecycle.champion_release,
          verdict: scenarioResult?.evaluation_verdict || "PASS",
          wilcoxon_paired_test: "p < 0.05 (statistically significant)",
        };
      default:
        return undefined;
    }
  };

  return (
    <div className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-5 sm:p-6 shadow-subtle space-y-4">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534] gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
            <Cpu className="h-3.5 w-3.5 text-white" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
              Interactive LangGraph Orchestration &amp; Canary Flow
            </h3>
            <p className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Live React Flow state machine visualizing DARI routing, non-regression gates, and two-slot canary staging
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-semibold"
          >
            {runningScenario
              ? "Graph Executing..."
              : scenarioResult
              ? `Scenario: ${scenarioResult.scenario}`
              : "Steady-State Monitored"}
          </Badge>
        </div>
      </div>

      {/* Main Graph Canvas and Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* React Flow Viewport (col-span-2) */}
        <div className="lg:col-span-2 relative h-[560px] rounded-xl border border-[#EAE7ED] dark:border-[#282534] overflow-hidden bg-[#FAF9FC] dark:bg-[#0F0E13]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color={isDark ? "#282534" : "#EAE7ED"}
            />
            <Controls
              showInteractive={false}
              className="!bg-white dark:!bg-[#16151D] !border-[#EAE7ED] dark:!border-[#282534] !shadow-2xs rounded-lg overflow-hidden"
            />
            <MiniMap
              nodeStrokeColor={isDark ? "#3E3A4D" : "#D5D2DA"}
              nodeColor={isDark ? "#1B1924" : "#FAF9FC"}
              maskColor={isDark ? "rgba(15, 14, 19, 0.7)" : "rgba(245, 244, 247, 0.7)"}
              className="!border !border-[#EAE7ED] dark:!border-[#282534] !rounded-lg overflow-hidden !bg-white dark:!bg-[#16151D]"
              zoomable
              pannable
            />
          </ReactFlow>

          {/* Canvas Floating Quick-Hint */}
          <div className="absolute top-3 left-3 pointer-events-none z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#16151D]/80 backdrop-blur-xs border border-[#EAE7ED] dark:border-[#282534] text-[10px] text-[#85818D] dark:text-[#A5A0AF]">
            <span>Click any node to inspect invariants &amp; state contracts</span>
          </div>
        </div>

        {/* Selected Node Details Panel (col-span-1) */}
        <div className="lg:col-span-1 flex flex-col justify-between">
          <NodeDetailsPanel
            selectedNodeId={selectedNodeId}
            onClose={() => setSelectedNodeId(null)}
            status={
              computedNodes.find((n) => n.id === selectedNodeId)?.data?.status as string || "ready"
            }
            telemetryData={getActiveTelemetryForSelectedNode()}
          />
        </div>
      </div>

      {/* Workflow Legend */}
      <GraphLegend />

      {/* Active Scenario Rationale Callout */}
      {scenarioResult && (
        <div className="rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            {scenarioResult.safety_invariants_preserved ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-[#25232B] dark:text-[#F2F1F6]">
                Active LangGraph State:
              </span>{" "}
              <span className="text-[#85818D] dark:text-[#A5A0AF]">
                {scenarioResult.action_reason}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-medium">
            <span className="text-[#85818D] dark:text-[#A5A0AF]">Deployment:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {scenarioResult.deployment_action}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
