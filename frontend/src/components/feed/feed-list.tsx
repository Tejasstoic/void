"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import FeedItem from "./feed-item";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";

export default function FeedList() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["posts"],
        queryFn: () => api.get("/content/posts/").then((res) => res.data),
        refetchInterval: 30000, // Refresh every 30s
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-void-muted">
                <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
                <p className="text-xs uppercase tracking-[0.2em] font-medium">Syncing with the void</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 glass rounded-2xl text-center border-void-error/20 bg-void-error/5">
                <p className="text-void-error font-bold">Failed to connect to the void.</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-xs underline uppercase tracking-widest text-void-muted hover:text-white">Reconnect</button>
            </div>
        );
    }

    const posts = data?.results || data || [];

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center gap-2 px-2 pb-2 border-b border-white/5 mb-2">
                <Zap className="h-3.5 w-3.5 text-void-accent" />
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-void-muted">Latest Pulses</h2>
            </div>

            {posts.length === 0 ? (
                <div className="py-20 text-center text-void-muted">
                    <p className="text-sm">The void is silent. Be the first to speak.</p>
                </div>
            ) : (
                posts.map((post: any) => (
                    <FeedItem key={post.id} post={post} />
                ))
            )}
        </div>
    );
}
