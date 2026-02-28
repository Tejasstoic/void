"use client";

import { useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        password_confirm: "",
        date_of_birth: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await api.post("/users/register/", formData);
            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.response?.data?.email?.[0] || err.response?.data?.password?.[0] || "Registration failed. Check your details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-8 glass rounded-3xl"
        >
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Join the Void</h2>
                <p className="text-void-muted mt-2">Secure your anonymous identity.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-void-muted px-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-void-muted" />
                        <input
                            type="email"
                            required
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-void-accent/50 transition-colors"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-void-muted px-1">Date of Birth</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-void-muted" />
                        <input
                            type="date"
                            required
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-void-accent/50 transition-colors"
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-void-muted px-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-void-muted" />
                            <input
                                type="password"
                                required
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-void-accent/50 transition-colors"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-void-muted px-1">Confirm</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-void-muted" />
                            <input
                                type="password"
                                required
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 outline-none focus:border-void-accent/50 transition-colors"
                                placeholder="••••••••"
                                value={formData.password_confirm}
                                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-void-error bg-void-error/10 p-3 rounded-xl border border-void-error/20">
                        {error}
                    </p>
                )}

                <button
                    disabled={isLoading}
                    type="submit"
                    className="group relative w-full h-14 bg-white text-void-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <>
                            Create Identity
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
}
