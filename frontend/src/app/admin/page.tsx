"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
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
    Activity
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const { data: stats } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: () => api.get("/governance/analytics/").then((res) => res.data),
    });

    return (
        <div className="flex min-h-screen bg-void-black text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-void-surface p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-void-purple flex items-center justify-center">
                        <Shield className="h-6 w-6" />
                    </div>
                    <h1 className="font-black tracking-widest text-lg">CMD CENTER</h1>
                </div>

                <nav className="flex flex-col gap-2">
                    <SidebarLink icon={<LayoutDashboard size={18} />} label="Overview" active />
                    <SidebarLink icon={<Shield size={18} />} label="Moderation" />
                    <SidebarLink icon={<Users size={18} />} label="User Controls" />
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
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
                        <p className="text-void-muted mt-1">Real-time platform metrics and governance status.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-void-muted glass px-4 py-2 rounded-full">
                        <Clock size={14} />
                        LAST SYNC: {new Date().toLocaleTimeString()}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Total Users" value={stats?.total_users || "2.1k"} delta="+12%" icon={<Users className="text-void-accent" />} />
                    <StatCard title="Active Posts" value={stats?.total_posts || "8.4k"} delta="+5.2%" icon={<MessageSquare className="text-void-purple" />} />
                    <StatCard title="Moderation Score" value="98.2" delta="+0.4%" icon={<CheckCircle className="text-green-500" />} />
                    <StatCard title="System Load" value="14%" delta="-2%" icon={<TrendingUp className="text-yellow-500" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass rounded-3xl p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <AlertTriangle className="text-void-accent" size={20} />
                            Pending Moderation Queue
                        </h3>
                        <div className="space-y-4">
                            <ModItem user="anon-821" content="This system feels incredibly smooth. Loving the new..." status="PENDING" score={0.12} />
                            <ModItem user="anon-492" content="Wait, is this actually anonymous? I need to know if..." status="MATURE" score={0.65} />
                            <ModItem user="anon-110" content="[PROHIBITED CONTENT REMOVED BY AI INTERCEPTOR]" status="PROHIBITED" score={0.98} />
                        </div>
                    </div>

                    <div className="glass rounded-3xl p-8 bg-void-purple/5 border-void-purple/10">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Activity className="text-void-purple" size={20} />
                            Governance Events
                        </h3>
                        <div className="space-y-6">
                            <EventItem icon={<Shield size={14} />} title="Strike Issued" desc="User void-492 reached 2 strikes." time="2m ago" />
                            <EventItem icon={<XCircle size={14} />} title="Account Suspended" desc="User bad-actor-1 banned permanently." time="14m ago" />
                            <EventItem icon={<CheckCircle size={14} />} title="Post Approved" desc="Post 8291 verified by AI." time="1h ago" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <button className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${active ? 'bg-white/10 text-void-accent' : 'text-void-muted hover:bg-white/5 hover:text-white'}`}>
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

function ModItem({ user, content, status, score }: { user: string, content: string, status: string, score: number }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex flex-col gap-1 max-w-[70%]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-void-accent uppercase tracking-widest bg-void-accent/10 px-2 py-0.5 rounded-full">{user}</span>
                    <span className="text-[10px] text-void-muted">SCORE: {score.toFixed(2)}</span>
                </div>
                <p className="text-sm truncate text-white/80">{content}</p>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl hover:bg-green-500/20 text-green-500 transition-colors"><CheckCircle size={18} /></button>
                <button className="p-2 rounded-xl hover:bg-void-error/20 text-void-error transition-colors"><XCircle size={18} /></button>
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
