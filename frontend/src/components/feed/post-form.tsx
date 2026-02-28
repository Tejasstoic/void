"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";

export default function PostForm() {
    const [content, setContent] = useState("");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (newPost: { content: string }) => api.post("/content/posts/", newPost),
        onSuccess: () => {
            setContent("");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || mutation.isPending) return;
        mutation.mutate({ content });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8 glass p-6 rounded-3xl"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share something with the void..."
                        className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-void-accent/40 transition-all resize-none text-base placeholder:text-void-muted"
                    />
                    <AnimatePresence>
                        {content.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-bold text-void-accent uppercase tracking-widest bg-void-accent/10 px-3 py-1 rounded-full border border-void-accent/20"
                            >
                                <Sparkles className="h-3 w-3" />
                                AI Moderation Active
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-void-muted uppercase tracking-widest px-2">
                        {content.length} / 1500 chars
                    </p>
                    <button
                        disabled={!content.trim() || mutation.isPending}
                        type="submit"
                        className="h-10 px-6 bg-void-accent text-void-black font-bold rounded-xl hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                Post
                                <Send className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
