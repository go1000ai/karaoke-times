"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasDashboard: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  hasDashboard: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDashboard, setHasDashboard] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) checkDashboardAccess(session.user.id);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        checkDashboardAccess(session.user.id);
      } else {
        setHasDashboard(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function checkDashboardAccess(userId: string) {
    // Check if user is a venue owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "venue_owner") {
      setHasDashboard(true);
      return;
    }

    // Check if user is a connected KJ
    const { data: staff } = await supabase
      .from("venue_staff")
      .select("id")
      .eq("user_id", userId)
      .not("accepted_at", "is", null)
      .limit(1);

    setHasDashboard(!!(staff && staff.length > 0));
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, hasDashboard, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
