"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";
import {
  LayoutDashboard,
  GitFork,
  Activity,
  Radio,
  BarChart3,
  ShieldAlert,
  Layers,
  Server,
  FileCode2,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { alerts, backendHealthy } = useDashboard();
  const NAV_ITEMS: NavItem[] = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/canary", label: "Canary Rollout", icon: GitFork },
    { href: "/scenarios", label: "Drift Simulator", icon: Activity },
    { href: "/ingestion", label: "Traffic Ingestion", icon: Radio },
    { href: "/benchmarks", label: "Benchmarks", icon: BarChart3 },
    { href: "/alerts", label: "Intrusion Feed", icon: ShieldAlert, badgeCount: alerts.length },
    { href: "/lineage", label: "Model Lineage", icon: Layers },
  ];

  return (
    <aside
      aria-label="Sidebar Rail"
      className="w-12 sm:w-14 shrink-0 flex flex-col items-center gap-2.5 sm:gap-3 select-none overflow-hidden"
    >

      {/* Center: Vertical Icon Navigation Rail (Compact floating capsule with perfectly centered focus) */}
      <nav
        aria-label="Rail Navigation"
        className="flex flex-col items-center p-1 sm:p-1.5 rounded-3xl bg-[#F5F4F7] dark:bg-[#1E1B24] border border-[#EAE7ED] dark:border-[#282534] gap-1 sm:gap-1.5 shadow-xs"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                aria-label={item.label}
                data-active={isActive ? "true" : "false"}
                className={`relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-coral-gradient text-white shadow-coral-soft font-semibold"
                    : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[1.8] ${isActive ? "text-white" : ""}`} />

                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ${
                      isActive
                        ? "bg-white ring-[#E76552]"
                        : "bg-[#E76552] ring-[#F5F4F7] dark:ring-[#1E1B24]"
                    }`}
                  />
                ) : null}
              </Link>

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#25232B] dark:bg-[#201D2A] text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-md z-50 border border-transparent dark:border-[#3E3A4D]">
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="ml-1 text-[10px] text-[#F7C6BF]">({item.badgeCount})</span>
                ) : null}
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-[#25232B] dark:border-r-[#201D2A]" />
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom: Secondary Actions & Health Beacon */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-col items-center p-1 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] border border-[#EAE7ED] dark:border-[#282534] gap-1 shadow-xs">
          {/* MLflow Registry */}
          <div className="relative group">
            <a
              href={MLFLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MLflow Registry"
              className="flex items-center justify-center h-8 w-8 rounded-full text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-white dark:hover:bg-[#282534] transition-colors"
            >
              <Server className="h-3.5 w-3.5" />
            </a>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#25232B] dark:bg-[#201D2A] text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-md z-50 border border-transparent dark:border-[#3E3A4D]">
              MLflow Registry (:5000)
              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-[#25232B] dark:border-r-[#201D2A]" />
            </div>
          </div>

          {/* Swagger API Docs */}
          <div className="relative group">
            <a
              href={`${BACKEND_ROOT_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Swagger API Docs"
              className="flex items-center justify-center h-8 w-8 rounded-full text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-white dark:hover:bg-[#282534] transition-colors"
            >
              <FileCode2 className="h-3.5 w-3.5" />
            </a>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#25232B] dark:bg-[#201D2A] text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-md z-50 border border-transparent dark:border-[#3E3A4D]">
              Swagger API Docs (:8000)
              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-[#25232B] dark:border-r-[#201D2A]" />
            </div>
          </div>
        </div>

        {/* Backend Connectivity Status Dot */}
        <div className="relative group mt-0.5">
          <div
            className={`h-2.5 w-2.5 rounded-full flex items-center justify-center transition-all ${
              backendHealthy ? "bg-emerald-500 ring-3 ring-emerald-100 dark:ring-emerald-950/60" : "bg-red-500 ring-3 ring-red-100 dark:ring-red-950/60"
            }`}
          />
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#25232B] dark:bg-[#201D2A] text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-md z-50 border border-transparent dark:border-[#3E3A4D]">
            {backendHealthy ? "Control Plane: Online" : "Control Plane: Offline"}
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-[#25232B] dark:border-r-[#201D2A]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
