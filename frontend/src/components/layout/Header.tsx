"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { MLFLOW_URL, BACKEND_ROOT_URL } from "@/lib/api";
import {
  Shield,
  Search,
  Bell,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Server,
  FileCode2,
  BookOpen,
  X,
  Sun,
  Moon,
} from "lucide-react";

const NAV_TABS = [
  { href: "/", label: "Overview" },
  { href: "/canary", label: "Canary" },
  { href: "/scenarios", label: "Simulator" },
  { href: "/ingestion", label: "Ingestion" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/alerts", label: "Alerts" },
  { href: "/lineage", label: "Lineage" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { backendHealthy, alerts, loading, loadData, lifecycle, theme, toggleTheme } = useDashboard();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);
  const [activeRect, setActiveRect] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [hoverRect, setHoverRect] = useState<{ left: number; width: number } | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when search is opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Fluid sliding pill indicator measurement
  const updateActiveRect = useCallback((targetEl?: HTMLElement | null) => {
    if (!navContainerRef.current) return;
    const activeEl = targetEl || navContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      if (elRect.width > 0) {
        setActiveRect({
          left: elRect.left - containerRect.left - (navContainerRef.current.clientLeft || 0),
          width: elRect.width,
          opacity: 1,
        });
      }
    }
  }, []);

  useEffect(() => {
    updateActiveRect();
    if (!navContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      updateActiveRect();
    });
    observer.observe(navContainerRef.current);
    return () => observer.disconnect();
  }, [pathname, updateActiveRect]);

  const criticalAlertsCount = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  ).length;

  const quickNavFiltered = NAV_TABS.filter((tab) =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 border-b border-[#EAE7ED] dark:border-[#282534] bg-white dark:bg-[#16151D] shrink-0 sticky top-0 z-40 transition-colors">
        {/* Brand / Logo (Left) */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-full bg-coral-gradient flex items-center justify-center text-white shadow-coral-soft group-hover:scale-105 transition-transform">
            <Shield className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-[#25232B] dark:text-[#F2F1F6] group-hover:text-[#E76552] transition-colors">
              SwayamKavach
            </span>
            <span className="text-[10px] font-semibold text-[#85818D] dark:text-[#A5A0AF] tracking-wider uppercase">
              Control Plane
            </span>
          </div>
        </Link>

        {/* Center Pill Segmented Navigation (Fluid Sliding Pill Animation) */}
        <nav
          ref={navContainerRef}
          aria-label="Primary Navigation"
          onMouseLeave={() => setHoverRect(null)}
          className="hidden md:inline-flex items-center relative p-1 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] border border-[#EAE7ED] dark:border-[#282534] shadow-inner select-none"
        >
          {/* Fluid Sliding Active Pill Indicator - Consistent Coral Gradient */}
          <div
            className="absolute left-0 top-1 bottom-1 rounded-full bg-coral-gradient shadow-coral-soft pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: `translateX(${activeRect.left}px)`,
              width: `${activeRect.width}px`,
              opacity: activeRect.opacity,
            }}
          />

          {/* Fluid Hover Pill Indicator */}
          {hoverRect && (
            <div
              className="absolute left-0 top-1 bottom-1 rounded-full bg-black/5 dark:bg-white/10 pointer-events-none transition-all duration-150 ease-out"
              style={{
                transform: `translateX(${hoverRect.left}px)`,
                width: `${hoverRect.width}px`,
              }}
            />
          )}

          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-active={isActive ? "true" : "false"}
                onClick={(e) => {
                  updateActiveRect(e.currentTarget);
                }}
                onMouseEnter={(e) => {
                  if (navContainerRef.current) {
                    const containerRect = navContainerRef.current.getBoundingClientRect();
                    const elRect = e.currentTarget.getBoundingClientRect();
                    setHoverRect({
                      left: elRect.left - containerRect.left,
                      width: elRect.width,
                    });
                  }
                }}
                className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold select-none transition-colors duration-200 flex items-center ${
                  isActive
                    ? "text-white"
                    : "text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.href === "/alerts" && alerts.length > 0 && (
                  <span
                    className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                      isActive ? "bg-white/20 text-white" : "bg-[#FDF0EE] dark:bg-[#E76552]/20 text-[#E76552]"
                    }`}
                  >
                    {alerts.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Utilities & User Profile (Right) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Utility Pill Container */}
          <div className="flex items-center p-1 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] border border-[#EAE7ED] dark:border-[#282534]">
            {/* Theme Toggle Trigger with Ripple */}
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
              className="p-1.5 rounded-full text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-white dark:hover:bg-[#282534] transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-[#25232B]" />
              )}
            </button>

            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              title="Quick Search (Ctrl+K)"
              className="p-1.5 rounded-full text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-white dark:hover:bg-[#282534] transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
            </button>

            {/* Notification Bell */}
            <Link
              href="/alerts"
              title={`${alerts.length} Alerts (${criticalAlertsCount} Critical)`}
              className="relative p-1.5 rounded-full text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-white dark:hover:bg-[#282534] transition-colors cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#E76552] ring-2 ring-white dark:ring-[#16151D]" />
              )}
            </Link>

            {/* Refresh / Sync Action */}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Sync telemetry data"
              className="p-1.5 rounded-full text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-white dark:hover:bg-[#282534] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#E76552]" : ""}`} />
            </button>
          </div>

          {/* User Profile Pill & Dropdown (Matching Reference Screenshot) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#F5F4F7] dark:bg-[#1E1B24] border border-[#EAE7ED] dark:border-[#282534] hover:border-[#D5D2DA] dark:hover:border-[#3E3A4D] hover:bg-[#EFEFF4] dark:hover:bg-[#282534] transition-all cursor-pointer"
            >
              {/* Avatar circle */}
              <div className="h-6.5 w-6.5 rounded-full bg-coral-gradient text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                SK
              </div>
              <div className="flex flex-col text-left leading-tight hidden lg:block">
                <span className="text-xs font-semibold text-[#25232B] dark:text-[#F2F1F6]">SecOps Lead</span>
                <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] truncate max-w-[120px]">
                  operator@kavach.internal
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF] transition-transform duration-200 ${
                  profileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#16151D] border border-[#EAE7ED] dark:border-[#282534] shadow-lg p-2 z-50 animate-slide-down">
                <div className="p-2.5 border-b border-[#F0EFF4] dark:border-[#282534] space-y-1">
                  <div className="text-xs font-bold text-[#25232B] dark:text-[#F2F1F6]">SwayamKavach Control Plane</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        backendHealthy ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <span>Backend Status:</span>
                    <span
                      className={`font-semibold ${
                        backendHealthy ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {backendHealthy ? "Connected (:8000)" : "Disconnected"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#85818D] dark:text-[#A5A0AF]">
                    Active Release: <strong className="text-[#25232B] dark:text-[#F2F1F6]">{lifecycle.champion_release}</strong> (Slot {lifecycle.active_slot})
                  </div>
                </div>

                <div className="py-1 space-y-0.5">
                  <a
                    href={MLFLOW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF]" />
                      <span>MLflow Registry</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-[#85818D] dark:text-[#A5A0AF]" />
                  </a>

                  <a
                    href={`${BACKEND_ROOT_URL}/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF]" />
                      <span>Swagger API Docs</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-[#85818D] dark:text-[#A5A0AF]" />
                  </a>

                  <a
                    href={`${BACKEND_ROOT_URL}/redoc`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-[#85818D] dark:text-[#A5A0AF]" />
                      <span>ReDoc Technical Spec</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-[#85818D] dark:text-[#A5A0AF]" />
                  </a>
                </div>

                <div className="pt-1.5 border-t border-[#F0EFF4] dark:border-[#282534] px-1">
                  <button
                    type="button"
                    onClick={() => {
                      loadData();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-[#E76552] hover:bg-[#FDF0EE] dark:hover:bg-[#E76552]/10 transition-colors cursor-pointer"
                  >
                    Synchronize Telemetry Cache
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#16151D] rounded-2xl border border-[#EAE7ED] dark:border-[#282534] shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-[#EAE7ED] dark:border-[#282534] flex items-center gap-2.5">
              <Search className="h-4 w-4 text-[#85818D] dark:text-[#A5A0AF]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to route or workbench..."
                className="flex-1 text-sm text-[#25232B] dark:text-[#F2F1F6] placeholder-[#85818D] dark:placeholder-[#A5A0AF] bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-full text-[#85818D] dark:text-[#A5A0AF] hover:text-[#25232B] dark:hover:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 max-h-60 overflow-y-auto space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#85818D] dark:text-[#A5A0AF]">
                Navigation Routes
              </div>
              {quickNavFiltered.map((tab) => (
                <button
                  key={tab.href}
                  type="button"
                  onClick={() => {
                    router.push(tab.href);
                    setSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#25232B] dark:text-[#F2F1F6] hover:bg-[#F5F4F7] dark:hover:bg-[#1E1B24] transition-colors text-left cursor-pointer"
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-[#85818D] dark:text-[#A5A0AF] font-mono">{tab.href}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
