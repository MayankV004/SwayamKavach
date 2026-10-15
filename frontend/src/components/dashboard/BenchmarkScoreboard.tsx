"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BenchmarkReport } from "@/types/contracts";
import { RefreshCw, CheckCircle2 } from "lucide-react";

interface BenchmarkScoreboardProps {
  benchmarkReport: BenchmarkReport | null;
  loadingBenchmark: boolean;
  onRefreshBenchmark: () => void;
}

export function BenchmarkScoreboard({
  benchmarkReport,
  loadingBenchmark,
  onRefreshBenchmark,
}: BenchmarkScoreboardProps) {
  return (
    <Card className="border-zinc-200/90 bg-white shadow-xs">
      <CardHeader className="pb-4 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-700">
                05
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-950">
                DARI vs. Baseline Empirical Benchmark Scoreboard
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-zinc-500 pl-7">
              Continuous streaming evaluation across identical 2,000-event replay windows under covariate and concept drift
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshBenchmark}
            disabled={loadingBenchmark}
            className="self-start sm:self-auto text-xs font-semibold border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 gap-1.5 h-8.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingBenchmark ? "animate-spin" : ""}`} />
            <span>{loadingBenchmark ? "Running Benchmark..." : "Re-run Benchmark"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {benchmarkReport ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-zinc-200/90 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Policy Strategy</th>
                    <th className="py-3 px-4">Cumulative Recall</th>
                    <th className="py-3 px-4">False Alarm (FPR)</th>
                    <th className="py-3 px-4">Unnecessary Retrains</th>
                    <th className="py-3 px-4">Compute Saved</th>
                    <th className="py-3 px-4">Label Savings</th>
                    <th className="py-3 px-4">Recovery Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {Object.values(benchmarkReport.results).map((res) => {
                    const isDari = res.policy === "dari";
                    return (
                      <tr
                        key={res.policy}
                        className={
                          isDari
                            ? "bg-zinc-50/90 font-semibold text-zinc-950"
                            : "hover:bg-zinc-50/50 text-zinc-700 transition-colors"
                        }
                      >
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wide text-zinc-900">
                            {res.policy.replace("_", " ")}
                          </span>
                          {isDari && (
                            <Badge variant="default" className="text-[10px] px-2 py-0.2 bg-zinc-950 text-white font-bold">
                              OPTIMAL
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-950 font-bold tabular-nums">
                          {(res.cumulative_recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-zinc-800 tabular-nums">
                          {(res.cumulative_fpr * 100).toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span
                            className={
                              res.unnecessary_retrain_rate === 0
                                ? "text-emerald-700 font-bold"
                                : "text-red-700 font-semibold"
                            }
                          >
                            {(res.unnecessary_retrain_rate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-emerald-700 font-bold tabular-nums">
                          {res.compute_savings_pct > 0
                            ? `+${res.compute_savings_pct.toFixed(1)}%`
                            : "0.0%"}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 font-bold tabular-nums">
                          {res.label_savings_pct > 0
                            ? `+${res.label_savings_pct.toFixed(1)}%`
                            : "0.0%"}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 tabular-nums font-medium">
                          {res.mean_recovery_time_s.toFixed(2)}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Benchmark Summary Verdict */}
            <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 text-xs text-zinc-700 leading-relaxed flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-950 mr-1.5">Empirical Evaluation Verdict:</span>
                <span>{benchmarkReport.summary_verdict}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
            {loadingBenchmark ? "Evaluating replay windows..." : "No benchmark data loaded."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
