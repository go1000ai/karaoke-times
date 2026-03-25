"use client";

import { useState, useRef, useTransition } from "react";
import { deleteVenue, assignVenueOwner, updateVenue } from "../actions";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  neighborhood: string;
  owner_id: string | null;
  is_private_room: boolean;
  queue_paused: boolean;
  accessibility: string | null;
  phone: string;
  website: string | null;
  description: string | null;
  cross_street: string;
  hours_open: string | null;
  booking_url: string | null;
  instagram: string | null;
  menu_url: string | null;
  menu_items: { name: string; description?: string; price?: string; category?: string }[] | null;
  created_at: string;
  profiles: any;
  _event_count: number;
  _review_count: number;
  _avg_rating: string | null;
  _promo_count: number;
  _media_count: number;
  _primary_image: string | null;
}

interface Owner {
  id: string;
  display_name: string | null;
}

export function VenuesList({ venues: initialVenues, owners }: { venues: Venue[]; owners: Owner[] }) {
  const [venues, setVenues] = useState(initialVenues);
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [accessFilter, setAccessFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Venue>>({});

  // Image upload state
  const supabase = createClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [menuExtractUrl, setMenuExtractUrl] = useState("");
  const [menuExtracting, setMenuExtracting] = useState<string | null>(null);
  const [menuPreview, setMenuPreview] = useState<{ venueId: string; items: { name: string; description?: string; price?: string; category?: string }[] } | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const filteredVenues = venues.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      v.neighborhood.toLowerCase().includes(search.toLowerCase());
    if (ownerFilter === "assigned" && !v.owner_id) return false;
    if (ownerFilter === "unassigned" && v.owner_id) return false;
    if (accessFilter === "unknown" && v.accessibility) return false;
    if (accessFilter && accessFilter !== "unknown" && v.accessibility !== accessFilter) return false;
    return matchesSearch;
  });

  function handleDelete(venueId: string, name: string) {
    if (!confirm(`Delete venue "${name}" and all its events? This cannot be undone.`)) return;
    setProcessingId(venueId);
    startTransition(async () => {
      const result = await deleteVenue(venueId);
      if (result.success) {
        setVenues((prev) => prev.filter((v) => v.id !== venueId));
      }
      setProcessingId(null);
    });
  }

  function handleOwnerChange(venueId: string, ownerId: string) {
    setProcessingId(venueId);
    startTransition(async () => {
      const result = await assignVenueOwner(venueId, ownerId || null);
      if (result.success) {
        setVenues((prev) => prev.map((v) => (v.id === venueId ? { ...v, owner_id: ownerId || null } : v)));
      }
      setProcessingId(null);
    });
  }

  function startEdit(venue: Venue) {
    setEditingId(venue.id);
    setEditForm({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      zip_code: venue.zip_code || "",
      neighborhood: venue.neighborhood,
      phone: venue.phone || "",
      website: venue.website || "",
      cross_street: venue.cross_street || "",
      hours_open: venue.hours_open || "",
      description: venue.description || "",
      is_private_room: venue.is_private_room,
      accessibility: venue.accessibility || "",
      booking_url: venue.booking_url || "",
      instagram: venue.instagram || "",
      menu_url: venue.menu_url || "",
    });
    setEditImageFile(null);
    setEditImagePreview(venue._primary_image);
    setRemoveImage(false);
    setImageError(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
    setEditImageFile(null);
    setEditImagePreview(null);
    setRemoveImage(false);
    setImageError(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be under 5MB.");
      return;
    }
    setImageError(null);
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setEditImageFile(null);
    setEditImagePreview(null);
    setRemoveImage(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleSaveEdit(venueId: string) {
    setProcessingId(venueId);

    let newImageUrl: string | null = null;

    // Handle image upload
    if (editImageFile) {
      const ext = editImageFile.name.split(".").pop() || "jpg";
      const fileName = `${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("venue-media")
        .upload(fileName, editImageFile, { contentType: editImageFile.type });

      if (uploadError) {
        setImageError("Failed to upload image: " + uploadError.message);
        setProcessingId(null);
        return;
      }

      const { data: urlData } = supabase.storage.from("venue-media").getPublicUrl(fileName);
      newImageUrl = urlData.publicUrl;

      // Remove old primary image record (if any)
      await supabase
        .from("venue_media")
        .delete()
        .eq("venue_id", venueId)
        .eq("is_primary", true);

      // Insert new primary image
      await supabase.from("venue_media").insert({
        venue_id: venueId,
        url: newImageUrl,
        type: "image",
        is_primary: true,
        sort_order: 0,
      });
    } else if (removeImage) {
      // Delete existing primary image
      const { data: existing } = await supabase
        .from("venue_media")
        .select("id, url")
        .eq("venue_id", venueId)
        .eq("is_primary", true)
        .single();

      if (existing) {
        // Try to remove from storage (extract path from URL)
        const urlParts = existing.url.split("/venue-media/");
        if (urlParts[1]) {
          await supabase.storage.from("venue-media").remove([urlParts[1]]);
        }
        await supabase.from("venue_media").delete().eq("id", existing.id);
      }
      newImageUrl = null;
    }

    startTransition(async () => {
      const result = await updateVenue(venueId, {
        name: editForm.name,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        zip_code: editForm.zip_code || "",
        neighborhood: editForm.neighborhood,
        phone: editForm.phone || "",
        website: editForm.website || null,
        cross_street: editForm.cross_street || "",
        hours_open: editForm.hours_open || null,
        description: editForm.description || null,
        is_private_room: editForm.is_private_room ?? false,
        accessibility: editForm.accessibility || null,
        booking_url: editForm.booking_url || null,
        instagram: editForm.instagram || null,
        menu_url: editForm.menu_url || null,
      });
      if (result.success) {
        const updatedImage = editImageFile ? newImageUrl : removeImage ? null : undefined;
        setVenues((prev) =>
          prev.map((v) =>
            v.id === venueId
              ? {
                  ...v,
                  name: editForm.name || v.name,
                  address: editForm.address || v.address,
                  city: editForm.city || v.city,
                  state: editForm.state || v.state,
                  zip_code: editForm.zip_code || "",
                  neighborhood: editForm.neighborhood || v.neighborhood,
                  phone: editForm.phone || "",
                  website: editForm.website || null,
                  cross_street: editForm.cross_street || "",
                  hours_open: editForm.hours_open || null,
                  description: editForm.description || null,
                  is_private_room: editForm.is_private_room ?? v.is_private_room,
                  accessibility: editForm.accessibility || null,
                  booking_url: editForm.booking_url || null,
                  instagram: editForm.instagram || null,
                  menu_url: editForm.menu_url || null,
                  _primary_image: updatedImage !== undefined ? updatedImage : v._primary_image,
                }
              : v
          )
        );
        setEditingId(null);
        setEditForm({});
        setEditImageFile(null);
        setEditImagePreview(null);
        setRemoveImage(false);
        setImageError(null);
      }
      setProcessingId(null);
    });
  }

  async function handleExtractMenu(venueId: string) {
    if (!menuExtractUrl.trim()) return;
    setMenuExtracting(venueId);
    setMenuPreview(null);
    try {
      const res = await fetch("/api/admin/extract-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: menuExtractUrl.trim(), venueId }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else if (data.items && data.items.length > 0) {
        if (data.saved) {
          setVenues((prev) => prev.map((v) => v.id === venueId ? { ...v, menu_items: data.items, menu_url: menuExtractUrl.trim() } : v));
          setMenuExtractUrl("");
          setMenuPreview(null);
        } else {
          setMenuPreview({ venueId, items: data.items });
        }
      } else {
        alert("No menu items found on that page. Try a different URL.");
      }
    } catch {
      alert("Failed to extract menu. Check the URL and try again.");
    }
    setMenuExtracting(null);
  }

  async function handleClearMenu(venueId: string) {
    if (!confirm("Remove the extracted menu from this venue?")) return;
    const sb = createClient();
    await sb.from("venues").update({ menu_items: null }).eq("id", venueId);
    setVenues((prev) => prev.map((v) => v.id === venueId ? { ...v, menu_items: null } : v));
  }

  const inputClass = "bg-card-dark border border-border rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Venues</h1>
          <p className="text-text-secondary text-sm">{venues.length} venues in database</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues by name, city, or neighborhood..."
            className="w-full bg-card-dark border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 placeholder:text-text-muted"
          />
        </div>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value as typeof ownerFilter)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
        >
          <option value="all">All</option>
          <option value="assigned">Has Owner</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value)}
          className="bg-card-dark border border-border rounded-xl px-4 py-3 text-sm text-white cursor-pointer"
        >
          <option value="">All Accessibility</option>
          <option value="full">Full Access</option>
          <option value="partial">Partial Access</option>
          <option value="none">No Access</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      {/* Venues List */}
      <div className="space-y-3">
        {filteredVenues.map((venue) => (
          <div key={venue.id} className="glass-card rounded-2xl p-4 md:p-5">
            {editingId === venue.id ? (
              /* ─── Edit Mode ─── */
              <div className="space-y-3">
                {/* Venue Image */}
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Venue Image</label>
                  <div className="flex items-center gap-3">
                    {editImagePreview ? (
                      <img
                        src={editImagePreview}
                        alt="Venue"
                        className="w-20 h-20 rounded-xl object-cover border border-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white/5 border border-border flex items-center justify-center">
                        <span className="material-icons-round text-text-muted text-2xl">image</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                      >
                        <span className="material-icons-round text-sm">upload</span>
                        {editImagePreview ? "Change" : "Upload"}
                      </button>
                      {editImagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-1"
                        >
                          <span className="material-icons-round text-sm">delete</span>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  {imageError && (
                    <p className="text-xs text-red-400 mt-1">{imageError}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Name</label>
                    <input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Address</label>
                    <input
                      value={editForm.address || ""}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">City</label>
                    <input
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">State</label>
                    <input
                      value={editForm.state || ""}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Zip Code</label>
                    <input
                      value={editForm.zip_code || ""}
                      onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })}
                      placeholder="e.g. 10001"
                      maxLength={5}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Neighborhood</label>
                    <input
                      value={editForm.neighborhood || ""}
                      onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                </div>

                {/* Contact & Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Phone</label>
                    <input
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="(212) 555-1234"
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Cross Street</label>
                    <input
                      value={editForm.cross_street || ""}
                      onChange={(e) => setEditForm({ ...editForm, cross_street: e.target.value })}
                      placeholder="Between 1st and 2nd Ave"
                      className={`${inputClass} w-full`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Website</label>
                    <input
                      value={editForm.website || ""}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://example.com"
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Booking URL</label>
                    <input
                      value={editForm.booking_url || ""}
                      onChange={(e) => setEditForm({ ...editForm, booking_url: e.target.value })}
                      placeholder="https://example.com/book"
                      className={`${inputClass} w-full`}
                    />
                  </div>
                </div>

                {/* Instagram & Menu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Instagram</label>
                    <input
                      value={editForm.instagram || ""}
                      onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                      placeholder="@venuename or URL"
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Menu URL</label>
                    <input
                      value={editForm.menu_url || ""}
                      onChange={(e) => setEditForm({ ...editForm, menu_url: e.target.value })}
                      placeholder="https://example.com/menu"
                      className={`${inputClass} w-full`}
                    />
                  </div>
                </div>

                {/* Hours of Operation */}
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Hours of Operation</label>
                  <textarea
                    value={editForm.hours_open || ""}
                    onChange={(e) => setEditForm({ ...editForm, hours_open: e.target.value })}
                    placeholder={"Mon-Thu: 5PM-2AM\nFri-Sat: 5PM-4AM\nSun: 3PM-12AM"}
                    rows={3}
                    className={`${inputClass} w-full resize-none`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Description</label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="A brief description of the venue..."
                    rows={3}
                    className={`${inputClass} w-full resize-none`}
                  />
                </div>

                {/* Toggles & Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Private Room</label>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, is_private_room: !editForm.is_private_room })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${editForm.is_private_room ? "bg-purple-500" : "bg-white/10"}`}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                        style={editForm.is_private_room ? { transform: "translateX(20px)" } : undefined}
                      />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Accessibility</label>
                    <select
                      value={editForm.accessibility || ""}
                      onChange={(e) => setEditForm({ ...editForm, accessibility: e.target.value })}
                      className={`${inputClass} w-full`}
                    >
                      <option value="">Unknown</option>
                      <option value="full">Fully Accessible</option>
                      <option value="partial">Partial Access</option>
                      <option value="none">Not Accessible</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSaveEdit(venue.id)}
                    disabled={isPending && processingId === venue.id}
                    className="px-4 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/80 transition-colors disabled:opacity-50"
                  >
                    {isPending && processingId === venue.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ─── View Mode ─── */
              <>
                {/* Venue name + badges */}
                <div className="flex items-center gap-3">
                  {venue._primary_image ? (
                    <img
                      src={venue._primary_image}
                      alt={venue.name}
                      className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-border flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-text-muted text-lg">storefront</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-bold">{venue.name}</h3>
                  {venue.is_private_room && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">Private Room</span>
                  )}
                  {venue.queue_paused && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Queue Paused</span>
                  )}
                  {venue.accessibility === "full" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 flex items-center gap-0.5">
                      <span className="material-icons-round text-[10px]">accessible</span>
                      Full
                    </span>
                  )}
                  {venue.accessibility === "partial" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center gap-0.5">
                      <span className="material-icons-round text-[10px]">accessible</span>
                      Partial
                    </span>
                  )}
                  {venue.accessibility === "none" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-0.5">
                      <span className="material-icons-round text-[10px]">not_accessible</span>
                      None
                    </span>
                  )}
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {venue.address} — {venue.neighborhood ? `${venue.neighborhood}, ` : ""}{venue.city}, {venue.state}{venue.zip_code ? ` ${venue.zip_code}` : ""}
                </p>
                {(venue.phone || venue.hours_open || venue.instagram || venue.menu_url) && (
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {venue.phone && (
                      <span className="text-xs text-text-muted flex items-center gap-0.5">
                        <span className="material-icons-round text-xs">call</span>
                        {venue.phone}
                      </span>
                    )}
                    {venue.hours_open && (
                      <span className="text-xs text-text-muted flex items-center gap-0.5">
                        <span className="material-icons-round text-xs">schedule</span>
                        {venue.hours_open.split("\n")[0]}
                      </span>
                    )}
                    {venue.instagram && (
                      <a
                        href={venue.instagram.startsWith("http") ? venue.instagram : `https://instagram.com/${venue.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-pink-400 flex items-center gap-0.5 hover:text-pink-300 transition-colors"
                      >
                        <span className="material-icons-round text-xs">photo_camera</span>
                        {venue.instagram.startsWith("http") ? "Instagram" : venue.instagram}
                      </a>
                    )}
                    {venue.menu_url && (
                      <a
                        href={venue.menu_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-400 flex items-center gap-0.5 hover:text-amber-300 transition-colors"
                      >
                        <span className="material-icons-round text-xs">restaurant_menu</span>
                        Menu
                      </a>
                    )}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                    {venue._event_count} events
                  </span>
                  {venue._review_count > 0 && (
                    <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-icons-round text-yellow-400 text-xs">star</span>
                      {venue._avg_rating} ({venue._review_count})
                    </span>
                  )}
                  {venue._promo_count > 0 && (
                    <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                      {venue._promo_count} promos
                    </span>
                  )}
                  {venue._media_count > 0 && (
                    <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                      {venue._media_count} media
                    </span>
                  )}
                </div>

                {/* Menu Extractor */}
                <div className="mt-3 pt-3 border-t border-border/20">
                  {venue.menu_items && venue.menu_items.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                          <span className="material-icons-round text-xs">restaurant_menu</span>
                          Menu ({venue.menu_items.length} items)
                        </span>
                        <button
                          onClick={() => handleClearMenu(venue.id)}
                          className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove menu
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-0.5 bg-white/5 rounded-lg p-2">
                        {venue.menu_items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-text-secondary truncate mr-2">{item.category ? <span className="text-text-muted">{item.category} · </span> : null}{item.name}</span>
                            {item.price && <span className="text-primary font-bold shrink-0">{item.price}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={menuExtracting === venue.id ? menuExtractUrl : (menuPreview?.venueId === venue.id ? menuExtractUrl : "")}
                        onChange={(e) => setMenuExtractUrl(e.target.value)}
                        onFocus={() => setMenuExtractUrl(venue.menu_url || "")}
                        placeholder="Paste restaurant menu URL..."
                        className="flex-1 bg-white/5 border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                      />
                      <button
                        onClick={() => handleExtractMenu(venue.id)}
                        disabled={menuExtracting === venue.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <span className="material-icons-round text-sm">{menuExtracting === venue.id ? "hourglass_top" : "restaurant_menu"}</span>
                        {menuExtracting === venue.id ? "Extracting..." : "Extract Menu"}
                      </button>
                    </div>
                  )}
                  {menuPreview?.venueId === venue.id && (
                    <div className="mt-2 bg-white/5 rounded-lg p-2 max-h-40 overflow-y-auto">
                      <p className="text-[10px] text-amber-400 font-bold mb-1">Preview — {menuPreview.items.length} items found (saved automatically)</p>
                      {menuPreview.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-text-secondary truncate mr-2">{item.name}</span>
                          {item.price && <span className="text-primary font-bold shrink-0">{item.price}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Owner + Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20 flex-wrap">
                  <span className="text-xs text-text-muted">Owner:</span>
                  <select
                    value={venue.owner_id || ""}
                    onChange={(e) => handleOwnerChange(venue.id, e.target.value)}
                    disabled={isPending && processingId === venue.id}
                    className="text-xs bg-card-dark border border-border rounded-lg px-2 py-1 text-white disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.display_name || o.id.slice(0, 8)}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="relative group">
                      <button
                        onClick={() => startEdit(venue)}
                        className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                      >
                        <span className="material-icons-round text-blue-400 text-sm">edit</span>
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] font-semibold text-white bg-black/90 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">Edit venue</span>
                    </div>
                    <div className="relative group">
                      <Link
                        href={`/venue/${venue.id}`}
                        className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-icons-round text-primary text-sm">visibility</span>
                      </Link>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] font-semibold text-white bg-black/90 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">View venue</span>
                    </div>
                    <div className="relative group">
                      <button
                        onClick={() => handleDelete(venue.id, venue.name)}
                        disabled={isPending && processingId === venue.id}
                        className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-icons-round text-red-400 text-sm">delete</span>
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] font-semibold text-white bg-black/90 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">Delete venue</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {filteredVenues.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
            <p className="text-text-secondary text-sm">No venues match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
