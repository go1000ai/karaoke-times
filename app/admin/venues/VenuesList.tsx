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
  const [manualMenuVenueId, setManualMenuVenueId] = useState<string | null>(null);
  const [manualMenuItems, setManualMenuItems] = useState<{ name: string; description: string; price: string; category: string }[]>([]);
  const [manualMenuSaving, setManualMenuSaving] = useState(false);
  const [editingMenuIdx, setEditingMenuIdx] = useState<number | null>(null);
  const [menuImageUploading, setMenuImageUploading] = useState<string | null>(null);
  const menuImageInputRef = useRef<HTMLInputElement>(null);
  const [selectedVenues, setSelectedVenues] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  async function handleExtractMenu(venueId: string, urlOverride?: string) {
    const url = urlOverride?.trim() || menuExtractUrl.trim();
    if (!url) return;
    setMenuExtracting(venueId);
    setMenuPreview(null);
    try {
      const res = await fetch("/api/admin/extract-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, venueId }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else if (data.items && data.items.length > 0) {
        if (data.saved) {
          setVenues((prev) => prev.map((v) => v.id === venueId ? { ...v, menu_items: data.items, menu_url: url } : v));
          setMenuExtractUrl("");
          setMenuPreview(null);
        } else {
          setMenuPreview({ venueId, items: data.items });
        }
      } else {
        alert("No menu items found in the page text. If the menu is an image, use the 'Upload Menu Images' button instead.");
      }
    } catch {
      alert("Failed to extract menu. Check the URL and try again.");
    }
    setMenuExtracting(null);
  }

  async function handleMenuImageUpload(venueId: string, files: FileList) {
    if (!files || files.length === 0) return;
    setMenuImageUploading(venueId);
    try {
      const formData = new FormData();
      formData.append("venueId", venueId);
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        formData.append("images", files[i]);
      }
      const res = await fetch("/api/admin/extract-menu-images", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else if (data.items && data.items.length > 0) {
        if (data.saved) {
          setVenues((prev) => prev.map((v) => v.id === venueId ? { ...v, menu_items: data.items } : v));
        }
        alert(`Extracted ${data.items.length} menu items from ${files.length} image${files.length > 1 ? "s" : ""}!`);
      } else {
        alert("No menu items found in the uploaded images. Try a clearer photo of the menu.");
      }
    } catch {
      alert("Failed to process menu images. Try again.");
    }
    setMenuImageUploading(null);
    if (menuImageInputRef.current) menuImageInputRef.current.value = "";
  }

  async function handleClearMenu(venueId: string) {
    if (!confirm("Remove the extracted menu from this venue?")) return;
    const sb = createClient();
    await sb.from("venues").update({ menu_items: null }).eq("id", venueId);
    setVenues((prev) => prev.map((v) => v.id === venueId ? { ...v, menu_items: null } : v));
  }

  function toggleSelectVenue(venueId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedVenues((prev) => {
      const next = new Set(prev);
      if (next.has(venueId)) next.delete(venueId);
      else next.add(venueId);
      return next;
    });
  }

  function selectAllVenues() {
    if (selectedVenues.size === filteredVenues.length) {
      setSelectedVenues(new Set());
    } else {
      setSelectedVenues(new Set(filteredVenues.map((v) => v.id)));
    }
  }

  async function handleBulkDelete() {
    const count = selectedVenues.size;
    if (!confirm(`Delete ${count} venue${count > 1 ? "s" : ""} and all their events? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const venueId of selectedVenues) {
      await deleteVenue(venueId);
    }
    setVenues((prev) => prev.filter((v) => !selectedVenues.has(v.id)));
    setSelectedVenues(new Set());
    setBulkDeleting(false);
  }

  function openManualMenuEditor(venueId: string) {
    const venue = venues.find((v) => v.id === venueId);
    const existing = venue?.menu_items?.map((item) => ({
      name: item.name,
      description: item.description || "",
      price: item.price || "",
      category: item.category || "",
    })) || [];
    setManualMenuItems(existing.length > 0 ? existing : [{ name: "", description: "", price: "", category: "" }]);
    setManualMenuVenueId(venueId);
  }

  function addManualMenuItem() {
    setManualMenuItems((prev) => [...prev, { name: "", description: "", price: "", category: "" }]);
  }

  function removeManualMenuItem(index: number) {
    setManualMenuItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateManualMenuItem(index: number, field: string, value: string) {
    setManualMenuItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function saveManualMenu() {
    if (!manualMenuVenueId) return;
    const items = manualMenuItems
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        description: item.description.trim() || undefined,
        price: item.price.trim() || undefined,
        category: item.category.trim() || undefined,
      }));
    setManualMenuSaving(true);
    try {
      const sb = createClient();
      await sb.from("venues").update({ menu_items: items.length > 0 ? items : null }).eq("id", manualMenuVenueId);
      setVenues((prev) => prev.map((v) => v.id === manualMenuVenueId ? { ...v, menu_items: items.length > 0 ? items : null } : v));
      setManualMenuVenueId(null);
      setManualMenuItems([]);
    } catch {
      alert("Failed to save menu items.");
    }
    setManualMenuSaving(false);
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

      {/* Bulk Actions Bar */}
      {selectedVenues.size > 0 && (
        <div className="flex items-center gap-3 mb-4 glass-card rounded-xl px-4 py-3">
          <button onClick={selectAllVenues} className="text-xs text-text-secondary hover:text-white transition-colors">
            {selectedVenues.size === filteredVenues.length ? "Deselect All" : "Select All"}
          </button>
          <span className="text-xs text-white font-bold">{selectedVenues.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="ml-auto px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <span className="material-icons-round text-sm">{bulkDeleting ? "hourglass_top" : "delete_sweep"}</span>
            {bulkDeleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      {/* Venues — Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredVenues.map((venue) => (
          editingId === venue.id ? (
            /* ─── Expanded Detail / Edit View ─── */
            <div key={venue.id} className="col-span-2 md:col-span-3 lg:col-span-4 glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {venue._primary_image ? (
                    <img src={venue._primary_image} alt={venue.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-border flex items-center justify-center">
                      <span className="material-icons-round text-text-muted text-xl">storefront</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-bold text-lg">{venue.name}</h3>
                    <p className="text-xs text-text-secondary">{venue.neighborhood ? `${venue.neighborhood}, ` : ""}{venue.city}, {venue.state}</p>
                  </div>
                </div>
                <button onClick={cancelEdit} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <span className="material-icons-round text-white text-sm">close</span>
                </button>
              </div>

              {/* Edit fields */}
              <div className="space-y-3">
                {/* Image */}
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Venue Image</label>
                  <div className="flex items-center gap-3">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Venue" className="w-20 h-20 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white/5 border border-border flex items-center justify-center">
                        <span className="material-icons-round text-text-muted text-2xl">image</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                      <button type="button" onClick={() => imageInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                        <span className="material-icons-round text-sm">upload</span>
                        {editImagePreview ? "Change" : "Upload"}
                      </button>
                      {editImagePreview && (
                        <button type="button" onClick={handleRemoveImage} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-1">
                          <span className="material-icons-round text-sm">delete</span>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  {imageError && <p className="text-xs text-red-400 mt-1">{imageError}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Name</label>
                    <input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Address</label>
                    <input value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">City</label>
                    <input value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">State</label>
                    <input value={editForm.state || ""} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Zip Code</label>
                    <input value={editForm.zip_code || ""} onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })} placeholder="e.g. 10001" maxLength={5} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Neighborhood</label>
                    <input value={editForm.neighborhood || ""} onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })} className={`${inputClass} w-full`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Phone</label>
                    <input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="(212) 555-1234" className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Cross Street</label>
                    <input value={editForm.cross_street || ""} onChange={(e) => setEditForm({ ...editForm, cross_street: e.target.value })} placeholder="Between 1st and 2nd Ave" className={`${inputClass} w-full`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Website</label>
                    <input value={editForm.website || ""} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://example.com" className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Booking URL</label>
                    <input value={editForm.booking_url || ""} onChange={(e) => setEditForm({ ...editForm, booking_url: e.target.value })} placeholder="https://example.com/book" className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Instagram</label>
                    <input value={editForm.instagram || ""} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="@venuename or URL" className={`${inputClass} w-full`} />
                  </div>
                </div>
                {/* Hours + Description side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-2 block">Hours of Operation</label>
                  {(() => {
                    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
                    const TIMES = ["Closed", "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"];

                    // Parse existing hours_open text into per-day open/close
                    const parseHours = (): Record<string, { open: string; close: string }> => {
                      const result: Record<string, { open: string; close: string }> = {};
                      DAYS.forEach((d) => { result[d] = { open: "", close: "" }; });
                      if (!editForm.hours_open) return result;
                      const lines = editForm.hours_open.split("\n");
                      for (const line of lines) {
                        const match = line.match(/^([\w,\s-]+):\s*(.+)$/);
                        if (!match) continue;
                        const dayPart = match[1].trim();
                        const timePart = match[2].trim();
                        // Find which days this applies to
                        const matchedDays: string[] = [];
                        for (const d of DAYS) {
                          if (dayPart.includes(d)) matchedDays.push(d);
                        }
                        // Handle ranges like "Mon-Thu"
                        const rangeMatch = dayPart.match(/(\w{3})\s*-\s*(\w{3})/);
                        if (rangeMatch) {
                          const startIdx = DAYS.indexOf(rangeMatch[1] as typeof DAYS[number]);
                          const endIdx = DAYS.indexOf(rangeMatch[2] as typeof DAYS[number]);
                          if (startIdx >= 0 && endIdx >= 0) {
                            for (let i = startIdx; i <= endIdx; i++) matchedDays.push(DAYS[i]);
                          }
                        }
                        if (timePart.toLowerCase() === "closed") {
                          matchedDays.forEach((d) => { result[d] = { open: "Closed", close: "Closed" }; });
                        } else {
                          const times = timePart.split(/\s*-\s*/);
                          if (times.length === 2) {
                            matchedDays.forEach((d) => { result[d] = { open: times[0].trim(), close: times[1].trim() }; });
                          }
                        }
                      }
                      return result;
                    };

                    const hoursData = parseHours();

                    const updateDay = (day: string, field: "open" | "close", value: string) => {
                      const data = parseHours();
                      if (value === "Closed") {
                        data[day] = { open: "Closed", close: "Closed" };
                      } else {
                        data[day] = { ...data[day], [field]: value };
                      }
                      // Serialize back to text
                      const lines = DAYS.map((d) => {
                        const h = data[d];
                        if (!h.open && !h.close) return null;
                        if (h.open === "Closed") return `${d}: Closed`;
                        return `${d}: ${h.open || "?"} - ${h.close || "?"}`;
                      }).filter(Boolean);
                      setEditForm({ ...editForm, hours_open: lines.join("\n") });
                    };

                    const copyToAll = (day: string) => {
                      const data = parseHours();
                      const src = data[day];
                      DAYS.forEach((d) => { data[d] = { ...src }; });
                      const lines = DAYS.map((d) => {
                        const h = data[d];
                        if (!h.open && !h.close) return null;
                        if (h.open === "Closed") return `${d}: Closed`;
                        return `${d}: ${h.open || "?"} - ${h.close || "?"}`;
                      }).filter(Boolean);
                      setEditForm({ ...editForm, hours_open: lines.join("\n") });
                    };

                    const selClass = "bg-card-dark border border-border rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500/30 cursor-pointer";

                    return (
                      <div className="space-y-2">
                        {DAYS.map((day) => {
                          const h = hoursData[day];
                          const isClosed = h.open === "Closed";
                          return (
                            <div key={day} className="flex items-center gap-2">
                              <span className="text-xs text-text-secondary font-bold w-8 shrink-0">{day}</span>
                              <select value={h.open || ""} onChange={(e) => updateDay(day, "open", e.target.value)} className={`${selClass} flex-1`}>
                                <option value="">--</option>
                                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                              {!isClosed && (
                                <>
                                  <span className="text-xs text-text-muted">-</span>
                                  <select value={h.close || ""} onChange={(e) => updateDay(day, "close", e.target.value)} className={`${selClass} flex-1`}>
                                    <option value="">--</option>
                                    {TIMES.filter((t) => t !== "Closed").map((t) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </>
                              )}
                              <button type="button" onClick={() => copyToAll(day)} title="Copy to all days" className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                                <span className="material-icons-round text-text-muted text-xs">content_copy</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Description</label>
                  <textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="A brief description of the venue..." rows={10} className={`${inputClass} w-full resize-none h-full`} />
                </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Private Room</label>
                    <button type="button" onClick={() => setEditForm({ ...editForm, is_private_room: !editForm.is_private_room })} className={`relative w-10 h-5 rounded-full transition-colors ${editForm.is_private_room ? "bg-purple-500" : "bg-white/10"}`}>
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={editForm.is_private_room ? { transform: "translateX(20px)" } : undefined} />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Accessibility</label>
                    <select value={editForm.accessibility || ""} onChange={(e) => setEditForm({ ...editForm, accessibility: e.target.value })} className={`${inputClass} w-full`}>
                      <option value="">Unknown</option>
                      <option value="full">Fully Accessible</option>
                      <option value="partial">Partial Access</option>
                      <option value="none">Not Accessible</option>
                    </select>
                  </div>
                </div>

                {/* Owner */}
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1 block">Owner</label>
                  <select value={venue.owner_id || ""} onChange={(e) => handleOwnerChange(venue.id, e.target.value)} disabled={isPending && processingId === venue.id} className={`${inputClass} w-full`}>
                    <option value="">Unassigned</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.display_name || o.id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>

                {/* Menu Section */}
                <div className="pt-3 border-t border-border/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      <span className="material-icons-round text-xs">restaurant_menu</span>
                      Menu {venue.menu_items && venue.menu_items.length > 0 ? `(${venue.menu_items.length} items)` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {venue.menu_items && venue.menu_items.length > 0 && (
                        <button onClick={() => handleClearMenu(venue.id)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Clear All</button>
                      )}
                      {manualMenuVenueId === venue.id && (
                        <button onClick={() => { setEditingMenuIdx(null); saveManualMenu(); }} disabled={manualMenuSaving} className="text-[10px] text-primary font-bold hover:text-primary/80 transition-colors flex items-center gap-0.5">
                          <span className="material-icons-round text-xs">{manualMenuSaving ? "hourglass_top" : "save"}</span>
                          {manualMenuSaving ? "Saving..." : "Save Menu"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Menu URL + Extract */}
                  <div className="flex gap-2 mb-3">
                    <input value={editForm.menu_url || ""} onChange={(e) => setEditForm({ ...editForm, menu_url: e.target.value })} placeholder="Paste venue's menu page URL..." className="flex-1 bg-white/5 border border-border/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30" />
                    <button
                      type="button"
                      onClick={() => { if (editForm.menu_url) { handleExtractMenu(venue.id, editForm.menu_url); } }}
                      disabled={!editForm.menu_url || menuExtracting === venue.id}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      <span className="material-icons-round text-sm">{menuExtracting === venue.id ? "hourglass_top" : "auto_awesome"}</span>
                      {menuExtracting === venue.id ? "Extracting..." : "Extract from URL"}
                    </button>
                  </div>
                  {/* Upload menu images */}
                  <div className="flex gap-2 mb-3">
                    <input
                      ref={menuImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => { if (e.target.files) handleMenuImageUpload(venue.id, e.target.files); }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => menuImageInputRef.current?.click()}
                      disabled={menuImageUploading === venue.id}
                      className="flex-1 py-2 rounded-lg border border-dashed border-amber-400/30 bg-amber-500/5 text-amber-400 text-xs font-bold hover:bg-amber-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-icons-round text-sm">{menuImageUploading === venue.id ? "hourglass_top" : "upload"}</span>
                      {menuImageUploading === venue.id ? "Reading menu images..." : "Upload Menu Images (AI will extract items)"}
                    </button>
                  </div>

                  {menuPreview?.venueId === venue.id && <p className="text-[10px] text-amber-400 font-bold mb-2">Extracted {menuPreview.items.length} items (saved)</p>}

                  {/* Menu items bento grid */}
                  {manualMenuVenueId === venue.id ? (
                    <div className="grid grid-cols-4 gap-2">
                      {manualMenuItems.map((item, idx) => (
                        editingMenuIdx === idx ? (
                          <div key={idx} className="col-span-2 bg-amber-500/5 border-2 border-amber-400/30 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Editing</span>
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => removeManualMenuItem(idx)} className="text-red-400/60 hover:text-red-400 transition-colors"><span className="material-icons-round text-xs">delete</span></button>
                                <button onClick={() => setEditingMenuIdx(null)} className="text-amber-400 hover:text-amber-300 transition-colors"><span className="material-icons-round text-xs">check_circle</span></button>
                              </div>
                            </div>
                            <input value={item.name} onChange={(e) => updateManualMenuItem(idx, "name", e.target.value)} placeholder="Item name *" autoFocus className="w-full bg-white/5 border border-border/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30" />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input value={item.price} onChange={(e) => updateManualMenuItem(idx, "price", e.target.value)} placeholder="$0.00" className="bg-white/5 border border-border/30 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30" />
                              <input value={item.category} onChange={(e) => updateManualMenuItem(idx, "category", e.target.value)} placeholder="Category" className="bg-white/5 border border-border/30 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30" />
                            </div>
                            <input value={item.description} onChange={(e) => updateManualMenuItem(idx, "description", e.target.value)} placeholder="Description (optional)" className="w-full bg-white/5 border border-border/30 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-400/30" />
                          </div>
                        ) : (
                          <div key={idx} onClick={() => setEditingMenuIdx(idx)} className="group bg-white/5 border border-border/20 rounded-xl p-2.5 cursor-pointer hover:border-amber-400/30 hover:bg-amber-500/5 transition-all min-h-[72px] flex flex-col justify-between">
                            <p className="text-[11px] text-white font-semibold truncate group-hover:text-amber-400 transition-colors">{item.name || <span className="text-text-muted italic text-[10px]">Untitled</span>}</p>
                            {item.description && <p className="text-[9px] text-text-muted mt-0.5 line-clamp-1">{item.description}</p>}
                            <div className="flex items-center justify-between mt-1.5">
                              {item.category ? <span className="text-[8px] text-text-muted bg-white/5 px-1 py-0.5 rounded truncate max-w-[60px]">{item.category}</span> : <span />}
                              <span className="text-[10px] text-primary font-bold">{item.price || ""}</span>
                            </div>
                          </div>
                        )
                      ))}
                      <div onClick={() => { addManualMenuItem(); setEditingMenuIdx(manualMenuItems.length); }} className="border border-dashed border-border/30 rounded-xl p-2.5 cursor-pointer hover:border-amber-400/30 hover:bg-amber-500/5 transition-all min-h-[72px] flex flex-col items-center justify-center gap-0.5">
                        <span className="material-icons-round text-lg text-text-muted">add</span>
                        <span className="text-[9px] text-text-muted font-semibold">Add Menu Item</span>
                      </div>
                    </div>
                  ) : venue.menu_items && venue.menu_items.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {venue.menu_items.map((item, idx) => (
                        <div key={idx} onClick={() => openManualMenuEditor(venue.id)} className="group bg-white/5 border border-border/20 rounded-xl p-2.5 cursor-pointer hover:border-amber-400/30 hover:bg-amber-500/5 transition-all min-h-[72px] flex flex-col justify-between">
                          <p className="text-[11px] text-white font-semibold truncate group-hover:text-amber-400 transition-colors">{item.name}</p>
                          {item.description && <p className="text-[9px] text-text-muted mt-0.5 line-clamp-1">{item.description}</p>}
                          <div className="flex items-center justify-between mt-1.5">
                            {item.category ? <span className="text-[8px] text-text-muted bg-white/5 px-1 py-0.5 rounded truncate max-w-[60px]">{item.category}</span> : <span />}
                            {item.price && <span className="text-[10px] text-primary font-bold">{item.price}</span>}
                          </div>
                        </div>
                      ))}
                      <div onClick={() => openManualMenuEditor(venue.id)} className="border border-dashed border-border/30 rounded-xl p-2.5 cursor-pointer hover:border-amber-400/30 hover:bg-amber-500/5 transition-all min-h-[72px] flex flex-col items-center justify-center gap-0.5">
                        <span className="material-icons-round text-lg text-text-muted">add</span>
                        <span className="text-[9px] text-text-muted font-semibold">Add Menu Item</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <div onClick={() => openManualMenuEditor(venue.id)} className="border border-dashed border-border/30 rounded-xl p-2.5 cursor-pointer hover:border-amber-400/30 hover:bg-amber-500/5 transition-all min-h-[72px] flex flex-col items-center justify-center gap-0.5">
                        <span className="material-icons-round text-lg text-text-muted">add</span>
                        <span className="text-[9px] text-text-muted font-semibold">Add Menu Item</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save / Cancel */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                  <button onClick={() => handleSaveEdit(venue.id)} disabled={isPending && processingId === venue.id} className="px-5 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:bg-primary/80 transition-colors disabled:opacity-50">
                    {isPending && processingId === venue.id ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={cancelEdit} className="px-5 py-2 rounded-lg bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ─── Bento Summary Card ─── */
            <div
              key={venue.id}
              className="glass-card rounded-2xl hover:border-primary/30 hover:bg-white/[0.02] transition-all group flex flex-col"
            >
              {/* Top bar — checkbox + action icons */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <div className={`transition-opacity ${selectedVenues.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <button
                    onClick={(e) => toggleSelectVenue(venue.id, e)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedVenues.has(venue.id) ? "bg-primary border-primary" : "border-border/50 hover:border-primary/50"}`}
                  >
                    {selectedVenues.has(venue.id) && <span className="material-icons-round text-black text-xs">check</span>}
                  </button>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative group/tip">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(venue); }} className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                      <span className="material-icons-round text-blue-400 text-xs">edit</span>
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[9px] font-semibold text-white bg-black/90 rounded whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity">Edit</span>
                  </div>
                  <div className="relative group/tip">
                    <Link href={`/venue/${venue.id}`} onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                      <span className="material-icons-round text-primary text-xs">visibility</span>
                    </Link>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[9px] font-semibold text-white bg-black/90 rounded whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity">View</span>
                  </div>
                  <div className="relative group/tip">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(venue.id, venue.name); }} disabled={isPending && processingId === venue.id} className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      <span className="material-icons-round text-red-400 text-xs">delete</span>
                    </button>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[9px] font-semibold text-white bg-black/90 rounded whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity">Delete</span>
                  </div>
                </div>
              </div>

              {/* Clickable body — opens detail */}
              <div onClick={() => startEdit(venue)} className="cursor-pointer flex flex-col flex-1 px-4 pb-4">
                {/* Image + Name */}
                <div className="flex items-center gap-2.5 mb-3">
                  {venue._primary_image ? (
                    <img src={venue._primary_image} alt={venue.name} className="w-11 h-11 rounded-lg object-cover border border-border flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-white/5 border border-border flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-round text-text-muted text-lg">storefront</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">{venue.name}</h3>
                    <p className="text-[10px] text-text-muted truncate">{venue.neighborhood || venue.city}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {venue.is_private_room && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-purple-400/10 text-purple-400">Private</span>}
                  {venue.menu_items && venue.menu_items.length > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400">{venue.menu_items.length} menu</span>}
                  {venue._review_count > 0 && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center gap-0.5">
                      <span className="material-icons-round text-[8px]">star</span>{venue._avg_rating}
                    </span>
                  )}
                  {venue.queue_paused && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">Paused</span>}
                </div>

                {/* Quick stats */}
                <div className="mt-auto pt-2 border-t border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span>{venue._event_count} events</span>
                    {venue._media_count > 0 && <span>{venue._media_count} media</span>}
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${venue.owner_id ? "bg-green-500/10 text-green-400" : "bg-white/5 text-text-muted"}`}>
                    {venue.owner_id ? "Owned" : "No owner"}
                  </span>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {filteredVenues.length === 0 && (
        <div className="text-center py-12 glass-card rounded-2xl mt-4">
          <span className="material-icons-round text-4xl text-text-muted mb-2">search_off</span>
          <p className="text-text-secondary text-sm">No venues match your search</p>
        </div>
      )}

    </div>
  );
}
