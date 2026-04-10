"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, Users, FileText, AlertTriangle,
  Activity, TrendingUp, Ban, Check, Eye,
  Loader2, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface AdminAnalytics {
  total_users: number;
  total_posts: number;
  pending_reports: number;
  active_users_24h: number;
  status_distribution: Record<string, number>;
  recent_strikes: Array<{
    id: string;
    user_alias: string;
    reason: string;
    is_active: boolean;
    created_at: string;
  }>;
}

interface QueueItem {
  id: string;
  post_id: string;
  post_content: string;
  post_author_alias: string;
  reason: string;
  ai_scores: Record<string, number>;
  status: string;
  priority: number;
  created_at: string;
}

export default function AdminPage() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "logs">("overview");

  useEffect(() => {
    if (!accessToken || (user?.role !== "admin" && user?.role !== "mod")) {
      router.push("/feed");
    }
  }, [accessToken, user, router]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ["admin-analytics"],
    queryFn: () => api.get("/governance/analytics/").then((res) => res.data),
    enabled: !!accessToken && user?.role === "admin",
  });

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: () => api.get("/moderation/queue/").then((res) => res.data),
    enabled: !!accessToken && activeTab === "queue",
  });

  const { data: auditLogs } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.get("/governance/logs/").then((res) => res.data),
    enabled: !!accessToken && activeTab === "logs",
  });

  const actionMutation = useMutation({
    mutationFn: (data: { queue_item_id: string; action: string; new_status?: string; notes?: string }) =>
      api.post("/moderation/action/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });

  if (!accessToken || (user?.role !== "admin" && user?.role !== "mod")) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-premium">
        <div className="mx-auto max-w-4xl flex h-16 items-center justify-between px-6">
          <Link href="/feed" className="p-2 text-void-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold tracking-tighter text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-void-purple" />
            {user?.role === "admin" ? "Admin Dashboard" : "Sentinel Panel"}
          </h1>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
              queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
            }}
            className="p-2 text-void-muted hover:text-white transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="mx-auto max-w-4xl px-6 pt-4">
        <div className="flex gap-2">
          {["overview", "queue", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-void-purple/20 text-void-purple border border-void-purple/30"
                  : "text-void-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {analyticsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-void-purple" />
              </div>
            ) : analytics && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Users", value: analytics.total_users, icon: Users, color: "text-void-accent" },
                    { label: "Total Posts", value: analytics.total_posts, icon: FileText, color: "text-blue-400" },
                    { label: "Pending Reports", value: analytics.pending_reports, icon: AlertTriangle, color: "text-void-error" },
                    { label: "Active (24h)", value: analytics.active_users_24h, icon: Activity, color: "text-green-400" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 glass rounded-2xl"
                    >
                      <stat.icon className={`h-5 w-5 mb-2 ${stat.color}`} />
                      <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                      <p className="text-[10px] text-void-muted uppercase tracking-[0.2em] font-bold mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Status Distribution */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-void-muted mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Content Distribution
                  </h3>
                  <div className="flex gap-4">
                    {Object.entries(analytics.status_distribution || {}).map(([status, count]) => (
                      <div key={status} className="flex-1 text-center">
                        <div className={`h-2 rounded-full mb-2 ${
                          status === "SAFE" ? "bg-green-400" :
                          status === "MATURE" ? "bg-yellow-400" :
                          status === "PROHIBITED" ? "bg-red-400" :
                          "bg-void-muted"
                        }`} />
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-[10px] text-void-muted uppercase tracking-widest">{status}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Strikes */}
                {analytics.recent_strikes?.length > 0 && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-void-muted mb-4 flex items-center gap-2">
                      <Ban className="h-4 w-4" /> Recent Strikes
                    </h3>
                    <div className="space-y-2">
                      {analytics.recent_strikes.map((strike) => (
                        <div key={strike.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                          <AlertTriangle className="h-4 w-4 text-void-error flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{strike.user_alias}</p>
                            <p className="text-xs text-void-muted truncate">{strike.reason}</p>
                          </div>
                          <span className="text-[10px] text-void-muted font-mono whitespace-nowrap">
                            {formatDistanceToNow(new Date(strike.created_at))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "queue" && (
          <div className="space-y-4">
            {queueLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-void-purple" />
              </div>
            ) : (queueData?.results || []).length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl">
                <Check className="h-12 w-12 mx-auto text-green-400 mb-4" />
                <p className="text-sm text-void-muted">Queue is clear. No items pending review.</p>
              </div>
            ) : (
              (queueData?.results || []).map((item: QueueItem) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 glass-premium rounded-2xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                        item.priority >= 2 ? "bg-void-error/20 text-void-error" : "bg-yellow-400/20 text-yellow-400"
                      }`}>
                        P{item.priority}
                      </span>
                      <span className="text-xs text-void-muted">{item.post_author_alias}</span>
                    </div>
                    <span className="text-[10px] text-void-muted font-mono">
                      {formatDistanceToNow(new Date(item.created_at))} ago
                    </span>
                  </div>

                  <p className="text-sm text-white/80 mb-2 line-clamp-3">{item.post_content}</p>
                  <p className="text-xs text-void-muted mb-4">{item.reason}</p>

                  {/* AI Scores */}
                  {item.ai_scores && Object.keys(item.ai_scores).length > 0 && (
                    <div className="flex gap-3 mb-4">
                      {Object.entries(item.ai_scores).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <p className={`text-sm font-bold ${(val as number) > 70 ? "text-void-error" : (val as number) > 40 ? "text-yellow-400" : "text-green-400"}`}>
                            {(val as number).toFixed(0)}
                          </p>
                          <p className="text-[8px] text-void-muted uppercase">{key}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => actionMutation.mutate({ queue_item_id: item.id, action: "APPROVE" })}
                      disabled={actionMutation.isPending}
                      className="flex-1 py-2 rounded-xl text-xs font-bold uppercase bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => actionMutation.mutate({ queue_item_id: item.id, action: "RECLASSIFY", new_status: "MATURE" })}
                      disabled={actionMutation.isPending}
                      className="flex-1 py-2 rounded-xl text-xs font-bold uppercase bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-all"
                    >
                      Mature
                    </button>
                    <button
                      onClick={() => actionMutation.mutate({ queue_item_id: item.id, action: "REMOVE" })}
                      disabled={actionMutation.isPending}
                      className="flex-1 py-2 rounded-xl text-xs font-bold uppercase bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-2">
            {(auditLogs || []).map((log: { id: string; admin_alias: string; target_alias: string; action_type: string; reason: string; created_at: string }) => (
              <div key={log.id} className="flex items-start gap-3 p-4 glass rounded-xl">
                <Shield className="h-4 w-4 text-void-purple mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-bold text-void-purple">{log.admin_alias}</span>
                    <span className="text-void-muted"> → </span>
                    <span className="font-bold">{log.target_alias}</span>
                  </p>
                  <p className="text-xs text-void-muted mt-0.5">{log.action_type}: {log.reason}</p>
                  <p className="text-[10px] text-void-muted mt-0.5 font-mono">
                    {formatDistanceToNow(new Date(log.created_at))} ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
