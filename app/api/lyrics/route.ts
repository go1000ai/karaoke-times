import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface LrcLibResult {
  id: number;
  trackName: string;
  artistName: string;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return NextResponse.json({ error: "Missing title or artist" }, { status: 400 });
  }

  try {
    // Try lrclib.net for synced lyrics first
    const lrcRes = await fetch(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
      { headers: { "User-Agent": "KaraokeTimes/1.0" }, next: { revalidate: 86400 } }
    );

    if (lrcRes.ok) {
      const data: LrcLibResult = await lrcRes.json();
      if (data.syncedLyrics || data.plainLyrics) {
        return NextResponse.json({
          synced: data.syncedLyrics || null,
          plain: data.plainLyrics || null,
          source: "lrclib",
        });
      }
    }

    // Fallback: search lrclib
    const searchRes = await fetch(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
      { headers: { "User-Agent": "KaraokeTimes/1.0" }, next: { revalidate: 86400 } }
    );

    if (searchRes.ok) {
      const results: LrcLibResult[] = await searchRes.json();
      const best = results.find((r) => r.syncedLyrics) || results[0];
      if (best) {
        return NextResponse.json({
          synced: best.syncedLyrics || null,
          plain: best.plainLyrics || null,
          source: "lrclib",
        });
      }
    }

    return NextResponse.json({ synced: null, plain: null, source: null });
  } catch {
    return NextResponse.json({ synced: null, plain: null, source: null });
  }
}
