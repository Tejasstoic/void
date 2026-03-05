"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
    Shield,
    Users,
    MessageSquare,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    LayoutDashboard,
    FileText,
    Activity,
    Loader2,
    Search,
    Ban,
    UserX
} from "lucide-react";

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("overview");

    const { data: stats } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: () => api.get("/governance/analytics/").then((res) => res.data),
    });

    const { data: queue, isLoading: isLoadingQueue } = useQuery({
        queryKey: ["moderation-queue"],
        queryFn: () => api.get("/governance/queue/").then((res) => res.data),
    });

    const { data: logs } = useQuery({
        queryKey: ["admin-logs"],
        queryFn: () => api.get("/governance/logs/").then((res) => res.data),
    });

    const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => api.get("/users/list/").then((res) => res.data),
        enabled: activeTab === "users",
    });

    const moderateMutation = useMutation({
        mutationFn: ({ postId, status }: { postId: string, status: string }) =>
            api.patch(`/content/posts/${postId}/`, { moderation_status: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
        }
    });

    const strikeMutation = useMutation({
        mutationFn: (userId: string) => api.post(`/governance/strike/${userId}/`, { reason: "Policy violation detected by admin." }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
            alert("Strike issued successfully.");
        }
    });

    return (
        <div className="flex min-h-screen bg-void-black text-white pb-20 md:pb-0">
            {/* Sidebar - Hidden on Mobile */}
            <aside className="hidden md:flex w-64 border-r border-white/5 bg-void-surface p-6 flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-void-purple flex items-center justify-center">
                        <Shield className="h-6 w-6" />
                    </div>
                    <h1 className="font-black tracking-widest text-lg">CMD CENTER</h1>
                </div>

                <nav className="flex flex-col gap-2">
                    <SidebarLink
                        icon={<LayoutDashboard size={18} />}
                        label="Overview"
                        active={activeTab === "overview"}
                        onClick={() => setActiveTab("overview")}
                    />
                    <SidebarLink
                        icon={<Users size={18} />}
                        label="User Controls"
                        active={activeTab === "users"}
                        onClick={() => setActiveTab("users")}
                    />
                    <SidebarLink icon={<FileText size={18} />} label="Audit Logs" />
                    <SidebarLink icon={<Activity size={18} />} label="System" />
                </nav>

                <div className="mt-auto p-4 glass rounded-2xl border-void-purple/20 bg-void-purple/5">
                    <p className="text-[10px] uppercase tracking-widest text-void-purple font-bold mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-void-accent animate-pulse" />
                        <p className="text-[10px] font-bold">NODE OPERATIONAL</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {activeTab === "overview" ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">System Overview</h2>
                                    <p className="text-void-muted mt-1 text-sm">Real-time platform metrics and governance status.</p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-void-muted glass px-4 py-2 rounded-full w-fit">
                                    <Clock size={14} />
                                    LAST SYNC: {new Date().toLocaleTimeString()}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                                <StatCard title="Total Users" value={stats?.total_users?.toString() || "0"} delta="+0%" icon={<Users className="text-void-accent" />} />
                                <StatCard title="Active Posts" value={stats?.total_posts?.toString() || "0"} delta="+0%" icon={<MessageSquare className="text-void-purple" />} />
                                <StatCard title="Pending Reports" value={stats?.pending_reports?.toString() || "0"} delta="0" icon={<AlertTriangle className="text-void-error" />} />
                                <StatCard title="System Load" value="14%" delta="-2%" icon={<TrendingUp className="text-yellow-500" />} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 glass rounded-3xl p-8">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <AlertTriangle className="text-void-accent" size={20} />
                                        Pending Moderation Queue
                                    </h3>
                                    {isLoadingQueue ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-void-muted" /></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {queue?.length === 0 ? (
                                                <p className="text-sm text-void-muted text-center py-10">Queue is clear. Well done, Sentinel.</p>
                                            ) : (
                                                queue?.map((post: any) => (
                                                    <ModItem
                                                        key={post.id}
                                                        id={post.id}
                                                        user={post.author_alias || 'Anon'}
                                                        content={post.content}
                                                        status={post.moderation_status}
                                                        score={post.toxicity_score || 0}
                                                        onApprove={() => moderateMutation.mutate({ postId: post.id, status: 'SAFE' })}
                                                        onReject={() => moderateMutation.mutate({ postId: post.id, status: 'PROHIBITED' })}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="glass rounded-3xl p-8 bg-void-purple/5 border-void-purple/10">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <Activity className="text-void-purple" size={20} />
                                        Governance Events
                                    </h3>
                                    <div className="space-y-6">
                                        {logs?.length === 0 ? (
                                            <p className="text-xs text-void-muted">No recent governance events.</p>
                                        ) : (
                                            logs?.map((log: any) => (
                                                <EventItem
                                                    key={log.id}
                                                    icon={log.action_type.includes('BAN') ? <XCircle size={14} /> : <Shield size={14} />}
                                                    title={log.action_type.replace(/_/g, ' ')}
                                                    desc={log.reason}
                                                    time={formatDistanceToNow(new Date(log.created_at)) + " ago"}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                                    <p className="text-void-muted mt-1">Oversee individual identities and enforce protocol safety.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-void-muted h-4 w-4" />
                                        <input
                                            type="text"
                                            placeholder="Search by Alias or UUID..."
                                            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-void-accent transition-colors w-64"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass rounded-3xl overflow-hidden">
                                {isLoadingUsers ? (
                                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-void-accent" /></div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-void-muted">
                                                <th className="px-6 py-4">Identity</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Strikes</th>
                                                <th className="px-6 py-4">Joined</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {allUsers?.map((user: any) => (
                                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white tracking-tight">{user.alias || 'Anonymous'}</span>
                                                            <span className="text-[10px] text-void-muted font-mono uppercase tracking-tighter">{user.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                            user.role === 'admin' ? "bg-void-purple/20 text-void-purple" : "bg-white/5 text-void-muted"
                                                        )}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3].map((s) => (
                                                                <div
                                                                    key={s}
                                                                    className={cn(
                                                                        "h-1.5 w-6 rounded-full transition-colors",
                                                                        user.strike_count >= s ? "bg-void-error shadow-[0_0_8px_rgba(255,82,82,0.4)]" : "bg-white/10"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-void-muted">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => strikeMutation.mutate(user.id)}
                                                                title="Issue Strike"
                                                                className="p-2 rounded-xl bg-void-error/10 text-void-error hover:bg-void-error/20 transition-colors"
                                                            >
                                                                <AlertTriangle size={16} />
                                                            </button>
                                                            <button title="Restrict Access" className="p-2 rounded-xl bg-white/5 text-void-muted hover:bg-white/10 transition-colors">
                                                                <Ban size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function SidebarLink({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${active ? 'bg-white/10 text-void-accent' : 'text-void-muted hover:bg-white/5 hover:text-white'}`}
        >
            {icon}
            {label}
        </button>
    );
}

function StatCard({ title, value, delta, icon }: { title: string, value: string, delta: string, icon: React.ReactNode }) {
    return (
        <motion.div whileHover={{ y: -5 }} className="glass p-6 rounded-3xl group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
                    {icon}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${delta.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {delta}
                </span>
            </div>
            <p className="text-void-muted text-xs uppercase tracking-widest font-bold mb-1">{title}</p>
            <p className="text-4xl font-black tracking-tighter">{value}</p>
        </motion.div>
    );
}

function ModItem({ id, user, content, status, score, onApprove, onReject }: { id: string, user: string, content: string, status: string, score: number, onApprove: () => void, onReject: () => void }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex flex-col gap-1 max-w-[70%]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-void-accent uppercase tracking-widest bg-void-accent/10 px-2 py-0.5 rounded-full">{user}</span>
                    <span className="text-[10px] text-void-muted tracking-widest uppercase">TOXICITY: {score.toFixed(2)}</span>
                </div>
                <p className="text-sm truncate text-white/80">{content}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onApprove} className="p-2 rounded-xl hover:bg-green-500/20 text-green-500 transition-colors" title="Approve Post"><CheckCircle size={18} /></button>
                <button onClick={onReject} className="p-2 rounded-xl hover:bg-void-error/20 text-void-error transition-colors" title="Reject & Block"><XCircle size={18} /></button>
            </div>
        </div>
    );
}

function EventItem({ icon, title, desc, time }: { icon: React.ReactNode, title: string, desc: string, time: string }) {
    return (
        <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-[-24px] before:w-[1px] before:bg-white/10 last:before:hidden">
            <div className="absolute left-[-6px] top-1.5 p-1 rounded-full bg-void-purple text-white">
                {icon}
            </div>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h4>
                    <span className="text-[10px] text-void-muted">{time}</span>
                </div>
                <p className="text-xs text-void-muted leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

// Utility function for conditional classes
function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}
