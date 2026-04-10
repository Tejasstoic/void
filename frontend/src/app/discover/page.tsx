"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, Hash, TrendingUp, Sparkles,
  MessageSquare, Users, Loader2, X
} from "lucide-react";
import Link from "next/link";
import FeedItem, { Post } from "@/components/feed/feed-item";

interface DiscoverData {
  trending: Post[];
  hashtags: Array<{ id: string; name: string; post_count: number }>;
  recent: Post[];
  rooms: Array<{ id: string; name: string; description: string; icon: string; member_count: number; is_member: boolean }>;
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"discover" | "search">("discover");

  const { data: discoverData, isLoading: isDiscoverLoading } = useQuery<DiscoverData>({
    queryKey: ["discover"],
    queryFn: () => api.get("/content/discover/").then((res) => res.data),
  });

  const { data: searchData, isLoading: isSearching } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => api.get(`/content/search/?q=${encodeURIComponent(searchQuery)}`).then((res) => res.data),
    enabled: searchQuery.length >= 2,
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-premium">
        <div className="mx-auto max-w-2xl flex h-16 items-center gap-4 px-6">
          <Link href="/feed" className="p-2 text-void-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-void-muted" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveSection(e.target.value.length >= 2 ? "search" : "discover");
              }}
              placeholder="Search pulses, hashtags..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-sm outline-none focus:border-void-accent/40 focus:bg-white/[0.08] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setActiveSection("discover"); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-void-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {activeSection === "search" && searchQuery.length >= 2 ? (
          <div className="space-y-8">
            {isSearching ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
              </div>
            ) : (
              <>
                {/* Search Hashtags */}
                {searchData?.hashtags?.length > 0 && (
                  <div>
                    <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                      <Hash className="h-3 w-3" /> Hashtags
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {searchData.hashtags.map((tag: { id: string; name: string; post_count: number }) => (
                        <Link
                          key={tag.id}
                          href={`/discover?tag=${tag.name}`}
                          className="px-4 py-2 bg-void-accent/10 border border-void-accent/20 rounded-full text-sm font-medium text-void-accent hover:bg-void-accent/20 transition-all"
                        >
                          #{tag.name} <span className="text-void-muted ml-1 text-xs">({tag.post_count})</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Posts */}
                {searchData?.posts?.length > 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" /> Pulses
                    </h2>
                    {searchData.posts.map((post: Post) => (
                      <FeedItem key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-void-muted py-10 text-sm">No results found for &quot;{searchQuery}&quot;</p>
                )}
              </>
            )}
          </div>
        ) : isDiscoverLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Trending Hashtags */}
            {discoverData?.hashtags && discoverData.hashtags.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                  <Hash className="h-3 w-3" /> Trending Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {discoverData.hashtags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => { setSearchQuery(tag.name); setActiveSection("search"); }}
                      className="px-4 py-2 glass rounded-full text-sm font-medium hover:bg-void-accent/10 hover:border-void-accent/20 transition-all"
                    >
                      #{tag.name}
                      <span className="text-void-muted ml-1 text-xs">{tag.post_count}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Confession Rooms */}
            {discoverData?.rooms && discoverData.rooms.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                  <Users className="h-3 w-3" /> Confession Rooms
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {discoverData.rooms.map((room) => (
                    <div key={room.id} className="p-4 glass rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{room.icon}</span>
                        <div>
                          <p className="font-bold text-sm">{room.name}</p>
                          <p className="text-[10px] text-void-muted">{room.member_count} members</p>
                        </div>
                      </div>
                      <p className="text-xs text-void-muted line-clamp-2">{room.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Trending Pulses */}
            {discoverData?.trending && discoverData.trending.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" /> Trending Pulses
                </h2>
                <div className="space-y-4">
                  {discoverData.trending.map((post) => (
                    <FeedItem key={post.id} post={post} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Pulses */}
            {discoverData?.recent && discoverData.recent.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Fresh Signals
                </h2>
                <div className="space-y-4">
                  {discoverData.recent.slice(0, 5).map((post) => (
                    <FeedItem key={post.id} post={post} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
