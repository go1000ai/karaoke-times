"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadICSFile,
} from "@/lib/calendar";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface AddToCalendarProps {
  title: string;
  venueId?: string;
  venueName?: string;
  description?: string;
  location?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

export function AddToCalendar({
  title,
  venueId,
  venueName,
  description,
  location,
  dayOfWeek,
  startTime,
  endTime,
  compact = false,
}: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const event = { title, description, location, dayOfWeek, startTime, endTime };

  async function saveReminder() {
    if (!user || !venueId) return;
    const supabase = createClient();
    await supabase.from("event_reminders").upsert(
      {
        user_id: user.id,
        venue_id: venueId,
        event_name: title,
        venue_name: venueName || null,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime || null,
        location: location || null,
        email: user.email || "",
      },
      { onConflict: "user_id,venue_id,day_of_week" }
    );
  }

  async function handleSendEmail() {
    if (!email) return;
    setSending(true);
    try {
      const res = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          eventTitle: title,
          venueName,
          dayOfWeek,
          startTime,
          endTime,
          location,
        }),
      });
      if (res.ok) {
        if (user && venueId) {
          const supabase = createClient();
          await supabase.from("event_reminders").upsert(
            {
              user_id: user.id,
              venue_id: venueId,
              event_name: title,
              venue_name: venueName || null,
              day_of_week: dayOfWeek,
              start_time: startTime,
              end_time: endTime || null,
              location: location || null,
              email,
            },
            { onConflict: "user_id,venue_id,day_of_week" }
          );
        }
        setSent(true);
        setTimeout(() => {
          setShowEmailForm(false);
          setSent(false);
          setEmail("");
          setOpen(false);
        }, 2000);
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  const modal = open && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal content — slides up from bottom on mobile, centered on desktop */}
      <div className="relative w-full sm:w-80 sm:rounded-2xl rounded-t-2xl bg-card-dark border border-border shadow-2xl shadow-black/50 animate-[slideUp_0.2s_ease-out] sm:animate-[fadeSlideUp_0.15s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-icons-round text-primary text-lg">calendar_month</span>
            Add to Calendar
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <span className="material-icons-round text-text-muted text-lg">close</span>
          </button>
        </div>

        {/* Options */}
        <div className="py-1">
          {/* Google Calendar */}
          <a
            href={getGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { saveReminder(); setOpen(false); }}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm text-white font-medium">Google Calendar</span>
          </a>

          {/* Outlook */}
          <a
            href={getOutlookCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { saveReminder(); setOpen(false); }}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors border-t border-border/30"
          >
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.583a.788.788 0 01-.576.238H8.822v-4.85L24 7.387z" />
              <path fill="#0364B8" d="M8.822 4.852h14.364c.23 0 .424.08.576.238.159.159.238.352.238.583V7.39L8.822 13.836V4.852z" />
              <path fill="#28A8EA" d="M24 7.387l-15.178 6.45L24 17.648v.455c0 .23-.08.424-.238.583a.788.788 0 01-.576.238H8.822L7.2 16.726l1.622-2.89L24 7.387z" />
              <path fill="#0078D4" d="M8.822 4.852v13.072H1.614A.793.793 0 011.04 17.687a.77.77 0 01-.24-.579V7.64c0-.344.114-.638.341-.882a1.196 1.196 0 01.844-.384l.037-.001h6.8z" />
              <path fill="#0A2767" opacity=".5" d="M13.622 8.426v8.676a.61.61 0 01-.378.564.584.584 0 01-.232.046H8.822v-5.876L7.2 16.726l1.622-2.89V9.574l4.8-1.148z" />
            </svg>
            <span className="text-sm text-white font-medium">Outlook</span>
          </a>

          {/* Apple Calendar / .ics Download */}
          <button
            onClick={() => {
              downloadICSFile(event);
              saveReminder();
              setOpen(false);
            }}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors border-t border-border/30 w-full text-left"
          >
            <span className="material-icons-round text-white/70 text-2xl flex-shrink-0">
              event
            </span>
            <span className="text-sm text-white font-medium">
              Apple / Download .ics
            </span>
          </button>

          {/* Email Reminder */}
          <div className="border-t border-border/30">
            {sent ? (
              <div className="flex items-center gap-4 px-5 py-3.5 text-green-400">
                <span className="material-icons-round text-2xl flex-shrink-0">check_circle</span>
                <span className="text-sm font-medium">Reminder saved!</span>
              </div>
            ) : showEmailForm ? (
              <div className="px-5 py-3.5 space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full bg-white/5 border border-border rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !email}
                  className="w-full bg-primary/10 text-primary text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {sending ? "Saving..." : "Get Reminders (24h & 4h before)"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (user) {
                    setSending(true);
                    saveReminder().then(() => {
                      setSent(true);
                      setTimeout(() => {
                        setSent(false);
                        setOpen(false);
                      }, 2000);
                    }).finally(() => setSending(false));
                  } else {
                    setShowEmailForm(true);
                  }
                }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors w-full text-left"
              >
                <span className="material-icons-round text-primary text-2xl flex-shrink-0">email</span>
                <div>
                  <span className="text-sm text-white font-medium block">Email Reminders</span>
                  <span className="text-[11px] text-text-muted">Get notified 24h & 4h before</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Safe area padding for mobile bottom */}
        <div className="h-2 sm:hidden" />
      </div>
    </div>,
    document.body
  );

  return (
    <div className="inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={
          compact
            ? "flex items-center gap-1 text-primary text-xs font-semibold hover:text-primary/80 transition-colors"
            : "flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
        }
      >
        <span className="material-icons-round text-sm">calendar_month</span>
        {compact ? "Remind Me" : "Add to Calendar"}
      </button>
      {modal}
    </div>
  );
}
