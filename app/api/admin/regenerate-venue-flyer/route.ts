import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import promptConfig from "@/lib/flyer-prompts.json";

export const maxDuration = 120;

type Style = { name: string; prompt: string; colors: string[][] };
const styles = promptConfig.styles as Record<string, Style>;

function buildCustomPrompt(params: {
  styleKey: string | null;
  color1: string;
  color2: string;
  extraDirection: string;
  referenceDescription: string | null;
}): string {
  const { styleKey, color1, color2, extraDirection, referenceDescription } = params;

  let base: string;
  if (styleKey && styles[styleKey]) {
    base = styles[styleKey].prompt
      .replace(/\{color1\}/g, color1 || "vivid neon")
      .replace(/\{color2\}/g, color2 || "warm gold");
  } else {
    // No named style — build from colors + extra direction alone
    base = `Cinematic karaoke venue flyer with ${color1 || "vivid neon"} and ${color2 || "warm gold"} lighting.`;
  }

  const parts = [base];
  if (extraDirection.trim()) parts.push(extraDirection.trim());
  if (referenceDescription) parts.push(`Visual reference cues: ${referenceDescription}`);
  parts.push(promptConfig.base_instructions);
  return parts.join(" ");
}

async function generateWithImagen(prompt: string, apiKey: string): Promise<Buffer> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "4:3" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Imagen API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("No image data in Imagen response");
  return Buffer.from(b64, "base64");
}

async function generateWithReference(prompt: string, refB64: string, refMime: string, apiKey: string): Promise<Buffer> {
  // Gemini 2.5 Flash Image Preview — multimodal image generation that accepts a reference image
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: `Generate a 4:3 karaoke venue flyer image using this reference as a stylistic guide. ${prompt}` },
            { inlineData: { mimeType: refMime, data: refB64 } },
          ],
        }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini image API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts as { inlineData?: { data: string } }[] | undefined;
  const imagePart = parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) throw new Error("No image data in Gemini response");
  return Buffer.from(imagePart.inlineData.data, "base64");
}

async function describeReferenceImage(refB64: string, refMime: string, apiKey: string): Promise<string> {
  // One-paragraph vision description — used when caller also provided a named style
  // so we blend the reference's cues into the styled prompt rather than letting the
  // reference dominate entirely.
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: "Describe this image's color palette, mood, composition and visual style in one sentence, as cues that could guide generation of a similar-feeling karaoke venue flyer. No prose — comma-separated cues only." },
            { inlineData: { mimeType: refMime, data: refB64 } },
          ],
        }],
      }),
    }
  );
  if (!res.ok) return "";
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
  return (text || "").trim();
}

export async function POST(request: Request) {
  // Auth: admin only
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });

  const { data: profile } = await serverSupabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, message: "GEMINI_API_KEY not configured" }, { status: 500 });

  // Parse multipart form
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid form data" }, { status: 400 });
  }

  const venueId = (form.get("venueId") as string | null)?.trim() || "";
  if (!venueId) return NextResponse.json({ success: false, message: "venueId is required" }, { status: 400 });

  const styleKey = (form.get("style") as string | null) || null;
  const color1 = ((form.get("color1") as string | null) || "").trim();
  const color2 = ((form.get("color2") as string | null) || "").trim();
  const extraDirection = ((form.get("extraDirection") as string | null) || "").trim();
  const referenceFile = form.get("referenceImage") as File | null;

  // Verify venue exists and load its current media
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: venue, error: venueErr } = await supabase
    .from("venues")
    .select("id, name, venue_media(id, url, is_primary, type)")
    .eq("id", venueId)
    .single();
  if (venueErr || !venue) {
    return NextResponse.json({ success: false, message: "Venue not found" }, { status: 404 });
  }

  // Handle reference image if provided
  let refB64: string | null = null;
  let refMime: string | null = null;
  let referenceDescription: string | null = null;
  if (referenceFile && referenceFile.size > 0) {
    if (referenceFile.size > 6 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "Reference image must be under 6MB" }, { status: 400 });
    }
    const arrayBuf = await referenceFile.arrayBuffer();
    refB64 = Buffer.from(arrayBuf).toString("base64");
    refMime = referenceFile.type || "image/png";
    // If a named style was also chosen, we'll blend: ask Gemini to describe the
    // reference, then include that description inside the styled Imagen prompt.
    // If no style was chosen, we'll feed the image directly to Gemini 2.5 Flash
    // Image and let the reference drive the output.
    if (styleKey && styles[styleKey]) {
      referenceDescription = await describeReferenceImage(refB64, refMime, apiKey);
    }
  }

  const prompt = buildCustomPrompt({ styleKey, color1, color2, extraDirection, referenceDescription });

  // Generate
  let imageBuffer: Buffer;
  try {
    if (refB64 && refMime && (!styleKey || !styles[styleKey])) {
      imageBuffer = await generateWithReference(prompt, refB64, refMime, apiKey);
    } else {
      imageBuffer = await generateWithImagen(prompt, apiKey);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: `Generation failed: ${msg}` }, { status: 502 });
  }

  // Upload to storage
  const fileName = `auto-flyers/venue-${venue.id}-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("flyer-uploads")
    .upload(fileName, imageBuffer, { contentType: "image/png", upsert: true });
  if (uploadError) {
    return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}` }, { status: 502 });
  }
  const { data: urlData } = supabase.storage.from("flyer-uploads").getPublicUrl(fileName);

  // Replace only the auto-flyer primary rows — user-uploaded media is preserved.
  // This is an explicit per-venue action, not a bulk replace.
  const existingMedia = (venue.venue_media as { id: string; url: string; is_primary: boolean; type: string }[] | null) || [];
  const staleAutoIds = existingMedia
    .filter((m) => m.is_primary && m.type === "image" && m.url.includes("auto-flyers/"))
    .map((m) => m.id);
  if (staleAutoIds.length > 0) {
    await supabase.from("venue_media").delete().in("id", staleAutoIds);
  }
  // Demote any remaining primaries so the new one is the only primary
  await supabase
    .from("venue_media")
    .update({ is_primary: false })
    .eq("venue_id", venue.id)
    .eq("is_primary", true);

  const { error: insertError } = await supabase.from("venue_media").insert({
    venue_id: venue.id,
    url: urlData.publicUrl,
    type: "image",
    is_primary: true,
    sort_order: 0,
  });
  if (insertError) {
    return NextResponse.json({ success: false, message: `DB insert failed: ${insertError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    imageUrl: urlData.publicUrl,
    venueName: venue.name,
    usedReferenceImage: Boolean(refB64 && !styleKey),
  });
}
