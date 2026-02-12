import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

interface Profile {
  id: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile) return null;

  return {
    ...profile,
    email: user.email,
  };
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/signin");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = data as { role: string } | null;
  if (profile?.role !== "admin") {
    redirect("/");
  }
  return user;
}

export async function requireVenueOwner() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = data as { role: string } | null;

  // Allow venue owners
  if (profile?.role === "venue_owner") return user;

  // Allow KJs who are connected staff at any venue
  const { data: staffRecord } = await supabase
    .from("venue_staff")
    .select("id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (staffRecord) return user;

  redirect("/");
}
