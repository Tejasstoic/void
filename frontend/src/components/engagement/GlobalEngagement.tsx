"use client";

import { useEngagement } from "@/hooks/useEngagement";
import { useAuthStore } from "@/store/use-auth-store";
import HealthNudge from "./HealthNudge";
import EngagementPulse from "./EngagementPulse";
import { useEffect } from "react";

export default function GlobalEngagement() {
    const { user, accessToken } = useAuthStore();
    const {
        startSession,
        endSession,
        shouldNudge,
        acknowledgeNudge,
        sessionMinutes
    } = useEngagement();

    // Start session when logged in
    useEffect(() => {
        if (accessToken) {
            startSession();
            return () => {
                endSession();
            };
        }
    }, [accessToken, startSession, endSession]);

    // Don't render for guests
    if (!accessToken) return null;

    return (
        <>
            <HealthNudge
                isVisible={shouldNudge}
                sessionMinutes={sessionMinutes}
                onDismiss={acknowledgeNudge}
            />
            <EngagementPulse />
        </>
    );
}
