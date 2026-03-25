import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status}` }, { status: 400 });
    }

    const html = await response.text();

    // Extract text content from HTML — strip tags, scripts, styles
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "");

    // Extract meaningful text blocks
    const textContent = cleanHtml
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#?\w+;/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Parse menu items using pattern matching
    const menuItems: MenuItem[] = [];
    const lines = textContent.split("\n").map((l) => l.trim()).filter(Boolean);

    // Price pattern: $X.XX or $XX or $X
    const pricePattern = /\$\d+(?:\.\d{2})?/;

    let currentCategory = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip very short or very long lines
      if (line.length < 2 || line.length > 300) continue;

      // Check if this line has a price
      const priceMatch = line.match(pricePattern);

      if (priceMatch) {
        // Extract name (everything before the price) and price
        const priceIdx = line.indexOf(priceMatch[0]);
        let name = line.substring(0, priceIdx).trim();
        const price = priceMatch[0];

        // Clean up name — remove trailing dots, dashes, pipes
        name = name.replace(/[.\-|]+$/, "").trim();

        if (name.length >= 2 && name.length <= 100) {
          // Check if the next line could be a description (no price, reasonable length)
          let description: string | undefined;
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            if (!pricePattern.test(nextLine) && nextLine.length > 5 && nextLine.length < 200) {
              description = nextLine;
              i++; // Skip the description line
            }
          }

          menuItems.push({
            name,
            price,
            description,
            category: currentCategory || undefined,
          });
        }
      } else if (
        // Potential category header: short, no price, mostly uppercase or title case
        line.length <= 40 &&
        !pricePattern.test(line) &&
        (line === line.toUpperCase() || /^[A-Z][a-z]/.test(line)) &&
        !/^\d/.test(line) &&
        !line.includes("@") &&
        !line.includes("http")
      ) {
        // Check if lines below have prices (confirming this is a category)
        let hasPricesBelow = false;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (pricePattern.test(lines[j])) {
            hasPricesBelow = true;
            break;
          }
        }
        if (hasPricesBelow) {
          currentCategory = line;
        }
      }
    }

    // If pattern matching found very few items, try a more aggressive approach
    // Look for lines that look like menu items (name + description patterns)
    if (menuItems.length < 3) {
      // Try finding items in structured patterns like "Item Name ... $Price"
      const allText = textContent;
      const structuredPattern = /([A-Z][A-Za-z\s&',()]+?)[\s.…–-]+(\$\d+(?:\.\d{2})?)/g;
      let match;
      const seenNames = new Set(menuItems.map((m) => m.name.toLowerCase()));

      while ((match = structuredPattern.exec(allText)) !== null) {
        const name = match[1].trim();
        const price = match[2];
        if (name.length >= 2 && name.length <= 100 && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          menuItems.push({ name, price });
        }
      }
    }

    // If venueId is provided, save to database
    if (venueId && menuItems.length > 0) {
      const { error: updateError } = await supabase
        .from("venues")
        .update({ menu_items: menuItems, menu_url: url })
        .eq("id", venueId);

      if (updateError) {
        return NextResponse.json({
          items: menuItems,
          saved: false,
          error: updateError.message,
        });
      }

      return NextResponse.json({ items: menuItems, saved: true, count: menuItems.length });
    }

    return NextResponse.json({ items: menuItems, saved: false, count: menuItems.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to extract menu" },
      { status: 500 }
    );
  }
}
