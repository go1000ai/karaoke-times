"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface CreateVenueResult {
  success?: boolean;
  error?: string;
  venueId?: string;
}

interface CreateVenueQuickFormProps {
  onCreateVenue: (params: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    cross_street?: string;
    phone?: string;
    website?: string | null;
    description?: string | null;
  }) => Promise<CreateVenueResult>;
}

export function CreateVenueQuickForm({ onCreateVenue }: CreateVenueQuickFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const inputClass =
    "w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted";
  const labelClass = "text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block";

  function handleSubmit(formData: FormData) {
    const name = (formData.get("venue_name") as string)?.trim();
    if (!name) return;
    setFeedback(null);

    startTransition(async () => {
      const result = await onCreateVenue({
        name,
        address: (formData.get("venue_address") as string)?.trim() || "",
        city: (formData.get("venue_city") as string)?.trim() || "New York",
        state: (formData.get("venue_state") as string)?.trim() || "New York",
        neighborhood: (formData.get("venue_neighborhood") as string)?.trim() || "",
        cross_street: (formData.get("venue_cross_street") as string)?.trim() || "",
        phone: (formData.get("venue_phone") as string)?.trim() || "",
        website: (formData.get("venue_website") as string)?.trim() || null,
        description: (formData.get("venue_description") as string)?.trim() || null,
      });

      if (result.success) {
        setFeedback({ type: "success", text: "Venue created! It's now available in the event form." });
        // Reset form by toggling
        setOpen(false);
        setTimeout(() => setOpen(true), 50);
        router.refresh();
      } else {
        setFeedback({ type: "error", text: result.error || "Failed to create venue" });
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
          <span className="material-icons-round text-red-400">add_business</span>
          <h2 className="text-lg font-bold text-white">Create New Venue</h2>
        </div>
        <span className={`material-icons-round text-text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="border-t border-border/20 p-5">
          <form action={handleSubmit} className="space-y-4">
            {/* Name & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Venue Name *</label>
                <input
                  name="venue_name"
                  type="text"
                  required
                  placeholder="e.g. Fusion East"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input
                  name="venue_address"
                  type="text"
                  placeholder="123 Main St"
                  className={inputClass}
                />
              </div>
            </div>

            {/* City & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input
                  name="venue_city"
                  type="text"
                  defaultValue="New York"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input
                  name="venue_state"
                  type="text"
                  defaultValue="New York"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Neighborhood & Cross Street */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Neighborhood</label>
                <input
                  name="venue_neighborhood"
                  type="text"
                  placeholder="e.g. East Village"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cross Street</label>
                <input
                  name="venue_cross_street"
                  type="text"
                  placeholder="e.g. 1st Ave & 7th St"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Phone & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  name="venue_phone"
                  type="text"
                  placeholder="212-555-0100"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  name="venue_website"
                  type="text"
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="venue_description"
                placeholder="Brief description of the venue..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {feedback && (
              <div className={`rounded-xl p-3 text-sm ${
                feedback.type === "success"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}>
                {feedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Venue"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
