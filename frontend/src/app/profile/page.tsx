"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, Star, MessageSquare, Heart,
  TrendingUp, Calendar, Award, Settings, LogOut
} from "lucide-react";
import Link from "next/link";

interface ProfileData {
  user: {
    id: string;
    alias: string;
    email: string;
    role: string;
    strike_count: number;
    is_18_plus: boolean;
    created_at: string;
  };
  post_count: number;
  reputation: {
    composite_score: number;
    total_posts: number;
    total_engagement: number;
    total_reactions_received: number;
  };
  badges: Array<{
    type: string;
    icon: string;
    name: string;
    earned_at: string;
  }>;
}

export default function ProfilePage() {
  const { user, accessToken, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) router.push("/login");
  }, [accessToken, router]);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: () => api.get("/users/profile/").then((res) => res.data),
    enabled: !!accessToken,
  });

  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass-premium">
        <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
          <Link href="/feed" className="p-2 text-void-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold tracking-tighter text-lg">Profile</h1>
          <button onClick={() => { logout(); router.push("/login"); }} className="p-2 text-void-muted hover:text-void-error transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-void-accent border-t-transparent animate-spin" />
          </div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Avatar & Identity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-br from-void-accent/20 to-void-purple/20 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(0,242,255,0.1)]">
                <span className="text-3xl font-black text-void-accent">
                  {(profile.user.alias || "A")[0].toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{profile.user.alias || "Anonymous"}</h2>
              <p className="text-sm text-void-muted mt-1 font-mono">
                Joined {new Date(profile.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              {profile.user.role !== "user" && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-void-purple/10 border border-void-purple/30 rounded-full">
                  <Shield className="h-3 w-3 text-void-purple" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-void-purple">
                    {profile.user.role === "admin" ? "Administrator" : "Sentinel"}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: "Pulses", value: profile.post_count, icon: MessageSquare, color: "text-void-accent" },
                { label: "Reputation", value: Math.round(profile.reputation.composite_score), icon: Star, color: "text-yellow-400" },
                { label: "Reactions", value: profile.reputation.total_reactions_received, icon: Heart, color: "text-pink-400" },
                { label: "Engagement", value: profile.reputation.total_engagement, icon: TrendingUp, color: "text-green-400" },
              ].map((stat, i) => (
                <div key={i} className="p-4 glass rounded-2xl text-center">
                  <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                  <p className="text-[10px] text-void-muted uppercase tracking-[0.2em] font-bold mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Badges */}
            {profile.badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-3xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-void-accent" />
                  <h3 className="font-bold uppercase tracking-[0.1em] text-sm">Earned Badges</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.badges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{badge.name}</p>
                        <p className="text-[10px] text-void-muted">
                          {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              {[
                { href: "/my-pulses", label: "My Pulses", icon: MessageSquare },
                { href: "/bookmarks", label: "Bookmarks", icon: Heart },
                { href: "/notifications", label: "Notifications", icon: Settings },
                { href: "/governance", label: "Governance", icon: Shield },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-4 p-4 glass rounded-2xl hover:bg-white/5 transition-all group"
                >
                  <link.icon className="h-5 w-5 text-void-muted group-hover:text-void-accent transition-colors" />
                  <span className="font-medium">{link.label}</span>
                  <ArrowLeft className="h-4 w-4 ml-auto rotate-180 text-void-muted group-hover:text-white transition-colors" />
                </Link>
              ))}
            </motion.div>

            {/* Strike Warning */}
            {profile.user.strike_count > 0 && (
              <div className="p-4 bg-void-error/10 border border-void-error/30 rounded-2xl">
                <p className="text-sm text-void-error font-bold">
                  ⚠️ You have {profile.user.strike_count} strike{profile.user.strike_count > 1 ? "s" : ""}. {profile.user.strike_count >= 2 ? "One more will result in a ban." : ""}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-void-muted py-20">Failed to load profile.</p>
        )}
      </main>
    </div>
  );
}
