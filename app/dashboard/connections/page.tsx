import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardVenue } from "@/lib/get-dashboard-venue";
import { VenueSelector } from "../VenueSelector";
import Link from "next/link";

export default async function ConnectionsPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { venue: activeVenue, isOwner, allVenues } = await getDashboardVenue(user.id);

  // If owner, show their owned venue (owners don't have "connections" the same way)
  if (isOwner) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Your Venue</h1>
        <p className="text-text-secondary text-sm mb-8">
          You own this venue. Manage it from the dashboard.
        </p>
        {activeVenue ? (
          <div className="glass-card rounded-2xl p-6 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-primary text-3xl">storefront</span>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{activeVenue.name}</p>
                <p className="text-xs text-primary font-semibold">Owner</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-text-muted">No venue linked to your account.</p>
        )}
      </div>
    );
  }

  // KJ: get full venue details for each connection
  const { data: staffRecords } = await supabase
    .from("venue_staff")
    .select("id, venue_id, role, accepted_at, venues(id, name, address, city, neighborhood)")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null);

  const connections = (staffRecords ?? []).map((s) => ({
    staffId: s.id,
    role: s.role,
    acceptedAt: s.accepted_at,
    venue: s.venues as unknown as {
      id: string;
      name: string;
      address: string;
      city: string;
      neighborhood: string;
    },
  })).filter((c) => c.venue);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Connections</h1>
      <p className="text-text-secondary text-sm mb-8">
        Venues you&apos;re connected to as a KJ. The active venue is highlighted.
      </p>

      {connections.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-icons-round text-5xl text-text-muted mb-3">hub</span>
          <h2 className="text-lg font-bold text-white mb-2">No Connections Yet</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            You haven&apos;t been connected to any venues. Ask a bar owner to invite you from their
            Staff &amp; KJs page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => {
            const isActive = activeVenue?.id === conn.venue.id;
            return (
              <div
                key={conn.staffId}
                className={`glass-card rounded-2xl p-5 transition-all ${
                  isActive ? "border-primary/40 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-primary/20" : "bg-white/5"
                    }`}
                  >
                    <span
                      className={`material-icons-round text-2xl ${
                        isActive ? "text-primary" : "text-text-muted"
                      }`}
                    >
                      storefront
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white truncate">{conn.venue.name}</p>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      {conn.venue.address}
                      {conn.venue.neighborhood ? ` · ${conn.venue.neighborhood}` : ""}
                      {conn.venue.city ? `, ${conn.venue.city}` : ""}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      Role: <span className="text-text-secondary capitalize">{conn.role}</span>
                      {conn.acceptedAt && (
                        <>
                          {" · "}Connected{" "}
                          {new Date(conn.acceptedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/venue/${conn.venue.id}`}
                    className="text-text-muted hover:text-primary transition-colors flex-shrink-0"
                  >
                    <span className="material-icons-round">open_in_new</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Venue switcher if multiple connections */}
      {connections.length > 1 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-3">Switch Active Venue</h2>
          <p className="text-text-secondary text-sm mb-4">
            Select which venue you want to manage from the dashboard.
          </p>
          <VenueSelector venues={allVenues} activeVenueId={activeVenue?.id || ""} />
        </div>
      )}
    </div>
  );
}
