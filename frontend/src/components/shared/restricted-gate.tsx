"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function RestrictedGate({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (user?.role === "ADMIN" || user?.role === "MODERATOR") {
            setIsAuthorized(true);
            return;
        }

        if (user?.date_of_birth) {
            const birthDate = new Date(user.date_of_birth);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            if (age >= 18) {
                setIsAuthorized(true);
            }
        }
    }, [user]);

    if (isAuthorized) {
        return <>{children}</>;
    }

    return (
        <div className="relative min-h-[400px] w-full glass rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 text-center border-void-purple/20">
            <div className="absolute inset-0 bg-void-purple/5 backdrop-blur-md z-0" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10"
            >
                <div className="mx-auto w-16 h-16 rounded-full bg-void-purple/20 flex items-center justify-center mb-6 border border-void-purple/30">
                    <Lock className="h-8 w-8 text-void-purple" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight mb-3">Restricted Zone</h2>
                <p className="max-w-xs text-void-muted text-sm leading-relaxed mb-8">
                    This area contains content marked as MATURE or PROHIBITED. You must be 18+ to access.
                </p>

                <div className="flex flex-col gap-3">
                    <button className="h-12 px-8 bg-void-purple text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all">
                        Confirm Age & Enter
                    </button>
                    <button className="text-xs uppercase tracking-widest text-void-muted hover:text-white transition-colors">
                        Return to Safe Feed
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
