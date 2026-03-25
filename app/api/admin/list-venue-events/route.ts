import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await serverSupabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("venue_events")
    .select("id, day_of_week, flyer_url, venues(name)")
    .eq("is_active", true)
    .order("day_of_week");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = (data || []).map((e: any) => ({
    id: e.id,
    day_of_week: e.day_of_week,
    flyer_url: e.flyer_url,
    venueName: e.venues?.name || "Unknown",
  })).sort((a: any, b: any) => a.venueName.localeCompare(b.venueName));

  return NextResponse.json({ events });
}
