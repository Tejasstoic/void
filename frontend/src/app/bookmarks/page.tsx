"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, Loader2 } from "lucide-react";
import Link from "next/link";
import FeedItem, { Post } from "@/components/feed/feed-item";

export default function BookmarksPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.get("/content/bookmarks/").then((res) => res.data.results || res.data),
    enabled: !!accessToken,
  });

  if (!accessToken) return null;

  const bookmarks = data || [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-premium">
        <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
          <Link href="/feed" className="p-2 text-void-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold tracking-tighter text-lg">Bookmarks</h1>
          <span className="text-sm text-void-muted font-mono">{bookmarks.length}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
          </div>
        ) : bookmarks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bookmark className="h-12 w-12 mx-auto text-void-muted mb-4" />
            <p className="text-void-muted text-sm">No bookmarks yet. Save pulses from the feed.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((bookmark: { id: string; post: string; post_data?: Post }, i: number) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {bookmark.post_data ? (
                  <FeedItem post={bookmark.post_data} />
                ) : (
                  <Link
                    href={`/post/${bookmark.post}`}
                    className="block p-6 glass-premium rounded-2xl hover:bg-white/5 transition-all"
                  >
                    <p className="text-void-muted text-sm">Bookmarked pulse</p>
                    <p className="text-[10px] text-void-muted mt-1 font-mono">ID: {bookmark.post}</p>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
