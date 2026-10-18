"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";
import {
  Shield,
  LayoutDashboard,
  GitFork,
  Activity,
  Radio,
  BarChart3,
  ShieldAlert,
  Layers,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Server,
  FileCode2,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard, tag: "01" },
  { href: "/canary", label: "Canary Rollout", icon: GitFork, tag: "02" },
  { href: "/scenarios", label: "Drift Simulator", icon: Activity, tag: "03" },
  { href: "/ingestion", label: "Traffic Ingestion", icon: Radio, tag: "04" },
  { href: "/benchmarks", label: "Benchmarks", icon: BarChart3, tag: "05" },
  { href: "/alerts", label: "Alert Feed", icon: ShieldAlert, tag: "06" },
  { href: "/lineage", label: "Release Lineage", icon: Layers, tag: "07" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, backendHealthy, lifecycle, alerts, effectiveAction } = useDashboard();

  return (
    <aside
      className={`border-r border-zinc-200/90 bg-white flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand & Toggle Bar */}
        <div className="h-16 border-b border-zinc-200/80 px-4 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-xs">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-zinc-950">
                  SwayamKavach
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
                  DARI Control Plane
                </span>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-xs mx-auto">
              <Shield className="h-4 w-4" />
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 p-1.5 rounded-md transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Routes */}
        <div className="p-3 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Navigation
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
                } ${sidebarCollapsed ? "justify-center px-1" : "justify-between"}`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-zinc-500"}`} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!sidebarCollapsed && item.href === "/alerts" && alerts.length > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-zinc-800 text-zinc-100" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {alerts.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* External Auxiliary Sections */}
        <div className="p-3 pt-4 border-t border-zinc-100 mt-2 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Integrations &amp; Tools
            </div>
          )}

          {/* MLflow Registry */}
          <a
            href={MLFLOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open MLflow Registry (:5000)"
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-zinc-400 shrink-0" />
              {!sidebarCollapsed && <span>MLflow Registry</span>}
            </div>
            {!sidebarCollapsed && <ExternalLink className="h-3 w-3 text-zinc-400" />}
          </a>

          {/* FastAPI Swagger Docs */}
          <a
            href={`${BACKEND_ROOT_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open FastAPI Swagger (:8000/docs)"
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileCode2 className="h-4 w-4 text-zinc-400 shrink-0" />
              {!sidebarCollapsed && <span>Swagger API</span>}
            </div>
            {!sidebarCollapsed && <ExternalLink className="h-3 w-3 text-zinc-400" />}
          </a>

          {/* ReDoc Technical Spec */}
          <a
            href={`${BACKEND_ROOT_URL}/redoc`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open ReDoc Specs (:8000/redoc)"
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-zinc-400 shrink-0" />
              {!sidebarCollapsed && <span>ReDoc Specs</span>}
            </div>
            {!sidebarCollapsed && <ExternalLink className="h-3 w-3 text-zinc-400" />}
          </a>
        </div>
      </div>

      {/* Bottom Telemetry Status */}
      <div className="p-3.5 border-t border-zinc-200/80 bg-zinc-50/70 text-xs space-y-2">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="font-medium text-zinc-500">Backend Server</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  backendHealthy ? "text-emerald-700" : "text-red-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    backendHealthy ? "bg-emerald-600" : "bg-red-600"
                  }`}
                />
                {backendHealthy ? "Online (:8000)" : "Offline"}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="font-medium text-zinc-500">Serving Slot</span>
              <span className="font-semibold text-zinc-900">
                Slot {lifecycle.active_slot} ({lifecycle.champion_release})
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="font-medium text-zinc-500">Active Policy</span>
              <span className="font-bold text-zinc-900">
                {effectiveAction || lifecycle.chosen_action || "A0"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-center py-1">
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
