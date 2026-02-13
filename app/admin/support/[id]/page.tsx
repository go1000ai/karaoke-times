import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TicketDetail } from "./TicketDetail";

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, user_id, subject, description, status, priority, category, assigned_to, resolved_at, created_at, updated_at, profiles(display_name, avatar_url)")
    .eq("id", id)
    .single();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_id, message, is_admin, created_at, profiles(display_name)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return (
    <TicketDetail
      ticket={ticket as any}
      messages={(messages ?? []) as any[]}
    />
  );
}
