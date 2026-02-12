"use client";

import { useTransition } from "react";
import { selectVenue } from "./actions";

interface VenueSelectorProps {
  venues: { id: string; name: string }[];
  activeVenueId: string;
}

export function VenueSelector({ venues, activeVenueId }: VenueSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const handleSelect = (venueId: string) => {
    startTransition(async () => {
      await selectVenue(venueId);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {venues.map((v) => (
        <button
          key={v.id}
          onClick={() => handleSelect(v.id)}
          disabled={isPending}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
            v.id === activeVenueId
              ? "bg-accent/10 border-accent/30 text-accent"
              : "glass-card text-text-secondary hover:text-white hover:border-white/20"
          } ${isPending ? "opacity-50" : ""}`}
        >
          <span className="material-icons-round text-lg">
            {v.id === activeVenueId ? "radio_button_checked" : "radio_button_unchecked"}
          </span>
          {v.name}
        </button>
      ))}
    </div>
  );
}
