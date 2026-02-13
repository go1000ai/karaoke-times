"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface TVSettings {
  show_specials: boolean;
  show_promos: boolean;
  show_media: boolean;
  show_event: boolean;
  show_queue: boolean;
  show_qr: boolean;
  slide_interval: number;
}

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  show_on_tv: boolean;
  label: string | null;
  sort_order: number;
}

const DEFAULT_SETTINGS: TVSettings = {
  show_specials: true,
  show_promos: true,
  show_media: true,
  show_event: true,
  show_queue: true,
  show_qr: true,
  slide_interval: 8,
};

const TOGGLE_OPTIONS: { key: keyof TVSettings; label: string; description: string; icon: string }[] = [
  { key: "show_specials", label: "Bar Specials", description: "Featured menu items with prices from your POS", icon: "local_bar" },
  { key: "show_promos", label: "Promotions", description: "Active venue promotions and deals", icon: "local_offer" },
  { key: "show_media", label: "Flyers & Media", description: "Images and videos you've selected to display", icon: "photo_library" },
  { key: "show_event", label: "Tonight's Event", description: "Current event info, KJ name, and schedule", icon: "event" },
  { key: "show_queue", label: "Song Queue", description: "Live queue showing who's up next and in line", icon: "queue_music" },
  { key: "show_qr", label: "QR Code", description: "Scannable QR code so guests can request songs", icon: "qr_code_2" },
];

const INTERVAL_OPTIONS = [5, 8, 10, 15, 20, 30];

export default function TVDisplaySettingsPage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [settings, setSettings] = useState<TVSettings>(DEFAULT_SETTINGS);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Find venue + load settings + media
  useEffect(() => {
    if (!user) return;
    const findVenue = async () => {
      // Check cookie for selected venue
      const res = await fetch("/api/active-venue");
      const { venueId: activeId } = await res.json();

      let vid: string | null = null;

      if (activeId) {
        const { data } = await supabase
          .from("venues")
          .select("id, name, tv_display_settings")
          .eq("id", activeId)
          .single();
        if (data) {
          vid = data.id;
          setVenueId(data.id);
          setVenueName(data.name);
          if (data.tv_display_settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.tv_display_settings });
          }
        }
      }

      // 2. KJ: connected venue via venue_staff
      if (!vid) {
        const { data: staffRecords } = await supabase
          .from("venue_staff")
          .select("venue_id")
          .eq("user_id", user.id)
          .not("accepted_at", "is", null)
          .limit(1);

        if (staffRecords?.[0]) {
          const staffVenueId = staffRecords[0].venue_id;
          const { data } = await supabase
            .from("venues")
            .select("id, name, tv_display_settings")
            .eq("id", staffVenueId)
            .single();
          if (data) {
            vid = data.id;
            setVenueId(data.id);
            setVenueName(data.name);
            if (data.tv_display_settings) {
              setSettings({ ...DEFAULT_SETTINGS, ...data.tv_display_settings });
            }
          }
        }
      }

      // 3. Fallback — owned venue
      if (!vid) {
        const { data: owned } = await supabase
          .from("venues")
          .select("id, name, tv_display_settings")
          .eq("owner_id", user.id)
          .limit(1)
          .single();
        if (owned) {
          vid = owned.id;
          setVenueId(owned.id);
          setVenueName(owned.name);
          if (owned.tv_display_settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...owned.tv_display_settings });
          }
        }
      }

      // Load media
      if (vid) {
        const { data: mediaData } = await supabase
          .from("venue_media")
          .select("id, url, type, show_on_tv, label, sort_order")
          .eq("venue_id", vid)
          .order("sort_order");
        if (mediaData) setMedia(mediaData as MediaItem[]);
      }

      setLoading(false);
    };
    findVenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleToggle = (key: keyof TVSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleIntervalChange = (value: number) => {
    setSettings((prev) => ({ ...prev, slide_interval: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!venueId) return;
    setSaving(true);
    await supabase
      .from("venues")
      .update({ tv_display_settings: settings })
      .eq("id", venueId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  /* ── Media upload ───────────────────────────────────── */
  const uploadFiles = async (files: FileList | File[]) => {
    if (!venueId || !user) return;
    const fileArray = Array.from(files);
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/quicktime", "video/webm",
    ];
    const valid = fileArray.filter((f) => allowed.includes(f.type));
    if (valid.length === 0) {
      alert("Please upload images (JPG, PNG, WebP, GIF) or videos (MP4, MOV, WebM).");
      return;
    }

    setUploading(true);
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      setUploadProgress(`Uploading ${i + 1} of ${valid.length}...`);
      const ext = file.name.split(".").pop();
      const fileName = `${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const isVideo = file.type.startsWith("video/");

      const { error: uploadError } = await supabase.storage
        .from("venue-media")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("venue-media")
        .getPublicUrl(fileName);

      const nextOrder = media.length + i;
      const { data: inserted, error: dbError } = await supabase
        .from("venue_media")
        .insert({
          venue_id: venueId,
          url: urlData.publicUrl,
          type: isVideo ? "video" : "image",
          is_primary: false,
          sort_order: nextOrder,
          show_on_tv: true, // default to showing on TV when uploaded here
        })
        .select("id, url, type, show_on_tv, label, sort_order")
        .single();

      if (!dbError && inserted) {
        setMedia((prev) => [...prev, inserted as MediaItem]);
      }
    }
    setUploading(false);
    setUploadProgress("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  /* ── Toggle show_on_tv per media item ───────────────── */
  const toggleMediaDisplay = async (item: MediaItem) => {
    const newVal = !item.show_on_tv;
    setMedia((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, show_on_tv: newVal } : m))
    );
    await supabase
      .from("venue_media")
      .update({ show_on_tv: newVal })
      .eq("id", item.id);
  };

  /* ── Delete media item ──────────────────────────────── */
  const deleteMedia = async (item: MediaItem) => {
    const urlParts = item.url.split("/venue-media/");
    const filePath = urlParts[1];
    if (filePath) {
      await supabase.storage.from("venue-media").remove([filePath]);
    }
    await supabase.from("venue_media").delete().eq("id", item.id);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="text-center py-20">
        <span className="material-icons-round text-5xl text-text-muted mb-3">tv_off</span>
        <p className="text-text-muted">No venue found. Please select a venue first.</p>
      </div>
    );
  }

  const tvUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/venue/${venueId}/tv`;
  const displayCount = media.filter((m) => m.show_on_tv).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">TV Display Settings</h1>
        <p className="text-text-muted text-sm mt-1">
          Control what content appears on the TV screen for {venueName}
        </p>
      </div>

      {/* TV Link */}
      <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-icons-round text-primary text-2xl">tv</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold">TV Display URL</p>
          <p className="text-text-muted text-xs truncate mt-0.5">{tvUrl}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(tvUrl)}
          className="text-primary hover:text-white transition-colors flex items-center gap-1.5 text-sm font-semibold"
        >
          <span className="material-icons-round text-lg">content_copy</span>
          Copy
        </button>
        <a
          href={tvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-white transition-colors flex items-center gap-1.5 text-sm font-semibold"
        >
          <span className="material-icons-round text-lg">open_in_new</span>
          Open
        </a>
      </div>

      {/* Content Toggles */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-white font-bold text-lg">Display Content</h2>
          <p className="text-text-muted text-xs mt-0.5">
            Choose which sections appear on your TV display
          </p>
        </div>

        <div className="divide-y divide-border/50">
          {TOGGLE_OPTIONS.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-round text-text-secondary text-xl">
                  {opt.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{opt.label}</p>
                <p className="text-text-muted text-xs mt-0.5">{opt.description}</p>
              </div>
              <button
                onClick={() => handleToggle(opt.key)}
                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                  settings[opt.key] ? "bg-primary" : "bg-white/10"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    settings[opt.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Slide Interval */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-icons-round text-text-secondary">timer</span>
          <div>
            <p className="text-white font-bold text-sm">Slide Duration</p>
            <p className="text-text-muted text-xs">
              How long each content panel stays on screen
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTERVAL_OPTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => handleIntervalChange(sec)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                settings.slide_interval === sec
                  ? "bg-primary text-black"
                  : "bg-white/5 text-text-secondary hover:bg-white/10"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* ── Flyers & Media Section ─────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Flyers & Media</h2>
              <p className="text-text-muted text-xs mt-0.5">
                Upload flyers, postcards, images, or videos. Check the box to display them on TV.
              </p>
            </div>
            {media.length > 0 && (
              <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full">
                {displayCount} on TV
              </span>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`m-4 rounded-2xl p-6 border-2 border-dashed transition-colors text-center cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : uploading
                ? "border-accent/30 bg-accent/5"
                : "border-border hover:border-primary/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-accent font-semibold">{uploadProgress}</p>
            </>
          ) : (
            <>
              <span className="material-icons-round text-3xl text-text-muted mb-2">cloud_upload</span>
              <p className="text-white font-semibold text-sm mb-1">Upload Flyers, Images, or Videos</p>
              <p className="text-text-muted text-xs">
                Drag & drop or click to browse. JPG, PNG, GIF, MP4, MOV, WebM.
              </p>
            </>
          )}
        </div>

        {/* Media Grid */}
        {media.length > 0 && (
          <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-3 gap-3">
            {media.map((item) => (
              <div
                key={item.id}
                className={`relative group rounded-xl overflow-hidden border-2 transition-colors ${
                  item.show_on_tv
                    ? "border-primary/50"
                    : "border-transparent"
                }`}
              >
                {/* Preview */}
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    className="w-full aspect-video object-cover"
                    preload="metadata"
                    muted
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                )}

                {/* Display badge */}
                {item.show_on_tv && (
                  <div className="absolute top-2 left-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-icons-round text-xs">tv</span>
                    On TV
                  </div>
                )}

                {/* Type badge */}
                {item.type === "video" && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Video
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 flex items-end justify-between">
                  {/* Toggle display */}
                  <button
                    onClick={() => toggleMediaDisplay(item)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                      item.show_on_tv
                        ? "bg-primary text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <span className="material-icons-round text-sm">
                      {item.show_on_tv ? "check_box" : "check_box_outline_blank"}
                    </span>
                    {item.show_on_tv ? "Displaying" : "Display"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteMedia(item)}
                    className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <span className="material-icons-round text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {media.length === 0 && (
          <div className="px-4 pb-5 text-center">
            <p className="text-text-muted text-xs">No media uploaded yet. Upload flyers and images to display on your TV!</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-black font-bold text-sm px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <span className="material-icons-round text-lg">save</span>
              Save Settings
            </>
          )}
        </button>
        {saved && (
          <span className="text-primary text-sm font-semibold flex items-center gap-1">
            <span className="material-icons-round text-lg">check_circle</span>
            Settings saved!
          </span>
        )}
      </div>
    </div>
  );
}
