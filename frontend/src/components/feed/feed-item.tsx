"use client";

import { motion } from "framer-motion";
import { MessageSquare, Heart, ShieldAlert, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Post {
    id: string;
    author_email: string;
    content: string;
    moderation_status: string;
    toxicity_score: number;
    reaction_counts: Record<string, number>;
    comment_count: number;
    user_reaction: string | null;
    created_at: string;
}

export default function FeedItem({ post }: { post: Post }) {
    const isMature = post.moderation_status === "MATURE";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-6 glass rounded-2xl hover:border-white/10 transition-colors group"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/5 text-void-muted">
                        <User className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-tight">{post.author_email.split("@")[0]}<span className="text-void-muted text-[10px] ml-1 opacity-0 group-hover:opacity-100 transition-opacity">#ANON</span></p>
                        <div className="flex items-center gap-2 text-[10px] text-void-muted uppercase tracking-widest mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(post.created_at))} ago
                        </div>
                    </div>
                </div>

                {isMature && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-void-purple/10 border border-void-purple/20 rounded-full text-[10px] font-bold text-void-purple uppercase tracking-tighter">
                        <ShieldAlert className="h-3 w-3" />
                        Restricted Content
                    </div>
                )}
            </div>

            <div className="mb-6">
                <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap">
                    {post.content}
                </p>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <button className="flex items-center gap-2 text-sm text-void-muted hover:text-void-accent transition-colors group/btn">
                    <div className="p-2 rounded-full group-hover/btn:bg-void-accent/10 transition-colors">
                        <Heart className={cn("h-4 w-4", post.user_reaction === 'heart' && "fill-void-accent text-void-accent")} />
                    </div>
                    <span className="font-medium group-hover/btn:text-void-accent">{post.reaction_counts.heart || 0}</span>
                </button>

                <button className="flex items-center gap-2 text-sm text-void-muted hover:text-white transition-colors group/btn">
                    <div className="p-2 rounded-full group-hover/btn:bg-white/10 transition-colors">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{post.comment_count || 0}</span>
                </button>

                <div className="ml-auto">
                    <button className="p-2 rounded-full hover:bg-void-error/10 text-void-muted hover:text-void-error transition-colors">
                        <ShieldAlert className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
