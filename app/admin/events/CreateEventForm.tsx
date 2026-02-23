"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent, createVenue } from "../actions";
import {
  AGE_RESTRICTIONS,
  DRESS_CODES,
  COVER_CHARGES,
  DRINK_MINIMUMS,
  RESTRICTION_TAGS,
} from "@/lib/permissions";
import { THEME_OPTIONS, FEATURE_OPTIONS } from "@/lib/flyer";

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

const COLOR_PRESETS = [
  { name: "Gold", hex: "#FFD700" },
  { name: "Hot Pink", hex: "#FF007A" },
  { name: "Neon Cyan", hex: "#00FFC2" },
  { name: "Royal Purple", hex: "#7B2FBE" },
  { name: "Fire Red", hex: "#FF2D00" },
  { name: "Electric Blue", hex: "#0066FF" },
  { name: "Lime Green", hex: "#39FF14" },
  { name: "Sunset Orange", hex: "#FF6B35" },
];

export function CreateEventForm({ venues: initialVenues }: { venues: Venue[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
    flyerUrl?: string;
    eventData?: { eventName: string; venueName: string; startTime: string; endTime: string; dj: string; notes: string; happyHour: string; dressCode: string; coverCharge: string };
  } | null>(null);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  // Inline venue creation
  const [venues, setVenues] = useState<Venue[]>(initialVenues);
  const [showNewVenue, setShowNewVenue] = useState(false);
  const [venueCreating, setVenueCreating] = useState(false);
  const [venueFeedback, setVenueFeedback] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState("");

  // Prompt generator state
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Flyer prompt extras (shown after event creation)
  const [promptTheme, setPromptTheme] = useState("");
  const [promptMood, setPromptMood] = useState("");
  const [promptColors, setPromptColors] = useState<string[]>([]);
  const [promptFeatures, setPromptFeatures] = useState<string[]>([]);

  const selectClass =
    "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50";
  const inputClass =
    "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted";
  const labelClass = "text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block";

  function handleVenueSelect(value: string) {
    if (value === "__new__") {
      setShowNewVenue(true);
      setSelectedVenueId("");
    } else {
      setShowNewVenue(false);
      setSelectedVenueId(value);
    }
  }

  async function handleCreateVenue(formData: FormData) {
    const name = (formData.get("new_venue_name") as string)?.trim();
    if (!name) return;

    setVenueCreating(true);
    setVenueFeedback(null);

    const result = await createVenue({
      name,
      address: (formData.get("new_venue_address") as string)?.trim() || "",
      city: (formData.get("new_venue_city") as string)?.trim() || "New York",
      state: (formData.get("new_venue_state") as string)?.trim() || "New York",
      neighborhood: (formData.get("new_venue_neighborhood") as string)?.trim() || "",
      cross_street: (formData.get("new_venue_cross_street") as string)?.trim() || "",
      phone: (formData.get("new_venue_phone") as string)?.trim() || "",
      website: (formData.get("new_venue_website") as string)?.trim() || null,
    });

    setVenueCreating(false);

    if (result.success && result.venueId) {
      const newVenue = { id: result.venueId, name };
      setVenues((prev) => [...prev, newVenue].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedVenueId(result.venueId);
      setShowNewVenue(false);
      setVenueFeedback(null);
      router.refresh();
    } else {
      setVenueFeedback(result.error || "Failed to create venue");
    }
  }

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    formData.set("restrictions", JSON.stringify(selectedRestrictions));

    const venueId = selectedVenueId || (formData.get("venue_id") as string);
    if (!venueId) {
      setFeedback({ type: "error", text: "Please select a venue" });
      return;
    }

    startTransition(async () => {
      const eventName = (formData.get("event_name") as string) || "Karaoke Night";
      const dj = (formData.get("dj") as string) || "";
      const startTime = (formData.get("start_time") as string) || "";
      const endTime = (formData.get("end_time") as string) || "";
      const notes = (formData.get("notes") as string) || "";
      const happyHour = (formData.get("happy_hour_details") as string) || "";
      const dressCode = (formData.get("dress_code") as string) || "casual";
      const coverCharge = (formData.get("cover_charge") as string) || "free";

      const result = await createEvent({
        venue_id: venueId,
        day_of_week: formData.get("day_of_week") as string,
        event_name: eventName,
        dj,
        start_time: startTime,
        end_time: endTime,
        notes,
        recurrence_type: (formData.get("recurrence_type") as string) || "weekly",
        event_date: (formData.get("event_date") as string) || "",
        happy_hour_details: happyHour,
        age_restriction: (formData.get("age_restriction") as string) || "all_ages",
        dress_code: dressCode,
        cover_charge: coverCharge,
        drink_minimum: (formData.get("drink_minimum") as string) || "none",
        restrictions: selectedRestrictions,
      });

      if (result.success) {
        const venueName = venues.find((v) => v.id === venueId)?.name || "";
        const flyerParams = new URLSearchParams({
          eventName,
          startTime,
          endTime,
        });
        if (dj) flyerParams.set("dj", dj);
        if (notes) flyerParams.set("notes", notes);
        if (happyHour) flyerParams.set("drinkSpecials", happyHour);

        setFeedback({
          type: "success",
          text: "Event created!",
          flyerUrl: `/dashboard/flyers?${flyerParams.toString()}`,
          eventData: { eventName, venueName, startTime, endTime, dj, notes, happyHour, dressCode, coverCharge },
        });
        setSelectedRestrictions([]);
        setGeneratedPrompt(null);
        setPromptTheme("");
        setPromptMood("");
        setPromptColors([]);
        setPromptFeatures([]);
        router.refresh();
      } else {
        setFeedback({ type: "error", text: result.error || "Failed to create event" });
      }
    });
  }

  function buildPrompt() {
    if (!feedback?.eventData) return;
    const { eventName, venueName, startTime, endTime, dj, notes, happyHour, dressCode, coverCharge } = feedback.eventData;

    const lines: string[] = [];

    lines.push(`Design a professional, eye-catching event flyer for "${eventName}" at ${venueName || "a karaoke venue"}.`);

    if (promptTheme) {
      lines.push(`Theme: ${promptTheme}.`);
    }
    if (promptMood) {
      lines.push(`Mood/atmosphere: ${promptMood}.`);
    }

    const timeParts: string[] = [];
    if (startTime) {
      timeParts.push(endTime ? `${startTime} - ${endTime}` : `Starting at ${startTime}`);
    }
    if (timeParts.length > 0) {
      lines.push(`The flyer should prominently display: ${timeParts.join(", ")}.`);
    }

    const colorNames = promptColors.map((hex) => {
      const preset = COLOR_PRESETS.find((c) => c.hex === hex);
      return preset ? preset.name : hex;
    });
    if (colorNames.length > 0) {
      lines.push(`Color palette: ${colorNames.join(", ")}. Use these as the dominant colors.`);
    }

    if (dressCode && dressCode !== "casual") {
      lines.push(`Dress code: ${dressCode}.`);
    }

    if (promptFeatures.length > 0) {
      lines.push(`Special features to highlight: ${promptFeatures.join(", ")}.`);
    }

    const specials: string[] = [];
    if (happyHour) specials.push(`Drink specials: ${happyHour}`);
    if (dj) specials.push(`KJ/DJ: ${dj}`);
    if (notes) specials.push(notes);
    if (specials.length > 0) {
      lines.push(`Include these details on the flyer: ${specials.join(". ")}.`);
    }

    if (coverCharge && coverCharge !== "free") {
      lines.push(`Cover charge: ${coverCharge}.`);
    }

    lines.push("Style: Bold typography, vibrant nightlife aesthetic, suitable for social media and print. Include a microphone or karaoke visual element. Make the text legible and the layout clean.");

    setGeneratedPrompt(lines.join("\n\n"));
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
                <select
                  name="venue_id"
                  required={!selectedVenueId}
                  value={showNewVenue ? "__new__" : selectedVenueId}
                  onChange={(e) => handleVenueSelect(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select venue...</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                  <option value="__new__">+ Add New Venue</option>
                </select>
                {/* Hidden input to pass the selected venue id when using state */}
                {selectedVenueId && <input type="hidden" name="venue_id" value={selectedVenueId} />}
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

            {/* Inline New Venue Fields */}
            {showNewVenue && (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-accent text-lg">add_business</span>
                  <h3 className="text-sm font-bold text-white">New Venue Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Venue Name *</label>
                    <input name="new_venue_name" type="text" required placeholder="e.g. Fusion East" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Address</label>
                    <input name="new_venue_address" type="text" placeholder="123 Main St" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input name="new_venue_city" type="text" defaultValue="New York" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input name="new_venue_state" type="text" defaultValue="New York" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Neighborhood</label>
                    <input name="new_venue_neighborhood" type="text" placeholder="e.g. East Village" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Cross Street</label>
                    <input name="new_venue_cross_street" type="text" placeholder="e.g. 1st Ave & 7th St" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input name="new_venue_phone" type="text" placeholder="212-555-0100" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input name="new_venue_website" type="text" placeholder="https://..." className={inputClass} />
                  </div>
                </div>
                {venueFeedback && (
                  <div className="rounded-xl p-3 text-sm bg-red-500/10 text-red-400">{venueFeedback}</div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={venueCreating}
                    onClick={() => {
                      const form = document.querySelector("form") as HTMLFormElement;
                      if (form) handleCreateVenue(new FormData(form));
                    }}
                    className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {venueCreating ? "Creating..." : "Create Venue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewVenue(false); setSelectedVenueId(""); }}
                    className="px-4 py-2 rounded-xl bg-white/5 text-text-secondary text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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

            {feedback && feedback.type === "error" && (
              <div className="rounded-xl p-3 text-sm bg-red-500/10 text-red-400">
                {feedback.text}
              </div>
            )}

            {/* Success State with Flyer + Prompt Generator */}
            {feedback && feedback.type === "success" && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-icons-round text-green-400">check_circle</span>
                  <span className="text-green-400 font-bold">{feedback.text}</span>
                </div>

                {/* Primary actions: Create Flyer / Create Another */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {feedback.flyerUrl && (
                    <Link
                      href={feedback.flyerUrl}
                      className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                    >
                      <span className="material-icons-round text-lg">auto_awesome</span>
                      Create Flyer for This Event
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setFeedback(null); setOpen(false); setTimeout(() => setOpen(true), 50); }}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-text-secondary font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    <span className="material-icons-round text-lg">add</span>
                    Create Another Event
                  </button>
                </div>

                {/* Prompt Generator Section */}
                <div className="border-t border-border/30 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons-round text-accent text-lg">description</span>
                    <h4 className="text-sm font-bold text-white">Generate AI Flyer Prompt</h4>
                    <span className="text-text-muted text-xs">(for Nano Banana, DALL-E, etc.)</span>
                  </div>

                  {!generatedPrompt ? (
                    <div className="space-y-3">
                      {/* Optional customization for the prompt */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Theme / Genre</label>
                          <select
                            value={promptTheme}
                            onChange={(e) => setPromptTheme(e.target.value)}
                            className={selectClass}
                          >
                            <option value="">Select a theme...</option>
                            {THEME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Mood / Atmosphere</label>
                          <input
                            type="text"
                            value={promptMood}
                            onChange={(e) => setPromptMood(e.target.value)}
                            placeholder="e.g. High-energy, neon vibes"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Color picks */}
                      <div>
                        <label className={labelClass}>Flyer Colors (Optional)</label>
                        <div className="flex flex-wrap gap-1.5">
                          {COLOR_PRESETS.map((color) => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() =>
                                setPromptColors((prev) =>
                                  prev.includes(color.hex)
                                    ? prev.filter((c) => c !== color.hex)
                                    : [...prev, color.hex]
                                )
                              }
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                promptColors.includes(color.hex)
                                  ? "bg-white/15 text-white border-2 border-white/60"
                                  : "bg-white/5 text-text-muted border border-border hover:border-white/30"
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Feature tags */}
                      <div>
                        <label className={labelClass}>Features to Highlight (Optional)</label>
                        <div className="flex flex-wrap gap-1.5">
                          {FEATURE_OPTIONS.map((feature) => (
                            <button
                              key={feature}
                              type="button"
                              onClick={() =>
                                setPromptFeatures((prev) =>
                                  prev.includes(feature)
                                    ? prev.filter((f) => f !== feature)
                                    : [...prev, feature]
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors border ${
                                promptFeatures.includes(feature)
                                  ? "bg-accent/20 text-accent border-accent/40"
                                  : "bg-white/5 text-text-muted border-border hover:border-accent/30"
                              }`}
                            >
                              {promptFeatures.includes(feature) && <span className="mr-0.5">&#10003;</span>}
                              {feature}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={buildPrompt}
                        className="flex items-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent font-bold px-5 py-2.5 rounded-xl transition-colors border border-accent/30 text-sm"
                      >
                        <span className="material-icons-round text-lg">description</span>
                        Generate Prompt
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white/5 border border-border rounded-xl p-4">
                        <p className="text-text-secondary text-sm whitespace-pre-line leading-relaxed">
                          {generatedPrompt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPrompt);
                            setCopiedPrompt(true);
                            setTimeout(() => setCopiedPrompt(false), 2000);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                        >
                          <span className="material-icons-round text-sm">
                            {copiedPrompt ? "check" : "content_copy"}
                          </span>
                          {copiedPrompt ? "Copied!" : "Copy Prompt"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setGeneratedPrompt(null)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 text-text-secondary hover:bg-white/10 transition-colors"
                        >
                          <span className="material-icons-round text-sm">refresh</span>
                          Edit & Regenerate
                        </button>
                      </div>
                      <p className="text-text-muted text-xs">
                        Copy this prompt and paste it into Nano Banana, DALL-E, Midjourney, or any AI image generator.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!feedback || feedback.type !== "success") && (
              <button
                type="submit"
                disabled={isPending || (showNewVenue && !selectedVenueId)}
                className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Event"}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
