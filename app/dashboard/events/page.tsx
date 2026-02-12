import { requireVenueOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  const user = await requireVenueOwner();
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { data: events } = await supabase
    .from("venue_events")
    .select("*")
    .eq("venue_id", venue?.id || "")
    .order("day_of_week");

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Bi-Monthly Sundays"];

  const sortedEvents = (events ?? []).sort(
    (a: { day_of_week: string }, b: { day_of_week: string }) =>
      dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Events</h1>
      <p className="text-text-secondary text-sm mb-8">Manage your karaoke event nights.</p>

      {sortedEvents.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <span className="material-icons-round text-5xl text-text-muted mb-3">event</span>
          <p className="text-text-secondary">No events scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event: Record<string, string | boolean>) => (
            <div key={event.id as string} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {event.day_of_week as string}
                    </span>
                    {event.is_active ? (
                      <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <h3 className="text-white font-bold">{event.event_name as string || "Karaoke Night"}</h3>
                  <p className="text-text-secondary text-sm mt-1">
                    {event.start_time as string} — {event.end_time as string}
                  </p>
                  {event.dj && (
                    <p className="text-text-muted text-xs mt-1">
                      <span className="material-icons-round text-xs align-middle mr-1">headphones</span>
                      {event.dj as string}
                    </p>
                  )}
                  {event.notes && (
                    <p className="text-text-muted text-xs mt-1">{event.notes as string}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
