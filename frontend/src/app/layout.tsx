import type { Metadata } from "next";
// Forced redeploy to resolve Vercel directory alignment
import "./globals.css";
import QueryProvider from "@/providers/query-provider";

export const viewport = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0";

export const metadata: Metadata = {
  title: "VOID | Anonymous Governance Platform",
  description: "Anonymous social protocol with AI-assisted moderation and governance. Speak freely, governed anonymously.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VOID",
  },
};

import GlobalEngagement from "@/components/engagement/GlobalEngagement";
import MobileDock from "@/components/navigation/mobile-dock";
import SidebarNav from "@/components/navigation/sidebar-nav";
import MainLayoutWrapper from "@/components/navigation/main-layout-wrapper";

import GoogleAuthProvider from "@/providers/google-auth-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased bg-background text-foreground selection:bg-void-accent selection:text-void-black">
        <GoogleAuthProvider>
          <QueryProvider>
            <SidebarNav />
            <MainLayoutWrapper>
              {children}
            </MainLayoutWrapper>
            <MobileDock />
            <GlobalEngagement />
          </QueryProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
