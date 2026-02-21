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

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

function getTodayDayName(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export default function DashboardRemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const supabase = createClient();
  const today = getTodayDayName();

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

  // Group reminders by day of week
  const remindersByDay: Record<string, Reminder[]> = {};
  for (const day of WEEK_DAYS) {
    remindersByDay[day] = [];
  }
  for (const r of reminders) {
    const day = WEEK_DAYS.find((d) => r.day_of_week.toLowerCase().includes(d.toLowerCase()));
    if (day) {
      remindersByDay[day].push(r);
    }
  }

  // Filter list if a day is selected
  const displayedReminders = selectedDay
    ? reminders.filter((r) => {
        const day = WEEK_DAYS.find((d) => r.day_of_week.toLowerCase().includes(d.toLowerCase()));
        return day === selectedDay;
      })
    : reminders;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="material-icons-round text-accent text-2xl">notifications_active</span>
        <h1 className="text-2xl font-extrabold text-white">My Reminders</h1>
      </div>
      <p className="text-sm text-text-secondary mb-6">
        Calendar reminders for your favorite karaoke nights.
      </p>

      {/* Weekly Calendar Strip */}
      {!loading && reminders.length > 0 && (
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-round text-primary text-lg">date_range</span>
            <h3 className="text-sm font-bold text-white">My Week</h3>
            {selectedDay && (
              <button
                onClick={() => setSelectedDay(null)}
                className="ml-auto text-xs text-primary font-semibold hover:underline"
              >
                Show All
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEK_DAYS.map((day) => {
              const dayReminders = remindersByDay[day];
              const isToday = day === today;
              const hasEvents = dayReminders.length > 0;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`flex flex-col items-center rounded-xl py-2.5 px-1 transition-all ${
                    isSelected
                      ? "bg-primary/20 border border-primary/40"
                      : isToday
                      ? "bg-accent/10 border border-accent/30"
                      : hasEvents
                      ? "bg-card-dark border border-border hover:border-primary/30"
                      : "bg-transparent border border-transparent"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      isSelected
                        ? "text-primary"
                        : isToday
                        ? "text-accent"
                        : "text-text-muted"
                    }`}
                  >
                    {DAY_SHORT[day]}
                  </span>

                  {hasEvents ? (
                    <div className="flex flex-col items-center gap-0.5">
                      {dayReminders.length <= 2 ? (
                        dayReminders.map((r) => (
                          <div
                            key={r.id}
                            className={`w-2 h-2 rounded-full ${
                              isToday ? "bg-accent" : "bg-primary"
                            }`}
                          />
                        ))
                      ) : (
                        <>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isToday ? "bg-accent" : "bg-primary"
                            }`}
                          />
                          <span className="text-[9px] text-text-muted font-bold">
                            +{dayReminders.length - 1}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border/30" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day detail strip */}
          {selectedDay && remindersByDay[selectedDay].length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {remindersByDay[selectedDay].map((r) => (
                <Link
                  key={r.id}
                  href={`/venue/${r.venue_id}`}
                  className="flex items-center gap-2 text-xs group"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    selectedDay === today ? "bg-accent" : "bg-primary"
                  }`} />
                  <span className="text-white font-semibold group-hover:text-primary transition-colors truncate">
                    {r.venue_name || r.event_name}
                  </span>
                  <span className="text-text-muted ml-auto flex-shrink-0">
                    {r.start_time}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

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
      ) : displayedReminders.length > 0 ? (
        <div className="space-y-3">
          {selectedDay && (
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">
              {selectedDay} reminders ({displayedReminders.length})
            </p>
          )}
          {displayedReminders.map((reminder) => (
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
                      {reminder.end_time ? ` \u2013 ${reminder.end_time}` : ""}
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
      ) : reminders.length > 0 && selectedDay ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <span className="material-icons-round text-3xl text-text-muted mb-2 block">event_busy</span>
          <p className="text-text-secondary text-sm">
            No karaoke nights on {selectedDay}. Try another day!
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-icons-round text-4xl text-text-muted mb-3 block">notifications_none</span>
          <h2 className="text-base font-bold text-white mb-1">No reminders yet</h2>
          <p className="text-sm text-text-secondary mb-5">
            Browse venues and set calendar reminders for karaoke nights you don&apos;t want to miss!
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
  );
}
