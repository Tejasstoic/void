"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";


const TYPE_ICONS: Record<string, string> = {
    REPLY: "💬",
    TRENDING: "🔥",
    MILESTONE: "🏆",
    RESTRICTED_SPIKE: "🌑",
    BADGE_EARNED: "🏅",
    MOMENTUM: "🚀",
    DISCUSSION: "⚡",
};

export default function NotificationBell() {
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markRead,
        markAllRead,
    } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = useCallback(() => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    }, [isOpen, fetchNotifications]);

    return (
        <div className="relative">
            {/* Bell icon */}
            <button
                onClick={togglePanel}
                className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
                <Bell className="h-5 w-5 text-void-muted hover:text-white transition-colors" />

                {/* Unread badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-void-error rounded-full"
                        >
                            <span className="text-[10px] font-black text-white px-1">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pulse ring when unread */}
                {unreadCount > 0 && (
                    <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-void-error/30"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </button>

            {/* Notification panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto glass-premium rounded-2xl border border-white/10 z-50 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-widest">
                                    Notifications
                                </h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="flex items-center gap-1 text-[10px] text-void-accent hover:text-void-accent/80 transition-colors"
                                        >
                                            <CheckCheck className="h-3 w-3" />
                                            Read all
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-void-muted hover:text-white transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Notification list */}
                            <div className="divide-y divide-white/5">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-void-muted text-sm">
                                        No notifications yet. Start posting.
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5 cursor-pointer ${!notif.is_read ? "bg-void-accent/5" : ""
                                                }`}
                                            onClick={() => {
                                                markRead(notif.id);
                                                if (notif.post) {
                                                    setIsOpen(false);
                                                }
                                            }}
                                        >
                                            <span className="text-lg mt-0.5">
                                                {TYPE_ICONS[notif.notification_type] || "🔔"}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={`text-sm ${notif.is_read ? "text-void-muted" : "text-white"
                                                        }`}
                                                >
                                                    {notif.title}
                                                </p>
                                                <p className="text-[11px] text-void-muted mt-0.5 line-clamp-1">
                                                    {notif.body}
                                                </p>
                                                <p className="text-[10px] text-void-muted/60 mt-1">
                                                    {new Date(notif.created_at).toLocaleDateString(undefined, {
                                                        hour: "numeric",
                                                        minute: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-void-accent mt-2 flex-shrink-0" />
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
