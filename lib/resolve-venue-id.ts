import { createClient } from "@/lib/supabase/client";

/**
 * Resolves a venue name to its Supabase UUID.
 * Mock-data uses string IDs like "fusion-east-monday" while Supabase uses UUIDs.
 * This looks up the venue by name and returns the UUID.
 */
export async function resolveVenueId(venueName: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("venues")
    .select("id")
    .ilike("name", venueName.trim())
    .limit(1)
    .single();

  return data?.id ?? null;
}
