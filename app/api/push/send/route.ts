import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

// Configure VAPID (only if env vars are set)
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:hello@karaoketimes.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(req: NextRequest) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  const { userId, title, body, url, tag } = await req.json();

  if (!userId || !body) {
    return NextResponse.json({ error: "Missing userId or body" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get user's push subscription
  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("user_id", userId)
    .single();

  if (!sub) {
    return NextResponse.json({ error: "No push subscription found for user" }, { status: 404 });
  }

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: sub.keys,
  };

  const payload = JSON.stringify({
    title: title || "Karaoke Times",
    body,
    url: url || "/dashboard/my-queue",
    tag: tag || "queue-update",
  });

  try {
    await webpush.sendNotification(pushSubscription, payload);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Push failed";
    // If subscription is expired/invalid, clean it up
    if (message.includes("410") || message.includes("404")) {
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
