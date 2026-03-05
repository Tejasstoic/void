"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import FeedList from "@/components/feed/feed-list";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function RestrictedZonePage() {
    const { user, accessToken } = useAuthStore();
    const router = useRouter();
    const [hasConfirmed, setHasConfirmed] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            router.push("/login");
        }
    }, [accessToken, router]);

    if (!accessToken) return null;

    // Handle Ineligible Users (Under 18)
    if (user && !user.is_18_plus) {
        return (
            <div className="min-h-screen bg-void-black flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-premium p-10 rounded-[2.5rem] border-white/10 bg-white/[0.02] text-center shadow-2xl shadow-void-black"
                >
                    <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-void-muted">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h1 className="text-xl font-bold uppercase tracking-[0.3em] text-white mb-2 text-glow">Protocol Rejection</h1>
                    <p className="text-void-muted text-xs mb-8 leading-relaxed px-4">
                        Access to the Restricted Layer requires a verified age of 18+. Your current identity profile does not meet this requirement.
                    </p>
                    <Link
                        href="/feed"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 text-xs font-bold uppercase tracking-widest text-white rounded-full border border-white/10 hover:bg-white/10 transition-all hover:scale-105"
                    >
                        <ArrowLeft size={14} />
                        Back to Safe Zone
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (!hasConfirmed) {
        return (
            <div className="fixed inset-0 z-[100] bg-void-black flex items-center justify-center p-6 backdrop-blur-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-lg w-full glass-premium p-10 rounded-[3rem] border-void-error/40 bg-void-error/5 text-center shadow-[0_0_100px_rgba(255,0,60,0.15)]"
                >
                    <div className="h-24 w-24 rounded-[2rem] bg-void-error/10 border border-void-error/20 flex items-center justify-center mx-auto mb-8 animate-pulse shadow-[0_0_30px_rgba(255,0,60,0.2)]">
                        <ShieldAlert className="h-12 w-12 text-void-error" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-4 text-glow">Protocol: Restricted Layer</h1>
                    <p className="text-void-muted text-sm mb-10 leading-relaxed px-6">
                        You are entering a non-moderated content frequency. This zone contains mature signals (18+) that may be sensitive. Governance accountability remains active, but visibility is unrestricted.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setHasConfirmed(true)}
                            className="w-full py-5 bg-void-error text-white font-black rounded-2xl hover:bg-void-error/80 transition-all uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-void-error/30 hover:scale-105 active:scale-95"
                        >
                            I am 18+ / ENTER
                        </button>
                        <Link
                            href="/feed"
                            className="w-full py-5 bg-white/5 text-void-muted font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-[0.2em] text-[11px] border border-white/10 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft size={14} />
                            Abort Access
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-void-black">
            {/* Nav */}
            <nav className="sticky top-0 z-50 glass border-b-0 border-void-error/10 bg-void-error/[0.02]">
                <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
                    <Link href="/feed" className="flex items-center gap-2 group text-void-muted hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Safe Zone</span>
                    </Link>

                    <div className="flex items-center gap-2 text-void-error">
                        <Lock className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">RESTRICTED</span>
                    </div>

                    <div className="w-20" /> {/* Spacer */}
                </div>
            </nav>

            <main className="mx-auto max-w-2xl px-6 py-8 pb-32">
                <div className="mb-10 text-center">
                    <h2 className="text-4xl font-black tracking-tighter text-white mb-2">THE VOID DEEP</h2>
                    <p className="text-[10px] text-void-error font-bold uppercase tracking-[0.5em]">Restricted Layer Active</p>
                </div>

                {/* We override the FeedList default behavior by passing a prop or creating a specialized list if needed */}
                <FeedList restrictedModeOverride={true} />
            </main>
        </div>
    );
}
