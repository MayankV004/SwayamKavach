"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BenchmarkReport } from "@/types/contracts";
import { RefreshCw, CheckCircle2, BarChart3 } from "lucide-react";

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
    <Card className="rounded-2xl border border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shadow-subtle">
      <CardHeader className="pb-4 border-b border-[#F0EFF4] dark:border-[#282534]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-gradient text-[11px] font-bold text-white shadow-coral-soft">
                <BarChart3 className="h-3.5 w-3.5 text-white" />
              </span>
              <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-[#25232B] dark:text-[#F2F1F6]">
                DARI vs. Baseline Empirical Benchmark Scoreboard
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs text-[#85818D] dark:text-[#A5A0AF] pl-8">
              Continuous streaming evaluation across identical 2,000-event replay windows under covariate and concept drift
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshBenchmark}
            disabled={loadingBenchmark}
            className="self-start sm:self-auto text-xs font-semibold border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#1E1B24] hover:bg-[#F5F4F7] dark:hover:bg-[#282534] text-[#25232B] dark:text-[#F2F1F6] gap-1.5 h-8.5 rounded-full px-4 shadow-subtle cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingBenchmark ? "animate-spin text-[#E76552]" : ""}`} />
            <span>{loadingBenchmark ? "Running Benchmark..." : "Re-run Benchmark"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {benchmarkReport ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9FC] dark:bg-[#1E1B24] border-b border-[#EAE7ED] dark:border-[#282534] text-[11px] font-semibold text-[#85818D] dark:text-[#A5A0AF] uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#F0EFF4] dark:divide-[#282534] text-xs">
                  {Object.values(benchmarkReport.results).map((res) => {
                    const isDari = res.policy === "dari";
                    return (
                      <tr
                        key={res.policy}
                        className={
                          isDari
                            ? "bg-[#FAF9FC] dark:bg-[#1E1B24]/80 font-semibold text-[#25232B] dark:text-[#F2F1F6]"
                            : "hover:bg-[#FAF9FC]/60 dark:hover:bg-[#1E1B24]/40 text-[#25232B] dark:text-[#F2F1F6] transition-colors"
                        }
                      >
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wide text-[#25232B] dark:text-[#F2F1F6]">
                            {res.policy.replace("_", " ")}
                          </span>
                          {isDari && (
                            <Badge variant="default" className="text-[10px] px-2 py-0.2 bg-[#E76552] text-white font-bold shadow-xs">
                              OPTIMAL
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#25232B] dark:text-[#F2F1F6] font-bold tabular-nums">
                          {(res.cumulative_recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-[#25232B] dark:text-[#F2F1F6] tabular-nums">
                          {(res.cumulative_fpr * 100).toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span
                            className={
                              res.unnecessary_retrain_rate === 0
                                ? "text-emerald-700 dark:text-emerald-400 font-bold"
                                : "text-red-700 dark:text-red-400 font-semibold"
                            }
                          >
                            {(res.unnecessary_retrain_rate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                          {res.compute_savings_pct > 0
                            ? `+${res.compute_savings_pct.toFixed(1)}%`
                            : "0.0%"}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                          {res.label_savings_pct > 0
                            ? `+${res.label_savings_pct.toFixed(1)}%`
                            : "0.0%"}
                        </td>
                        <td className="py-3 px-4 text-[#85818D] dark:text-[#A5A0AF] tabular-nums font-medium">
                          {res.mean_recovery_time_s.toFixed(2)}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Benchmark Summary Verdict */}
            <div className="p-4 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1924] border border-[#EAE7ED] dark:border-[#282534] text-xs text-[#25232B] dark:text-[#F2F1F6] leading-relaxed flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#25232B] dark:text-[#F2F1F6] mr-1.5">Empirical Evaluation Verdict:</span>
                <span className="text-[#85818D] dark:text-[#A5A0AF]">{benchmarkReport.summary_verdict}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#85818D] dark:text-[#A5A0AF] border border-dashed border-[#EAE7ED] dark:border-[#282534] rounded-2xl bg-[#FAF9FC] dark:bg-[#1B1924]/50">
            {loadingBenchmark ? "Evaluating replay windows..." : "No benchmark data loaded."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
