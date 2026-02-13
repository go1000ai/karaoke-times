"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function DashboardRemindersPage() {
  const { user } = useAuth();
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons-round text-accent text-2xl">notifications_active</span>
        <h1 className="text-2xl font-extrabold text-white">My Reminders</h1>
      </div>
      <p className="text-sm text-text-secondary mb-6">
        Calendar reminders for your favorite karaoke nights.
      </p>

      {/* Info banner */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-start gap-3">
        <span className="material-icons-round text-primary text-xl flex-shrink-0 mt-0.5">info</span>
        <p className="text-xs text-text-secondary leading-relaxed">
          Tap <strong className="text-white">Remind Me</strong> on any venue page and choose
          Google Calendar, Outlook, or Apple Calendar. Your reminders will show up here.
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
                    <p className="text-xs text-text-secondary truncate">{reminder.venue_name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <span className="material-icons-round text-xs">calendar_today</span>
                      Every {reminder.day_of_week}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <span className="material-icons-round text-xs">schedule</span>
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
                    <span className="material-icons-round text-lg">delete_outline</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-icons-round text-4xl text-text-muted mb-3 block">notifications_none</span>
          <h2 className="text-base font-bold text-white mb-1">No reminders yet</h2>
          <p className="text-sm text-text-secondary mb-5">
            Browse venues and set calendar reminders for karaoke nights you don&apos;t want to miss!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            <span className="material-icons-round text-lg">explore</span>
            Explore Venues
          </Link>
        </div>
      )}
    </div>
  );
}
