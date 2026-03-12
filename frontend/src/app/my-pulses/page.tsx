"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Clock, MessageSquare, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Post } from "@/components/feed/feed-item";

export default function MyPulsesPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-pulses"],
    queryFn: () => api.get("/content/my-pulses/").then((res) => res.data),
    enabled: !!accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/content/posts/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-pulses"] }),
  });

  if (!accessToken) return null;

  const posts: Post[] = data?.results || [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-premium">
        <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
          <Link href="/feed" className="p-2 text-void-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold tracking-tighter text-lg">My Pulses</h1>
          <span className="text-sm text-void-muted font-mono">{data?.total || 0}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <MessageSquare className="h-12 w-12 mx-auto text-void-muted mb-4" />
            <p className="text-void-muted text-sm">You haven&apos;t sent any pulses yet.</p>
            <Link href="/feed" className="inline-block mt-4 px-6 py-2 bg-void-accent text-void-black text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all">
              Create Your First Pulse
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 glass-premium rounded-2xl group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-[10px] text-void-muted uppercase tracking-[0.2em] font-mono">
                    <Clock className="h-3 w-3" />
                    {post.created_at ? formatDistanceToNow(new Date(post.created_at)) : "just now"} ago
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                      post.moderation_status === "SAFE" ? "bg-green-500/10 text-green-400" :
                      post.moderation_status === "MATURE" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-void-error/10 text-void-error"
                    }`}>
                      {post.moderation_status}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this pulse?")) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-void-error/10 text-void-muted hover:text-void-error transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Link href={`/post/${post.id}`}>
                  <p className="text-white/90 leading-relaxed mb-4 line-clamp-3 hover:text-white transition-colors">
                    {post.content}
                  </p>
                </Link>

                <div className="flex items-center gap-6 text-sm text-void-muted">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" />
                    <span>{Object.values(post.reaction_counts || {}).reduce((a: number, b) => a + (b as number), 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{post.comment_count || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
