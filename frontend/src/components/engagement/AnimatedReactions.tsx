"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import api from "@/lib/api";

const REACTIONS = [
    { type: "upvote", emoji: "👍", label: "Upvote" },
    { type: "downvote", emoji: "👎", label: "Downvote" },
    { type: "heart", emoji: "❤️", label: "Heart" },
    { type: "fire", emoji: "🔥", label: "Fire" },
    { type: "mindblown", emoji: "🤯", label: "Mind Blown" },
    { type: "sad", emoji: "😢", label: "Sad" },
    { type: "laugh", emoji: "😂", label: "Laugh" },
];

interface AnimatedReactionsProps {
    postId: string;
    reactionCounts: Record<string, number>;
    userReaction: string | null;
    onReact?: (type: string) => void;
}

export default function AnimatedReactions({
    postId,
    reactionCounts,
    userReaction,
    onReact,
}: AnimatedReactionsProps) {
    const [activeReaction, setActiveReaction] = useState<string | null>(userReaction);
    const [counts, setCounts] = useState(reactionCounts);
    const [bursts, setBursts] = useState<Array<{ id: number; type: string; x: number }>>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

    const handleReact = useCallback(
        async (type: string) => {
            const previousReaction = activeReaction;

            // Optimistic update
            setActiveReaction((prev) => (prev === type ? null : type));
            setCounts((prev) => {
                const next = { ...prev };
                if (previousReaction) {
                    next[previousReaction] = Math.max(0, (next[previousReaction] || 0) - 1);
                }
                if (previousReaction !== type) {
                    next[type] = (next[type] || 0) + 1;
                }
                return next;
            });

            // Burst animation
            if (previousReaction !== type) {
                const newBursts = Array.from({ length: 5 }, (_, i) => ({
                    id: Date.now() + i,
                    type,
                    x: Math.random() * 60 - 30,
                }));
                setBursts((p) => [...p, ...newBursts]);
                setTimeout(() => {
                    setBursts((p) => p.filter((b) => !newBursts.find((n) => n.id === b.id)));
                }, 800);
            }

            try {
                await api.post(`/content/posts/${postId}/react/`, {
                    reaction_type: type,
                });
                onReact?.(type);
            } catch {
                // Rollback
                setActiveReaction(previousReaction);
                setCounts(reactionCounts);
            }
        },
        [postId, activeReaction, reactionCounts, onReact]
    );

    // Find the active emoji for display
    const activeEmoji = REACTIONS.find((r) => r.type === activeReaction);

    return (
        <div className="relative">
            {/* Burst particles */}
            <AnimatePresence>
                {bursts.map((burst) => {
                    const reaction = REACTIONS.find((r) => r.type === burst.type);
                    return (
                        <motion.span
                            key={burst.id}
                            initial={{ opacity: 1, y: 0, x: burst.x, scale: 1 }}
                            animate={{ opacity: 0, y: -40, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute -top-2 left-1/2 text-lg pointer-events-none z-10"
                        >
                            {reaction?.emoji}
                        </motion.span>
                    );
                })}
            </AnimatePresence>

            <div className="flex items-center gap-2">
                {/* Quick reaction button (shows active or default) */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all ${activeReaction
                            ? "bg-void-accent/10 border border-void-accent/20 text-void-accent"
                            : "bg-white/5 border border-white/10 text-void-muted hover:border-white/20"
                        }`}
                >
                    <span className="text-base">
                        {activeEmoji ? activeEmoji.emoji : "👍"}
                    </span>
                    <motion.span
                        key={totalReactions}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="text-xs font-bold tabular-nums"
                    >
                        {totalReactions}
                    </motion.span>
                </button>

                {/* Expanded reaction bar */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -10 }}
                            className="flex items-center gap-0.5 px-2 py-1 glass rounded-2xl"
                        >
                            {REACTIONS.map((reaction, i) => {
                                const count = counts[reaction.type] || 0;
                                const isActive = activeReaction === reaction.type;

                                return (
                                    <motion.button
                                        key={reaction.type}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => handleReact(reaction.type)}
                                        className={`relative flex flex-col items-center px-2 py-1 rounded-xl transition-all ${isActive
                                                ? "bg-void-accent/10 scale-110"
                                                : "hover:bg-white/5 hover:scale-110"
                                            }`}
                                        title={reaction.label}
                                    >
                                        <span className="text-lg transition-transform hover:scale-125">
                                            {reaction.emoji}
                                        </span>
                                        {count > 0 && (
                                            <motion.span
                                                key={count}
                                                initial={{ scale: 1.5 }}
                                                animate={{ scale: 1 }}
                                                className={`text-[9px] font-bold tabular-nums ${isActive ? "text-void-accent" : "text-void-muted"
                                                    }`}
                                            >
                                                {count}
                                            </motion.span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
