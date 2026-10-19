"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreamStatus } from "@/types/contracts";
import { Play, Square, Send, Code, Radio } from "lucide-react";

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
    <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
      <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                <Radio className="h-3.5 w-3.5 text-white" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                Live Traffic Feeds &amp; Continuous Ingestion Controller
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
              Stream live network traffic into SwayamKavach via real host packet sniffing or authentic IoT attack telemetry
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 font-semibold ${
                anyRunning
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                  : "border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#85818D] dark:text-[#A5A0AF]"
              }`}
            >
              {anyRunning ? (
                <span className="flex items-center">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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
        <div className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] block">
              Master Feed Controller
            </span>
            <span className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Start both live traffic sources simultaneously or toggle them independently below
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={togglingStream || !backendHealthy || bothRunning}
              onClick={onStartBoth}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8.5 px-4 rounded-full gap-1.5 shadow-xs cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{togglingStream ? "Starting..." : "Start Both Feeds"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream || !backendHealthy || !anyRunning}
              onClick={onStopBoth}
              className="border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] hover:bg-[#F5F4F7] dark:hover:bg-[#201D2A] text-[#25232B] dark:text-[#F2F1F6] text-xs font-semibold h-8.5 px-4 rounded-full gap-1.5 cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop All Feeds</span>
            </Button>
          </div>
        </div>

        {/* Feedback Banner */}
        {streamFeedback && (
          <div className="p-3 rounded-xl text-xs bg-[#FAF9FC] dark:bg-[#1B1924] text-[#25232B] dark:text-[#F2F1F6] border border-[#EAE7ED] dark:border-[#282534] flex items-center justify-between shadow-2xs animate-fade-in">
            <span className="font-medium">Feed Status: {streamFeedback}</span>
            <span className="text-[10px] text-[#E76552] uppercase font-semibold">Live Update</span>
          </div>
        )}

        {/* 2-Column Split: Option 1 vs Option 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPTION 1: Host Live Packet Sniffer */}
          <div className="p-5 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] uppercase tracking-wider">
                  Option 1: Host Live Sniffer
                </span>
                <Badge
                  variant={isSnifferRunning ? "info" : "secondary"}
                  className="text-xs px-2.5 py-0.5"
                >
                  {isSnifferRunning ? "Sniffing Live" : "Offline"}
                </Badge>
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed mb-4">
                Sniffs real-time WiFi and LAN packets on host interface <code className="bg-[#F5F4F7] dark:bg-[#1E1B24] px-1.5 py-0.5 rounded text-[#25232B] dark:text-[#F2F1F6] font-mono text-[11px]">wlp2s0 (or any)</code> and extracts Zeek connection features.
              </p>

              {/* Real-time stats with Bigger Numbers */}
              <div className="grid grid-cols-3 gap-2 bg-[#FAF9FC] dark:bg-[#1B1924] p-3 rounded-xl border border-[#EAE7ED] dark:border-[#282534] text-center">
                <div>
                  <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">Packets</div>
                  <div className="text-2xl font-bold text-[#25232B] dark:text-[#F2F1F6] mt-0.5 tabular-nums">
                    {streamStatus?.sniffer?.packets_captured ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">Flows Ingested</div>
                  <div className="text-2xl font-bold text-[#25232B] dark:text-[#F2F1F6] mt-0.5 tabular-nums">
                    {streamStatus?.sniffer?.flows_ingested ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">Active Buffer</div>
                  <div className="text-2xl font-bold text-[#25232B] dark:text-[#F2F1F6] mt-0.5 tabular-nums">
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
              className={`w-full text-xs font-semibold h-8.5 rounded-full cursor-pointer ${
                isSnifferRunning
                  ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100"
                  : "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#1E1B24] hover:bg-[#F5F4F7] dark:hover:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6]"
              }`}
            >
              {togglingStream ? "Switching..." : isSnifferRunning ? "Stop Live Sniffer" : "Start Live WiFi Sniffer"}
            </Button>
          </div>

          {/* OPTION 2: Real IoT Attack Replay Stream */}
          <div className="p-5 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] uppercase tracking-wider">
                  Option 2: IoT Attack Replay
                </span>
                <Badge
                  variant={isReplayRunning ? "warning" : "secondary"}
                  className="text-xs px-2.5 py-0.5"
                >
                  {isReplayRunning ? "Replaying 10 per sec" : "Offline"}
                </Badge>
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed mb-4">
                Continuous stream of real IoT testbed captures containing authentic attacks (DDoS, Ransomware, XSS, DoS, PortScan) from <code className="bg-[#F5F4F7] dark:bg-[#1E1B24] px-1.5 py-0.5 rounded text-[#25232B] dark:text-[#F2F1F6] font-mono text-[11px]">ToN_IoT</code>.
              </p>

              {/* Real-time stats with Bigger Numbers */}
              <div className="grid grid-cols-3 gap-2 bg-[#FAF9FC] dark:bg-[#1B1924] p-3 rounded-xl border border-[#EAE7ED] dark:border-[#282534] text-center">
                <div>
                  <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">Events Streamed</div>
                  <div className="text-2xl font-bold text-[#25232B] dark:text-[#F2F1F6] mt-0.5 tabular-nums">
                    {streamStatus?.replay?.events_sent ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">Batches Sent</div>
                  <div className="text-2xl font-bold text-[#25232B] dark:text-[#F2F1F6] mt-0.5 tabular-nums">
                    {streamStatus?.replay?.batches_sent ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">Burst Size</div>
                  <div className="text-2xl font-bold text-[#25232B] dark:text-[#F2F1F6] mt-0.5 tabular-nums">
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
              className={`w-full text-xs font-semibold h-8.5 rounded-full cursor-pointer ${
                isReplayRunning
                  ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100"
                  : "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#1E1B24] hover:bg-[#F5F4F7] dark:hover:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6]"
              }`}
            >
              {togglingStream ? "Switching..." : isReplayRunning ? "Stop IoT Replay" : "Start IoT Attack Replay"}
            </Button>
          </div>
        </div>

        {/* Quick Test Flow Probe */}
        <div className="border-t border-[#F0EFF4] dark:border-[#282534] pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6] block">
                Single-Batch Ingestion Probe
              </span>
              <span className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
                Submit an instant 2-event test batch (1 benign and 1 DoS attack) to inspect queue latency
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPayload(!showPayload)}
              className="text-xs font-semibold text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] inline-flex items-center gap-1 cursor-pointer"
            >
              <Code className="h-3.5 w-3.5" />
              <span>{showPayload ? "Hide Payload Schema" : "View Raw Payload"}</span>
            </button>
          </div>

          {showPayload && (
            <pre className="p-4 rounded-xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] text-[#25232B] dark:text-[#F2F1F6] text-xs font-mono overflow-x-auto max-h-40 shadow-inner">
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
              className={`p-3 rounded-xl text-xs font-medium ${
                batchFeedback.toLowerCase().includes("fail") || batchFeedback.toLowerCase().includes("error")
                  ? "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
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
            className="w-full bg-[#E76552] hover:bg-[#D8523E] text-white text-xs font-semibold h-9 rounded-full gap-2 shadow-coral-soft cursor-pointer active:scale-98 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{submittingBatch ? "Submitting Probe Batch..." : "Inject 2 Test Flows (Instant Probe)"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
