"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import api from "@/lib/api";
import { Check } from "lucide-react";

interface PollOption {
    id: string;
    text: string;
    vote_count: number;
    vote_percentage: number;
}

interface PollData {
    id: string;
    question: string;
    allows_multiple: boolean;
    options: PollOption[];
    total_votes: number;
    user_voted: boolean;
}

interface PollCardProps {
    poll: PollData;
    postId: string;
}

export default function PollCard({ poll, postId }: PollCardProps) {
    const [options, setOptions] = useState(poll.options);
    const [hasVoted, setHasVoted] = useState(poll.user_voted);
    const [totalVotes, setTotalVotes] = useState(poll.total_votes);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    const handleVote = useCallback(
        async (optionId: string) => {
            if (hasVoted || isVoting) return;
            setIsVoting(true);
            setSelectedOption(optionId);

            // Optimistic update
            setHasVoted(true);
            setTotalVotes((t) => t + 1);
            setOptions((prev) =>
                prev.map((opt) => {
                    if (opt.id === optionId) {
                        const newCount = opt.vote_count + 1;
                        const newTotal = totalVotes + 1;
                        return {
                            ...opt,
                            vote_count: newCount,
                            vote_percentage: Math.round((newCount / newTotal) * 1000) / 10,
                        };
                    }
                    const newTotal = totalVotes + 1;
                    return {
                        ...opt,
                        vote_percentage:
                            Math.round((opt.vote_count / newTotal) * 1000) / 10,
                    };
                })
            );

            try {
                await api.post(`/content/posts/${postId}/vote/`, {
                    option_id: optionId,
                });
            } catch {
                // Rollback
                setHasVoted(poll.user_voted);
                setTotalVotes(poll.total_votes);
                setOptions(poll.options);
                setSelectedOption(null);
            } finally {
                setIsVoting(false);
            }
        },
        [hasVoted, isVoting, postId, poll, totalVotes]
    );

    return (
        <div className="mt-3 p-4 glass rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-white">{poll.question}</h4>

            <div className="space-y-2">
                {options.map((option) => {
                    const isSelected = selectedOption === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={hasVoted}
                            className={`relative w-full text-left px-4 py-2.5 rounded-xl border transition-all overflow-hidden ${hasVoted
                                    ? "border-white/5 cursor-default"
                                    : "border-white/10 hover:border-void-accent/30 cursor-pointer"
                                }`}
                        >
                            {/* Progress bar (visible after voting) */}
                            {hasVoted && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${option.vote_percentage}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={`absolute inset-y-0 left-0 ${isSelected
                                            ? "bg-void-accent/15"
                                            : "bg-white/5"
                                        } rounded-xl`}
                                />
                            )}

                            <div className="relative flex items-center justify-between">
                                <span
                                    className={`text-sm ${isSelected ? "text-void-accent font-medium" : "text-white/80"
                                        }`}
                                >
                                    {option.text}
                                </span>

                                <div className="flex items-center gap-2">
                                    {hasVoted && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs font-bold text-void-muted tabular-nums"
                                        >
                                            {option.vote_percentage}%
                                        </motion.span>
                                    )}
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500 }}
                                        >
                                            <Check className="h-3.5 w-3.5 text-void-accent" />
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="text-[10px] text-void-muted uppercase tracking-widest font-bold">
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                {poll.allows_multiple && " · Multiple choice"}
            </div>
        </div>
    );
}
