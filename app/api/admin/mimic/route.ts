import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { role } = await request.json();

  const response = NextResponse.json({ success: true, mimicRole: role || null });

  if (role === "kj" || role === "owner") {
    response.cookies.set("admin_mimic_role", role, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
    });
  } else {
    // Clear mimic mode
    response.cookies.delete("admin_mimic_role");
  }

  return response;
}
