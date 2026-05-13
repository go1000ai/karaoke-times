import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { UserProfileEditor } from "./UserProfileEditor";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, role, address, phone, website, social_links, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Email lives in auth.users — fetch via admin client (service role)
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authUserData } = await adminSupabase.auth.admin.getUserById(id);
  const email = authUserData?.user?.email ?? null;
  const lastSignIn = authUserData?.user?.last_sign_in_at ?? null;

  // KJ status (accepted venue_staff record)
  const { data: staffRows } = await supabase
    .from("venue_staff")
    .select("venue_id, role, accepted_at, venues(id, name)")
    .eq("user_id", id);

  const isKJ = (staffRows ?? []).some((s) => s.accepted_at !== null);

  // Owned venues
  const { data: ownedVenues } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", id);

  // Queue stats — songs ever submitted
  const { count: songsRequested } = await supabase
    .from("song_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id);

  return (
    <div>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-white transition-colors"
        >
          <span className="material-icons-round text-base">arrow_back</span>
          All Users
        </Link>
      </div>

      <UserProfileEditor
        profile={{
          id: profile.id,
          display_name: (profile.display_name as string | null) ?? null,
          avatar_url: (profile.avatar_url as string | null) ?? null,
          role: profile.role as string,
          address: (profile.address as string | null) ?? null,
          phone: (profile.phone as string | null) ?? null,
          website: (profile.website as string | null) ?? null,
          social_links: (profile.social_links as Record<string, string> | null) ?? {},
          created_at: profile.created_at as string,
          updated_at: profile.updated_at as string,
          email,
          last_sign_in_at: lastSignIn,
          isKJ,
        }}
        ownedVenues={(ownedVenues ?? []).map((v) => ({ id: v.id as string, name: v.name as string }))}
        staffVenues={(staffRows ?? [])
          .filter((s) => s.accepted_at !== null)
          .map((s) => {
            const v = s.venues as unknown as { id: string; name: string } | null;
            return v ? { id: v.id, name: v.name } : null;
          })
          .filter((v): v is { id: string; name: string } => v !== null)}
        songsRequested={songsRequested ?? 0}
      />
    </div>
  );
}
