import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");

  // If Google/Supabase returned an error (e.g. user denied consent)
  if (error_param) {
    return NextResponse.redirect(`${origin}/signin?error=auth`);
  }

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.user;

      if (user) {
        // Check if profile already exists (may have been created by DB trigger)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // No profile yet — create one and send to onboarding
          const meta = user.user_metadata || {};
          await supabase.from("profiles").upsert({
            id: user.id,
            display_name: meta.full_name || meta.name || user.email?.split("@")[0] || "User",
            avatar_url: meta.avatar_url || meta.picture || null,
            role: "user",
          });
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Check if this is a brand-new user (account created in the last 60 seconds)
        // The DB trigger may have already created a profile with default role "user"
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = now.getTime() - createdAt.getTime() < 60000; // 60 seconds

        if (isNewUser && profile.role === "user") {
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        if (profile.role === "admin") {
          return NextResponse.redirect(`${origin}/admin`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // Log error for debugging
    console.error("OAuth code exchange failed:", error?.message);
  }

  // Return the user to the sign-in page with an error
  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
