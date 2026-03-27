import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  category?: string;
}

export async function POST(req: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  try {
    const formData = await req.formData();
    const venueId = formData.get("venueId") as string | null;
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No images uploaded" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Vision API not configured" }, { status: 503 });
    }

    // Convert uploaded files to base64
    const imageBlocks: Anthropic.Messages.ImageBlockParam[] = [];
    for (const file of files.slice(0, 5)) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      imageBlocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    }

    // Send to Claude Vision
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Look at these menu images from a restaurant/bar. Extract ALL menu items you can find. For each item, provide: name, price (keep original format like "2 for $10" or "$12.99"), description (if visible), and category (e.g. Appetizers, Wraps, Drinks, Entrees, Desserts, etc.).

Return ONLY a valid JSON array with no other text. Example:
[{"name":"Chicken Wings","price":"$12.99","description":"Crispy wings with buffalo sauce","category":"Appetizers"}]

If no menu items are visible, return: []
Important: Only extract actual food/drink menu items. Do not make up items.`,
            },
          ],
        },
      ],
    });

    // Parse response
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ items: [], saved: false, count: 0 });
    }

    const menuItems: MenuItem[] = JSON.parse(jsonMatch[0]).filter((item: MenuItem) => item.name);

    // Save to database if venueId provided
    if (venueId && menuItems.length > 0) {
      const { error: updateError } = await supabase
        .from("venues")
        .update({ menu_items: menuItems })
        .eq("id", venueId);

      if (updateError) {
        return NextResponse.json({ items: menuItems, saved: false, error: updateError.message });
      }
      return NextResponse.json({ items: menuItems, saved: true, count: menuItems.length });
    }

    return NextResponse.json({ items: menuItems, saved: false, count: menuItems.length });
  } catch (err) {
    console.error("Image menu extraction error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to extract menu from images" },
      { status: 500 }
    );
  }
}
