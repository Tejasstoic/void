"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, Vote, Scale, Clock,
  CheckCircle, XCircle, AlertTriangle, Loader2, ScrollText
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Proposal {
  id: string;
  target_post: string;
  target_post_content: string;
  proposer_alias: string;
  reason: string;
  status: string;
  safe_weight: number;
  mature_weight: number;
  prohibited_weight: number;
  expires_at: string;
  created_at: string;
  vote_count: number;
}

interface GovernanceLog {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
}

export default function GovernancePage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => api.get("/governance/proposals/").then((res) => res.data.results || res.data),
    enabled: !!accessToken,
  });

  const { data: logsData  } = useQuery({
    queryKey: ["governance-logs"],
    queryFn: () => api.get("/governance/public-logs/").then((res) => res.data),
    enabled: !!accessToken,
  });

  const voteMutation = useMutation({
    mutationFn: ({ proposalId, choice }: { proposalId: string; choice: string }) =>
      api.post(`/governance/proposals/${proposalId}/vote/`, { choice }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  if (!accessToken) return null;

  const activeProposals = (proposals || []).filter((p: Proposal) => p.status === "PENDING");
  const resolvedProposals = (proposals || []).filter((p: Proposal) => p.status !== "PENDING");
  const logs: GovernanceLog[] = logsData?.results || [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-premium">
        <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
          <Link href="/feed" className="p-2 text-void-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold tracking-tighter text-lg flex items-center gap-2">
            <Scale className="h-5 w-5 text-void-accent" /> Governance
          </h1>
          <div className="w-9" />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-10">
        {proposalsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
          </div>
        ) : (
          <>
            {/* Active Proposals */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                <Vote className="h-3 w-3" /> Active Proposals ({activeProposals.length})
              </h2>
              {activeProposals.length === 0 ? (
                <p className="text-center text-void-muted py-8 text-sm glass rounded-2xl">No active proposals</p>
              ) : (
                <div className="space-y-4">
                  {activeProposals.map((proposal: Proposal, i: number) => {
                    const totalWeight = proposal.safe_weight + proposal.mature_weight + proposal.prohibited_weight;
                    const safePct = totalWeight > 0 ? (proposal.safe_weight / totalWeight) * 100 : 33;
                    const maturePct = totalWeight > 0 ? (proposal.mature_weight / totalWeight) * 100 : 33;
                    const prohibitedPct = totalWeight > 0 ? (proposal.prohibited_weight / totalWeight) * 100 : 34;

                    return (
                      <motion.div
                        key={proposal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-6 glass-premium rounded-2xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] text-void-muted uppercase tracking-[0.2em] font-mono">
                            by {proposal.proposer_alias}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-void-muted">
                            <Clock className="h-3 w-3" />
                            Expires {formatDistanceToNow(new Date(proposal.expires_at))}
                          </div>
                        </div>

                        <p className="text-sm text-white/80 mb-2 line-clamp-2 italic">&quot;{proposal.target_post_content}&quot;</p>
                        <p className="text-xs text-void-muted mb-4">Reason: {proposal.reason}</p>

                        {/* Vote Progress */}
                        <div className="h-3 rounded-full overflow-hidden bg-white/5 mb-4 flex">
                          <div className="bg-green-400/60 transition-all" style={{ width: `${safePct}%` }} />
                          <div className="bg-yellow-400/60 transition-all" style={{ width: `${maturePct}%` }} />
                          <div className="bg-red-400/60 transition-all" style={{ width: `${prohibitedPct}%` }} />
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-void-muted mb-4">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" /> Safe {safePct.toFixed(0)}%</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Mature {maturePct.toFixed(0)}%</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" /> Prohibited {prohibitedPct.toFixed(0)}%</span>
                          <span className="ml-auto">{proposal.vote_count} votes</span>
                        </div>

                        {/* Vote Buttons */}
                        <div className="flex gap-2">
                          {["SAFE", "MATURE", "PROHIBITED"].map((choice) => (
                            <button
                              key={choice}
                              onClick={() => voteMutation.mutate({ proposalId: proposal.id, choice })}
                              disabled={voteMutation.isPending}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                                choice === "SAFE" ? "bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20" :
                                choice === "MATURE" ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20" :
                                "bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20"
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Resolved Proposals */}
            {resolvedProposals.length > 0 && (
              <section>
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" /> Resolved ({resolvedProposals.length})
                </h2>
                <div className="space-y-2">
                  {resolvedProposals.slice(0, 10).map((proposal: Proposal) => (
                    <div key={proposal.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                      {proposal.status === "PASSED" ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : proposal.status === "REJECTED" ? (
                        <XCircle className="h-4 w-4 text-red-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      )}
                      <p className="text-xs text-white/70 flex-1 line-clamp-1">{proposal.reason}</p>
                      <span className="text-[10px] text-void-muted font-mono">
                        {formatDistanceToNow(new Date(proposal.created_at))} ago
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Public Governance Logs */}
            {logs.length > 0 && (
              <section>
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-void-muted mb-4 flex items-center gap-2">
                  <ScrollText className="h-3 w-3" /> Public Governance Log
                </h2>
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 glass rounded-xl">
                      <Shield className="h-3 w-3 text-void-muted mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-white/70">{log.reason}</p>
                        <p className="text-[10px] text-void-muted mt-0.5 font-mono">
                          {log.action_type} · {formatDistanceToNow(new Date(log.created_at))} ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
