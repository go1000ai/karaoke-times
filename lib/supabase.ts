// Re-export the SSR-compatible clients
// Use createClient from ./supabase/server for Server Components/Actions
// Use createClient from ./supabase/client for Client Components
export { createClient as createBrowserClient } from "./supabase/client";
export type { Database } from "./supabase/types";

// Legacy export for backward compatibility — browser client
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
