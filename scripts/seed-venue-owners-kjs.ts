/**
 * Seed venue owner + KJ accounts from the real venue/event data.
 *
 * Run with: npx tsx scripts/seed-venue-owners-kjs.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * What it does:
 *  1. Creates a venue_owner account for every venue in the DB
 *  2. Assigns each venue to its owner
 *  3. Creates a user account for every unique KJ name found in venue_events
 *  4. Links each KJ to their venue(s) via venue_staff
 *
 * Default password for all generated accounts: Welcome123!
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = "Welcome123!";

// Generic DJ names that shouldn't get their own account
const GENERIC_DJ_NAMES = new Set([
  "various kj's",
  "rotating dj's",
  "rotating djs",
  "open",
  "kimono karaoke",
  "",
]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getOrCreateUser(
  email: string,
  displayName: string,
  role: "venue_owner" | "user"
): Promise<string | null> {
  // Check if already exists
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const found = existing?.users?.find((u) => u.email === email);

  if (found) {
    console.log(`    ✓ ${email} already exists (${found.id})`);
    return found.id;
  }

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: displayName, role },
  });

  if (error) {
    console.error(`    ✗ Failed to create ${email}: ${error.message}`);
    return null;
  }

  // Update profile
  await supabase
    .from("profiles")
    .update({ role, display_name: displayName })
    .eq("id", data.user.id);

  console.log(`    ✓ Created ${email} → ${displayName} (${data.user.id})`);
  return data.user.id;
}

async function seedVenueOwnersAndKJs() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Seeding Venue Owners & KJ Accounts");
  console.log("═══════════════════════════════════════════════════════\n");

  // ─── Step 1: Fetch all venues ───
  const { data: venues, error: venueError } = await supabase
    .from("venues")
    .select("id, name, owner_id")
    .order("name");

  if (venueError || !venues) {
    console.error("Failed to fetch venues:", venueError?.message);
    return;
  }

  console.log(`Found ${venues.length} venues in database.\n`);

  // ─── Step 2: Create venue owner accounts ───
  console.log("── Creating Venue Owner Accounts ──\n");

  const venueOwnerMap: Record<string, string> = {}; // venue_id → owner_user_id

  for (const venue of venues) {
    if (venue.owner_id) {
      console.log(`  ⏩ "${venue.name}" — already has owner`);
      venueOwnerMap[venue.id] = venue.owner_id;
      continue;
    }

    const slug = slugify(venue.name);
    const email = `owner.${slug}@karaoketimes.app`;
    const displayName = `${venue.name} Owner`;

    const userId = await getOrCreateUser(email, displayName, "venue_owner");
    if (userId) {
      // Assign venue to owner
      await supabase.from("venues").update({ owner_id: userId }).eq("id", venue.id);
      venueOwnerMap[venue.id] = userId;
      console.log(`    → Assigned "${venue.name}" to owner\n`);
    }
  }

  // ─── Step 3: Fetch all events to find KJ names ───
  console.log("\n── Creating KJ Accounts ──\n");

  const { data: events, error: eventError } = await supabase
    .from("venue_events")
    .select("id, venue_id, dj, venues(name)");

  if (eventError || !events) {
    console.error("Failed to fetch events:", eventError?.message);
    return;
  }

  // Build unique KJ → venues mapping
  const kjVenueMap = new Map<
    string,
    { name: string; venueIds: Set<string>; venueNames: string[] }
  >();

  for (const event of events) {
    const djName = (event.dj || "").trim();
    if (!djName || GENERIC_DJ_NAMES.has(djName.toLowerCase())) continue;

    // Normalize key (lowercase) to merge similar names
    const key = slugify(djName);
    if (!key) continue;

    const existing = kjVenueMap.get(key);
    if (existing) {
      if (!existing.venueIds.has(event.venue_id)) {
        existing.venueIds.add(event.venue_id);
        const venueName = (event.venues as any)?.name || "Unknown";
        existing.venueNames.push(venueName);
      }
    } else {
      const venueName = (event.venues as any)?.name || "Unknown";
      kjVenueMap.set(key, {
        name: djName,
        venueIds: new Set([event.venue_id]),
        venueNames: [venueName],
      });
    }
  }

  console.log(`Found ${kjVenueMap.size} unique KJs in events.\n`);

  const kjAccounts: { name: string; email: string; venues: string[] }[] = [];

  for (const [slug, kj] of kjVenueMap) {
    const email = `kj.${slug}@karaoketimes.app`;

    const userId = await getOrCreateUser(email, kj.name, "user");
    if (!userId) continue;

    kjAccounts.push({ name: kj.name, email, venues: kj.venueNames });

    // Link KJ to each venue via venue_staff
    for (const venueId of kj.venueIds) {
      // Check if already linked
      const { data: existingStaff } = await supabase
        .from("venue_staff")
        .select("id")
        .eq("venue_id", venueId)
        .eq("user_id", userId)
        .limit(1);

      if (existingStaff && existingStaff.length > 0) {
        console.log(`    ⏩ Already linked to venue`);
        continue;
      }

      const ownerId = venueOwnerMap[venueId];
      const { error: staffError } = await supabase.from("venue_staff").insert({
        venue_id: venueId,
        user_id: userId,
        role: "kj",
        invited_by: ownerId || userId,
        accepted_at: new Date().toISOString(),
      });

      if (staffError) {
        console.error(`    ⚠ Failed to link KJ: ${staffError.message}`);
      } else {
        console.log(`    → Linked to venue`);
      }
    }
    console.log("");
  }

  // ─── Summary ───
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  DONE! Account Summary");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log(`  Venue Owners: ${venues.length} accounts`);
  console.log(`  KJs: ${kjVenueMap.size} accounts\n`);

  console.log("  Default password for all: Welcome123!\n");

  console.log("── Venue Owner Accounts ──\n");
  for (const venue of venues) {
    const slug = slugify(venue.name);
    const email = venue.owner_id && !Object.values(venueOwnerMap).includes(venue.owner_id)
      ? "(pre-existing owner)"
      : `owner.${slug}@karaoketimes.app`;
    console.log(`  ${venue.name.padEnd(40)} ${email}`);
  }

  console.log("\n── KJ Accounts ──\n");
  for (const kj of kjAccounts) {
    console.log(`  ${kj.name.padEnd(30)} ${kj.email}`);
    console.log(`  ${"".padEnd(30)} → ${kj.venues.join(", ")}`);
  }

  console.log("\n═══════════════════════════════════════════════════════\n");
}

seedVenueOwnersAndKJs().catch(console.error);
