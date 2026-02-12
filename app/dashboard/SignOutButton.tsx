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
      title="Sign out"
      className="text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
    >
      <span className="material-icons-round text-xl">logout</span>
    </button>
  );
}
