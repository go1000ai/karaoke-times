import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FlyerRequest, FlyerResponse, N8nWebhookResponse } from "@/lib/flyer";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body: FlyerRequest = await request.json();

  if (!body.eventName || !body.eventDate || !body.startTime) {
    return NextResponse.json(
      { success: false, error: "Event name, date, and start time are required" },
      { status: 400 }
    );
  }

  // Verify user is a venue owner or KJ (same logic as requireVenueOwner)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isOwner = profile?.role === "venue_owner";

  if (!isOwner) {
    const { data: staffRecord } = await supabase
      .from("venue_staff")
      .select("id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .limit(1)
      .single();

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, error: "Only venue owners and KJs can generate flyers" },
        { status: 403 }
      );
    }
  }

  // Send to n8n webhook
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    // Mock mode for development — return a placeholder
    return NextResponse.json({
      success: true,
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080&h=1350&fit=crop",
    } satisfies FlyerResponse);
  }

  try {
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        userId: user.id,
        generatedAt: new Date().toISOString(),
      }),
    });

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text().catch(() => "Unknown error");
      console.error("n8n webhook error:", n8nResponse.status, errText);
      return NextResponse.json(
        { success: false, error: "Flyer generation service returned an error" },
        { status: 502 }
      );
    }

    const n8nResult: N8nWebhookResponse = await n8nResponse.json();

    if (!n8nResult.success || n8nResult.error) {
      return NextResponse.json(
        { success: false, error: n8nResult.error || "Flyer generation failed" },
        { status: 500 }
      );
    }

    const response: FlyerResponse = {
      success: true,
      imageUrl: n8nResult.imageUrl,
      imageBase64: n8nResult.imageBase64,
      copyData: n8nResult.copyData,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Flyer generation error:", err);
    return NextResponse.json(
      { success: false, error: "Could not reach the flyer generation service" },
      { status: 502 }
    );
  }
}
