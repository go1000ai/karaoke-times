"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { THEME_OPTIONS, FEATURE_OPTIONS } from "@/lib/flyer";
import type { FlyerRequest, FlyerResponse, CopyData } from "@/lib/flyer";

interface VenueOption {
  id: string;
  name: string;
  address: string;
}

interface Props {
  venues: VenueOption[];
  defaultVenueId: string;
}

type GenerationStatus = "idle" | "uploading" | "generating" | "done" | "error";

const LOADING_MESSAGES = [
  "Crafting your event copy...",
  "Designing your flyer...",
  "Adding the finishing touches...",
  "Almost there...",
];

export default function FlyerGenerator({
  venues,
  defaultVenueId,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Venue selection
  const [selectedVenueId, setSelectedVenueId] = useState(
    defaultVenueId || venues[0]?.id || ""
  );
  const selectedVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];
  const venueId = selectedVenue?.id || "";
  const venueName = selectedVenue?.name || "";
  const venueAddress = selectedVenue?.address || "";

  // Section collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basics: true,
    vibe: false,
    specials: false,
    image: false,
  });

  // Form state — Event Basics
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [coverCharge, setCoverCharge] = useState("");

  // Form state — Vibe & Theme
  const [theme, setTheme] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [moodDescription, setMoodDescription] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Form state — Specials & Promos
  const [drinkSpecials, setDrinkSpecials] = useState("");
  const [foodDeals, setFoodDeals] = useState("");
  const [prizes, setPrizes] = useState("");
  const [promoText, setPromoText] = useState("");

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Generation state
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [copyData, setCopyData] = useState<CopyData | null>(null);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Rotate loading messages
  useEffect(() => {
    if (status !== "generating") return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [status]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(): Promise<string | undefined> {
    if (!imageFile || !venueId) return;
    const ext = imageFile.name.split(".").pop();
    const fileName = `${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("flyer-uploads")
      .upload(fileName, imageFile, { contentType: imageFile.type });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return undefined;
    }

    const { data } = supabase.storage
      .from("flyer-uploads")
      .getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleGenerate() {
    if (!eventName.trim()) {
      setError("Please enter an event name.");
      return;
    }
    if (!eventDate) {
      setError("Please select an event date.");
      return;
    }
    if (!startTime.trim()) {
      setError("Please enter a start time.");
      return;
    }

    setStatus("generating");
    setError("");
    setGeneratedImageUrl(null);
    setCopyData(null);
    setLoadingMsgIndex(0);

    try {
      // Upload image first if provided
      let imageUrl: string | undefined;
      if (imageFile) {
        setStatus("uploading");
        imageUrl = await uploadImage();
        setStatus("generating");
      }

      const payload: FlyerRequest = {
        eventName: eventName.trim(),
        venueName,
        venueAddress,
        eventDate,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        coverCharge: coverCharge.trim(),
        theme: theme === "Custom" ? customTheme.trim() : theme,
        moodDescription: moodDescription.trim(),
        dressCode: dressCode.trim(),
        specialFeatures: selectedFeatures,
        drinkSpecials: drinkSpecials.trim(),
        foodDeals: foodDeals.trim(),
        prizes: prizes.trim(),
        promoText: promoText.trim(),
        imageUrl,
        venueId,
      };

      const res = await fetch("/api/generate-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: FlyerResponse = await res.json();

      if (!res.ok || !result.success) {
        setStatus("error");
        setError(result.error || "Flyer generation failed. Please try again.");
        return;
      }

      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      } else if (result.imageBase64) {
        setGeneratedImageUrl(`data:image/webp;base64,${result.imageBase64}`);
      }
      setGeneratedImageBase64(result.imageBase64 || null);

      if (result.copyData) {
        setCopyData(result.copyData);
      }

      setSaveStatus("idle");
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleSave() {
    if (saveStatus !== "idle" || !generatedImageUrl) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/flyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: generatedImageBase64 || undefined,
          imageUrl: !generatedImageBase64 ? generatedImageUrl : undefined,
          eventName,
          venueName,
          venueId,
          eventDate,
          theme: theme === "custom" ? customTheme : theme,
          copyData,
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("idle");
      }
    } catch {
      setSaveStatus("idle");
    }
  }

  function handleRegenerate() {
    handleGenerate();
  }

  function handleStartOver() {
    setEventName("");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setCoverCharge("");
    setTheme("");
    setCustomTheme("");
    setMoodDescription("");
    setDressCode("");
    setSelectedFeatures([]);
    setDrinkSpecials("");
    setFoodDeals("");
    setPrizes("");
    setPromoText("");
    removeImage();
    setStatus("idle");
    setGeneratedImageUrl(null);
    setCopyData(null);
    setError("");
    setOpenSections({ basics: true, vibe: false, specials: false, image: false });
  }

  async function handleShare() {
    if (!generatedImageUrl) return;
    const shareText = copyData?.socialCaption
      ? `${copyData.socialCaption}\n\n${(copyData.hashtags || []).map((h) => `#${h}`).join(" ")}`
      : `Check out ${eventName} at ${venueName}!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${eventName} at ${venueName}`,
          text: shareText,
          url: generatedImageUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(generatedImageUrl);
      alert("Flyer URL copied to clipboard!");
    }
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  // --- RENDER ---

  // Show preview when done
  if (status === "done" && generatedImageUrl) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6 animate-[fadeIn_0.5s_ease-out]">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span className="material-icons-round text-primary">
              auto_awesome
            </span>
            Your Flyer is Ready!
          </h2>
          <div className="rounded-xl overflow-hidden border border-border bg-black/30">
            <img
              src={generatedImageUrl}
              alt={`${eventName} flyer`}
              className="w-full max-h-[700px] object-contain"
            />
          </div>
        </div>

        {/* Generated Copy Data */}
        {copyData && (
          <div className="glass-card rounded-2xl p-6 animate-[fadeIn_0.5s_ease-out] space-y-5">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="material-icons-round text-accent">
                edit_note
              </span>
              Generated Copy
            </h2>

            {/* Headline & Tagline */}
            <div>
              <p className="text-white font-bold text-xl">{copyData.headline}</p>
              <p className="text-text-secondary text-sm mt-1">{copyData.tagline}</p>
            </div>

            {/* Highlights */}
            {copyData.highlights?.length > 0 && (
              <div className="space-y-1.5">
                {copyData.highlights.map((h, i) => (
                  <p key={i} className="text-text-secondary text-sm">{h}</p>
                ))}
              </div>
            )}

            {/* Social Caption - Copy to Clipboard */}
            {copyData.socialCaption && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                    Social Media Caption
                  </label>
                  <button
                    onClick={() => copyToClipboard(copyData.socialCaption, "caption")}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="material-icons-round text-sm">
                      {copiedField === "caption" ? "check" : "content_copy"}
                    </span>
                    {copiedField === "caption" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-text-secondary text-sm bg-white/5 rounded-xl px-4 py-3 border border-border">
                  {copyData.socialCaption}
                </p>
              </div>
            )}

            {/* Hashtags - Copy to Clipboard */}
            {copyData.hashtags?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-wider">
                    Hashtags
                  </label>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        copyData.hashtags.map((h) => `#${h}`).join(" "),
                        "hashtags"
                      )
                    }
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="material-icons-round text-sm">
                      {copiedField === "hashtags" ? "check" : "content_copy"}
                    </span>
                    {copiedField === "hashtags" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {copyData.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {saveStatus === "saved" ? (
            <span className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-6 py-2.5 rounded-xl border border-primary/20">
              <span className="material-icons-round text-lg">check_circle</span>
              Saved to My Flyers
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <span className="material-icons-round text-lg">
                {saveStatus === "saving" ? "hourglass_empty" : "bookmark"}
              </span>
              {saveStatus === "saving" ? "Saving..." : "Save to My Flyers"}
            </button>
          )}
          <a
            href={generatedImageUrl}
            download={`${eventName.replace(/\s+/g, "-").toLowerCase()}-flyer.webp`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-2.5 rounded-xl transition-colors border border-border"
          >
            <span className="material-icons-round text-lg">download</span>
            Download
          </a>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent font-bold px-6 py-2.5 rounded-xl transition-colors border border-accent/30"
          >
            <span className="material-icons-round text-lg">share</span>
            Share
          </button>
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-2.5 rounded-xl transition-colors border border-border"
          >
            <span className="material-icons-round text-lg">refresh</span>
            Regenerate
          </button>
          <button
            onClick={handleStartOver}
            className="flex items-center gap-2 text-text-muted hover:text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
          >
            <span className="material-icons-round text-lg">restart_alt</span>
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section 1: Event Basics */}
      <CollapsibleSection
        title="Event Basics"
        icon="event"
        isOpen={openSections.basics}
        onToggle={() => toggleSection("basics")}
        filled={!!eventName && !!eventDate && !!startTime}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Event Name *
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Latin Karaoke Fridays"
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Venue
            </label>
            {venues.length > 1 ? (
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={venueName}
                readOnly
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-text-secondary text-sm cursor-not-allowed"
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Date *
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Cover Charge
            </label>
            <input
              type="text"
              value={coverCharge}
              onChange={(e) => setCoverCharge(e.target.value)}
              placeholder="Free / $10 / $15 before 11pm"
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Start Time *
            </label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="9:00 PM"
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              End Time
            </label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="2:00 AM"
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        {venueAddress && (
          <div className="mt-3">
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Address
            </label>
            <input
              type="text"
              value={venueAddress}
              readOnly
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-text-secondary text-sm cursor-not-allowed"
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Section 2: Vibe & Theme */}
      <CollapsibleSection
        title="Vibe & Theme"
        icon="palette"
        isOpen={openSections.vibe}
        onToggle={() => toggleSection("vibe")}
        filled={!!theme || !!moodDescription}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
                Theme / Genre
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select a theme...</option>
                {THEME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
                Dress Code
              </label>
              <input
                type="text"
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
                placeholder="Casual / Smart casual / Themed"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {theme === "Custom" && (
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
                Custom Theme
              </label>
              <input
                type="text"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Describe your theme..."
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Mood / Atmosphere
            </label>
            <textarea
              value={moodDescription}
              onChange={(e) => setMoodDescription(e.target.value)}
              placeholder="Describe the vibe you want to convey... e.g., 'High-energy party with neon lights, great for groups and birthday celebrations'"
              rows={3}
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-2 font-semibold uppercase tracking-wider">
              Special Features
            </label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedFeatures.includes(feature)
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "bg-white/5 text-text-muted border border-border hover:border-accent/30 hover:text-text-secondary"
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: Specials & Promos */}
      <CollapsibleSection
        title="Specials & Promos"
        icon="local_offer"
        isOpen={openSections.specials}
        onToggle={() => toggleSection("specials")}
        filled={!!drinkSpecials || !!foodDeals || !!prizes}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
                Drink Specials
              </label>
              <textarea
                value={drinkSpecials}
                onChange={(e) => setDrinkSpecials(e.target.value)}
                placeholder="$5 margaritas, 2-for-1 beers before 10pm..."
                rows={2}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
                Food Deals
              </label>
              <textarea
                value={foodDeals}
                onChange={(e) => setFoodDeals(e.target.value)}
                placeholder="Half-price appetizers, free wings with pitcher..."
                rows={2}
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Prizes / Giveaways
            </label>
            <input
              type="text"
              value={prizes}
              onChange={(e) => setPrizes(e.target.value)}
              placeholder="$100 cash prize for best performance, free karaoke gift cards..."
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5 font-semibold uppercase tracking-wider">
              Additional Promo Text
            </label>
            <textarea
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="Anything else you want on the flyer... e.g., 'Tag us @venue on Instagram for a free shot!'"
              rows={2}
              className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: Style Reference */}
      <CollapsibleSection
        title="Style Reference"
        icon="style"
        isOpen={openSections.image}
        onToggle={() => toggleSection("image")}
        filled={!!imageFile}
        optional
      >
        <p className="text-text-muted text-xs mb-3">
          Upload a flyer or design you love — the AI will analyze its style (colors, typography, layout) and create your flyer to match that look.
        </p>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="max-h-48 rounded-xl border border-border"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <span className="material-icons-round text-sm">close</span>
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <span className="material-icons-round text-3xl text-text-muted mb-2 block">
              cloud_upload
            </span>
            <p className="text-text-secondary text-sm">
              Drop a sample flyer here, or click to browse
            </p>
            <p className="text-text-muted text-xs mt-1">
              Upload any flyer or design you want to match (max 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 text-red-400 rounded-xl px-4 py-3 text-sm border border-red-500/20">
          <span className="material-icons-round text-lg">error</span>
          {error}
        </div>
      )}

      {/* Loading State */}
      {(status === "generating" || status === "uploading") && (
        <div className="glass-card rounded-2xl p-8 text-center animate-[fadeIn_0.3s_ease-out]">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-1">
            {status === "uploading"
              ? "Uploading your image..."
              : LOADING_MESSAGES[loadingMsgIndex]}
          </p>
          <p className="text-text-muted text-sm">
            This may take 15-30 seconds
          </p>
        </div>
      )}

      {/* Generate Button */}
      {status === "idle" || status === "error" ? (
        <button
          onClick={handleGenerate}
          disabled={!eventName || !eventDate || !startTime}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg"
        >
          <span className="material-icons-round">auto_awesome</span>
          Generate Flyer
        </button>
      ) : null}
    </div>
  );
}

// --- Collapsible Section Component ---

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  filled,
  optional,
  children,
}: {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  filled: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-icons-round text-primary">{icon}</span>
          <span className="text-white font-bold">{title}</span>
          {optional && (
            <span className="text-text-muted text-xs font-normal">
              (Optional)
            </span>
          )}
          {filled && !isOpen && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </div>
        <span
          className={`material-icons-round text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 animate-[fadeIn_0.2s_ease-out]">{children}</div>
      )}
    </div>
  );
}
