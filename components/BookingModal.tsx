"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface BookingModalProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
}

export default function BookingModal({ venueId, venueName, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !startTime || !endTime) return;

    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase.from("room_bookings").insert({
      venue_id: venueId,
      user_id: user.id,
      date,
      start_time: startTime,
      end_time: endTime,
      party_size: partySize,
      status: "pending",
    });

    setSubmitting(false);

    if (insertError) {
      setError("Failed to submit booking. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-round text-primary text-3xl">check_circle</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Booking Submitted!</h2>
          <p className="text-text-secondary text-sm mb-6">
            Your booking request has been sent to {venueName}. They&apos;ll confirm shortly.
          </p>
          <button onClick={onClose} className="bg-primary text-black font-bold px-8 py-3 rounded-xl">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">Book a Room</h2>
            <p className="text-text-muted text-xs mt-0.5">{venueName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Party Size</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                className="w-10 h-10 rounded-xl bg-card-dark border border-border flex items-center justify-center text-white hover:border-primary/30 transition-colors"
              >
                <span className="material-icons-round">remove</span>
              </button>
              <span className="text-xl font-bold text-white w-8 text-center">{partySize}</span>
              <button
                type="button"
                onClick={() => setPartySize(Math.min(20, partySize + 1))}
                className="w-10 h-10 rounded-xl bg-card-dark border border-border flex items-center justify-center text-white hover:border-primary/30 transition-colors"
              >
                <span className="material-icons-round">add</span>
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-icons-round text-xl">book_online</span>
                Submit Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
