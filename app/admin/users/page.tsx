import { createClient } from "@/lib/supabase/server";
import { UsersList } from "./UsersList";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Fetch all users with their auth email
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false });

  // Get emails from auth (via admin or profile join)
  // Since we can't access auth.users directly with anon key,
  // we'll display what we have from profiles
  const users = (profiles ?? []).map((p) => ({
    ...p,
    display_name: p.display_name as string | null,
    role: p.role as string,
  }));

  return <UsersList users={users} />;
}
