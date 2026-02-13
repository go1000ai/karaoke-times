"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Venue {
  id: string;
  name: string;
}

export default function VenueSwitcher({
  venues,
  activeVenueId,
  label,
}: {
  venues: Venue[];
  activeVenueId: string | null;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const activeVenue = venues.find((v) => v.id === activeVenueId) || venues[0];
  const canSwitch = venues.length > 1;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const switchVenue = async (venueId: string) => {
    if (venueId === activeVenue?.id) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    await fetch("/api/active-venue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId }),
    });
    setOpen(false);
    setSwitching(false);
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => canSwitch && setOpen(!open)}
        className={`glass-card rounded-xl p-3 w-full text-left transition-colors ${
          canSwitch ? "cursor-pointer hover:bg-white/5" : "cursor-default"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">
              {label}
            </p>
            <p className="text-sm font-bold text-white truncate">
              {activeVenue?.name || "No venue linked"}
            </p>
          </div>
          {canSwitch && (
            <span className={`material-icons-round text-text-muted text-lg flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
              expand_more
            </span>
          )}
        </div>
        {canSwitch && (
          <p className="text-[10px] text-accent mt-1">{venues.length} venues connected</p>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card-dark border border-border rounded-xl shadow-xl shadow-black/40 z-50 overflow-hidden">
          {venues.map((v) => {
            const isActive = v.id === activeVenue?.id;
            return (
              <button
                key={v.id}
                onClick={() => switchVenue(v.id)}
                disabled={switching}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-text-secondary hover:bg-white/5 hover:text-white"
                } disabled:opacity-50`}
              >
                <span className="material-icons-round text-base">
                  {isActive ? "check_circle" : "storefront"}
                </span>
                <span className="truncate">{v.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
