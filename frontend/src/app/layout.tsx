import type { Metadata } from "next";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PageHeader } from "@/components/layout/PageHeader";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('swayamkavach-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F5F4F7] dark:bg-[#0F0E13] text-[#25232B] dark:text-[#F2F1F6] font-sans antialiased selection:bg-[#E76552] selection:text-white transition-colors duration-300">
        <DashboardProvider>
          {/* Outer Viewport Canvas with Consistent Padding */}
          <div className="min-h-screen w-full bg-[#F5F4F7] dark:bg-[#0F0E13] p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-start transition-colors duration-300">
            {/* Softly Rounded Main Application Container (Reference Layout) */}
            <div className="w-full max-w-[1720px] bg-white dark:bg-[#16151D] rounded-[24px] sm:rounded-[32px] border border-[#EAE7ED] dark:border-[#282534] shadow-canvas overflow-hidden flex flex-col min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)] transition-colors duration-300">
              {/* Compact Top Navigation Bar */}
              <Header />

              {/* Inner Body (Floating Compact Sidebar Rail + Main Content Area) */}
              <div className="flex flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#16151D] relative transition-colors duration-300">
                {/* Floating Navigation Rail (Compact, Fixed/Sticky, Symmetrically Centered) */}
                <div className="shrink-0 p-3 sm:p-4 flex flex-col items-center justify-start z-20">
                  <Sidebar />
                </div>

                {/* Main Scrollable Content Area */}
                <div className="flex flex-col flex-1 min-w-0 overflow-y-auto bg-white dark:bg-[#16151D] transition-colors duration-300">
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1560px] mx-auto space-y-6 sm:space-y-8 page-fluid-enter">
                    <PageHeader />
                    {children}
                  </main>
                </div>
              </div>
            </div>
          </div>
        </DashboardProvider>
      </body>
    </html>
  );
}
