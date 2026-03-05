import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Heart, ShieldAlert, ShieldCheck, User, Clock, Send, Loader2, CornerDownRight, Bookmark, Share2, Eye, Fingerprint } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import AnimatedReactions from "./../engagement/AnimatedReactions";
import PollCard from "./../engagement/PollCard";
import BadgeDisplay from "./../engagement/BadgeDisplay";
import { useEngagement } from "@/hooks/useEngagement";
import { useEffect, useRef } from "react";

interface Comment {
    id: number;
    author_alias: string;
    content: string;
    created_at: string;
    replies?: Comment[];
}

interface Post {
    id: string;
    author_alias: string;
    content: string;
    content_type: "TEXT_BURST" | "CONFESSION" | "POLL";
    moderation_status: string;
    toxicity_score: number;
    reaction_counts: Record<string, number>;
    author?: string;
    comment_count: number;
    user_reaction: string | null;
    is_bookmarked: boolean;
    created_at: string;
    author_badges?: Array<{ type: string; icon: string; name: string }>;
    poll?: any;
    is_zk_verified?: boolean;
}

export default function FeedItem({ post }: { post: Post }) {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [showMature, setShowMature] = useState(false);
    const queryClient = useQueryClient();
    const isMature = post.moderation_status === "MATURE";
    const { recordImpression } = useEngagement();
    const itemRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number | null>(null);

    // Dwell time tracking
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    startTimeRef.current = Date.now();
                } else if (startTimeRef.current) {
                    const dwellTimeMs = Date.now() - startTimeRef.current;
                    if (dwellTimeMs > 1000) { // Only log if visible for > 1s
                        recordImpression(post.id, dwellTimeMs);
                    }
                    startTimeRef.current = null;
                }
            },
            { threshold: 0.5 }
        );

        if (itemRef.current) observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, [post.id, recordImpression]);

    // Fetch comments only when expanded
    const { data: comments, isLoading: isLoadingComments } = useQuery({
        queryKey: ["comments", post.id],
        queryFn: () => api.get("/content/comments/", { params: { post: post.id } }).then(res => res.data.results || res.data),
        enabled: showComments,
    });

    const reactMutation = useMutation({
        mutationFn: (type: string) => api.post(`/content/posts/${post.id}/react/`, { reaction_type: type }),
        onSuccess: () => {
            // Optimistically handled by AnimatedReactions, but invalidate in background
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const reportMutation = useMutation({
        mutationFn: () => api.post(`/content/reports/`, { post: post.id, reason: "User reported from feed" }),
        onSuccess: () => {
            alert("Report submitted to governance.");
        },
    });

    const commentMutation = useMutation({
        mutationFn: (content: string) => api.post(`/content/comments/`, { post: post.id, content }),
        onSuccess: () => {
            setCommentText("");
            queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const bookmarkMutation = useMutation({
        mutationFn: () => api.post(`/content/posts/${post.id}/bookmark/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    // handleReact removed, handled by AnimatedReactions

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        bookmarkMutation.mutate();
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        const url = `${window.location.origin}/post/${post.id}`;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        commentMutation.mutate(commentText);
    };

    return (
        <motion.div
            ref={itemRef}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full p-8 glass-premium rounded-3xl transition-all group shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(0,242,255,0.05)] ${post.content_type === "CONFESSION" ? "border-void-purple/20 hover:border-void-purple/40" :
                post.content_type === "POLL" ? "border-yellow-400/20 hover:border-yellow-400/40" :
                    "hover:border-void-accent/30"
                }`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-void-accent/5 border border-void-accent/20 flex items-center justify-center text-void-accent shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-base font-bold tracking-tight text-glow">{post.author_alias || "Anon"}</p>
                            {post.author_badges && <BadgeDisplay badges={post.author_badges} size="sm" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-void-muted uppercase tracking-[0.2em] mt-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {post.created_at ? formatDistanceToNow(new Date(post.created_at)) : 'just now'} ago

                            {post.is_zk_verified && (
                                <div className="flex items-center gap-1.5 ml-2 text-void-accent border border-void-accent/20 bg-void-accent/5 px-2 py-0.5 rounded-full">
                                    <Fingerprint className="h-2.5 w-2.5" />
                                    <span className="text-[8px] font-black">ZK VERIFIED</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isMature && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-void-error/10 border border-void-error/30 rounded-full text-[10px] font-black text-void-error uppercase tracking-[0.2em] animate-pulse">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        RESTRICTED SIGNAL
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="relative overflow-hidden rounded-3xl mb-8">
                <AnimatePresence>
                    {isMature && !showMature ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-void-black/90 backdrop-blur-2xl border border-void-error/30"
                        >
                            <div className="h-16 w-16 rounded-full bg-void-error/10 border border-void-error/30 flex items-center justify-center mb-4">
                                <ShieldAlert className="h-8 w-8 text-void-error animate-pulse-glow" />
                            </div>
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-void-error mb-6 text-center">PROTOCOL: RESTRICTED LAYER</p>
                            <button
                                onClick={() => setShowMature(true)}
                                className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group"
                            >
                                <Eye size={14} className="text-void-muted transition-colors group-hover:text-white" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Reveal Signal</span>
                            </button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <div className={cn(
                    "p-6 text-white/90 leading-relaxed font-medium transition-all duration-700",
                    isMature && !showMature ? "blur-2xl scale-105" : "",
                    post.content_type === "CONFESSION" ? "font-serif text-lg italic" : ""
                )}>
                    {post.content}

                    {post.content_type === "POLL" && post.poll && (
                        <PollCard poll={post.poll} postId={post.id} />
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <AnimatedReactions
                    postId={post.id}
                    reactionCounts={post.reaction_counts}
                    userReaction={post.user_reaction}
                />

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-sm text-void-muted hover:text-white transition-colors group/btn"
                >
                    <div className="p-2 rounded-full group-hover/btn:bg-white/10 transition-colors">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{post.comment_count || 0}</span>
                </button>

                <button
                    onClick={handleBookmark}
                    disabled={bookmarkMutation.isPending}
                    className={cn(
                        "flex items-center gap-2 text-sm transition-colors group/btn",
                        post.is_bookmarked ? "text-void-accent" : "text-void-muted hover:text-white"
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-full transition-colors",
                        post.is_bookmarked ? "bg-void-accent/10" : "group-hover/btn:bg-white/10"
                    )}>
                        <Bookmark className={cn("h-4 w-4", post.is_bookmarked && "fill-void-accent")} />
                    </div>
                </button>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-sm text-void-muted hover:text-white transition-colors group/btn"
                >
                    <div className="p-2 rounded-full group-hover/btn:bg-white/10 transition-colors">
                        <Share2 className="h-4 w-4" />
                    </div>
                </button>

                <div className="ml-auto">
                    <button
                        onClick={() => reportMutation.mutate()}
                        disabled={reportMutation.isPending}
                        className="p-2 rounded-full hover:bg-void-error/10 text-void-muted hover:text-void-error transition-colors"
                    >
                        <ShieldAlert className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-8 space-y-6">
                            {isLoadingComments ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-void-muted" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comments?.length === 0 ? (
                                        <p className="text-[10px] text-center text-void-muted uppercase tracking-widest py-2">No pulses in this thread yet.</p>
                                    ) : (
                                        comments?.filter((c: any) => !c.parent).map((comment: Comment) => (
                                            <CommentItem key={comment.id} comment={comment} />
                                        ))
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleCommentSubmit} className="mt-6 flex gap-2">
                                <input
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a pulse..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-void-accent/40 placeholder:text-void-muted"
                                />
                                <button
                                    type="submit"
                                    disabled={commentMutation.isPending || !commentText.trim()}
                                    className="px-4 bg-void-accent text-void-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CommentItem({ comment }: { comment: Comment }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="p-1.5 rounded-full bg-white/5 text-void-muted mt-1">
                    <User className="h-3 w-3" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{comment.author_alias || "Anon"}</span>
                        <span className="text-[10px] text-void-muted">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                    </div>
                    <p className="text-sm text-white/80 mt-1">{comment.content}</p>
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 space-y-2 border-l border-white/5 pl-4 mt-1">
                    {comment.replies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-2">
                            <CornerDownRight className="h-3 w-3 text-void-muted mt-2" />
                            <CommentItem comment={reply} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
