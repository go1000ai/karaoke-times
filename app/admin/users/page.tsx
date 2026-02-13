import { createClient } from "@/lib/supabase/server";
import { UsersList } from "./UsersList";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false });

  // Get KJ user IDs (users with accepted venue_staff records)
  const { data: kjStaff } = await supabase
    .from("venue_staff")
    .select("user_id")
    .not("accepted_at", "is", null);

  const kjUserIds = new Set((kjStaff ?? []).map((s) => s.user_id));

  const users = (profiles ?? []).map((p) => ({
    ...p,
    display_name: p.display_name as string | null,
    role: p.role as string,
    isKJ: kjUserIds.has(p.id),
  }));

  return <UsersList users={users} />;
}
