"use client";

import { Search, LogOut, Shield, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import NotificationBell from "@/components/engagement/NotificationBell";
import TrendingSection from "@/components/engagement/TrendingSection";
import PostComposer from "@/components/engagement/PostComposer";
import { GovernancePanel } from "@/components/engagement/GovernancePanel";
import FeedList from "@/components/feed/feed-list";
import Image from "next/image";

export default function FeedPage() {
    const { user, accessToken, logout } = useAuthStore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            router.push("/login");
        }
    }, [accessToken, router]);

    if (!accessToken) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation (Sticky) */}
            <nav className="sticky top-0 z-50 glass-premium border-b-0">
                <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
                    {!isSearching ? (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-void-purple/10">
                                    <Image
                                        src="/branding/logo_exclusive.png"
                                        alt="VOID"
                                        fill
                                        className="object-cover scale-110"
                                    />
                                </div>
                                <h1 className="font-bold tracking-tighter text-xl bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">VOID</h1>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href="/restricted"
                                    className="flex items-center gap-2 px-4 py-2 bg-void-error/10 border border-void-error/30 rounded-full text-[10px] font-black text-void-error uppercase tracking-[0.2em] hover:bg-void-error/20 transition-all mr-2 shadow-[0_0_15px_rgba(255,0,60,0.1)] hover:scale-105 active:scale-95 animate-pulse-glow"
                                >
                                    <ShieldAlert size={14} />
                                    WILD ZONE
                                </Link>
                                <button
                                    onClick={() => setIsSearching(true)}
                                    className="p-2 text-void-muted hover:text-void-accent transition-colors"
                                >
                                    <Search className="h-5 w-5" />
                                </button>
                                <div className="relative">
                                    <NotificationBell />
                                </div>
                                <button onClick={() => logout()} className="p-2 text-void-muted hover:text-void-error transition-colors"><LogOut className="h-5 w-5" /></button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-void-muted" />
                                <input
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search the void frequency..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-void-accent/40 focus:bg-white/[0.08] transition-all"
                                />
                            </div>
                            <button
                                onClick={() => { setIsSearching(false); setSearchQuery(""); }}
                                className="p-2 text-void-muted hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <main className="mx-auto max-w-2xl px-6 py-8">
                {!searchQuery && (
                    <div className="mb-6 space-y-6">
                        <TrendingSection />
                        <GovernancePanel />
                    </div>
                )}

                <div className="mb-8">
                    <PostComposer />
                </div>

                <FeedList searchQuery={searchQuery} />
            </main>

            {/* Shield Action for Admin */}
            {user?.role === 'admin' && (
                <div className="fixed bottom-8 right-8">
                    <Link
                        href="/admin"
                        className="h-14 w-14 rounded-full bg-void-purple text-white shadow-2xl shadow-void-purple/20 flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-white/20"
                    >
                        <Shield className="h-6 w-6" />
                    </Link>
                </div>
            )}
        </div>
    );
}
