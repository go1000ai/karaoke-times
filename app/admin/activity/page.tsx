import { createClient } from "@/lib/supabase/server";
import { ActivityLog } from "./ActivityLog";

export default async function AdminActivityPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("admin_activity_log")
    .select("id, admin_id, action, target_type, target_id, details, created_at, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return <ActivityLog logs={(logs ?? []) as any[]} />;
}
