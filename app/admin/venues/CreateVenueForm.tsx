"use client";

import { useState, useTransition } from "react";
import { createVenue } from "../actions";

interface Owner {
  id: string;
  display_name: string | null;
}

export function CreateVenueForm({ owners }: { owners: Owner[] }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("New York");
  const [state, setState] = useState("New York");
  const [neighborhood, setNeighborhood] = useState("");
  const [crossStreet, setCrossStreet] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [accessibility, setAccessibility] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit() {
    if (!name.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await createVenue({
        name: name.trim(),
        address: address.trim(),
        city: city.trim() || "New York",
        state: state.trim() || "New York",
        neighborhood: neighborhood.trim(),
        cross_street: crossStreet.trim(),
        phone: phone.trim(),
        website: website.trim() || null,
        description: description.trim() || null,
        is_private_room: isPrivateRoom,
        accessibility: accessibility || null,
        owner_id: ownerId || null,
      });
      if (result.success) {
        setFeedback({ type: "success", text: "Venue created!" });
        setName("");
        setAddress("");
        setNeighborhood("");
        setCrossStreet("");
        setPhone("");
        setWebsite("");
        setDescription("");
        setIsPrivateRoom(false);
        setAccessibility("");
        setOwnerId("");
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
        <div className="border-t border-border/20 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Venue name"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Neighborhood</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="e.g. East Village"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Cross Street</label>
              <input
                type="text"
                value={crossStreet}
                onChange={(e) => setCrossStreet(e.target.value)}
                placeholder="e.g. 1st Ave & 7th St"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="212-555-0100"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the venue..."
              rows={2}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Accessibility</label>
              <select
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value)}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer"
              >
                <option value="">Unknown</option>
                <option value="full">Full Access</option>
                <option value="partial">Partial Access</option>
                <option value="none">No Access</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Owner</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer"
              >
                <option value="">Unassigned</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.display_name || o.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivateRoom}
                  onChange={(e) => setIsPrivateRoom(e.target.checked)}
                  className="w-4 h-4 rounded accent-red-500"
                />
                <span className="text-sm text-text-secondary">Private Room</span>
              </label>
            </div>
          </div>

          {feedback && (
            <div className={`rounded-xl p-3 text-sm ${feedback.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {feedback.text}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Venue"}
          </button>
        </div>
      )}
    </div>
  );
}
