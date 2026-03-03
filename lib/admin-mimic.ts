import { cookies } from "next/headers";

export type MimicRole = "kj" | "owner" | null;

/**
 * Read the admin mimic role from cookies (server-side only).
 * Returns "kj", "owner", or null if not mimicking.
 */
export async function getAdminMimicRole(): Promise<MimicRole> {
  const cookieStore = await cookies();
  const value = cookieStore.get("admin_mimic_role")?.value;
  if (value === "kj" || value === "owner") return value;
  return null;
}
