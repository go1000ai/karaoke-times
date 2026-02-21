"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { AddToCalendar } from "@/components/AddToCalendar";

interface Reminder {
  id: string;
  venue_id: string;
  event_name: string;
  venue_name: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    loadReminders();
  }, [user]);

  async function loadReminders() {
    const { data } = await supabase
      .from("event_reminders")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setReminders(data || []);
    setLoading(false);
  }

  async function deleteReminder(id: string) {
    await supabase.from("event_reminders").delete().eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
        <div className="max-w-md mx-auto pt-24 px-5 text-center">
          <span className="material-icons-round text-5xl text-text-muted mb-4 block">
            notifications_off
          </span>
          <h1 className="text-xl font-bold text-white mb-2">
            Sign in for Reminders
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Get calendar reminders for your favorite karaoke nights.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-2xl"
          >
            Sign In
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-lg mx-auto pt-20 px-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="material-icons-round text-accent text-2xl">
            notifications_active
          </span>
          <h1 className="text-xl font-extrabold text-white">My Reminders</h1>
        </div>

        {/* Info banner */}
        <div className="glass-card rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="material-icons-round text-primary text-xl flex-shrink-0 mt-0.5">
            info
          </span>
          <p className="text-xs text-text-secondary leading-relaxed">
            Tap <strong className="text-white">Remind Me</strong> on any venue
            page and choose Google Calendar, Outlook, or Apple Calendar.
            Your reminders will show up here.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : reminders.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/venue/${reminder.venue_id}`}
                      className="text-sm font-bold text-white hover:text-primary transition-colors truncate block"
                    >
                      {reminder.event_name}
                    </Link>
                    {reminder.venue_name && (
                      <p className="text-xs text-text-secondary truncate">
                        {reminder.venue_name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <span className="material-icons-round text-xs">
                          calendar_today
                        </span>
                        Every {reminder.day_of_week}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <span className="material-icons-round text-xs">
                          schedule
                        </span>
                        {reminder.start_time}
                        {reminder.end_time ? ` – ${reminder.end_time}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <AddToCalendar
                      title={reminder.event_name}
                      venueId={reminder.venue_id}
                      venueName={reminder.venue_name || undefined}
                      location={reminder.location || undefined}
                      dayOfWeek={reminder.day_of_week}
                      startTime={reminder.start_time}
                      endTime={reminder.end_time || ""}
                      compact
                    />
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-text-muted hover:text-red-400 transition-colors"
                      title="Remove reminder"
                    >
                      <span className="material-icons-round text-lg">
                        delete_outline
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center">
            <span className="material-icons-round text-4xl text-text-muted mb-3 block">
              notifications_none
            </span>
            <h2 className="text-base font-bold text-white mb-1">
              No reminders yet
            </h2>
            <p className="text-sm text-text-secondary mb-5">
              Browse venues and set calendar reminders for karaoke nights you
              don&apos;t want to miss!
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              <span className="material-icons-round text-lg">map</span>
              View Map
            </Link>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
