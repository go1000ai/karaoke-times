import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if venue owner
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "venue_owner") {
          return NextResponse.redirect(`${origin}/dashboard`);
        }

        // Check if connected KJ
        const { data: staff } = await supabase
          .from("venue_staff")
          .select("id")
          .eq("user_id", user.id)
          .not("accepted_at", "is", null)
          .limit(1);

        if (staff && staff.length > 0) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }

        // Regular singer → profile
        return NextResponse.redirect(`${origin}/profile`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to the sign-in page with an error
  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
