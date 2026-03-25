"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  link_url: string | null;
  category: string;
  tagline: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const CATEGORIES = [
  { value: "liquor", label: "Liquor Brand", icon: "local_bar", color: "text-amber-400" },
  { value: "equipment", label: "Equipment", icon: "speaker", color: "text-blue-400" },
  { value: "entertainment", label: "Entertainment", icon: "music_note", color: "text-purple-400" },
  { value: "venue", label: "Venue / Space", icon: "storefront", color: "text-green-400" },
  { value: "general", label: "General", icon: "business", color: "text-gray-400" },
];

const BLANK: Omit<Sponsor, "id" | "created_at"> = {
  name: "",
  logo_url: "",
  link_url: "",
  category: "general",
  tagline: "",
  is_active: true,
  display_order: 0,
};

export function SponsorsList({ sponsors: initial }: { sponsors: Sponsor[] }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<typeof BLANK>(BLANK);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");

  const supabase = createClient();

  const displayed = filterCat === "all" ? sponsors : sponsors.filter((s) => s.category === filterCat);

  function openAdd() {
    setEditing(null);
    setForm(BLANK);
    setError(null);
    setShowForm(true);
  }

  function openEdit(s: Sponsor) {
    setEditing(s);
    setForm({
      name: s.name,
      logo_url: s.logo_url ?? "",
      link_url: s.link_url ?? "",
      category: s.category,
      tagline: s.tagline ?? "",
      is_active: s.is_active,
      display_order: s.display_order,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        logo_url: form.logo_url?.trim() || null,
        link_url: form.link_url?.trim() || null,
        category: form.category,
        tagline: form.tagline?.trim() || null,
        is_active: form.is_active,
        display_order: Number(form.display_order) || 0,
      };

      if (editing) {
        const { data, error: err } = await supabase
          .from("sponsors")
          .update(payload)
          .eq("id", editing.id)
          .select()
          .single();
        if (err) throw err;
        setSponsors((prev) => prev.map((s) => (s.id === editing.id ? (data as Sponsor) : s)));
      } else {
        const { data, error: err } = await supabase
          .from("sponsors")
          .insert(payload)
          .select()
          .single();
        if (err) throw err;
        setSponsors((prev) => [data as Sponsor, ...prev]);
      }
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(sponsor: Sponsor) {
    setToggling(sponsor.id);
    const { error: err } = await supabase
      .from("sponsors")
      .update({ is_active: !sponsor.is_active })
      .eq("id", sponsor.id);
    if (!err) {
      setSponsors((prev) => prev.map((s) => s.id === sponsor.id ? { ...s, is_active: !sponsor.is_active } : s));
    }
    setToggling(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sponsor? This cannot be undone.")) return;
    setDeleting(id);
    await supabase.from("sponsors").delete().eq("id", id);
    setSponsors((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  }

  const catInfo = (cat: string) => CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[4];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsors & Partners</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage brands shown in the homepage carousel and KJ TV display.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <span className="material-icons-round text-lg">add</span>
          Add Sponsor
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCat === "all" ? "bg-primary text-black" : "glass-card text-text-secondary hover:text-white"}`}
        >
          All ({sponsors.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = sponsors.filter((s) => s.category === c.value).length;
          if (count === 0) return null;
          return (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCat === c.value ? "bg-primary text-black" : "glass-card text-text-secondary hover:text-white"}`}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-8 border border-primary/20">
          <h3 className="text-white font-bold text-lg mb-5">
            {editing ? "Edit Sponsor" : "Add New Sponsor"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                Company / Brand Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Crown Royal"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-card-dark border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={form.logo_url ?? ""}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                Website / Link URL
              </label>
              <input
                type="url"
                value={form.link_url ?? ""}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://example.com"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                Tagline (optional)
              </label>
              <input
                type="text"
                value={form.tagline ?? ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. The Water of Life"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                Display Order (lower = first)
              </label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Logo preview */}
          {form.logo_url && (
            <div className="mb-4">
              <p className="text-text-muted text-xs mb-2">Logo Preview:</p>
              <div className="w-32 h-16 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={form.logo_url}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain p-2"
                  onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-text-secondary">Active (show on site)</span>
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Sponsor"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="glass-card text-text-secondary text-sm px-5 py-2.5 rounded-xl hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sponsors list */}
      {displayed.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <span className="material-icons-round text-4xl text-text-muted mb-3 block">business</span>
          <p className="text-text-muted">No sponsors yet. Click &ldquo;Add Sponsor&rdquo; to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((s) => {
            const cat = catInfo(s.category);
            return (
              <div
                key={s.id}
                className={`glass-card rounded-2xl p-4 flex items-center gap-4 transition-all ${
                  !s.is_active ? "opacity-40 grayscale" : ""
                }`}
              >
                {/* Logo */}
                <div className="w-16 h-12 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {s.logo_url ? (
                    <img
                      src={s.logo_url}
                      alt={s.name}
                      className="max-w-full max-h-full object-contain p-1"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = "none";
                        t.parentElement!.innerHTML = `<span class="material-icons-round text-text-muted text-2xl">${cat.icon}</span>`;
                      }}
                    />
                  ) : (
                    <span className={`material-icons-round text-2xl ${cat.color}`}>{cat.icon}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-sm">{s.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 ${cat.color}`}>
                      {cat.label}
                    </span>
                    {!s.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  {s.tagline && (
                    <p className="text-text-muted text-xs mt-0.5 truncate">{s.tagline}</p>
                  )}
                  {s.link_url && (
                    <a
                      href={s.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs hover:underline truncate block mt-0.5"
                    >
                      {s.link_url}
                    </a>
                  )}
                </div>

                {/* Order badge */}
                <div className="text-center flex-shrink-0 hidden sm:block">
                  <p className="text-[10px] text-text-muted">Order</p>
                  <p className="text-white font-bold text-sm">{s.display_order}</p>
                </div>

                {/* Visible toggle */}
                <button
                  onClick={() => handleToggle(s)}
                  disabled={toggling === s.id}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all disabled:opacity-50 ${
                    s.is_active
                      ? "bg-green-500/10 border-green-500/30 hover:bg-red-500/10 hover:border-red-500/30 group"
                      : "bg-red-500/10 border-red-500/20 hover:bg-green-500/10 hover:border-green-500/30 group"
                  }`}
                  title={s.is_active ? "Click to hide from site" : "Click to show on site"}
                >
                  {/* Toggle pill */}
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${
                    s.is_active ? "bg-green-500" : "bg-white/20"
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                      s.is_active ? "left-[22px]" : "left-0.5"
                    }`} />
                  </div>
                  <span className={`text-[10px] font-bold whitespace-nowrap transition-colors ${
                    s.is_active ? "text-green-400 group-hover:text-red-400" : "text-red-400 group-hover:text-green-400"
                  }`}>
                    {toggling === s.id ? "..." : s.is_active ? "Live" : "Hidden"}
                  </span>
                </button>

                {/* Edit + Delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(s)}
                    title="Edit"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="material-icons-round text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    title="Delete"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/5 text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <span className="material-icons-round text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
