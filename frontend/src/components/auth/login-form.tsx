"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import Image from "next/image";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await api.post("/users/login/", { email, password });

            // Get user from response body, or decode from JWT as fallback
            let user = res.data.user;
            if (!user) {
                const tokenPayload = JSON.parse(atob(res.data.access.split('.')[1]));
                user = {
                    id: tokenPayload.user_id,
                    email: tokenPayload.email,
                    role: tokenPayload.role,
                    is_18_plus: tokenPayload.is_18_plus,
                };
            }

            setAuth(user, res.data.access, res.data.refresh);
            router.push("/feed");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            setError(error.response?.data?.detail || "Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setError("");
            try {
                // dj-rest-auth handles Google access tokens for authentication
                const res = await api.post("/users/login/google/", {
                    access_token: tokenResponse.access_token
                });

                let user = res.data.user;
                if (!user) {
                    const tokenPayload = JSON.parse(atob(res.data.access.split('.')[1]));
                    user = {
                        id: tokenPayload.user_id,
                        email: tokenPayload.email,
                        role: tokenPayload.role,
                        is_18_plus: tokenPayload.is_18_plus,
                    };
                }

                setAuth(user, res.data.access, res.data.refresh);
                router.push("/feed");
            } catch (err: unknown) {
                setError("Google authentication failed. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            setError("Google login popup closed or failed.");
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-8 glass rounded-3xl"
        >
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
                <p className="text-void-muted mt-2">Enter your credentials to access the void.</p>
            </div>

            <button
                type="button"
                onClick={() => googleLogin()}
                disabled={isLoading}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors mb-6 font-semibold"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                Continue with Google
            </button>

            <div className="relative flex items-center mb-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase tracking-widest text-void-muted">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-void-muted px-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-void-muted" />
                        <input
                            type="email"
                            required
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-void-accent/50 transition-colors"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-void-muted px-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-void-muted" />
                        <input
                            type="password"
                            required
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-void-accent/50 transition-colors"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
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
                    className="group relative w-full h-14 bg-void-accent text-void-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <>
                            Sign In
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
}
