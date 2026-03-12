"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bell, Check, CheckCheck, MessageSquare,
  TrendingUp, Award, Zap, AlertTriangle, Loader2
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  post: string | null;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  REPLY: MessageSquare,
  TRENDING: TrendingUp,
  MILESTONE: Award,
  BADGE_EARNED: Award,
  MOMENTUM: Zap,
  DISCUSSION: MessageSquare,
  RESTRICTED_SPIKE: AlertTriangle,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  REPLY: "text-void-accent",
  TRENDING: "text-orange-400",
  MILESTONE: "text-yellow-400",
  BADGE_EARNED: "text-purple-400",
  MOMENTUM: "text-green-400",
  DISCUSSION: "text-blue-400",
  RESTRICTED_SPIKE: "text-void-error",
};

export default function NotificationsPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications/").then((res) => res.data),
    enabled: !!accessToken,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/read/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post("/notifications/read-all/"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!accessToken) return null;

  const notifications: Notification[] = data?.results || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-premium">
        <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
          <Link href="/feed" className="p-2 text-void-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold tracking-tighter text-lg">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-void-accent hover:bg-void-accent/10 rounded-full transition-all"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Read All
            </button>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-void-accent" />
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bell className="h-12 w-12 mx-auto text-void-muted mb-4" />
            <p className="text-void-muted text-sm">No notifications yet. They&apos;ll appear here.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const Icon = NOTIFICATION_ICONS[notif.notification_type] || Bell;
              const color = NOTIFICATION_COLORS[notif.notification_type] || "text-void-muted";

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    if (!notif.is_read) readMutation.mutate(notif.id);
                    if (notif.post) router.push(`/post/${notif.post}`);
                  }}
                  className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/5 ${
                    !notif.is_read ? "bg-void-accent/5 border border-void-accent/10" : "glass"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${!notif.is_read ? "bg-void-accent/10" : "bg-white/5"}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-bold ${!notif.is_read ? "text-white" : "text-white/70"}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <div className="h-2 w-2 rounded-full bg-void-accent flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-void-muted mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-[10px] text-void-muted mt-1 font-mono">
                      {formatDistanceToNow(new Date(notif.created_at))} ago
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
