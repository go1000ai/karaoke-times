/**
 * Seed test users for each role.
 *
 * Run with: npx tsx scripts/seed-users.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Creates these test accounts:
 *
 *  Role          Email                        Password
 *  ─────────────────────────────────────────────────────────
 *  Singer        singer@karaoketimes.test     Singer123!
 *  Venue Owner   owner@karaoketimes.test      Owner123!
 *  KJ            kj@karaoketimes.test         KJhost123!
 *  Admin         admin@karaoketimes.test      Admin123!
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

const TEST_USERS = [
  {
    email: "singer@karaoketimes.test",
    password: "Singer123!",
    displayName: "Test Singer",
    role: "user" as const,
  },
  {
    email: "owner@karaoketimes.test",
    password: "Owner123!",
    displayName: "Test Owner",
    role: "venue_owner" as const,
  },
  {
    email: "kj@karaoketimes.test",
    password: "KJhost123!",
    displayName: "Test KJ",
    role: "user" as const, // KJs are regular users linked via venue_staff
  },
  {
    email: "admin@karaoketimes.test",
    password: "Admin123!",
    displayName: "Test Admin",
    role: "admin" as const,
  },
];

async function seedUsers() {
  console.log("Seeding test users...\n");

  const createdUsers: { email: string; id: string; role: string }[] = [];

  for (const user of TEST_USERS) {
    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === user.email);

    if (found) {
      console.log(`  ✓ ${user.email} already exists (${found.id})`);
      createdUsers.push({ email: user.email, id: found.id, role: user.role });
      continue;
    }

    // Create auth user (email auto-confirmed)
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.displayName,
        role: user.role,
      },
    });

    if (error) {
      console.error(`  ✗ Failed to create ${user.email}: ${error.message}`);
      continue;
    }

    console.log(`  ✓ Created ${user.email} (${data.user.id})`);
    createdUsers.push({ email: user.email, id: data.user.id, role: user.role });

    // Update profile role (trigger creates the profile with role='user')
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: user.role, display_name: user.displayName })
      .eq("id", data.user.id);

    if (profileError) {
      console.error(`    ⚠ Profile update failed: ${profileError.message}`);
    }
  }

  // --- Venue Owner: link to first venue ---
  const owner = createdUsers.find((u) => u.email === "owner@karaoketimes.test");
  if (owner) {
    // Find first venue without an owner and assign it
    const { data: venues } = await supabase
      .from("venues")
      .select("id, name")
      .is("owner_id", null)
      .limit(1);

    if (venues && venues.length > 0) {
      await supabase
        .from("venues")
        .update({ owner_id: owner.id })
        .eq("id", venues[0].id);
      console.log(`\n  → Assigned venue "${venues[0].name}" to owner account`);
    } else {
      // Create a test venue for the owner
      const { data: newVenue } = await supabase
        .from("venues")
        .insert({
          owner_id: owner.id,
          name: "Test Karaoke Bar",
          address: "123 Test Street",
          city: "New York",
          state: "New York",
          neighborhood: "Midtown",
        })
        .select("id, name")
        .single();

      if (newVenue) {
        console.log(`\n  → Created test venue "${newVenue.name}" for owner account`);
      }
    }
  }

  // --- KJ: link to owner's venue as staff ---
  const kj = createdUsers.find((u) => u.email === "kj@karaoketimes.test");
  if (kj && owner) {
    const { data: ownerVenue } = await supabase
      .from("venues")
      .select("id, name")
      .eq("owner_id", owner.id)
      .limit(1)
      .single();

    if (ownerVenue) {
      // Check if already linked
      const { data: existingStaff } = await supabase
        .from("venue_staff")
        .select("id")
        .eq("venue_id", ownerVenue.id)
        .eq("user_id", kj.id)
        .limit(1);

      if (!existingStaff || existingStaff.length === 0) {
        const { error: staffError } = await supabase
          .from("venue_staff")
          .insert({
            venue_id: ownerVenue.id,
            user_id: kj.id,
            role: "kj",
            invited_by: owner.id,
            accepted_at: new Date().toISOString(),
          });

        if (staffError) {
          console.error(`  ⚠ Failed to link KJ to venue: ${staffError.message}`);
        } else {
          console.log(`  → Linked KJ to venue "${ownerVenue.name}"`);
        }
      } else {
        console.log(`  → KJ already linked to venue "${ownerVenue.name}"`);
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Test Accounts Ready!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("  Singer (regular user):");
  console.log("    Email:    singer@karaoketimes.test");
  console.log("    Password: Singer123!");
  console.log("");
  console.log("  Venue Owner:");
  console.log("    Email:    owner@karaoketimes.test");
  console.log("    Password: Owner123!");
  console.log("");
  console.log("  KJ (Karaoke Jockey):");
  console.log("    Email:    kj@karaoketimes.test");
  console.log("    Password: KJhost123!");
  console.log("");
  console.log("  Admin:");
  console.log("    Email:    admin@karaoketimes.test");
  console.log("    Password: Admin123!");
  console.log("═══════════════════════════════════════════════════════\n");
}

seedUsers().catch(console.error);
