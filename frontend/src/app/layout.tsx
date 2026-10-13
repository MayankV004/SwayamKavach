import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
