"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export default function MediaPage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Get venue and media (works for both owners and KJs)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Try owner first
      let venue: { id: string } | null = null;
      const { data: ownedVenue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      venue = ownedVenue;

      // If not an owner, check venue_staff (KJ)
      if (!venue) {
        const { data: staffRecord } = await supabase
          .from("venue_staff")
          .select("venue_id")
          .eq("user_id", user.id)
          .not("accepted_at", "is", null)
          .limit(1)
          .single();

        if (staffRecord) {
          venue = { id: staffRecord.venue_id };
        }
      }

      if (!venue) { setLoading(false); return; }
      setVenueId(venue.id);

      const { data: mediaData } = await supabase
        .from("venue_media")
        .select("*")
        .eq("venue_id", venue.id)
        .order("sort_order");

      setMedia((mediaData as MediaItem[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [user, supabase]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!venueId || !user) return;

    const fileArray = Array.from(files);
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"];
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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("venue-media")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("venue-media")
        .getPublicUrl(fileName);

      // Save to venue_media table
      const nextOrder = media.length + i;
      const { data: inserted, error: dbError } = await supabase
        .from("venue_media")
        .insert({
          venue_id: venueId,
          url: urlData.publicUrl,
          type: isVideo ? "video" : "image",
          is_primary: media.length === 0 && i === 0,
          sort_order: nextOrder,
        })
        .select()
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

  const handleDelete = async (item: MediaItem) => {
    // Extract file path from URL
    const urlParts = item.url.split("/venue-media/");
    const filePath = urlParts[1];

    if (filePath) {
      await supabase.storage.from("venue-media").remove([filePath]);
    }

    await supabase.from("venue_media").delete().eq("id", item.id);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
  };

  const handleSetPrimary = async (item: MediaItem) => {
    if (!venueId) return;

    // Unset all primary
    await supabase
      .from("venue_media")
      .update({ is_primary: false })
      .eq("venue_id", venueId);

    // Set new primary
    await supabase
      .from("venue_media")
      .update({ is_primary: true })
      .eq("id", item.id);

    setMedia((prev) =>
      prev.map((m) => ({ ...m, is_primary: m.id === item.id }))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">Media</h1>
      <p className="text-text-secondary text-sm mb-8">
        Upload photos and videos of your venue. The primary photo shows on your listing.
      </p>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-card rounded-2xl p-8 border-2 border-dashed transition-colors mb-8 text-center cursor-pointer ${
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
            <span className="material-icons-round text-4xl text-text-muted mb-2">cloud_upload</span>
            <p className="text-white font-semibold mb-1">Upload Photos or Videos</p>
            <p className="text-text-muted text-xs">
              Drag & drop or click to browse. JPG, PNG, GIF, MP4, MOV, WebM. Up to 50MB.
            </p>
          </>
        )}
      </div>

      {/* Photos Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-primary">photo_library</span>
            <h2 className="font-bold text-white">Photos</h2>
          </div>
          <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">
            {images.length}
          </span>
        </div>

        {images.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-icons-round text-3xl text-text-muted mb-2">add_photo_alternate</span>
            <p className="text-text-muted text-sm">No photos yet. Upload some to attract customers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((item) => (
              <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden">
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {item.is_primary && (
                  <div className="absolute top-2 left-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {!item.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(item)}
                      className="text-white hover:text-primary transition-colors"
                      title="Set as primary"
                    >
                      <span className="material-icons-round text-2xl">star</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-white hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <span className="material-icons-round text-2xl">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-accent">videocam</span>
            <h2 className="font-bold text-white">Videos</h2>
          </div>
          <span className="text-xs text-text-muted font-bold bg-white/5 px-2.5 py-1 rounded-full">
            {videos.length}
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-icons-round text-3xl text-text-muted mb-2">video_library</span>
            <p className="text-text-muted text-sm">No videos yet. Upload venue clips to show off the vibe!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((item) => (
              <div key={item.id} className="relative group glass-card rounded-xl overflow-hidden">
                <video
                  src={item.url}
                  className="w-full aspect-video object-cover"
                  controls
                  preload="metadata"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(item)}
                    className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <span className="material-icons-round text-xl">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
