import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Auth check — only logged-in users can search YouTube
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const YouTube = (await import("youtube-sr")).default;
    const results = await YouTube.search(`${query} karaoke`, { limit: 8, type: "video" });

    const videos = results.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail?.url || null,
      duration: v.durationFormatted,
      channel: v.channel?.name || "",
    }));

    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ videos: [] });
  }
}
