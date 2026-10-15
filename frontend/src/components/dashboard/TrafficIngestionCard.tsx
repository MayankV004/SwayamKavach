"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreamStatus } from "@/types/contracts";
import { Play, Square, Send, Code } from "lucide-react";

interface TrafficIngestionCardProps {
  submittingBatch: boolean;
  batchFeedback: string | null;
  backendHealthy: boolean | null;
  onSendTestBatch: () => void;
  streamStatus?: StreamStatus | null;
  togglingStream?: boolean;
  streamFeedback?: string | null;
  onToggleReplay?: () => void;
  onToggleSniffer?: () => void;
  onStartBoth?: () => void;
  onStopBoth?: () => void;
}

export function TrafficIngestionCard({
  submittingBatch,
  batchFeedback,
  backendHealthy,
  onSendTestBatch,
  streamStatus,
  togglingStream = false,
  streamFeedback,
  onToggleReplay,
  onToggleSniffer,
  onStartBoth,
  onStopBoth,
}: TrafficIngestionCardProps) {
  const [showPayload, setShowPayload] = useState(false);

  const isReplayRunning = streamStatus?.replay?.is_running ?? false;
  const isSnifferRunning = streamStatus?.sniffer?.is_running ?? false;
  const anyRunning = streamStatus?.any_active ?? false;
  const bothRunning = streamStatus?.both_active ?? false;

  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardHeader className="pb-4 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                04
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                Live Traffic Feeds &amp; Continuous Ingestion Controller
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-zinc-500 pl-7">
              Stream live network traffic into SwayamKavach via real host packet sniffing or authentic IoT attack telemetry
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 font-semibold ${
                anyRunning
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
              }`}
            >
              {anyRunning ? (
                <span className="flex items-center">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Streaming Live
                </span>
              ) : (
                "Idle (Waiting for Feed)"
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Master Action Banner */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-zinc-900 block">
              Master Feed Controller
            </span>
            <span className="text-xs text-zinc-500">
              Start both live traffic sources simultaneously or toggle them independently below
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={togglingStream || !backendHealthy || bothRunning}
              onClick={onStartBoth}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-3.5 gap-1.5"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{togglingStream ? "Starting..." : "Start Both Feeds"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream || !backendHealthy || !anyRunning}
              onClick={onStopBoth}
              className="border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold h-8 px-3.5 gap-1.5"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop All Feeds</span>
            </Button>
          </div>
        </div>

        {/* Feedback Banner */}
        {streamFeedback && (
          <div className="p-3 rounded-lg text-xs bg-zinc-900 text-zinc-100 border border-zinc-800 flex items-center justify-between shadow-xs animate-fade-in">
            <span className="font-medium">Feed Status: {streamFeedback}</span>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Live Update</span>
          </div>
        )}

        {/* 2-Column Split: Option 1 vs Option 2 with Bigger Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPTION 1: Host Live Packet Sniffer */}
          <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Option 1: Host Live Sniffer
                </span>
                <Badge
                  variant={isSnifferRunning ? "info" : "secondary"}
                  className="text-xs px-2.5 py-0.5"
                >
                  {isSnifferRunning ? "Sniffing Live" : "Offline"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                Sniffs real-time WiFi and LAN packets on host interface <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-[11px]">wlp2s0 (or any)</code> and extracts Zeek connection features.
              </p>

              {/* Real-time stats with Bigger Numbers */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-50/80 p-3 rounded-lg border border-zinc-100 text-center">
                <div>
                  <div className="text-[11px] text-zinc-500">Packets</div>
                  <div className="text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                    {streamStatus?.sniffer?.packets_captured ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500">Flows Ingested</div>
                  <div className="text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                    {streamStatus?.sniffer?.flows_ingested ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500">Active Buffer</div>
                  <div className="text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                    {streamStatus?.sniffer?.active_flows_in_buffer ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream || !backendHealthy}
              onClick={onToggleSniffer}
              className={`w-full text-xs font-semibold h-8.5 ${
                isSnifferRunning
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900"
              }`}
            >
              {togglingStream ? "Switching..." : isSnifferRunning ? "Stop Live Sniffer" : "Start Live WiFi Sniffer"}
            </Button>
          </div>

          {/* OPTION 2: Real IoT Attack Replay Stream */}
          <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Option 2: IoT Attack Replay
                </span>
                <Badge
                  variant={isReplayRunning ? "warning" : "secondary"}
                  className="text-xs px-2.5 py-0.5"
                >
                  {isReplayRunning ? "Replaying 10 per sec" : "Offline"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                Continuous stream of real IoT testbed captures containing authentic attacks (DDoS, Ransomware, XSS, DoS, PortScan) from <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-[11px]">ToN_IoT</code>.
              </p>

              {/* Real-time stats with Bigger Numbers */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-50/80 p-3 rounded-lg border border-zinc-100 text-center">
                <div>
                  <div className="text-[11px] text-zinc-500">Events Streamed</div>
                  <div className="text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                    {streamStatus?.replay?.events_sent ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500">Batches Sent</div>
                  <div className="text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                    {streamStatus?.replay?.batches_sent ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500">Burst Size</div>
                  <div className="text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                    {streamStatus?.replay?.batch_size ?? 15}
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream || !backendHealthy}
              onClick={onToggleReplay}
              className={`w-full text-xs font-semibold h-8.5 ${
                isReplayRunning
                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900"
              }`}
            >
              {togglingStream ? "Switching..." : isReplayRunning ? "Stop IoT Replay" : "Start IoT Attack Replay"}
            </Button>
          </div>
        </div>

        {/* Quick Test Flow Probe */}
        <div className="border-t border-zinc-100 pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-zinc-900 block">
                Single-Batch Ingestion Probe
              </span>
              <span className="text-xs text-zinc-500">
                Submit an instant 2-event test batch (1 benign and 1 DoS attack) to inspect queue latency
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPayload(!showPayload)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <Code className="h-3.5 w-3.5" />
              <span>{showPayload ? "Hide Payload Schema" : "View Raw Payload"}</span>
            </button>
          </div>

          {showPayload && (
            <pre className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-200 text-xs font-mono overflow-x-auto max-h-40">
{`{
  "batch_id": "ui-probe-sample",
  "sensor_id": "zeek-sensor-lab-1",
  "events": [
    { "type": "benign", "duration": 2.4, "src_bytes": 420, "dst_bytes": 840 },
    { "type": "intrusion_dos", "duration": 65.0, "src_bytes": 45000, "dst_bytes": 89000 }
  ]
}`}
            </pre>
          )}

          {batchFeedback && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                batchFeedback.toLowerCase().includes("fail") || batchFeedback.toLowerCase().includes("error")
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-800"
              }`}
            >
              Batch Delivery Receipt: {batchFeedback}
            </div>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={onSendTestBatch}
            disabled={submittingBatch || !backendHealthy}
            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold h-9 gap-2 shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{submittingBatch ? "Submitting Probe Batch..." : "Inject 2 Test Flows (Instant Probe)"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
