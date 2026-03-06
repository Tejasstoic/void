'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Proposal {
    id: string;
    target_post_content: string;
    reason: string;
    status: string;
    safe_weight: number;
    mature_weight: number;
    prohibited_weight: number;
    expires_at: string;
}

export const GovernancePanel: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState<string | null>(null);

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            const res = await fetch('https://void-backend-kia3.onrender.com/api/governance/proposals/');
            const data = await res.json();
            // Filter for pending only
            setProposals(data.filter((p: Proposal) => p.status === 'PENDING'));
        } catch (err) {
            console.error('Failed to fetch proposals', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (proposalId: string, choice: string) => {
        setVotingId(proposalId);
        try {
            const res = await fetch(`https://void-backend-kia3.onrender.com/api/governance/proposals/${proposalId}/vote/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is in localStorage
                },
                body: JSON.stringify({ choice })
            });

            if (res.ok) {
                // Refresh
                fetchProposals();
            }
        } catch (err) {
            console.error('Vote failed', err);
        } finally {
            setVotingId(null);
        }
    };

    if (loading) return null;
    if (proposals.length === 0) return null;

    return (
        <div className="governance-panel glass p-6 rounded-2xl mb-8 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    Community Governance
                </h2>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {proposals.map((proposal) => (
                        <motion.div
                            key={proposal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="proposal-card p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                            <p className="text-sm text-gray-400 mb-2 italic">"{proposal.target_post_content.substring(0, 100)}..."</p>
                            <p className="text-sm font-semibold text-purple-300 mb-4">Reason: {proposal.reason}</p>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleVote(proposal.id, 'SAFE')}
                                    disabled={!!votingId}
                                    className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-xs font-bold transition-all"
                                >
                                    Confirm Safe ({Math.round(proposal.safe_weight)})
                                </button>
                                <button
                                    onClick={() => handleVote(proposal.id, 'MATURE')}
                                    disabled={!!votingId}
                                    className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-xs font-bold transition-all"
                                >
                                    Mark Mature ({Math.round(proposal.mature_weight)})
                                </button>
                                <button
                                    onClick={() => handleVote(proposal.id, 'PROHIBITED')}
                                    disabled={!!votingId}
                                    className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-xs font-bold transition-all"
                                >
                                    Prohibit ({Math.round(proposal.prohibited_weight)})
                                </button>
                            </div>

                            {votingId === proposal.id && (
                                <div className="mt-2 text-[10px] text-purple-400 animate-pulse">Calculating weighted consensus...</div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
        </div>
    );
};
