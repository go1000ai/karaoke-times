import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "./AnnouncementForm";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  // Get past announcements
  const { data: announcements } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, is_read, created_at, data")
    .eq("type", "announcement")
    .order("created_at", { ascending: false })
    .limit(50);

  // Group by title + created_at (same batch)
  const grouped: Record<string, { title: string; message: string; created_at: string; audience: string; total: number; read: number }> = {};
  (announcements ?? []).forEach((a: any) => {
    const key = `${a.title}||${a.created_at?.slice(0, 16)}`;
    if (!grouped[key]) {
      grouped[key] = {
        title: a.title,
        message: a.message,
        created_at: a.created_at,
        audience: a.data?.audience || "all",
        total: 0,
        read: 0,
      };
    }
    grouped[key].total++;
    if (a.is_read) grouped[key].read++;
  });

  const pastAnnouncements = Object.values(grouped).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return <AnnouncementForm pastAnnouncements={pastAnnouncements} />;
}
