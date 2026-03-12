"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, MessageSquare, Bookmark, Bell,
  User, Scale, Shield, ShieldAlert, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/my-pulses", label: "My Pulses", icon: MessageSquare },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/governance", label: "Governance", icon: Scale },
  { href: "/profile", label: "Profile", icon: User },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user || pathname === "/" || pathname === "/login" || pathname === "/register") return null;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col glass-premium z-40 border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="h-9 w-9 relative overflow-hidden rounded-xl border border-white/10">
          <Image src="/branding/logo_exclusive.png" alt="VOID" fill className="object-cover scale-110" />
        </div>
        <span className="text-lg font-black tracking-tighter uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          VOID
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              pathname === item.href
                ? "bg-void-accent/10 text-void-accent border border-void-accent/20"
                : "text-void-muted hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Wild Zone */}
        <Link
          href="/restricted"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
            pathname === "/restricted"
              ? "bg-void-error/10 text-void-error border border-void-error/20"
              : "text-void-error/60 hover:text-void-error hover:bg-void-error/5"
          )}
        >
          <ShieldAlert className="h-5 w-5" />
          <span>Wild Zone</span>
        </Link>

        {/* Admin */}
        {(user?.role === "admin" || user?.role === "mod") && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              pathname === "/admin"
                ? "bg-void-purple/10 text-void-purple border border-void-purple/20"
                : "text-void-purple/60 hover:text-void-purple hover:bg-void-purple/5"
            )}
          >
            <Shield className="h-5 w-5" />
            <span>{user?.role === "admin" ? "Admin Panel" : "Sentinel"}</span>
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/5">
        <Link href="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all">
          <div className="h-9 w-9 rounded-xl bg-void-accent/10 border border-void-accent/20 flex items-center justify-center text-void-accent text-sm font-bold">
            {(user?.alias || "A")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.alias || "Anonymous"}</p>
            <p className="text-[10px] text-void-muted truncate">{user?.role}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
