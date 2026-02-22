import { createClient } from "@/lib/supabase/server";
import { NewsletterForm } from "./NewsletterForm";

export default async function AdminNewsletterPage() {
  const supabase = await createClient();

  const { data: pastNewsletters } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  return (
    <NewsletterForm
      pastNewsletters={pastNewsletters ?? []}
      totalUsers={count ?? 0}
    />
  );
}
