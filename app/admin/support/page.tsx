import { createClient } from "@/lib/supabase/server";
import { TicketsList } from "./TicketsList";

export default async function AdminSupportPage() {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, user_id, subject, description, status, priority, category, created_at, updated_at, profiles(display_name)")
    .order("created_at", { ascending: false });

  // Get last message for each ticket
  const { data: messages } = await supabase
    .from("support_messages")
    .select("ticket_id, message, is_admin, created_at")
    .order("created_at", { ascending: false });

  const lastMessageMap = new Map<string, { message: string; is_admin: boolean; created_at: string }>();
  (messages ?? []).forEach((m) => {
    if (!lastMessageMap.has(m.ticket_id)) {
      lastMessageMap.set(m.ticket_id, m);
    }
  });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const openCount = (tickets ?? []).filter((t) => t.status === "open").length;
  const thisWeekCount = (tickets ?? []).filter((t) => t.created_at >= oneWeekAgo).length;

  const ticketsWithLastMessage = (tickets ?? []).map((t: any) => ({
    ...t,
    lastMessage: lastMessageMap.get(t.id) || null,
  }));

  return (
    <TicketsList
      tickets={ticketsWithLastMessage}
      openCount={openCount}
      thisWeekCount={thisWeekCount}
    />
  );
}
