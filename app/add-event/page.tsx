"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import ImageUpload from "@/components/ImageUpload";

export default function AddEventPage() {
  return (
    <div className="min-h-screen pb-28 md:pb-12 bg-bg-dark">
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="pt-20 px-5 mb-2">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/">
            <span className="material-icons-round text-white">arrow_back</span>
          </Link>
          <div className="flex-1 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <span className="material-icons-round text-primary">mic</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-accent font-bold neon-glow-pink">
              New York City
            </p>
          </div>
          <div className="w-6" />
        </div>
      </header>

      {/* Google Verify Banner */}
      <section className="px-5 mb-6">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <div className="flex-grow">
            <p className="text-sm font-semibold text-white">Sign in to list events</p>
            <p className="text-xs text-text-secondary">Save your progress & manage listings</p>
          </div>
          <button className="bg-primary text-black text-xs font-bold px-4 py-2 rounded-xl">
            Verify
          </button>
        </div>
      </section>

      {/* Form */}
      <section className="px-5">
        <h1 className="text-2xl font-extrabold text-white mb-0">Add New Event</h1>
        <p className="text-sm italic text-primary mb-6 neon-glow-green" style={{ fontFamily: "var(--font-script)" }}>
          Host a show
        </p>

        <div className="space-y-5">
          {/* Event Name */}
          <div>
            <label className="text-xs uppercase tracking-wider text-primary font-bold mb-2 block">
              Event Name
            </label>
            <input
              type="text"
              placeholder="e.g. 90s Grunge Karaoke Night"
              className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
            />
          </div>

          {/* Venue / Location */}
          <div>
            <label className="text-xs uppercase tracking-wider text-primary font-bold mb-2 block">
              Venue / Location
            </label>
            <div className="relative">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                location_on
              </span>
              <input
                type="text"
                placeholder="Search NYC Venues..."
                className="w-full bg-card-dark border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-primary font-bold mb-2 block">
                Date
              </label>
              <input
                type="date"
                className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-4 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-primary font-bold mb-2 block">
                Start Time
              </label>
              <input
                type="time"
                className="w-full bg-card-dark border border-border rounded-2xl py-3.5 px-4 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Event Flyer Upload */}
          <div>
            <label className="text-xs uppercase tracking-wider text-primary font-bold mb-2 block">
              Event Flyer
            </label>
            <ImageUpload label="Upload Event Flyer" maxSize="5MB" />
          </div>

          {/* Listing Fees */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-round text-primary text-lg">info</span>
              <h4 className="text-xs uppercase tracking-wider font-bold text-white">Listing Fees</h4>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">First Monthly Event</span>
              <span className="font-bold text-white">$10.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Additional Events</span>
              <span className="font-bold text-white">$2.00 /ea</span>
            </div>
          </div>

          {/* Submit */}
          <button className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:shadow-primary/40 transition-all">
            Proceed to Payment
            <span className="material-icons-round">arrow_forward</span>
          </button>

          <p className="text-[10px] text-text-muted text-center leading-relaxed pb-4">
            By listing your event, you agree to our Terms of Service and Event
            Guidelines for the New York City area.
          </p>
        </div>
      </section>

      </div>
      <BottomNav />
    </div>
  );
}
