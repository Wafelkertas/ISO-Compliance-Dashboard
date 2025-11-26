import { Navigate } from "react-router-dom";
import supabase from "../utils/supabase";
import { JSX, useEffect, useState } from "react";

export default function ProtectedRoutePage({ children }: { children: JSX.Element }) {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadSession() {
            const { data } = await supabase.auth.getSession();
            if (!mounted) return;
            setAuthenticated(!!data.session);
        }

        loadSession();

        // Subscribe to auth changes (login, logout, refresh token)
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setAuthenticated(!!session);
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Still loading initial session
    if (authenticated === null) {
        return <div className="text-center py-8">Checking authentication...</div>;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated → render children
    return children;
}