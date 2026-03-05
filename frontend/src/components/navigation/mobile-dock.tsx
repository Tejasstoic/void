"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Shield, Users, Bell, User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

export default function MobileDock() {
    const pathname = usePathname();
    const { user } = useAuthStore();

    if (pathname === "/login" || pathname === "/register") return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6">
            <nav className="glass-premium border-white/10 p-2 rounded-[2rem] flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <DockLink
                    href="/feed"
                    icon={<MessageSquare size={20} />}
                    active={pathname === "/feed"}
                />

                <DockLink
                    href="/restricted"
                    icon={<ShieldAlert size={20} />}
                    active={pathname === "/restricted"}
                />

                {user?.role === "admin" && (
                    <DockLink
                        href="/admin"
                        icon={<Shield size={20} />}
                        active={pathname === "/admin"}
                    />
                )}

                <DockLink
                    href="/notifications"
                    icon={<Bell size={20} />}
                    active={pathname === "/notifications"}
                />

                <DockLink
                    href="/profile"
                    icon={<User size={20} />}
                    active={pathname === "/profile"}
                />
            </nav>
        </div>
    );
}

function DockLink({ href, icon, active }: { href: string, icon: React.ReactNode, active: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "p-3 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95",
                active ? "bg-void-accent text-void-black shadow-[0_0_20px_rgba(0,242,255,0.3)]" : "text-void-muted hover:text-white"
            )}
        >
            {icon}
        </Link>
    );
}
