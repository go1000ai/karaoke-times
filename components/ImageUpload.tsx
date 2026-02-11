"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  label?: string;
  accept?: string;
  maxSize?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export default function ImageUpload({
  label = "Upload Event Flyer",
  accept = "image/jpeg,image/png",
  maxSize = "5MB",
  multiple = false,
  maxFiles = 6,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleClick = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: string[] = [];
    const limit = multiple ? Math.min(files.length, maxFiles - previews.length) : 1;

    for (let i = 0; i < limit; i++) {
      newPreviews.push(URL.createObjectURL(files[i]));
    }

    setPreviews((prev) => (multiple ? [...prev, ...newPreviews] : newPreviews));
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />

      {previews.length > 0 && (
        <div className="flex gap-3 mb-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-border">
              <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-crimson text-white rounded-full flex items-center justify-center text-xs"
              >
                <span className="material-icons-round text-sm">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {(!multiple || previews.length < maxFiles) && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full border-2 border-dashed border-border rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-crimson hover:bg-crimson/5 transition-colors"
        >
          <span className="material-icons-round text-3xl text-crimson">add_photo_alternate</span>
          <span className="text-sm font-semibold text-text-primary">{label}</span>
          <span className="text-xs text-text-muted">JPG, PNG up to {maxSize}</span>
        </button>
      )}

      {multiple && previews.length > 0 && (
        <p className="text-xs text-text-muted mt-2 text-right">{previews.length} / {maxFiles}</p>
      )}
    </div>
  );
}
