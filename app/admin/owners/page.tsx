import { createClient } from "@/lib/supabase/server";
import { OwnersList } from "./OwnersList";

export default async function AdminOwnersPage() {
  const supabase = await createClient();

  // Get all venue owners
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at")
    .eq("role", "venue_owner")
    .order("created_at", { ascending: false });

  // Get venue counts per owner
  const { data: venues } = await supabase
    .from("venues")
    .select("id, owner_id, name");

  const venuesByOwner = new Map<string, { count: number; names: string[] }>();
  (venues ?? []).forEach((v) => {
    if (!v.owner_id) return;
    const existing = venuesByOwner.get(v.owner_id) || { count: 0, names: [] };
    existing.count++;
    existing.names.push(v.name);
    venuesByOwner.set(v.owner_id, existing);
  });

  // Get KJ counts per owner's venues
  const { data: staff } = await supabase
    .from("venue_staff")
    .select("venue_id, user_id")
    .not("accepted_at", "is", null);

  const venueIdToOwner = new Map<string, string>();
  (venues ?? []).forEach((v) => {
    if (v.owner_id) venueIdToOwner.set(v.id, v.owner_id);
  });

  const kjCountByOwner = new Map<string, number>();
  (staff ?? []).forEach((s) => {
    const ownerId = venueIdToOwner.get(s.venue_id);
    if (ownerId) {
      kjCountByOwner.set(ownerId, (kjCountByOwner.get(ownerId) || 0) + 1);
    }
  });

  const owners = (profiles ?? []).map((p) => ({
    ...p,
    display_name: p.display_name as string | null,
    venueCount: venuesByOwner.get(p.id)?.count || 0,
    venueNames: venuesByOwner.get(p.id)?.names || [],
    kjCount: kjCountByOwner.get(p.id) || 0,
  }));

  return <OwnersList owners={owners} />;
}
