import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "VOID | Anonymous Governance Platform",
  description: "Anonymous social platform with AI-assisted moderation and governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground selection:bg-void-accent selection:text-void-black">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
