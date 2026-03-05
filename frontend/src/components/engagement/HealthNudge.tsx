"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sun, X } from "lucide-react";

interface HealthNudgeProps {
    isVisible: boolean;
    sessionMinutes: number;
    onDismiss: () => void;
    onTakeBreak?: () => void;
}

export default function HealthNudge({
    isVisible,
    sessionMinutes,
    onDismiss,
    onTakeBreak,
}: HealthNudgeProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-full max-w-sm mx-4 glass-premium rounded-3xl p-8 text-center relative overflow-hidden"
                    >
                        {/* Decorative glow */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-void-accent/10 blur-3xl" />

                        {/* Close button */}
                        <button
                            onClick={onDismiss}
                            className="absolute top-4 right-4 text-void-muted hover:text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Icon */}
                        <motion.div
                            initial={{ rotate: -10 }}
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-void-accent/10 border border-void-accent/20 mb-6"
                        >
                            <Sun className="h-8 w-8 text-void-accent" />
                        </motion.div>

                        <h3 className="text-lg font-bold mb-2">Time for a breather?</h3>
                        <p className="text-void-muted text-sm mb-2">
                            You&apos;ve been exploring the void for
                        </p>

                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Clock className="h-4 w-4 text-void-accent" />
                            <span className="text-2xl font-black text-void-accent tabular-nums">
                                {sessionMinutes}
                            </span>
                            <span className="text-sm text-void-muted">minutes</span>
                        </div>

                        <p className="text-void-muted text-xs mb-6">
                            Your minds matters. Take a moment to stretch, hydrate, or just look away from the screen.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onTakeBreak}
                                className="w-full py-3 bg-void-accent text-void-black font-bold text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-transform"
                            >
                                Take a Break
                            </button>
                            <button
                                onClick={onDismiss}
                                className="w-full py-3 bg-white/5 border border-white/10 text-white/60 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors"
                            >
                                I&apos;m Good, Continue
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
