import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface TrendingPost {
    id: string;
    author_alias: string;
    content: string;
    content_type: string;
    reaction_counts: Record<string, number>;
    comment_count: number;
    view_count: number;
    created_at: string;
}

export interface TrendingCategory {
    label: string;
    posts: TrendingPost[];
    scores: number[];
}

export type TrendingData = Record<string, TrendingCategory>;

export function useTrending() {
    const [trending, setTrending] = useState<TrendingData>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchTrending = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/trending/");
            setTrending(res.data);
        } catch {
            // Silent
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Refresh trending every 5 minutes
    useEffect(() => {
        fetchTrending();
        const interval = setInterval(fetchTrending, 300000);
        return () => clearInterval(interval);
    }, [fetchTrending]);

    return { trending, isLoading, fetchTrending };
}
