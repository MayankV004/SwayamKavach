"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { TrafficIngestionCard } from "@/components/dashboard/TrafficIngestionCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSpreadsheet, ShieldCheck } from "lucide-react";

export default function IngestionPage() {
  const {
    submittingBatch,
    batchFeedback,
    backendHealthy,
    sendTestBatch,
    streamStatus,
    togglingStream,
    streamFeedback,
    toggleReplayStream,
    toggleSnifferStream,
    startBothStreams,
    stopBothStreams,
  } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Live Stream & Ingestion Controller */}
      <TrafficIngestionCard
        submittingBatch={submittingBatch}
        batchFeedback={batchFeedback}
        backendHealthy={backendHealthy}
        onSendTestBatch={sendTestBatch}
        streamStatus={streamStatus}
        togglingStream={togglingStream}
        streamFeedback={streamFeedback}
        onToggleReplay={toggleReplayStream}
        onToggleSniffer={toggleSnifferStream}
        onStartBoth={startBothStreams}
        onStopBoth={stopBothStreams}
      />

      {/* Contract & Extractor Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-200/90 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-zinc-600" />
              <CardTitle className="text-base font-bold text-zinc-950">
                ToN_IoT Schema Specification
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500">
              11 connection features extracted by pinned Zeek network extractor v1 (ton-conn-11-v1)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">duration</span>
              <span className="text-zinc-600 text-xs">Connection duration in seconds (float)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">src_bytes</span>
              <span className="text-zinc-600 text-xs">Payload bytes sent by origin host (int)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">dst_bytes</span>
              <span className="text-zinc-600 text-xs">Payload bytes sent by destination host (int)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">src_ip_bytes</span>
              <span className="text-zinc-600 text-xs">Total IP-layer bytes sent by origin host (int)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">dst_ip_bytes</span>
              <span className="text-zinc-600 text-xs">Total IP-layer bytes sent by destination host (int)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">src_pkts</span>
              <span className="text-zinc-600 text-xs">Originator packet count (int)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">dst_pkts</span>
              <span className="text-zinc-600 text-xs">Responder packet count (int)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">missed_bytes</span>
              <span className="text-zinc-600 text-xs">Missed bytes for packet capture quality tracking (int)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">proto</span>
              <span className="text-zinc-600 text-xs">Transport protocol: tcp, udp, icmp (categorical string)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">service</span>
              <span className="text-zinc-600 text-xs">Identified application service: http, dns, etc. (categorical string)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50/70 border border-zinc-200/80">
              <span className="font-bold text-zinc-900 block font-mono">conn_state</span>
              <span className="text-zinc-600 text-xs">Zeek connection state: SF, S0, REJ, etc. (categorical string)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/90 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-600" />
              <CardTitle className="text-base font-bold text-zinc-950">
                Stream Ingestion Guarantees
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500">
              Invariants enforced by the ingestion pipeline prior to inference dispatch
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1">
              <span className="font-bold text-zinc-950 text-sm block">Idempotent Batch Receipts</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Incoming batches receive a unique batch identifier receipt. Duplicate batches are acknowledged idempotently without double-counting telemetry events.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1">
              <span className="font-bold text-zinc-950 text-sm block">Schema Validation &amp; Quality Filter</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Malformed flows or missing numerical features are rejected before entering the sliding evaluation window to preserve data quality metric Q.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 space-y-1">
              <span className="font-bold text-zinc-950 text-sm block">Inference Queue Decoupling</span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Network packet ingestion is fully decoupled from model evaluation via persistent buffer queues to prevent backpressure drops.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
