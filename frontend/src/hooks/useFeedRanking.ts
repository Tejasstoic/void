import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

interface FeedOptions {
  restricted?: boolean;
  pageSize?: number;
  lat?: number;
  lng?: number;
}

interface FeedPost {
  id: string;
  author_alias: string;
  author_id: string;
  content: string;
  content_type: "TEXT_BURST" | "CONFESSION" | "POLL";
  moderation_status: string;
  view_count: number;
  engagement_score: number;
  reaction_counts: Record<string, number>;
  comment_count: number;
  user_reaction: string | null;
  is_bookmarked: boolean;
  author_badges: Array<{ type: string; icon: string; name: string }>;
  poll: {
    id: string;
    question: string;
    allows_multiple: boolean;
    options: Array<{
      id: string;
      text: string;
      vote_count: number;
      vote_percentage: number;
    }>;
    total_votes: number;
    user_voted: boolean;
  } | null;
  created_at: string;
}

export function useFeedRanking(options: FeedOptions = {}) {
  const { restricted = false, pageSize = 15, lat, lng } = options;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (isLoading) return;
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get("/ranking/feed/", {
          params: {
            page: pageNum,
            page_size: pageSize,
            restricted: restricted ? "true" : "false",
            lat,
            lng,
          },
        });

        const data = res.data;
        setPosts((prev) => (append ? [...prev, ...data.results] : data.results));
        setHasNext(data.has_next);
        setPage(pageNum);
      } catch (err: unknown) {
        // Fallback to chronological feed if ranking isn't available
        try {
          const fallbackRes = await api.get("/content/posts/", {
            params: {
              restricted: restricted ? "true" : "false",
              lat,
              lng,
            },
          });
          const results = fallbackRes.data.results || fallbackRes.data;
          setPosts((prev) => (append ? [...prev, ...results] : results));
          setHasNext(false);
        } catch {
          setError("Failed to load feed");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [restricted, pageSize, lat, lng, isLoading]
  );

  const loadMore = useCallback(() => {
    if (hasNext && !isLoading) {
      fetchPosts(page + 1, true);
    }
  }, [fetchPosts, page, hasNext, isLoading]);

  const refresh = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasNext(true);
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Initial load
  useEffect(() => {
    fetchPosts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restricted, lat, lng]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasNext, isLoading, loadMore]);

  return {
    posts,
    isLoading,
    error,
    hasNext,
    loadMore,
    refresh,
    loadMoreRef,
  };
}
