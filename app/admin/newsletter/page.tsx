import { createClient } from "@/lib/supabase/server";
import { NewsletterForm } from "./NewsletterForm";

export default async function AdminNewsletterPage() {
  const supabase = await createClient();

  const [{ data: pastNewsletters }, { count }, { data: drafts }] =
    await Promise.all([
      supabase
        .from("newsletters")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("newsletter_drafts")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

  return (
    <NewsletterForm
      pastNewsletters={pastNewsletters ?? []}
      totalUsers={count ?? 0}
      initialDrafts={drafts ?? []}
    />
  );
}
