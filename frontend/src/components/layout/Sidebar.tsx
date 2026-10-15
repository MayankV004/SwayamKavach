"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "Overview", tag: "01" },
  { href: "/canary", label: "Canary Rollout", tag: "02" },
  { href: "/scenarios", label: "Drift Simulator", tag: "03" },
  { href: "/ingestion", label: "Traffic Ingestion", tag: "04" },
  { href: "/benchmarks", label: "Benchmarks", tag: "05" },
  { href: "/alerts", label: "Alert Feed", tag: "06" },
  { href: "/lineage", label: "Release Lineage", tag: "07" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, backendHealthy, lifecycle, alerts } = useDashboard();

  return (
    <aside
      className={`border-r border-zinc-200 bg-zinc-50 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand & Toggle Bar */}
        <div className="h-14 border-b border-zinc-200 px-3.5 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex flex-col">
              <span className="font-mono font-bold text-sm tracking-wider text-zinc-950 uppercase">
                SwayamKavach
              </span>
              <span className="text-[10px] font-mono text-zinc-600 tracking-tight">
                DARI CONTROL PLANE
              </span>
            </div>
          ) : (
            <span className="font-mono font-bold text-xs text-zinc-950 mx-auto">
              SK
            </span>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            className="text-[11px] font-mono text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/80 px-2 py-1 rounded transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "[ + ]" : "[ - ]"}
          </button>
        </div>

        {/* Navigation Routes */}
        <div className="p-2 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-600">
              Navigation
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md font-mono text-xs transition-colors ${
                  isActive
                    ? "bg-zinc-950 text-white font-medium shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60"
                } ${sidebarCollapsed ? "justify-center px-1" : "justify-between"}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`text-[10px] ${isActive ? "text-zinc-400" : "text-zinc-600"}`}>
                    {item.tag}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!sidebarCollapsed && item.href === "/alerts" && alerts.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? "bg-zinc-800 text-zinc-100" : "bg-zinc-200 text-zinc-800"
                    }`}
                  >
                    {alerts.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* External Auxiliary Sections (Transferred from header) */}
        <div className="p-2 pt-3 border-t border-zinc-200/80 mt-2 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-600">
              Integrations &amp; Workbenches
            </div>
          )}

          {/* MLflow Registry */}
          <a
            href={MLFLOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open MLflow Registry (:5000)"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md font-mono text-xs text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <span>{sidebarCollapsed ? "ML" : "MLflow Registry"}</span>
            <span className="text-[10px] text-zinc-600">↗</span>
          </a>

          {/* FastAPI Swagger Docs */}
          <a
            href={`${BACKEND_ROOT_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open FastAPI Swagger (:8000/docs)"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md font-mono text-xs text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <span>{sidebarCollapsed ? "API" : "Swagger API"}</span>
            <span className="text-[10px] text-zinc-600">↗</span>
          </a>

          {/* ReDoc Technical Spec */}
          <a
            href={`${BACKEND_ROOT_URL}/redoc`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open ReDoc Specs (:8000/redoc)"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md font-mono text-xs text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <span>{sidebarCollapsed ? "DOC" : "ReDoc Specs"}</span>
            <span className="text-[10px] text-zinc-600">↗</span>
          </a>
        </div>
      </div>

      {/* Bottom Telemetry Status */}
      <div className="p-3 border-t border-zinc-200 bg-white/60 font-mono text-[11px] space-y-1.5">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Backend :8000</span>
              <span
                className={`font-semibold ${
                  backendHealthy ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {backendHealthy ? "[ ONLINE ]" : "[ OFFLINE ]"}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Serving Slot</span>
              <span className="font-semibold text-zinc-900">
                Slot {lifecycle.active_slot} ({lifecycle.champion_release})
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Policy State</span>
              <span className="font-semibold text-zinc-900">
                {lifecycle.chosen_action || "A0"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                backendHealthy ? "bg-emerald-600" : "bg-red-600"
              }`}
              title={backendHealthy ? "Backend Online" : "Backend Offline"}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
