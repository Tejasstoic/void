"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, MessageSquare, Award } from "lucide-react";

interface PulseNotification {
    id: string;
    type: "trending" | "momentum" | "discussion" | "badge";
    message: string;
}

export default function EngagementPulse() {
    const [pulses, setPulses] = useState<PulseNotification[]>([]);

    // Listen for engagement events (in a real app, this would use WebSocket or SSE)
    useEffect(() => {
        const checkPulses = async () => {
            // Simulated pulse check — in production, replace with real-time events
            try {
                const { default: api } = await import("@/lib/api");
                const res = await api.get("/notifications/", {
                    params: { page_size: 3 },
                });

                const unread = (res.data.results || []).filter(
                    (n: { is_read: boolean }) => !n.is_read
                );

                if (unread.length > 0) {
                    const newest = unread[0];
                    const typeMap: Record<string, PulseNotification["type"]> = {
                        TRENDING: "trending",
                        MOMENTUM: "momentum",
                        DISCUSSION: "discussion",
                        BADGE_EARNED: "badge",
                    };

                    setPulses((p) => {
                        if (p.find((x) => x.id === newest.id)) return p;
                        return [
                            ...p,
                            {
                                id: newest.id,
                                type: typeMap[newest.notification_type] || "momentum",
                                message: newest.title,
                            },
                        ].slice(-3);
                    });
                }
            } catch {
                // Silent
            }
        };

        const interval = setInterval(checkPulses, 60000);
        return () => clearInterval(interval);
    }, []);

    // Auto-dismiss pulses after 5 seconds
    useEffect(() => {
        if (pulses.length === 0) return;

        const timer = setTimeout(() => {
            setPulses((p) => p.slice(1));
        }, 5000);

        return () => clearTimeout(timer);
    }, [pulses]);

    const iconMap = {
        trending: <TrendingUp className="h-4 w-4 text-orange-400" />,
        momentum: <TrendingUp className="h-4 w-4 text-void-accent" />,
        discussion: <MessageSquare className="h-4 w-4 text-blue-400" />,
        badge: <Award className="h-4 w-4 text-yellow-400" />,
    };

    const colorMap = {
        trending: "border-orange-400/30 bg-orange-400/5",
        momentum: "border-void-accent/30 bg-void-accent/5",
        discussion: "border-blue-400/30 bg-blue-400/5",
        badge: "border-yellow-400/30 bg-yellow-400/5",
    };

    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
            <AnimatePresence>
                {pulses.map((pulse) => (
                    <motion.div
                        key={pulse.id}
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl ${colorMap[pulse.type]}`}
                        onClick={() => setPulses((p) => p.filter((x) => x.id !== pulse.id))}
                    >
                        <div className="flex-shrink-0">{iconMap[pulse.type]}</div>
                        <p className="text-sm text-white/90 font-medium">{pulse.message}</p>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
