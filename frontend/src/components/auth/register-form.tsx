"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/use-auth-store";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import Image from "next/image";

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        password_confirm: "",
        date_of_birth: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await api.post("/users/register/", formData);
            router.push("/login?registered=true");
        } catch (err: unknown) {
            const error = err as { response?: { data?: Record<string, string[]> } };
            const data = error.response?.data;
            const firstError = data
                ? Object.values(data).flat()[0]
                : undefined;
            setError(firstError || "Registration failed. Check your details.");
        } finally {
            setIsLoading(false);
        }
    };

const handleGoogleSuccess = async (tokenResponse: any) => {
        setIsLoading(true);
        setError("");
        console.log("Exchanging token with backend (signup)...");
        try {
            const res = await api.post("/users/login/google/", {
                access_token: tokenResponse.credential,
                id_token: tokenResponse.credential
            });

            console.log("Full Backend Response (signup):", res.data);
            
            const accessToken = res.data.access || res.data.access_token;
            const refreshToken = res.data.refresh || res.data.refresh_token;
            let user = res.data.user;

            if (!accessToken) {
                throw new Error("No access token received from backend");
            }

            if (!user) {
                console.log("Decoding user from token...");
                const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
                user = {
                    id: tokenPayload.user_id,
                    email: tokenPayload.email,
                    role: tokenPayload.role,
                    is_18_plus: tokenPayload.is_18_plus,
                };
            }

            console.log("Final User Object (signup):", user);
            setAuth(user, accessToken, refreshToken);
            router.push("/feed");
        } catch (err: any) {
            console.error("Backend Error Object:", err);
            const backendError = err.response?.data?.detail || err.response?.data || err.message;
            console.error("Detailed error from backend:", backendError);
            setError(`Google sign-up failed: ${typeof backendError === 'string' ? backendError : JSON.stringify(backendError)}`);
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

            {/* Google Sign-Up */}
            <div className="w-full flex justify-center mb-6">
                <GoogleLogin
                    onSuccess={(response) => {
                        console.log("Google Sign-up Success callback reached", response);
                        handleGoogleSuccess(response);
                    }}
                    onError={() => {
                        console.error("Google Sign-up Error callback hit. Check your Google Cloud Console settings (origins, redirect URIs) and Client ID.");
                        setError("Google sign-up failed. Please check browser console for details.");
                    }}
                    use_fedcm_for_prompt={true}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="350"
                />
            </div>

            <div className="relative flex items-center mb-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase tracking-widest text-void-muted">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
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
                            placeholder="you@gmail.com"
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
