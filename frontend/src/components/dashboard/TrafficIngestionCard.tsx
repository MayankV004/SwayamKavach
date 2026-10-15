"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrafficIngestionCardProps {
  submittingBatch: boolean;
  batchFeedback: string | null;
  backendHealthy: boolean | null;
  onSendTestBatch: () => void;
}

export function TrafficIngestionCard({
  submittingBatch,
  batchFeedback,
  backendHealthy,
  onSendTestBatch,
}: TrafficIngestionCardProps) {
  const [showPayload, setShowPayload] = useState(false);

  return (
    <Card className="border-zinc-200 bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                INGESTION
              </span>
              <CardTitle className="text-sm font-bold font-mono">
                Live Traffic Ingestion Probe
              </CardTitle>
            </div>
            <CardDescription className="mt-1 font-mono text-[11px]">
              Inject TON_IoT compliant telemetry (1 benign HTTP flow + 1 high-byte attack flow) directly into ingestion.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-zinc-300 bg-zinc-50">
            ton-conn-5-v1
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3.5">
        {/* Schema and endpoint tags */}
        <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-xs space-y-1.5 text-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Destination:</span>
            <span className="font-semibold text-zinc-900">POST /api/v1/ingestion/batches</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Features:</span>
            <span className="font-semibold text-zinc-900 truncate max-w-[280px]">
              duration, src_bytes, dst_bytes, src_ip_bytes, dst_ip_bytes
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Serving Route:</span>
            <span className="font-semibold text-zinc-900">Slot A (Champion Release R1)</span>
          </div>
        </div>

        {/* Payload inspector toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowPayload(!showPayload)}
            className="font-mono text-xs text-zinc-700 hover:text-zinc-950 font-medium py-1 cursor-pointer"
          >
            {showPayload ? "[-] HIDE TEST PAYLOAD" : "[+] INSPECT SAMPLE FLOW PAYLOAD"}
          </button>

          {showPayload && (
            <pre className="mt-2 p-3 rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-200 text-[11px] font-mono overflow-x-auto max-h-40 animate-fade-in">
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
        </div>

        {/* Feedback Banner */}
        {batchFeedback && (
          <div
            className={`p-2.5 rounded-lg text-xs font-mono animate-fade-in ${
              batchFeedback.toLowerCase().includes("fail") || batchFeedback.toLowerCase().includes("error")
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            }`}
          >
            [ RECEIPT ]: {batchFeedback}
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onSendTestBatch}
          disabled={submittingBatch || !backendHealthy}
          className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs font-medium"
        >
          {submittingBatch ? "SUBMITTING BATCH..." : "INJECT 2 TEST FLOWS (1 BENIGN + 1 ATTACK)"}
        </Button>
      </CardContent>
    </Card>
  );
}
