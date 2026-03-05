import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

interface VoidNotification {
    id: string;
    notification_type: string;
    title: string;
    body: string;
    post: string | null;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<VoidNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await api.get("/notifications/", {
                params: { page, page_size: 20 },
            });
            setNotifications(res.data.results);
        } catch {
            // Silent
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get("/notifications/unread-count/");
            setUnreadCount(res.data.unread_count);
        } catch {
            // Silent
        }
    }, []);

    const markRead = useCallback(async (id: string) => {
        try {
            await api.post(`/notifications/read/${id}/`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            // Silent
        }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await api.post("/notifications/read-all/");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {
            // Silent
        }
    }, []);

    // Poll for unread count every 30s
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        fetchUnreadCount,
        markRead,
        markAllRead,
    };
}
