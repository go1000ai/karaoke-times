import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}

// List all drafts
export async function GET() {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { data: drafts, error } = await supabase
    .from("newsletter_drafts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drafts });
}

// Create or update a draft
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { id, subject, bodyText, bodyHtml, adminContext, source } = body;

  if (id) {
    // Update existing draft
    const { data, error } = await supabase
      .from("newsletter_drafts")
      .update({
        subject: subject ?? "",
        body_text: bodyText ?? "",
        body_html: bodyHtml ?? null,
        admin_context: adminContext ?? null,
        source: source ?? "manual",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, draft: data });
  } else {
    // Create new draft
    const { data, error } = await supabase
      .from("newsletter_drafts")
      .insert({
        subject: subject ?? "",
        body_text: bodyText ?? "",
        body_html: bodyHtml ?? null,
        admin_context: adminContext ?? null,
        source: source ?? "manual",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, draft: data });
  }
}

// Delete a draft
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("newsletter_drafts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
