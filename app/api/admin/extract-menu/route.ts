import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  category?: string;
}

export async function POST(req: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { url, venueId } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status}` }, { status: 400 });
    }

    const html = await response.text();

    // --- Step 1: Try text-based extraction first ---
    const menuItems = extractMenuFromText(html);

    // --- Step 2: If text extraction found few items, try image-based extraction with Claude Vision ---
    if (menuItems.length < 3) {
      console.log(`Text extraction found ${menuItems.length} items, trying Vision...`);
      try {
        const imageItems = await extractMenuFromImages(html, url);
        console.log(`Vision extraction found ${imageItems.length} items`);
        if (imageItems.length > menuItems.length) {
          return saveAndReturn(supabase, venueId, url, imageItems);
        }
      } catch (visionErr) {
        console.error("Vision extraction failed:", visionErr instanceof Error ? visionErr.message : visionErr);
      }
    } else {
      console.log(`Text extraction found ${menuItems.length} items, skipping Vision`);
    }

    return saveAndReturn(supabase, venueId, url, menuItems);
  } catch (err) {
    console.error("Menu extraction error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to extract menu" },
      { status: 500 }
    );
  }
}

/** Save menu items to database and return response */
async function saveAndReturn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string | undefined,
  url: string,
  menuItems: MenuItem[]
) {
  if (venueId && menuItems.length > 0) {
    const { error: updateError } = await supabase
      .from("venues")
      .update({ menu_items: menuItems, menu_url: url })
      .eq("id", venueId);

    if (updateError) {
      return NextResponse.json({ items: menuItems, saved: false, error: updateError.message });
    }
    return NextResponse.json({ items: menuItems, saved: true, count: menuItems.length });
  }
  return NextResponse.json({ items: menuItems, saved: false, count: menuItems.length });
}

/** Extract menu items from HTML text content (original approach) */
function extractMenuFromText(html: string): MenuItem[] {
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  const textContent = cleanHtml
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const menuItems: MenuItem[] = [];
  const lines = textContent.split("\n").map((l) => l.trim()).filter(Boolean);
  const pricePattern = /\$\d+(?:\.\d{2})?/;
  let currentCategory = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 2 || line.length > 300) continue;

    const priceMatch = line.match(pricePattern);
    if (priceMatch) {
      const priceIdx = line.indexOf(priceMatch[0]);
      let name = line.substring(0, priceIdx).trim();
      const price = priceMatch[0];
      name = name.replace(/[.\-|]+$/, "").trim();

      if (name.length >= 2 && name.length <= 100) {
        let description: string | undefined;
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (!pricePattern.test(nextLine) && nextLine.length > 5 && nextLine.length < 200) {
            description = nextLine;
            i++;
          }
        }
        menuItems.push({ name, price, description, category: currentCategory || undefined });
      }
    } else if (
      line.length <= 40 &&
      !pricePattern.test(line) &&
      (line === line.toUpperCase() || /^[A-Z][a-z]/.test(line)) &&
      !/^\d/.test(line) &&
      !line.includes("@") &&
      !line.includes("http")
    ) {
      let hasPricesBelow = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (pricePattern.test(lines[j])) { hasPricesBelow = true; break; }
      }
      if (hasPricesBelow) currentCategory = line;
    }
  }

  // Aggressive fallback
  if (menuItems.length < 3) {
    const structuredPattern = /([A-Z][A-Za-z\s&',()]+?)[\s.…–-]+(\$\d+(?:\.\d{2})?)/g;
    let match;
    const seenNames = new Set(menuItems.map((m) => m.name.toLowerCase()));
    while ((match = structuredPattern.exec(textContent)) !== null) {
      const name = match[1].trim();
      const price = match[2];
      if (name.length >= 2 && name.length <= 100 && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        menuItems.push({ name, price });
      }
    }
  }

  return menuItems;
}

/** Extract menu items from images on the page using Claude Vision */
async function extractMenuFromImages(html: string, pageUrl: string): Promise<MenuItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];

  // Find image URLs from multiple sources in the HTML
  const allImages: string[] = [];

  // Standard img src
  const imgSrcPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgSrcPattern.exec(html)) !== null) allImages.push(m[1]);

  // Lazy-loaded images (data-src, data-lazy-src, etc.)
  const lazySrcPattern = /data-(?:lazy-)?src=["']([^"']+)["']/gi;
  while ((m = lazySrcPattern.exec(html)) !== null) allImages.push(m[1]);

  // Background images in style attributes
  const bgPattern = /background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((m = bgPattern.exec(html)) !== null) allImages.push(m[1]);

  // CDN image URLs with extensions
  const cdnPattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:[^\s"'<>]*)/gi;
  while ((m = cdnPattern.exec(html)) !== null) allImages.push(m[0]);

  // CDN image URLs without extensions (wsimg, cloudinary, etc. that use path-based transforms)
  const wsimgPattern = /(?:img\d\.wsimg\.com|res\.cloudinary\.com|images\.unsplash\.com)\/[^\s"'<>]+/gi;
  while ((m = wsimgPattern.exec(html)) !== null) {
    const url = m[0].startsWith("http") ? m[0] : "https://" + m[0];
    allImages.push(url);
  }

  // Deduplicate
  const uniqueImages = [...new Set(allImages)];
  if (uniqueImages.length === 0) return [];

  // Resolve relative URLs and filter for likely content images
  const baseUrl = new URL(pageUrl);
  const resolvedImages = uniqueImages
    .map((src) => {
      try {
        if (src.startsWith("data:")) return null;
        if (src.startsWith("//")) return `https:${src}`;
        if (src.startsWith("/")) return `${baseUrl.origin}${src}`;
        if (src.startsWith("http")) return src;
        return new URL(src, pageUrl).href;
      } catch { return null; }
    })
    .filter((u): u is string => !!u)
    .filter((u) => {
      const lower = u.toLowerCase();
      if (lower.includes("logo") || lower.includes("favicon") || lower.includes("icon")) return false;
      if (lower.includes("sprite") || lower.includes("placeholder") || lower.includes("gfont")) return false;
      if (lower.includes("vendor") || lower.includes("veteran") || lower.includes("badge")) return false;
      if (lower.includes("as%20seen") || lower.includes("certified") || lower.includes("award")) return false;
      if (lower.endsWith(".svg") || lower.endsWith(".gif")) return false;
      // Skip very small thumbnails (under 200px)
      const sizeMatch = lower.match(/rs=w:(\d+)/);
      if (sizeMatch && parseInt(sizeMatch[1]) < 200) return false;
      return true;
    });

  if (resolvedImages.length === 0) return [];

  // Deduplicate by base URL (remove resize variants of the same image)
  const seenBase = new Set<string>();
  const dedupedImages = resolvedImages.filter((u) => {
    const base = u.replace(/\/:[^\s"'<>]*$/, "").replace(/\?.*$/, "");
    if (seenBase.has(base)) return false;
    seenBase.add(base);
    return true;
  });

  // Sort: prioritize images with menu-related keywords in URL
  const menuKeywords = ["menu", "food", "special", "screenshot", "drink", "price", "dish"];
  dedupedImages.sort((a, b) => {
    const aScore = menuKeywords.some((k) => a.toLowerCase().includes(k)) ? 0 : 1;
    const bScore = menuKeywords.some((k) => b.toLowerCase().includes(k)) ? 0 : 1;
    return aScore - bScore;
  });

  // Download images in parallel (fast — 4 second timeout each)
  const candidates = dedupedImages.slice(0, 10);
  console.log(`Downloading ${candidates.length} image candidates (deduped from ${resolvedImages.length})...`);
  const downloads = await Promise.allSettled(
    candidates.map(async (imgUrl) => {
      const imgRes = await fetch(imgUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      });
      if (!imgRes.ok) return null;
      const contentType = imgRes.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) return null;
      const buffer = await imgRes.arrayBuffer();
      if (buffer.byteLength < 10000 || buffer.byteLength > 10000000) return null;
      return {
        base64: Buffer.from(buffer).toString("base64"),
        mediaType: contentType.split(";")[0].trim(),
        size: buffer.byteLength,
      };
    })
  );

  // Keep up to 5 images — send them all so Claude can find the menu ones
  const imageData = downloads
    .map((r) => r.status === "fulfilled" ? r.value : null)
    .filter((d): d is { base64: string; mediaType: string; size: number } => !!d)
    .slice(0, 5);

  console.log(`Got ${imageData.length} usable images, sizes: ${imageData.map((d) => d.size).join(", ")}`);

  if (imageData.length === 0) return [];

  // Send images to Claude Vision
  const anthropic = new Anthropic();
  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = imageData.map((img) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: img.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
      data: img.base64,
    },
  }));

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `Look at these images from a restaurant/bar website. Extract ALL menu items you can find. For each item, provide: name, price (in $X.XX format), description (if visible), and category (e.g. Appetizers, Drinks, Entrees, Desserts, etc.).

Return ONLY a valid JSON array with no other text. Example format:
[{"name":"Chicken Wings","price":"$12.99","description":"Crispy wings with buffalo sauce","category":"Appetizers"}]

If no menu items are visible in the images, return an empty array: []
Important: Only extract actual food/drink menu items with prices. Do not make up items.`,
          },
        ],
      },
    ],
  });

  // Parse Claude's response
  try {
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as MenuItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.name) : [];
  } catch {
    return [];
  }
}
