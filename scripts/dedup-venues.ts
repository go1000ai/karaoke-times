/**
 * Deduplicate venues in the database.
 *
 * Run with: npx tsx scripts/dedup-venues.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * What it does:
 *  1. Groups venues by lowercase name
 *  2. For each group of duplicates, picks the "primary" venue (most child records)
 *  3. Reassigns all foreign key references from duplicates → primary
 *  4. Deletes the duplicate venue rows
 *
 * DRY RUN by default — pass --apply to actually make changes.
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

const APPLY = process.argv.includes("--apply");

// All tables with a venue_id FK referencing venues(id)
const FK_TABLES = [
  "venue_events",
  "venue_media",
  "venue_promos",
  "song_queue",
  "reviews",
  "favorites",
  "room_bookings",
  "venue_staff",
  "venue_integrations",
  "pos_menu_items",
  "event_reminders",
  "flyers",
];

async function countChildRows(venueId: string): Promise<number> {
  let total = 0;
  for (const table of FK_TABLES) {
    const { count } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("venue_id", venueId);
    total += count ?? 0;
  }
  return total;
}

async function reassignChildren(
  fromVenueId: string,
  toVenueId: string
): Promise<number> {
  let moved = 0;
  for (const table of FK_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .update({ venue_id: toVenueId })
      .eq("venue_id", fromVenueId)
      .select("id");

    if (error) {
      // Unique constraint violations mean the record already exists on the target
      // (e.g. duplicate favorites). Delete the duplicate instead.
      if (error.code === "23505") {
        const { data: deleted } = await supabase
          .from(table)
          .delete()
          .eq("venue_id", fromVenueId)
          .select("id");
        console.log(
          `      ${table}: deleted ${deleted?.length ?? 0} duplicate rows (unique constraint)`
        );
      } else {
        console.error(`      ⚠ ${table}: ${error.message}`);
      }
    } else if (data && data.length > 0) {
      moved += data.length;
      console.log(`      ${table}: moved ${data.length} rows`);
    }
  }
  return moved;
}

async function dedup() {
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Venue Deduplication — ${APPLY ? "APPLYING CHANGES" : "DRY RUN (pass --apply to execute)"}`);
  console.log("═══════════════════════════════════════════════════════\n");

  // Fetch all venues
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, owner_id, created_at")
    .order("created_at", { ascending: true });

  if (error || !venues) {
    console.error("Failed to fetch venues:", error?.message);
    return;
  }

  console.log(`Total venues in database: ${venues.length}\n`);

  // Group by lowercase name
  const groups = new Map<string, typeof venues>();
  for (const v of venues) {
    const key = v.name.toLowerCase().trim();
    const group = groups.get(key) || [];
    group.push(v);
    groups.set(key, group);
  }

  const dupGroups = [...groups.entries()].filter(([, g]) => g.length > 1);
  console.log(`Unique venue names: ${groups.size}`);
  console.log(`Groups with duplicates: ${dupGroups.length}\n`);

  if (dupGroups.length === 0) {
    console.log("No duplicates found. Nothing to do.");
    return;
  }

  let totalDupsRemoved = 0;
  let totalRowsMoved = 0;

  for (const [name, group] of dupGroups) {
    console.log(`── "${group[0].name}" (${group.length} copies) ──`);

    // Count child rows for each duplicate to pick the "best" one
    const scored: { venue: (typeof venues)[0]; childCount: number }[] = [];
    for (const v of group) {
      const count = await countChildRows(v.id);
      scored.push({ venue: v, childCount: count });
    }

    // Pick primary: prefer one with owner_id set, then most children, then oldest
    scored.sort((a, b) => {
      const aOwner = a.venue.owner_id ? 1 : 0;
      const bOwner = b.venue.owner_id ? 1 : 0;
      if (bOwner !== aOwner) return bOwner - aOwner;
      if (b.childCount !== a.childCount) return b.childCount - a.childCount;
      return new Date(a.venue.created_at).getTime() - new Date(b.venue.created_at).getTime();
    });

    const primary = scored[0];
    const duplicates = scored.slice(1);

    console.log(
      `  ✓ Keep: ${primary.venue.id} (${primary.childCount} children, owner: ${primary.venue.owner_id ? "yes" : "no"})`
    );

    for (const dup of duplicates) {
      console.log(
        `    ✗ Remove: ${dup.venue.id} (${dup.childCount} children, owner: ${dup.venue.owner_id ? "yes" : "no"})`
      );

      if (APPLY) {
        // Reassign child rows
        if (dup.childCount > 0) {
          const moved = await reassignChildren(dup.venue.id, primary.venue.id);
          totalRowsMoved += moved;
        }

        // If the duplicate had an owner but primary doesn't, copy the owner
        if (dup.venue.owner_id && !primary.venue.owner_id) {
          await supabase
            .from("venues")
            .update({ owner_id: dup.venue.owner_id })
            .eq("id", primary.venue.id);
          console.log(`      → Transferred owner_id to primary`);
        }

        // Delete the duplicate venue
        const { error: delError } = await supabase
          .from("venues")
          .delete()
          .eq("id", dup.venue.id);

        if (delError) {
          console.error(`      ⚠ Failed to delete: ${delError.message}`);
        } else {
          console.log(`      → Deleted`);
          totalDupsRemoved++;
        }
      } else {
        totalDupsRemoved++;
      }
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("  Summary");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log(`  Duplicate groups: ${dupGroups.length}`);
  console.log(`  Venues to remove: ${totalDupsRemoved}`);
  if (APPLY) {
    console.log(`  Rows reassigned:  ${totalRowsMoved}`);
    console.log(`\n  ✅ Changes applied.`);
  } else {
    console.log(`\n  ℹ️  This was a DRY RUN. Pass --apply to execute.`);
  }

  const remaining = venues.length - totalDupsRemoved;
  console.log(`  Venues after cleanup: ${remaining}\n`);
}

dedup().catch(console.error);
