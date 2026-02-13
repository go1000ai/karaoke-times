import { createClient } from "@/lib/supabase/server";
import { PromosList } from "./PromosList";

export default async function AdminPromosPage() {
  const supabase = await createClient();

  const { data: promos } = await supabase
    .from("venue_promos")
    .select("id, venue_id, title, description, start_date, end_date, is_active, created_at, venues(name)")
    .order("created_at", { ascending: false });

  return <PromosList promos={(promos ?? []) as any[]} />;
}
