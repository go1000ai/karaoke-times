"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateUserProfile, deleteUser } from "../../actions";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  last_sign_in_at: string | null;
  isKJ: boolean;
};

type VenueRef = { id: string; name: string };

const ROLE_OPTIONS = [
  { value: "user", label: "Singer (user)" },
  { value: "venue_owner", label: "Venue Owner" },
  { value: "admin", label: "Admin" },
  { value: "advertiser", label: "Advertiser" },
];

export function UserProfileEditor({
  profile,
  ownedVenues,
  staffVenues,
  songsRequested,
}: {
  profile: Profile;
  ownedVenues: VenueRef[];
  staffVenues: VenueRef[];
  songsRequested: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    role: profile.role,
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    website: profile.website ?? "",
    instagram: profile.social_links?.instagram ?? "",
    facebook: profile.social_links?.facebook ?? "",
    tiktok: profile.social_links?.tiktok ?? "",
    twitter: profile.social_links?.twitter ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const social_links: Record<string, string> = {};
      if (form.instagram) social_links.instagram = form.instagram;
      if (form.facebook) social_links.facebook = form.facebook;
      if (form.tiktok) social_links.tiktok = form.tiktok;
      if (form.twitter) social_links.twitter = form.twitter;

      const result = await updateUserProfile(profile.id, {
        display_name: form.display_name || null,
        role: form.role,
        phone: form.phone || null,
        address: form.address || null,
        website: form.website || null,
        social_links,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete user "${profile.display_name || profile.email || profile.id}"? This cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteUser(profile.id);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/users");
      }
    });
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400",
    venue_owner: "bg-amber-400/10 text-amber-400",
    user: "bg-white/5 text-text-muted",
    advertiser: "bg-primary/10 text-primary",
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 md:p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? ""}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="material-icons-round text-primary text-3xl">person</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-white">
              {profile.display_name || "Unnamed User"}
            </h1>
            <p className="text-text-secondary text-sm break-all">
              {profile.email ?? profile.id}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  roleColors[profile.role] || roleColors.user
                }`}
              >
                {profile.role.toUpperCase()}
              </span>
              {profile.isKJ && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">
                  KJ
                </span>
              )}
              <span className="text-xs text-text-muted">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </span>
              {profile.last_sign_in_at && (
                <span className="text-xs text-text-muted">
                  · Last seen {new Date(profile.last_sign_in_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mt-5 pt-5 border-t border-border/30">
          <Stat label="Songs Requested" value={songsRequested} />
          <Stat label="Owned Venues" value={ownedVenues.length} />
          <Stat label="KJ Venues" value={staffVenues.length} />
        </div>
      </div>

      {/* Editable Fields */}
      <div className="glass-card rounded-2xl p-5 md:p-6 mb-6">
        <h2 className="text-lg font-extrabold text-white mb-1">Profile Details</h2>
        <p className="text-text-secondary text-sm mb-5">
          Admin can edit any field. Email is managed in Supabase Auth and is read-only.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Display Name">
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              className="input-base"
            />
          </Field>

          <Field label="Email (read-only)">
            <input
              type="email"
              value={profile.email ?? ""}
              disabled
              className="input-base opacity-60 cursor-not-allowed"
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(555) 555-5555"
              className="input-base"
            />
          </Field>

          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="input-base"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Address" full>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="123 Main St, City, State"
              className="input-base"
            />
          </Field>

          <Field label="Website" full>
            <input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://"
              className="input-base"
            />
          </Field>
        </div>
      </div>

      {/* Social Links */}
      <div className="glass-card rounded-2xl p-5 md:p-6 mb-6">
        <h2 className="text-lg font-extrabold text-white mb-5">Social Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Instagram">
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
              placeholder="@username or URL"
              className="input-base"
            />
          </Field>
          <Field label="Facebook">
            <input
              type="text"
              value={form.facebook}
              onChange={(e) => update("facebook", e.target.value)}
              placeholder="Profile URL"
              className="input-base"
            />
          </Field>
          <Field label="TikTok">
            <input
              type="text"
              value={form.tiktok}
              onChange={(e) => update("tiktok", e.target.value)}
              placeholder="@username"
              className="input-base"
            />
          </Field>
          <Field label="X / Twitter">
            <input
              type="text"
              value={form.twitter}
              onChange={(e) => update("twitter", e.target.value)}
              placeholder="@username"
              className="input-base"
            />
          </Field>
        </div>
      </div>

      {/* Connected Venues */}
      {(ownedVenues.length > 0 || staffVenues.length > 0) && (
        <div className="glass-card rounded-2xl p-5 md:p-6 mb-6">
          <h2 className="text-lg font-extrabold text-white mb-4">Connected Venues</h2>
          {ownedVenues.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">
                Owns
              </p>
              <div className="flex flex-wrap gap-2">
                {ownedVenues.map((v) => (
                  <Link
                    key={v.id}
                    href={`/admin/venues`}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors"
                  >
                    {v.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {staffVenues.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-2">
                KJ at
              </p>
              <div className="flex flex-wrap gap-2">
                {staffVenues.map((v) => (
                  <Link
                    key={v.id}
                    href={`/admin/venues`}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors"
                  >
                    {v.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="sticky bottom-0 md:static glass-card rounded-2xl p-4 md:p-5 -mx-4 md:mx-0 border-t border-border md:border-t-0">
        {error && (
          <p className="text-sm text-red-400 mb-3 px-2">{error}</p>
        )}
        {saved && !error && (
          <p className="text-sm text-primary mb-3 px-2">✓ Saved</p>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-primary text-bg-dark font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-white/5 text-text-secondary text-sm hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="ml-auto px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <style jsx>{`
        :global(.input-base) {
          width: 100%;
          background: rgb(22 22 30 / 0.8);
          border: 1px solid rgb(255 255 255 / 0.08);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        :global(.input-base:focus) {
          outline: none;
          border-color: rgb(0 255 194 / 0.4);
          box-shadow: 0 0 0 2px rgb(0 255 194 / 0.15);
        }
        :global(.input-base::placeholder) {
          color: rgb(255 255 255 / 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-xs uppercase tracking-wider text-text-muted font-bold mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
        {label}
      </p>
      <p className="text-xl md:text-2xl font-extrabold text-white">{value}</p>
    </div>
  );
}
