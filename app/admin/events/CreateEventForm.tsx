"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent } from "../actions";
import {
  AGE_RESTRICTIONS,
  DRESS_CODES,
  COVER_CHARGES,
  DRINK_MINIMUMS,
  RESTRICTION_TAGS,
} from "@/lib/permissions";

interface Venue {
  id: string;
  name: string;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const RECURRENCE_OPTIONS = [
  { value: "weekly", label: "Every Week" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "one_time", label: "One-Time Event" },
];

// Generate time options in 30-min increments (12:00 PM → 4:00 AM)
const TIME_OPTIONS: string[] = [];
for (let h = 12; h <= 23; h++) {
  for (const m of [0, 30]) {
    const hour12 = h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? "PM" : "AM";
    TIME_OPTIONS.push(`${hour12}:${m === 0 ? "00" : "30"} ${ampm}`);
  }
}
for (let h = 0; h <= 4; h++) {
  for (const m of [0, 30]) {
    if (h === 0) {
      TIME_OPTIONS.push(`12:${m === 0 ? "00" : "30"} AM`);
    } else {
      TIME_OPTIONS.push(`${h}:${m === 0 ? "00" : "30"} AM`);
    }
    if (h === 4 && m === 0) break;
  }
}

export function CreateEventForm({ venues }: { venues: Venue[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string; flyerUrl?: string } | null>(null);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  const selectClass =
    "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50";
  const inputClass =
    "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted";
  const labelClass = "text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block";

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    formData.set("restrictions", JSON.stringify(selectedRestrictions));

    startTransition(async () => {
      const result = await createEvent({
        venue_id: formData.get("venue_id") as string,
        day_of_week: formData.get("day_of_week") as string,
        event_name: (formData.get("event_name") as string) || "",
        dj: (formData.get("dj") as string) || "",
        start_time: (formData.get("start_time") as string) || "",
        end_time: (formData.get("end_time") as string) || "",
        notes: (formData.get("notes") as string) || "",
        recurrence_type: (formData.get("recurrence_type") as string) || "weekly",
        event_date: (formData.get("event_date") as string) || "",
        happy_hour_details: (formData.get("happy_hour_details") as string) || "",
        age_restriction: (formData.get("age_restriction") as string) || "all_ages",
        dress_code: (formData.get("dress_code") as string) || "casual",
        cover_charge: (formData.get("cover_charge") as string) || "free",
        drink_minimum: (formData.get("drink_minimum") as string) || "none",
        restrictions: selectedRestrictions,
      });
      if (result.success) {
        const flyerParams = new URLSearchParams({
          eventName: (formData.get("event_name") as string) || "Karaoke Night",
          startTime: (formData.get("start_time") as string) || "",
          endTime: (formData.get("end_time") as string) || "",
        });
        const dj = formData.get("dj") as string;
        const notes = formData.get("notes") as string;
        const happyHour = formData.get("happy_hour_details") as string;
        if (dj) flyerParams.set("dj", dj);
        if (notes) flyerParams.set("notes", notes);
        if (happyHour) flyerParams.set("drinkSpecials", happyHour);

        setFeedback({
          type: "success",
          text: "Event created!",
          flyerUrl: `/dashboard/flyers?${flyerParams.toString()}`,
        });
        setSelectedRestrictions([]);
        router.refresh();
      } else {
        setFeedback({ type: "error", text: result.error || "Failed to create event" });
      }
    });
  }

  return (
    <div className="glass-card rounded-2xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-icons-round text-red-400">add_circle</span>
          <h2 className="text-lg font-bold text-white">Create New Event</h2>
        </div>
        <span className={`material-icons-round text-text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="border-t border-border/20 p-5">
          <form action={handleSubmit} className="space-y-4">
            {/* Venue & Day */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Venue *</label>
                <select name="venue_id" required className={selectClass}>
                  <option value="">Select venue...</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Day of Week *</label>
                <select name="day_of_week" required className={selectClass}>
                  <option value="">Select day...</option>
                  {DAY_ORDER.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Name & KJ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event Name</label>
                <input name="event_name" type="text" placeholder="e.g. Karaoke Night" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>KJ / DJ</label>
                <input name="dj" type="text" placeholder="e.g. DJ Mike" className={inputClass} />
              </div>
            </div>

            {/* Start Time, End Time, Recurrence */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Start Time *</label>
                <select name="start_time" required className={selectClass}>
                  <option value="">Select time...</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={`start-${t}`} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>End Time *</label>
                <select name="end_time" required className={selectClass}>
                  <option value="">Select time...</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={`end-${t}`} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Recurrence</label>
                <select name="recurrence_type" defaultValue="weekly" className={selectClass}>
                  {RECURRENCE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Date & Happy Hour */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event Date</label>
                <input name="event_date" type="date" className={`${inputClass} [color-scheme:dark]`} />
              </div>
              <div>
                <label className={labelClass}>Happy Hour</label>
                <input name="happy_hour_details" type="text" placeholder="e.g. $3 wells before 9PM" className={inputClass} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                name="notes"
                placeholder="Special details, drink specials, etc."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Event Rules */}
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="material-icons-round text-base text-red-400">rule</span>
                Event Rules
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Age Restriction</label>
                  <select name="age_restriction" defaultValue="all_ages" className={selectClass}>
                    {AGE_RESTRICTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Dress Code</label>
                  <select name="dress_code" defaultValue="casual" className={selectClass}>
                    {DRESS_CODES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Cover Charge</label>
                  <select name="cover_charge" defaultValue="free" className={selectClass}>
                    {COVER_CHARGES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Drink Minimum</label>
                  <select name="drink_minimum" defaultValue="none" className={selectClass}>
                    {DRINK_MINIMUMS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Restriction tags */}
              <div className="mt-4">
                <label className={labelClass}>Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {RESTRICTION_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedRestrictions((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                        selectedRestrictions.includes(tag)
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "bg-white/5 border-border text-text-muted hover:border-text-secondary"
                      }`}
                    >
                      {selectedRestrictions.includes(tag) && <span className="mr-0.5">&#10003;</span>}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {feedback && (
              <div className={`rounded-xl p-3 text-sm ${feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                <div className="flex items-center justify-between">
                  <span>{feedback.text}</span>
                  {feedback.flyerUrl && (
                    <Link
                      href={feedback.flyerUrl}
                      className="inline-flex items-center gap-1.5 text-accent font-bold text-xs hover:text-accent/80 transition-colors ml-3"
                    >
                      <span className="material-icons-round text-sm">auto_awesome</span>
                      Create Flyer
                    </Link>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
