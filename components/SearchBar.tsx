"use client";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBar({ placeholder = "Search venues, songs, or KJs...", value, onChange }: SearchBarProps) {
  return (
    <div className="relative group">
      <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-crimson transition-colors">
        search
      </span>
      <input
        type="text"
        className="w-full bg-white border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-crimson/30 focus:border-crimson transition-all placeholder:text-text-muted shadow-sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
