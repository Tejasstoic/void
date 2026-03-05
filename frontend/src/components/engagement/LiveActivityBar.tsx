"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Eye, Activity, Zap } from "lucide-react";

interface LiveActivityBarProps {
    postId?: string;
    viewerCount?: number;
    recentReactions?: Array<{ type: string; timestamp: number }>;
}

export default function LiveActivityBar({
    viewerCount = 0,
    recentReactions = [],
}: LiveActivityBarProps) {
    const [displayCount, setDisplayCount] = useState(viewerCount);
    const [reactionTicker, setReactionTicker] = useState<string[]>([]);

    // Smooth count animation
    useEffect(() => {
        const diff = viewerCount - displayCount;
        if (diff === 0) return;

        const step = diff > 0 ? 1 : -1;
        const timer = setInterval(() => {
            setDisplayCount((c) => {
                if (c === viewerCount) {
                    clearInterval(timer);
                    return c;
                }
                return c + step;
            });
        }, 50);

        return () => clearInterval(timer);
    }, [viewerCount, displayCount]);

    // Reaction ticker
    useEffect(() => {
        const types = recentReactions.map((r) => {
            const emojiMap: Record<string, string> = {
                upvote: "👍",
                downvote: "👎",
                heart: "❤️",
                fire: "🔥",
                mindblown: "🤯",
                sad: "😢",
                laugh: "😂",
            };
            return emojiMap[r.type] || "✨";
        });
        setReactionTicker(types);
    }, [recentReactions]);

    return (
        <div className="flex items-center gap-4 px-4 py-2 glass rounded-xl text-[11px]">
            {/* Live viewer count */}
            <div className="flex items-center gap-1.5 text-void-accent">
                <div className="relative">
                    <Eye className="h-3.5 w-3.5" />
                    <motion.div
                        className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-green-400 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </div>
                <motion.span
                    key={displayCount}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-bold tabular-nums"
                >
                    {displayCount}
                </motion.span>
                <span className="text-void-muted">viewing</span>
            </div>

            {/* Separator */}
            <div className="h-3 w-px bg-white/10" />

            {/* Activity pulse */}
            <div className="flex items-center gap-1.5 text-void-muted">
                <Activity className="h-3.5 w-3.5 text-void-purple" />
                <span>Live</span>
            </div>

            {/* Reaction ticker */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout">
                    <div className="flex gap-1">
                        {reactionTicker.slice(-8).map((emoji, i) => (
                            <motion.span
                                key={`${emoji}-${i}-${Date.now()}`}
                                initial={{ opacity: 0, scale: 0, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                className="text-sm"
                            >
                                {emoji}
                            </motion.span>
                        ))}
                    </div>
                </AnimatePresence>
            </div>

            {/* Pulse indicator */}
            <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-400" />
                <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-green-400"
                    animate={{
                        boxShadow: [
                            "0 0 0 0 rgba(74, 222, 128, 0.5)",
                            "0 0 0 4px rgba(74, 222, 128, 0)",
                        ],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            </div>
        </div>
    );
}
