import { createClient } from "@/lib/supabase/server";
import { SponsorsList } from "./SponsorsList";

export default async function AdminSponsorsPage() {
  const supabase = await createClient();

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: false });

  return <SponsorsList sponsors={(sponsors ?? []) as any[]} />;
}
