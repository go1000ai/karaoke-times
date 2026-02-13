import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { subscription, userId } = await req.json();

  if (!subscription || !userId) {
    return NextResponse.json({ error: "Missing subscription or userId" }, { status: 400 });
  }

  const supabase = await createClient();

  // Upsert the push subscription for this user
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      subscribed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
