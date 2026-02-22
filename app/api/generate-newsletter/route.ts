import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gatherNewsletterData, generateNewsletter } from "@/lib/newsletter-ai";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const data = await gatherNewsletterData();
    const result = await generateNewsletter(data, body.adminContext);

    return NextResponse.json({
      success: true,
      subject: result.subject,
      bodyHtml: result.bodyHtml,
    });
  } catch (err) {
    console.error("Newsletter AI generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate newsletter" },
      { status: 500 }
    );
  }
}
