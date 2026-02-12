import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncToastMenu } from "@/lib/toast-api";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { venueId } = await request.json();

  if (!venueId) {
    return NextResponse.json(
      { error: "Venue ID is required" },
      { status: 400 }
    );
  }

  // Verify user owns this venue
  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .single();

  if (!venue) {
    return NextResponse.json(
      { error: "You don't own this venue" },
      { status: 403 }
    );
  }

  // Get the Toast integration credentials
  const { data: integration } = await supabase
    .from("venue_integrations")
    .select("client_id, client_secret, restaurant_guid")
    .eq("venue_id", venueId)
    .eq("provider", "toast")
    .eq("is_active", true)
    .single();

  if (!integration) {
    return NextResponse.json(
      { error: "No active Toast integration found. Connect Toast first." },
      { status: 404 }
    );
  }

  // Use admin client for writing menu items (bypasses RLS for the sync)
  const { createClient: createAdminClient } = await import(
    "@supabase/supabase-js"
  );
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const result = await syncToastMenu(
    venueId,
    {
      clientId: integration.client_id,
      clientSecret: integration.client_secret,
      restaurantGuid: integration.restaurant_guid,
    },
    adminSupabase
  );

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Synced ${result.itemCount} menu items from Toast.`,
    itemCount: result.itemCount,
  });
}
