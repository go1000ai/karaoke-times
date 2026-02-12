import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { testToastConnection } from "@/lib/toast-api";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { clientId, clientSecret, restaurantGuid } = await request.json();

  if (!clientId || !clientSecret || !restaurantGuid) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const result = await testToastConnection({
    clientId,
    clientSecret,
    restaurantGuid,
  });

  return NextResponse.json(result);
}
