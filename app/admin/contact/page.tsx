import { createClient } from "@/lib/supabase/server";
import { MessagesList } from "./MessagesList";

export default async function AdminContactPage() {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("contact_messages")
    .select(
      "id, name, email, subject, message, status, created_at, ip_address"
    )
    .order("created_at", { ascending: false });

  const rows = messages ?? [];
  const newCount = rows.filter((m) => m.status === "new").length;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thisWeekCount = rows.filter((m) => m.created_at >= oneWeekAgo).length;

  return (
    <MessagesList
      messages={rows}
      newCount={newCount}
      thisWeekCount={thisWeekCount}
    />
  );
}
