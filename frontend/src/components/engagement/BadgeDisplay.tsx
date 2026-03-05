"use client";

import { motion } from "framer-motion";

interface Badge {
    type: string;
    icon: string;
    name: string;
}

interface BadgeDisplayProps {
    badges: Badge[];
    size?: "sm" | "md";
}

export default function BadgeDisplay({ badges, size = "sm" }: BadgeDisplayProps) {
    if (!badges || badges.length === 0) return null;

    return (
        <div className="flex items-center gap-1">
            {badges.map((badge, i) => (
                <motion.div
                    key={badge.type}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 400 }}
                    className="group relative"
                >
                    <span
                        className={`${size === "sm" ? "text-xs" : "text-sm"
                            } cursor-default transition-transform hover:scale-125`}
                        title={badge.name}
                    >
                        {badge.icon}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-void-surface border border-white/10 rounded-lg text-[10px] text-void-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {badge.name}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-void-surface" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
