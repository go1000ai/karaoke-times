"use client";

import { useState, useRef } from "react";
import promptConfig from "@/lib/flyer-prompts.json";

type Style = { name: string; prompt: string; colors: string[][] };
const STYLES = promptConfig.styles as Record<string, Style>;
const STYLE_KEYS = Object.keys(STYLES);

export function RegenerateFlyerModal({
  venueId,
  venueName,
  currentImage,
  onClose,
  onSuccess,
}: {
  venueId: string;
  venueName: string;
  currentImage: string | null;
  onClose: () => void;
  onSuccess: (newImageUrl: string) => void;
}) {
  // "" means "no named style — generate from colors + direction + reference only"
  const [styleKey, setStyleKey] = useState<string>(STYLE_KEYS[0]);
  const [color1, setColor1] = useState<string>(STYLES[STYLE_KEYS[0]].colors[0][0]);
  const [color2, setColor2] = useState<string>(STYLES[STYLE_KEYS[0]].colors[0][1]);
  const [extraDirection, setExtraDirection] = useState<string>("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleStyleChange(key: string) {
    setStyleKey(key);
    if (key && STYLES[key]) {
      // Load first preset palette as defaults — user can still override
      const preset = STYLES[key].colors[0];
      setColor1(preset[0]);
      setColor2(preset[1]);
    }
  }

  function handleFilePick(file: File | null) {
    setReferenceFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setReferencePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReferencePreview(null);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    setGeneratedImage(null);
    try {
      const form = new FormData();
      form.append("venueId", venueId);
      if (styleKey) form.append("style", styleKey);
      if (color1) form.append("color1", color1);
      if (color2) form.append("color2", color2);
      if (extraDirection.trim()) form.append("extraDirection", extraDirection.trim());
      if (referenceFile) form.append("referenceImage", referenceFile);

      const res = await fetch("/api/admin/regenerate-venue-flyer", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Generation failed");
      setGeneratedImage(data.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleAccept() {
    if (generatedImage) onSuccess(generatedImage);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border/20 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Regenerate flyer</h2>
            <p className="text-text-muted text-xs mt-0.5">{venueName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <span className="material-icons-round text-white text-sm">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current vs. new preview */}
          {(currentImage || generatedImage) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">Current</p>
                {currentImage ? (
                  <img src={currentImage} alt="Current" className="w-full aspect-[4/3] object-cover rounded-xl border border-border" />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-xl bg-white/5 border border-border flex items-center justify-center text-text-muted text-xs">No image</div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1.5">New</p>
                {generatedImage ? (
                  <img src={generatedImage} alt="Generated" className="w-full aspect-[4/3] object-cover rounded-xl border border-primary" />
                ) : (
                  <div className="w-full aspect-[4/3] rounded-xl bg-white/5 border border-dashed border-border flex items-center justify-center text-text-muted text-xs">{submitting ? "Generating..." : "Not generated yet"}</div>
                )}
              </div>
            </div>
          )}

          {/* Style */}
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Design style</label>
            <select
              value={styleKey}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white cursor-pointer"
            >
              <option value="">(No named style — let colors & direction drive it)</option>
              {STYLE_KEYS.map((k) => (
                <option key={k} value={k}>{STYLES[k].name}</option>
              ))}
            </select>
            {styleKey && STYLES[styleKey] && (
              <p className="text-[11px] text-text-muted mt-1.5 line-clamp-2">{STYLES[styleKey].prompt}</p>
            )}
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Color 1</label>
              <input
                type="text"
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                placeholder="e.g. purple, #7c4dff, crimson red"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white placeholder:text-text-muted"
              />
              {styleKey && STYLES[styleKey] && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {STYLES[styleKey].colors.map((pair, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setColor1(pair[0]); setColor2(pair[1]); }}
                      className="text-[10px] text-text-muted hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10"
                    >
                      {pair[0]} + {pair[1]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Color 2</label>
              <input
                type="text"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                placeholder="e.g. gold, #ffd700, cyan"
                className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Extra direction */}
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Additional direction (optional)</label>
            <textarea
              value={extraDirection}
              onChange={(e) => setExtraDirection(e.target.value)}
              placeholder="e.g. 'art deco geometric patterns', 'more intimate lighting', 'Korean neon street aesthetic'..."
              rows={2}
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white placeholder:text-text-muted resize-none"
            />
          </div>

          {/* Reference image */}
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1.5 block">Reference image (optional)</label>
            <p className="text-[11px] text-text-muted mb-2">
              Upload a sample. If you also pick a style above, the reference guides color/mood and the chosen style guides layout. If you leave the style empty, the reference drives the whole look.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white font-semibold border border-border"
              >
                {referenceFile ? "Change..." : "Choose file..."}
              </button>
              {referenceFile && (
                <>
                  <span className="text-xs text-text-muted truncate flex-1">{referenceFile.name}</span>
                  <button
                    type="button"
                    onClick={() => handleFilePick(null)}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            {referencePreview && (
              <img src={referencePreview} alt="Reference preview" className="mt-2 w-24 h-24 object-cover rounded-lg border border-border" />
            )}
          </div>

          {error && (
            <div className="rounded-xl p-3 text-xs bg-red-500/10 text-red-400">{error}</div>
          )}
        </div>

        <div className="p-5 border-t border-border/20 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white font-semibold">Cancel</button>
          {generatedImage ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-semibold disabled:opacity-50"
              >
                Try again
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 rounded-lg bg-primary text-black text-xs font-bold"
              >
                Use this one
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary text-black text-xs font-bold disabled:opacity-50"
            >
              {submitting ? "Generating..." : "Generate"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
