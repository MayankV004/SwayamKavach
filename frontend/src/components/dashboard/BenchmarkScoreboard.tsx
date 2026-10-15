"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BenchmarkReport } from "@/types/contracts";

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
    <Card className="border-zinc-200 bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 font-semibold">
                EVALUATION
              </span>
              <CardTitle className="text-sm font-bold font-mono">
                DARI vs. Baseline Empirical Benchmark Scoreboard
              </CardTitle>
            </div>
            <CardDescription className="mt-1 font-mono text-[11px]">
              Continuous streaming evaluation across identical 2,000-event replay windows under covariate and concept drift.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshBenchmark}
            disabled={loadingBenchmark}
            className="self-start sm:self-auto font-mono text-xs border-zinc-300 hover:bg-zinc-100 text-zinc-900"
          >
            {loadingBenchmark ? "RUNNING BENCHMARK..." : "RE-RUN BENCHMARK"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {benchmarkReport ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Policy Strategy</th>
                    <th className="py-2.5 px-3">Cumulative Recall</th>
                    <th className="py-2.5 px-3">False Alarm (FPR)</th>
                    <th className="py-2.5 px-3">Unnecessary Retrains</th>
                    <th className="py-2.5 px-3">Compute Saved</th>
                    <th className="py-2.5 px-3">Label Savings</th>
                    <th className="py-2.5 px-3">Recovery Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs">
                  {Object.values(benchmarkReport.results).map((res) => {
                    const isDari = res.policy === "dari";
                    return (
                      <tr
                        key={res.policy}
                        className={
                          isDari
                            ? "bg-zinc-100 font-bold text-zinc-950"
                            : "hover:bg-zinc-50 text-zinc-700 transition-colors"
                        }
                      >
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span className="uppercase">{res.policy.replace("_", " ")}</span>
                          {isDari && (
                            <Badge variant="default" className="text-[9px] px-1 py-0 ml-1 bg-zinc-950 text-white">
                              OPTIMAL
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-900 font-semibold">
                          {(res.cumulative_recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-zinc-800">
                          {(res.cumulative_fpr * 100).toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              res.unnecessary_retrain_rate === 0
                                ? "text-emerald-700 font-bold"
                                : "text-red-700 font-medium"
                            }
                          >
                            {(res.unnecessary_retrain_rate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                          {res.compute_savings_pct > 0
                            ? `+${res.compute_savings_pct.toFixed(1)}%`
                            : "0.0%"}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                          {res.label_savings_pct > 0
                            ? `+${res.label_savings_pct.toFixed(1)}%`
                            : "0.0%"}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">
                          {res.mean_recovery_time_s.toFixed(2)}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Benchmark Summary Verdict */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 font-mono leading-relaxed">
              <span className="font-bold text-zinc-950">[ EMPIRICAL SUMMARY ]: </span>
              {benchmarkReport.summary_verdict}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-400 font-mono">
            {loadingBenchmark ? "EVALUATING REPLAY WINDOWS..." : "NO BENCHMARK DATA LOADED."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
