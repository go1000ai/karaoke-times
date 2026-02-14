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

// POST — save a generated flyer
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { imageBase64, imageUrl, eventName, venueName, venueId, eventDate, theme, copyData } =
    await request.json();

  if (!imageBase64 && !imageUrl) {
    return NextResponse.json({ error: "Image data required" }, { status: 400 });
  }

  try {
    let imageBuffer: Buffer | null = null;

    if (imageBase64) {
      imageBuffer = Buffer.from(imageBase64, "base64");
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (imgRes.ok) {
        imageBuffer = Buffer.from(await imgRes.arrayBuffer());
      }
    }

    if (!imageBuffer) {
      return NextResponse.json({ error: "Could not process image" }, { status: 400 });
    }

    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

    const { error: uploadErr } = await supabase.storage
      .from("flyers")
      .upload(fileName, imageBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("flyers").getPublicUrl(fileName);

    await supabase.from("flyers").insert({
      user_id: user.id,
      venue_id: venueId || null,
      event_name: eventName || "Untitled Flyer",
      venue_name: venueName || "",
      event_date: eventDate || null,
      theme: theme || null,
      image_path: fileName,
      copy_data: copyData || null,
    });

    return NextResponse.json({ success: true, imageUrl: urlData.publicUrl });
  } catch (err) {
    console.error("Flyer save error:", err);
    return NextResponse.json({ error: "Failed to save flyer" }, { status: 500 });
  }
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
