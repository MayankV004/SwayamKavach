"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { TrafficIngestionCard } from "@/components/dashboard/TrafficIngestionCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ShieldCheck, Radio, Play, Square, Check } from "lucide-react";

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
  const bothRunning = streamStatus?.both_active ?? false;

  const totalPackets = streamStatus?.sniffer?.packets_captured ?? 0;
  const totalFlows = streamStatus?.sniffer?.flows_ingested ?? 0;
  const totalEvents = streamStatus?.replay?.events_sent ?? 0;
  const totalBatches = streamStatus?.replay?.batches_sent ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ASYMMETRIC INGESTION HERO COMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left: Signature Coral Accent Panel */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-[24px] bg-coral-gradient p-6 sm:p-8 text-white shadow-coral-soft flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-black/5 blur-xl pointer-events-none" />

          {/* Top Tag & Status */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-semibold tracking-wider uppercase text-white shadow-2xs">
              <Radio className="h-3.5 w-3.5 fill-current" />
              <span>Network Ingestion Engine · ton-conn-11-v1</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>{anyRunning ? "Live Ingestion Streaming" : "Ingestion Idle"}</span>
            </div>
          </div>

          {/* Core Headline */}
          <div className="relative z-10 space-y-2 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {anyRunning ? "Streaming Live Network Flows" : "Dual-Feed Traffic Ingestion"}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-xl leading-relaxed">
              Capture real-world socket traffic via host sniffer or replay authentic ToN_IoT multi-class cyberattacks. Ingested flows are normalized and queued into continuous sliding windows.
            </p>
          </div>

          {/* Telemetry Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Packets Sniffed</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{totalPackets.toLocaleString()}</span>
              <span className="text-[10px] text-white/75 block">Host socket live</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Flows Extracted</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{totalFlows.toLocaleString()}</span>
              <span className="text-[10px] text-white/75 block">Zeek 11-feature</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Replay Events</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{totalEvents.toLocaleString()}</span>
              <span className="text-[10px] text-white/75 block">ToN_IoT attack stream</span>
            </div>
            <div>
              <span className="text-[11px] text-white/70 block font-medium">Batches Queued</span>
              <span className="text-lg sm:text-xl font-extrabold text-white tabular-nums">{totalBatches.toLocaleString()}</span>
              <span className="text-[10px] text-white/75 block">HTTP POST batches</span>
            </div>
          </div>

          {/* Master Stream Controls */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-6">
            <Button
              variant="default"
              size="sm"
              disabled={togglingStream || bothRunning}
              onClick={startBothStreams}
              className="bg-white text-[#E76552] hover:bg-white/95 text-xs font-bold h-9 px-5 rounded-full gap-1.5 shadow-subtle cursor-pointer active:scale-98 transition-transform"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{togglingStream ? "Starting..." : "Start Both Live Feeds"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={togglingStream || !anyRunning}
              onClick={stopBothStreams}
              className="border-white/30 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold h-9 px-4 rounded-full gap-1.5 cursor-pointer backdrop-blur-xs transition-colors"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop All Feeds</span>
            </Button>
          </div>
        </div>

        {/* Right: Ingestion Guarantees Checklist */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-[24px] border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] p-6 sm:p-7 shadow-subtle flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFF4] dark:border-[#282534]">
              <div>
                <h3 className="text-base font-bold text-[#25232B] dark:text-[#F2F1F6]">
                  Stream Ingestion Invariants
                </h3>
                <p className="text-xs text-[#85818D] dark:text-[#A5A0AF] mt-0.5">
                  Pre-inference data safety and idempotency rules
                </p>
              </div>
              <Badge variant="outline" className="border-[#EAE7ED] dark:border-[#282534] bg-[#F5F4F7] dark:bg-[#1E1B24] text-[#25232B] dark:text-[#F2F1F6] text-[10px] font-semibold">
                Verified
              </Badge>
            </div>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Idempotent Batch Receipts</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Unique UUID acknowledgment avoids double-counting duplicate telemetry.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Schema Validation &amp; Quality Filter</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Malformed flows rejected prior to evaluation buffer to protect Q &ge; 0.95.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Inference Queue Decoupling</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Packet ingestion buffers independently from GPU/CPU inference routines.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="h-5 w-5 rounded-full bg-[#FDF0EE] dark:bg-[#E76552]/15 text-[#E76552] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <div className="text-xs leading-relaxed">
                  <strong className="text-[#25232B] dark:text-[#F2F1F6] font-semibold block">Deterministic Temporal Chronology</strong>
                  <span className="text-[#85818D] dark:text-[#A5A0AF]">Out-of-order flows are buffered and sorted deterministically.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EFF4] dark:border-[#282534] flex items-center justify-between text-xs">
            <span className="text-[#85818D] dark:text-[#A5A0AF]">Schema Contract</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 inline-block" />
              ton-conn-11-v1 Pinned
            </span>
          </div>
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
                Kernel-level network tap listens on all active interfaces (<code className="text-[#25232B] dark:text-[#F2F1F6] font-mono">any / eth0</code>), reassembles TCP/UDP bidirectional sessions, and outputs pinned 11-feature flow records at wire speed.
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
