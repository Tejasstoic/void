"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

interface RestrictedToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
    isEligible: boolean;
}

export default function RestrictedToggle({ isEnabled, onToggle, isEligible }: RestrictedToggleProps) {
    if (!isEligible) return null;

    return (
        <div className="flex items-center justify-between p-4 glass rounded-2xl mb-6 border-void-purple/20 bg-void-purple/5">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-void-purple/20 text-void-purple">
                    <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white">Restricted Zone</h3>
                    <p className="text-[10px] text-void-muted uppercase tracking-tighter mt-0.5">Toggle 18+ Mature Content</p>
                </div>
            </div>

            <button
                onClick={() => onToggle(!isEnabled)}
                className={void 0}
                style={{
                    position: 'relative',
                    width: '44px',
                    height: '24px',
                    borderRadius: '99px',
                    backgroundColor: isEnabled ? '#7000ff' : '#1a1a1a',
                    transition: 'background-color 0.2s'
                }}
            >
                <motion.div
                    animate={{ x: isEnabled ? 22 : 2 }}
                    className="absolute top-1 left-0 h-4 w-4 bg-white rounded-full shadow-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
}
