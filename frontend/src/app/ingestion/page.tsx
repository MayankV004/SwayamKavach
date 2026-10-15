"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { TrafficIngestionCard } from "@/components/dashboard/TrafficIngestionCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function IngestionPage() {
  const { submittingBatch, batchFeedback, backendHealthy, sendTestBatch } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Probe Card */}
      <TrafficIngestionCard
        submittingBatch={submittingBatch}
        batchFeedback={batchFeedback}
        backendHealthy={backendHealthy}
        onSendTestBatch={sendTestBatch}
      />

      {/* Contract & Extractor Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold font-mono">
              [ TON_IOT SCHEMA SPECIFICATION ]
            </CardTitle>
            <CardDescription className="font-mono text-[11px]">
              Features extracted by pinned Zeek extractor v1.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 font-mono text-xs space-y-2.5">
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="font-bold text-zinc-900">duration</span>
              <span className="text-zinc-500 text-[11px] block">Connection length in seconds (float)</span>
            </div>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="font-bold text-zinc-900">src_bytes</span>
              <span className="text-zinc-500 text-[11px] block">Payload bytes sent by source host (int)</span>
            </div>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="font-bold text-zinc-900">dst_bytes</span>
              <span className="text-zinc-500 text-[11px] block">Payload bytes sent by destination host (int)</span>
            </div>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="font-bold text-zinc-900">src_ip_bytes</span>
              <span className="text-zinc-500 text-[11px] block">Total IP-layer bytes from source (int)</span>
            </div>
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="font-bold text-zinc-900">dst_ip_bytes</span>
              <span className="text-zinc-500 text-[11px] block">Total IP-layer bytes from destination (int)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold font-mono">
              [ STREAM INGESTION INVARIANTS ]
            </CardTitle>
            <CardDescription className="font-mono text-[11px]">
              Guarantees enforced by the ingestion pipeline before inference.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 font-mono text-xs space-y-3">
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">Idempotent Batch Receipts</span>
              <p className="text-[11px] text-zinc-600">
                Incoming batches receive a unique batch_id receipt. Duplicate batches are acknowledged idempotently without double-counting telemetry events.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">Schema Validation &amp; Quality Filter</span>
              <p className="text-[11px] text-zinc-600">
                Malformed flows or missing numerical features are rejected before entering the sliding evaluation window to preserve data quality metric Q.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
              <span className="font-bold text-zinc-950">Inference Queue Decoupling</span>
              <p className="text-[11px] text-zinc-600">
                Batch ingestion returns HTTP 202 Accepted within milliseconds. An async worker routes events through the active serving slot and publishes alert records.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
