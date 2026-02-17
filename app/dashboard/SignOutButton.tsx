"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center justify-center gap-2 text-text-muted hover:text-red-400 text-sm font-semibold py-2 px-3 rounded-xl border border-border hover:border-red-400/30 hover:bg-red-400/5 transition-all"
    >
      <span className="material-icons-round text-base">logout</span>
      Log Out
    </button>
  );
}
