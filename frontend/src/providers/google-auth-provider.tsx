"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect } from "react";

const GOOGLE_CLIENT_ID = "218380733132-0sk036rblo6jbduj4a8e2njff3q0u554.apps.googleusercontent.com";

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        console.log("GoogleAuthProvider (Client): Initialized with ID:", GOOGLE_CLIENT_ID);
        if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
            console.log("Env variable NEXT_PUBLIC_GOOGLE_CLIENT_ID exists:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
        } else {
            console.warn("Env variable NEXT_PUBLIC_GOOGLE_CLIENT_ID is MISSING. Using hardcoded fallback.");
        }
    }, []);

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
}
