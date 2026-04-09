import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { DataLoader } from "@/components/DataLoader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Heinz Tattoo Studio",
  description: "Sistema de gestão rápido e simples para tatuadores.",
  appleWebApp: {
    title: "Heinz Studio",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    apple: "/logo.jpeg",
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { GlobalModals } from "@/components/layout/GlobalModals";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className}`}>
        <DataLoader />
        <GlobalModals />
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
