"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bell, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

export default function MobileDock() {
    const pathname = usePathname();
    const { user } = useAuthStore();

    // Hide on auth pages and landing
    if (!user || pathname === "/" || pathname === "/login" || pathname === "/register") return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
            <nav className="glass-premium border-white/10 p-1.5 rounded-[2rem] flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <DockLink
                    href="/feed"
                    icon={<Home size={20} />}
                    label="Feed"
                    active={pathname === "/feed"}
                />
                <DockLink
                    href="/discover"
                    icon={<Compass size={20} />}
                    label="Discover"
                    active={pathname === "/discover"}
                />
                <DockLink
                    href="/notifications"
                    icon={<Bell size={20} />}
                    label="Alerts"
                    active={pathname === "/notifications"}
                />
                <DockLink
                    href="/profile"
                    icon={<User size={20} />}
                    label="Profile"
                    active={pathname === "/profile"}
                />
            </nav>
        </div>
    );
}

function DockLink({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center gap-0.5 p-2.5 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 min-w-[56px]",
                active ? "bg-void-accent text-void-black shadow-[0_0_20px_rgba(0,242,255,0.3)]" : "text-void-muted hover:text-white"
            )}
        >
            {icon}
            <span className={cn("text-[8px] font-bold uppercase tracking-widest", active ? "text-void-black" : "text-void-muted")}>{label}</span>
        </Link>
    );
}
