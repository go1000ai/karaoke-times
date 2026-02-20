"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { VENUE_TYPES, PARKING_OPTIONS } from "@/lib/permissions";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MINUTES = ["00", "15", "30", "45"];

function parseTime(data: { open?: string; close?: string }) {
  const parse = (str: string | undefined, defaultHr: string, defaultPer: string) => {
    if (!str) return { hr: defaultHr, min: "00", period: defaultPer };
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return { hr: defaultHr, min: "00", period: defaultPer };
    return { hr: match[1], min: match[2], period: match[3].toUpperCase() };
  };
  const o = parse(data.open, "7", "PM");
  const c = parse(data.close, "12", "AM");
  return { openHr: o.hr, openMin: o.min, openPeriod: o.period, closeHr: c.hr, closeMin: c.min, closePeriod: c.period };
}

function TimePicker({
  label,
  hour,
  minute,
  period,
  onChange,
}: {
  label: string;
  hour: string;
  minute: string;
  period: string;
  onChange: (hr: string, min: string, period: string) => void;
}) {
  const smallSelect =
    "bg-card-dark border border-border rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer";
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-text-muted uppercase font-bold mr-1">{label}</span>
      <select value={hour} onChange={(e) => onChange(e.target.value, minute, period)} className={smallSelect}>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-text-muted text-xs">:</span>
      <select value={minute} onChange={(e) => onChange(hour, e.target.value, period)} className={smallSelect}>
        {MINUTES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select value={period} onChange={(e) => onChange(hour, minute, e.target.value)} className={smallSelect}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

const inputClass =
  "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const selectClass =
  "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer";
const labelClass = "text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block";

export default function ListingPage() {
  const { user } = useAuth();
  const [venue, setVenue] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState<Record<string, any>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function loadVenue() {
      const { data } = await supabase
        .from("venues")
        .select("*")
        .eq("owner_id", user!.id)
        .single();

      if (data) {
        setVenue(data);
        setHoursPerDay(
          typeof data.hours_of_operation === "object" && data.hours_of_operation
            ? data.hours_of_operation
            : {}
        );
      }
    }

    loadVenue();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!venue) return;
    setSaving(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("venues")
      .update({
        name: form.get("name"),
        address: form.get("address"),
        city: form.get("city"),
        state: form.get("state"),
        neighborhood: form.get("neighborhood"),
        cross_street: form.get("cross_street"),
        phone: form.get("phone"),
        website: (form.get("website") as string) || null,
        description: form.get("description"),
        venue_type: form.get("venue_type"),
        parking: form.get("parking"),
        capacity: (form.get("capacity") as string) || null,
        food_available: form.get("food_available") === "true",
        hours_of_operation: hoursPerDay,
      })
      .eq("id", venue.id);

    setSaving(false);
    setMessage(error ? error.message : "Saved!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (!venue) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Venue Listing</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage your venue&apos;s basic information visible to customers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ─── Basic Info ─── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary text-xl">storefront</span>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Venue Name</label>
              <input name="name" type="text" defaultValue={venue.name || ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" type="tel" defaultValue={venue.phone || ""} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Address</label>
              <input name="address" type="text" defaultValue={venue.address || ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input name="city" type="text" defaultValue={venue.city || ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input name="state" type="text" defaultValue={venue.state || ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Neighborhood</label>
              <input name="neighborhood" type="text" defaultValue={venue.neighborhood || ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cross Street</label>
              <input name="cross_street" type="text" defaultValue={venue.cross_street || ""} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Website</label>
              <input name="website" type="url" defaultValue={venue.website || ""} placeholder="https://" className={inputClass} />
            </div>
          </div>
        </section>

        {/* ─── Venue Details ─── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary text-xl">category</span>
            Venue Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Venue Type</label>
              <select name="venue_type" defaultValue={venue.venue_type || "karaoke_night"} className={selectClass}>
                {VENUE_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Capacity</label>
              <input name="capacity" type="text" defaultValue={venue.capacity || ""} placeholder="e.g. 100 people" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Parking</label>
              <select name="parking" defaultValue={venue.parking || "street"} className={selectClass}>
                {PARKING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Food Available</label>
              <select name="food_available" defaultValue={venue.food_available !== false ? "true" : "false"} className={selectClass}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </section>

        {/* ─── Hours of Operation ─── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary text-xl">schedule</span>
            Hours of Operation
          </h2>
          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayData = hoursPerDay[day];
              const isClosed = !dayData || dayData === "closed";
              const parsed = !isClosed ? parseTime(typeof dayData === "object" ? dayData : { open: dayData, close: "" }) : { openHr: "7", openMin: "00", openPeriod: "PM", closeHr: "12", closeMin: "00", closePeriod: "AM" };

              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-text-secondary sm:w-20 flex-shrink-0 font-medium">{day}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isClosed) {
                        setHoursPerDay((prev) => ({ ...prev, [day]: { open: "7:00 PM", close: "12:00 AM" } }));
                      } else {
                        setHoursPerDay((prev) => ({ ...prev, [day]: "closed" }));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isClosed
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-green-500/10 border-green-500/30 text-green-400"
                    }`}
                  >
                    {isClosed ? "Closed" : "Open"}
                  </button>
                  {!isClosed && (
                    <>
                      <TimePicker
                        label="Open"
                        hour={parsed.openHr}
                        minute={parsed.openMin}
                        period={parsed.openPeriod}
                        onChange={(hr, min, per) => {
                          const closeStr = typeof dayData === "object" ? dayData.close : "12:00 AM";
                          setHoursPerDay((prev) => ({
                            ...prev,
                            [day]: { open: `${hr}:${min} ${per}`, close: closeStr },
                          }));
                        }}
                      />
                      <span className="text-text-muted text-xs font-bold">to</span>
                      <TimePicker
                        label="Close"
                        hour={parsed.closeHr}
                        minute={parsed.closeMin}
                        period={parsed.closePeriod}
                        onChange={(hr, min, per) => {
                          const openStr = typeof dayData === "object" ? dayData.open : "7:00 PM";
                          setHoursPerDay((prev) => ({
                            ...prev,
                            [day]: { open: openStr, close: `${hr}:${min} ${per}` },
                          }));
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Description ─── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary text-xl">description</span>
            About
          </h2>
          <textarea
            name="description"
            rows={4}
            defaultValue={venue.description || ""}
            placeholder="Tell customers about the venue, the vibe..."
            className={`${inputClass} resize-none`}
          />
        </section>

        {/* ─── Save ─── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-black font-bold text-sm px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {message && (
            <p className={`text-sm font-semibold ${message === "Saved!" ? "text-primary" : "text-red-400"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
