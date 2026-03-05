import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import FeedItem from "./feed-item";
import RestrictedToggle from "./restricted-toggle";
import { useAuthStore } from "@/store/use-auth-store";
import { Loader2, Zap } from "lucide-react";
import { useFeedRanking } from "@/hooks/useFeedRanking";
import { useEngagement } from "@/hooks/useEngagement";

export default function FeedList({ restrictedModeOverride, searchQuery }: { restrictedModeOverride?: boolean, searchQuery?: string }) {
    const [restrictedMode, setRestrictedMode] = useState(restrictedModeOverride || false);
    const { user } = useAuthStore();
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Get location on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => {
                    // Fallback or silent fail for simulated MVP
                    // setLocation({ lat: 40.7128, lng: -74.0060 }); // NY
                }
            );
        }
    }, []);

    // Use regular query for searches, but use feed ranking otherwise
    const { data: searchData, isLoading: isSearchLoading, error: searchError } = useQuery({
        queryKey: ["posts", restrictedMode || restrictedModeOverride, searchQuery, location],
        queryFn: () => api.get("/content/posts/", {
            params: {
                restricted: restrictedMode || restrictedModeOverride,
                search: searchQuery,
                lat: location?.lat,
                lng: location?.lng
            }
        }).then((res) => res.data),
        enabled: !!searchQuery,
    });

    const {
        posts: rankingPosts,
        isLoading: isRankingLoading,
        error: rankingError,
        loadMoreRef,
        hasNext
    } = useFeedRanking({
        restricted: restrictedMode || restrictedModeOverride,
        pageSize: 15,
        lat: location?.lat,
        lng: location?.lng
    });

    const { recordScrollDepth } = useEngagement();

    // Scroll depth tracking
    useEffect(() => {
        const handleScroll = () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            // Debounce or sample this in production
            if (Math.random() < 0.05) { // Sample ~5% of scroll events
                const postsScrolled = Math.floor(window.scrollY / 400); // Rough estimate
                recordScrollDepth(scrollPercent, postsScrolled);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [recordScrollDepth]);

    const isLoading = searchQuery ? isSearchLoading : isRankingLoading;
    const error = searchQuery ? searchError : rankingError;
    const posts = searchQuery ? (searchData?.results || searchData || []) : rankingPosts;

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

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center gap-2 px-2 pb-2 border-b border-white/5 mb-2">
                <Zap className="h-3.5 w-3.5 text-void-accent" />
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-void-muted">Latest Pulses</h2>
            </div>

            {!restrictedModeOverride && (
                <RestrictedToggle
                    isEnabled={restrictedMode}
                    onToggle={setRestrictedMode}
                    isEligible={!!user?.is_18_plus}
                />
            )}

            {posts.length === 0 && !isLoading ? (
                <div className="py-20 text-center text-void-muted">
                    <p className="text-sm">The void is silent. Be the first to speak.</p>
                </div>
            ) : (
                <>
                    {posts.map((post: any) => (
                        <FeedItem key={post.id} post={post} />
                    ))}

                    {/* Infinite Scroll Loader */}
                    {!searchQuery && (
                        <div ref={loadMoreRef} className="py-8 flex justify-center">
                            {hasNext ? (
                                <Loader2 className="h-6 w-6 animate-spin text-void-muted/50" />
                            ) : (
                                <p className="text-[10px] uppercase tracking-widest text-void-muted font-bold">End of the void</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
