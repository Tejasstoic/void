import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

let sessionId: string | null = null;

export function useEngagement() {
    const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [sessionMinutes, setSessionMinutes] = useState(0);
    const [shouldNudge, setShouldNudge] = useState(false);

    // Start session
    const startSession = useCallback(async (isRestricted = false) => {
        try {
            const res = await api.post("/engagement/session/start/", {
                is_restricted: isRestricted,
            });
            sessionId = res.data.session_id;

            // Start timer
            sessionTimerRef.current = setInterval(() => {
                setSessionMinutes((m) => m + 1);
            }, 60000); // Every minute
        } catch {
            // Silent fail for engagement tracking
        }
    }, []);

    // End session
    const endSession = useCallback(async () => {
        if (!sessionId) return;
        try {
            await api.post("/engagement/session/end/", { session_id: sessionId });
        } catch {
            // Silent
        }
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        sessionId = null;
        setSessionMinutes(0);
    }, []);

    // Record post impression with dwell time
    const recordImpression = useCallback(async (postId: string, dwellTimeMs: number) => {
        try {
            await api.post("/engagement/impression/", {
                post_id: postId,
                dwell_time_ms: dwellTimeMs,
            });
        } catch {
            // Silent
        }
    }, []);

    // Record scroll depth
    const recordScrollDepth = useCallback(async (depthPercent: number, postsScrolled: number) => {
        if (!sessionId) return;
        try {
            await api.post("/engagement/scroll/", {
                session_id: sessionId,
                max_depth_percent: depthPercent,
                posts_scrolled_past: postsScrolled,
            });
        } catch {
            // Silent
        }
    }, []);

    // Check usage for nudge
    const checkUsage = useCallback(async () => {
        try {
            const res = await api.get("/engagement/usage/");
            setShouldNudge(res.data.should_nudge);
            return res.data;
        } catch {
            return null;
        }
    }, []);

    // Acknowledge nudge
    const acknowledgeNudge = useCallback(async () => {
        try {
            await api.post("/engagement/usage/");
            setShouldNudge(false);
        } catch {
            // Silent
        }
    }, []);

    // Check for nudge periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (sessionMinutes > 0 && sessionMinutes % 15 === 0) {
                checkUsage();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [sessionMinutes, checkUsage]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        };
    }, []);

    return {
        startSession,
        endSession,
        recordImpression,
        recordScrollDepth,
        checkUsage,
        acknowledgeNudge,
        shouldNudge,
        sessionMinutes,
    };
}
