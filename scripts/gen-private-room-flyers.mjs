// One-shot: generate AI flyers for private-room venues that have no image.
// Replicates /api/admin/auto-generate-flyers logic but targets venues (not venue_events)
// and stores result in venue_media (since private rooms have no events).
//
// Run: npx dotenv-cli -e .env.local -- node scripts/gen-private-room-flyers.mjs
// Or:  set -a; source .env.local; set +a; node scripts/gen-private-room-flyers.mjs

import fs from "fs";
import path from "path";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI = process.env.GEMINI_API_KEY;
if (!URL || !SR || !GEMINI) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY");
  process.exit(1);
}

const promptConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "lib/flyer-prompts.json"), "utf-8")
);

function buildPrompt(styleName, venueHash) {
  const style = promptConfig.styles[styleName] || promptConfig.styles.neon_stage;
  const [color1, color2] = style.colors[venueHash % style.colors.length];
  const styled = style.prompt.replace(/\{color1\}/g, color1).replace(/\{color2\}/g, color2);
  return `${styled} ${promptConfig.base_instructions}`;
}

async function generateImage(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "4:3" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Imagen ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("No image data returned");
  return Buffer.from(b64, "base64");
}

async function uploadToStorage(venueId, buffer) {
  const fileName = `auto-flyers/venue-${venueId}-${Date.now()}.png`;
  const uploadRes = await fetch(`${URL}/storage/v1/object/flyer-uploads/${fileName}`, {
    method: "POST",
    headers: {
      apikey: SR,
      Authorization: `Bearer ${SR}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!uploadRes.ok) throw new Error(`Upload ${uploadRes.status}: ${(await uploadRes.text()).slice(0, 200)}`);
  return `${URL}/storage/v1/object/public/flyer-uploads/${fileName}`;
}

async function insertVenueMedia(venueId, publicUrl) {
  const res = await fetch(`${URL}/rest/v1/venue_media`, {
    method: "POST",
    headers: {
      apikey: SR,
      Authorization: `Bearer ${SR}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      venue_id: venueId,
      url: publicUrl,
      type: "image",
      is_primary: true,
      sort_order: 0,
    }),
  });
  if (!res.ok) throw new Error(`Insert ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function main() {
  // Find private-room venues with no venue_media photos
  const qs = new URLSearchParams({
    select: "id,name,venue_media(id)",
    is_private_room: "eq.true",
  });
  const venuesRes = await fetch(`${URL}/rest/v1/venues?${qs}`, {
    headers: { apikey: SR, Authorization: `Bearer ${SR}` },
  });
  if (!venuesRes.ok) throw new Error(`List venues failed: ${await venuesRes.text()}`);
  const venues = await venuesRes.json();
  const missing = venues.filter((v) => !(v.venue_media || []).length);

  console.log(`Private rooms missing photos: ${missing.length}`);
  missing.forEach((v) => console.log(`  - ${v.name}`));
  if (!missing.length) {
    console.log("Nothing to do.");
    return;
  }

  const styleNames = Object.keys(promptConfig.styles);

  for (const v of missing) {
    process.stdout.write(`Generating for ${v.name}... `);
    try {
      const hash = v.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const style = styleNames[hash % styleNames.length];
      const prompt = buildPrompt(style, hash);
      const img = await generateImage(prompt);
      const publicUrl = await uploadToStorage(v.id, img);
      await insertVenueMedia(v.id, publicUrl);
      console.log(`OK (style: ${style}) -> ${publicUrl}`);
      // throttle to respect rate limits
      await new Promise((r) => setTimeout(r, 5000));
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
    }
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
