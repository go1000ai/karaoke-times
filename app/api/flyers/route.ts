import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — list saved flyers for the current user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: flyers, error } = await supabase
    .from("flyers")
    .select("id, event_name, venue_name, event_date, theme, image_path, copy_data, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach public URLs
  const flyersWithUrls = (flyers ?? []).map((f) => {
    const { data } = supabase.storage.from("flyers").getPublicUrl(f.image_path);
    return { ...f, imageUrl: data.publicUrl };
  });

  return NextResponse.json({ flyers: flyersWithUrls });
}

// DELETE — remove a saved flyer
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Flyer ID required" }, { status: 400 });
  }

  // Get the flyer to find the storage path
  const { data: flyer } = await supabase
    .from("flyers")
    .select("image_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!flyer) {
    return NextResponse.json({ error: "Flyer not found" }, { status: 404 });
  }

  // Delete from storage
  await supabase.storage.from("flyers").remove([flyer.image_path]);

  // Delete from database
  await supabase.from("flyers").delete().eq("id", id).eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
