"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutProfileButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full border-2 border-accent text-accent font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-accent/5 transition-colors"
    >
      <span className="material-icons-round">logout</span>
      Sign Out
    </button>
  );
}
