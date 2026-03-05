"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import FeedItem from "@/components/feed/feed-item";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function PostDetailPage() {
    const { id } = useParams();

    const { data: post, isLoading, error } = useQuery({
        queryKey: ["post", id],
        queryFn: () => api.get(`/content/posts/${id}/`).then((res) => res.data),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-void-black">
                <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-void-black text-white p-6">
                <Shield className="h-16 w-16 text-void-accent mb-6 opacity-20" />
                <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Pulse Not Found</h1>
                <p className="text-void-muted mb-8 text-center max-w-sm">This signal has been lost in the void or was prohibited by governance.</p>
                <Link href="/feed" className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs">
                    Return to Feed
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-void-black pb-20">
            <nav className="flex items-center justify-between px-8 py-6 glass sticky top-0 z-50">
                <Link href="/feed" className="flex items-center gap-2 text-void-muted hover:text-white transition-colors group">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Back to Feed</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-void-accent" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.3em]">VOID SIGNAL</span>
                </div>
                <div className="w-20" /> {/* Spacer */}
            </nav>

            <main className="max-w-2xl mx-auto pt-10 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FeedItem post={post} />
                </motion.div>

                <div className="mt-20 text-center">
                    <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-void-muted">
                        End of Signal Transmission
                    </p>
                </div>
            </main>
        </div>
    );
}
