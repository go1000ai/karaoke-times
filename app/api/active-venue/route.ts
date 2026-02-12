import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const venueId = cookieStore.get("active_venue_id")?.value || null;
  return NextResponse.json({ venueId });
}
