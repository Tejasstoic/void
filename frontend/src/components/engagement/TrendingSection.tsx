"use client";

import { useTrending } from "@/hooks/useTrending";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Flame, Moon, MessageCircle, Zap } from "lucide-react";
import Link from "next/link";

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
    TRENDING_NOW: {
        icon: <Flame className="h-4 w-4" />,
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-transparent",
    },
    DARK_RISING: {
        icon: <Moon className="h-4 w-4" />,
        color: "text-red-400",
        gradient: "from-red-500/20 to-transparent",
    },
    MOST_DISCUSSED: {
        icon: <MessageCircle className="h-4 w-4" />,
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-transparent",
    },
    RAPID_GROWTH: {
        icon: <Zap className="h-4 w-4" />,
        color: "text-yellow-400",
        gradient: "from-yellow-500/20 to-transparent",
    },
};

export default function TrendingSection() {
    const { trending, isLoading } = useTrending();
    const [activeTab, setActiveTab] = useState("TRENDING_NOW");

    const tabs = Object.entries(trending);

    if (isLoading && tabs.length === 0) {
        return (
            <div className="glass rounded-2xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                </div>
            </div>
        );
    }

    if (tabs.length === 0) return null;

    const activeCategory = trending[activeTab];
    const config = CATEGORY_CONFIG[activeTab];

    return (
        <div className="glass rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/5 overflow-x-auto scrollbar-hide">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all relative ${activeTab === key ? cfg.color : "text-void-muted hover:text-white/60"
                            }`}
                    >
                        {cfg.icon}
                        <span className="hidden md:inline">{key.replace(/_/g, " ")}</span>
                        {activeTab === key && (
                            <motion.div
                                layoutId="trending-tab"
                                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.gradient}`}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                    >
                        {activeCategory?.posts?.slice(0, 5).map((post: any, i: number) => (
                            <Link
                                key={post.id}
                                href={`/post/${post.id}`}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                            >
                                <span
                                    className={`text-xs font-black ${config.color} opacity-50 mt-0.5`}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/80 line-clamp-2 group-hover:text-white transition-colors">
                                        {post.content?.slice(0, 100)}
                                        {post.content?.length > 100 ? "..." : ""}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-void-muted">
                                        <span>{post.author_alias}</span>
                                        <span>•</span>
                                        <span>
                                            {Object.values(post.reaction_counts as Record<string, number> || {}).reduce(
                                                (a, b) => a + b,
                                                0
                                            )}{" "}
                                            reactions
                                        </span>
                                        <span>•</span>
                                        <span>{post.comment_count} comments</span>
                                    </div>
                                </div>
                                <div
                                    className={`flex items-center gap-1 text-[10px] font-bold ${config.color} opacity-60`}
                                >
                                    {config.icon}
                                </div>
                            </Link>
                        ))}

                        {(!activeCategory?.posts || activeCategory.posts.length === 0) && (
                            <div className="text-center py-8 text-void-muted text-sm">
                                Nothing trending yet. Start a conversation.
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
