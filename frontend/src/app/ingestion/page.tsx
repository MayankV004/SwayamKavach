"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { TrafficIngestionCard } from "@/components/dashboard/TrafficIngestionCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const anyRunning = streamStatus?.any_active ?? false;
  const totalPackets = streamStatus?.sniffer?.packets_captured ?? 0;
  const totalFlows = streamStatus?.sniffer?.flows_ingested ?? 0;
  const totalEvents = streamStatus?.replay?.events_sent ?? 0;
  const totalBatches = streamStatus?.replay?.batches_sent ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Ingestion Status Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="text-xs border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#25232B] dark:text-[#F2F1F6] px-3 py-1 font-semibold"
        >
          Contract: ton-conn-11-v1
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs px-3 py-1 font-semibold ${
            anyRunning
              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
              : "border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#85818D] dark:text-[#A5A0AF]"
          }`}
        >
          {anyRunning ? "Continuous Streaming Active" : "Dual-Feed Socket Idle"}
        </Badge>
      </div>

      {/* Clean Telemetry Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">Packets Captured</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums block">
            {totalPackets.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1 block">Host socket live</span>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">Flows Extracted</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums block">
            {totalFlows.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1 block">11-feature Zeek conn</span>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">Replay Events Sent</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums block">
            {totalEvents.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#85818D] dark:text-[#A5A0AF] mt-1 block">ToN_IoT attack stream</span>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <span className="text-[11px] font-medium text-[#85818D] dark:text-[#A5A0AF] block">Batches Ingested</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#25232B] dark:text-[#F2F1F6] mt-1 tabular-nums block">
            {totalBatches.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">HTTP POST idempotence</span>
        </div>
      </div>

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
        <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <CardHeader className="pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
              <CardTitle className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                ToN_IoT Schema Specification
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              11 connection features extracted by pinned Zeek network extractor v1 (ton-conn-11-v1)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">duration</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Connection duration in seconds</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">float</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">src_bytes</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Payload bytes sent by origin host</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">int</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">dst_bytes</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Payload bytes sent by destination host</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">int</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">src_ip_bytes</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Total IP-layer bytes sent by origin host</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">int</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">dst_ip_bytes</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Total IP-layer bytes sent by destination host</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">int</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">src_pkts</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Originator packet count</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">int</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">dst_pkts</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Responder packet count</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">int</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">missed_bytes</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Missed bytes for packet capture quality tracking</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">int</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">proto</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Transport protocol: tcp, udp, icmp</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">categorical</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">service</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Identified application service: http, dns, etc.</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">categorical</Badge>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] transition-all flex items-center justify-between">
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] block font-mono text-xs">conn_state</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF] text-xs">Zeek connection state: SF, S0, REJ, etc.</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-white dark:bg-[#1E1B24] border-[#EAE7ED] dark:border-[#282534] text-[#25232B] dark:text-[#F2F1F6]">categorical</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
          <CardHeader className="pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
              <CardTitle className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                Sensor Topology &amp; Ingestion Architecture
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#85818D] dark:text-[#A5A0AF]">
              Live socket bindings, sliding window queueing, and asynchronous dispatch pipelines
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-1.5 shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">Host Raw Socket Sniffer</span>
                <Badge variant="outline" className="text-[10px] border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono">
                  AF_PACKET / Scapy
                </Badge>
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                Kernel-level network tap listens on active interfaces, reassembles TCP/UDP bidirectional sessions, and outputs pinned 11-feature flow records at wire speed.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-1.5 shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">Synthetic Replay Daemon</span>
                <Badge variant="outline" className="text-[10px] border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-mono">
                  ToN_IoT Ground Truth
                </Badge>
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                Asynchronous worker streams authentic multi-class cyberattacks from stored fixtures with controlled inter-packet intervals, validating drift detectors against ground truth labels.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-[#FAF9FC] dark:bg-[#1B1924] space-y-1.5 shadow-2xs hover:bg-white dark:hover:bg-[#201D2A] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:shadow-subtle transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] text-sm">Dual-Slot Inference Router</span>
                <Badge variant="outline" className="text-[10px] border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] text-[#85818D] dark:text-[#A5A0AF] font-mono">
                  :8001 &bull; :8002
                </Badge>
              </div>
              <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] leading-relaxed">
                Zero-downtime traffic splitter dynamically steers ingress traffic between Champion (Active) and Canary (Standby) serving containers using configurable weights (0% to 100%).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
