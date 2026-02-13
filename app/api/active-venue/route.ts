import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const venueId = cookieStore.get("active_venue_id")?.value || null;
  return NextResponse.json({ venueId });
}

export async function POST(req: NextRequest) {
  const { venueId } = await req.json();
  if (!venueId) {
    return NextResponse.json({ error: "Missing venueId" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set("active_venue_id", venueId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return NextResponse.json({ ok: true });
}
