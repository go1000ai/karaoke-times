/**
 * Centralized permission system for the dashboard.
 * Defines what owners vs KJs can do.
 */

export type Permission =
  | "venue.edit"
  | "event.create"
  | "event.edit"
  | "event.delete"
  | "promo.create"
  | "promo.edit"
  | "promo.delete"
  | "media.upload"
  | "media.delete"
  | "flyer.generate"
  | "staff.manage"
  | "integration.manage"
  | "queue.manage"
  | "singer.highlight"
  | "ad.manage"
  | "bookings.manage"
  | "tv.manage"
  | "vdj.manage"
  | "listing.edit";

const OWNER_PERMISSIONS: Permission[] = [
  "staff.manage",
  "integration.manage",
];

const KJ_PERMISSIONS: Permission[] = [
  "venue.edit",
  "listing.edit",
  "event.create",
  "event.edit",
  "event.delete",
  "promo.create",
  "promo.edit",
  "promo.delete",
  "media.upload",
  "media.delete",
  "flyer.generate",
  "queue.manage",
  "singer.highlight",
  "ad.manage",
  "bookings.manage",
  "tv.manage",
  "vdj.manage",
];

export function getPermissions(
  role: "venue_owner" | "kj" | "admin",
  options?: { eventOwned?: boolean }
): Set<Permission> {
  if (role === "venue_owner" || role === "admin") {
    // Owners/admins keep staff + POS, everything else is KJ-managed
    // But they still have full access for backward compat
    return new Set([...OWNER_PERMISSIONS, ...KJ_PERMISSIONS]);
  }

  // KJ permissions
  const perms = new Set<Permission>(KJ_PERMISSIONS);

  // If the event isn't owned by this KJ, remove edit/delete
  if (options && !options.eventOwned) {
    perms.delete("event.edit");
    perms.delete("event.delete");
    perms.delete("promo.edit");
    perms.delete("promo.delete");
  }

  return perms;
}

export function hasPermission(
  role: "venue_owner" | "kj" | "admin",
  permission: Permission,
  options?: { eventOwned?: boolean }
): boolean {
  return getPermissions(role, options).has(permission);
}

// ─── Dropdown Options for Enhanced Listing ───

export const VENUE_TYPES = [
  { value: "karaoke_night", label: "Karaoke Night" },
  { value: "club_night", label: "Club Night" },
  { value: "private_room", label: "Private Room" },
  { value: "open_mic", label: "Open Mic" },
  { value: "lounge", label: "Lounge" },
  { value: "restaurant_bar", label: "Restaurant & Bar" },
  { value: "sports_bar", label: "Sports Bar" },
  { value: "hookah_lounge", label: "Hookah Lounge" },
] as const;

export const AGE_RESTRICTIONS = [
  { value: "all_ages", label: "All Ages Welcome" },
  { value: "18+", label: "18+ Only" },
  { value: "21+", label: "21+ Only" },
] as const;

export const DRESS_CODES = [
  { value: "none", label: "No Dress Code" },
  { value: "casual", label: "Casual" },
  { value: "smart_casual", label: "Smart Casual" },
  { value: "no_sneakers", label: "No Sneakers" },
  { value: "no_hats", label: "No Hats" },
  { value: "formal", label: "Formal" },
] as const;

export const COVER_CHARGES = [
  { value: "free", label: "Free Entry" },
  { value: "varies", label: "Varies" },
  { value: "$5", label: "$5" },
  { value: "$10", label: "$10" },
  { value: "$15", label: "$15" },
  { value: "$20", label: "$20" },
  { value: "$25+", label: "$25+" },
] as const;

export const DRINK_MINIMUMS = [
  { value: "none", label: "No Minimum" },
  { value: "1_drink", label: "1 Drink Minimum" },
  { value: "2_drink", label: "2 Drink Minimum" },
  { value: "3_drink", label: "3 Drink Minimum" },
  { value: "bottle_service", label: "Bottle Service Available" },
] as const;

export const PARKING_OPTIONS = [
  { value: "street", label: "Street Parking" },
  { value: "lot", label: "Parking Lot" },
  { value: "valet", label: "Valet" },
  { value: "garage", label: "Parking Garage" },
  { value: "none", label: "No Parking" },
] as const;

export const RESTRICTION_TAGS = [
  "Free Shots For Singers",
  "Free Parking",
  "Street Parking Only",
  "Reservations Required",
  "Walk-Ins Welcome",
  "BYOB",
  "Kitchen Open",
  "Kitchen Closes Early",
  "Food Available For Purchase",
  "No Outside Food/Drinks",
  "Bottle Service Available",
  "Ladies Night Specials",
  "Birthday Celebrations Welcome",
  "Group Rates Available",
  "Private Events Available",
  "Outdoor Seating",
  "Pool Tables",
  "Dance Floor",
  "Live Band",
  "DJ On Site",
  "Smoke Friendly",
  "Pet Friendly",
  "Wheelchair Accessible",
  "Cash Only",
  "Cards Accepted",
] as const;

export const HOURS_PRESETS = [
  { value: "closed", label: "Closed" },
  { value: "5pm-10pm", label: "5:00 PM - 10:00 PM" },
  { value: "6pm-11pm", label: "6:00 PM - 11:00 PM" },
  { value: "7pm-12am", label: "7:00 PM - 12:00 AM" },
  { value: "8pm-1am", label: "8:00 PM - 1:00 AM" },
  { value: "8pm-2am", label: "8:00 PM - 2:00 AM" },
  { value: "9pm-2am", label: "9:00 PM - 2:00 AM" },
  { value: "9pm-3am", label: "9:00 PM - 3:00 AM" },
  { value: "10pm-3am", label: "10:00 PM - 3:00 AM" },
  { value: "10pm-4am", label: "10:00 PM - 4:00 AM" },
  { value: "custom", label: "Custom Hours" },
] as const;
