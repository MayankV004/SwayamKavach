import type { Metadata } from "next";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "SwayamKavach — Autonomous IoT IDS & DARI Control Plane",
  description: "Self-Healing Intrusion Detection System with Damage-Aware Retraining & Intervention",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white">
        <DashboardProvider>
          <div className="flex h-screen overflow-hidden bg-white">
            {/* Collapsible Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
              <Header />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
                {children}
              </main>
            </div>
          </div>
        </DashboardProvider>
      </body>
    </html>
  );
}
