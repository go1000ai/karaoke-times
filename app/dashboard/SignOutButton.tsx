"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
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
