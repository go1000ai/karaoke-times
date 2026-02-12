/**
 * Toast POS API Client
 *
 * Handles authentication (OAuth 2.0 client credentials) and data fetching
 * from the Toast REST API.
 *
 * Toast API docs: https://doc.toasttab.com/doc/devguide/index.html
 * API Reference: https://toastintegrations.redoc.ly/openapi/
 */

const TOAST_API_BASE = "https://ws-api.toasttab.com";
const TOAST_AUTH_URL = `${TOAST_API_BASE}/authentication/v1/authentication/login`;

interface ToastCredentials {
  clientId: string;
  clientSecret: string;
  restaurantGuid: string;
}

interface ToastToken {
  accessToken: string;
  expiresAt: Date;
}

interface ToastMenuItem {
  guid: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  category: string;
  isAvailable: boolean;
}

interface ToastMenuGroup {
  guid: string;
  name: string;
  description: string | null;
  menuItems: ToastMenuItem[];
}

/**
 * Authenticate with Toast API using client credentials.
 * Returns a bearer token for subsequent API calls.
 */
export async function getToastToken(
  credentials: ToastCredentials
): Promise<ToastToken> {
  const response = await fetch(TOAST_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      userAccessType: "TOAST_MACHINE_CLIENT",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast auth failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.token?.accessToken || data.accessToken,
    // Toast tokens typically expire in ~12 hours. Default to 11 hours to be safe.
    expiresAt: new Date(Date.now() + 11 * 60 * 60 * 1000),
  };
}

/**
 * Fetch menus from Toast API (V2).
 * Returns menu groups with their items.
 */
export async function getToastMenus(
  token: string,
  restaurantGuid: string
): Promise<ToastMenuGroup[]> {
  const response = await fetch(
    `${TOAST_API_BASE}/menus/v2/menus`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Toast-Restaurant-External-ID": restaurantGuid,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast menus fetch failed (${response.status}): ${errorText}`);
  }

  const menus = await response.json();
  const allGroups: ToastMenuGroup[] = [];

  // Parse the menu structure: menus -> menuGroups -> menuItems
  for (const menu of menus) {
    if (!menu.menuGroups) continue;

    for (const group of menu.menuGroups) {
      const items: ToastMenuItem[] = [];

      if (group.menuItems) {
        for (const item of group.menuItems) {
          items.push({
            guid: item.guid || item.multiLocationId || "",
            name: item.name || "Unknown Item",
            description: item.description || null,
            price: item.price ?? item.prices?.[0]?.price ?? null,
            imageUrl: item.imageLink || item.image || null,
            category: group.name || "Uncategorized",
            isAvailable:
              item.visibility !== "HIDDEN" &&
              item.isDeactivated !== true,
          });
        }
      }

      allGroups.push({
        guid: group.guid || group.multiLocationId || "",
        name: group.name || "Uncategorized",
        description: group.description || null,
        menuItems: items,
      });
    }
  }

  return allGroups;
}

/**
 * Test Toast API connection with provided credentials.
 * Returns true if authentication succeeds and we can read restaurant info.
 */
export async function testToastConnection(
  credentials: ToastCredentials
): Promise<{ success: boolean; error?: string; restaurantName?: string }> {
  try {
    const token = await getToastToken(credentials);

    // Try to fetch restaurant config to verify the restaurant GUID works
    const response = await fetch(
      `${TOAST_API_BASE}/restaurants/v1/restaurants/${credentials.restaurantGuid}`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Toast-Restaurant-External-ID": credentials.restaurantGuid,
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Could not access restaurant (${response.status}). Check your Restaurant GUID.`,
      };
    }

    const restaurant = await response.json();

    return {
      success: true,
      restaurantName: restaurant.restaurantName || restaurant.name,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * Sync Toast menu items to our pos_menu_items table.
 * Fetches menus from Toast, then upserts items into Supabase.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncToastMenu(
  venueId: string,
  credentials: ToastCredentials,
  supabaseAdmin: any
): Promise<{ itemCount: number; error?: string }> {
  try {
    const token = await getToastToken(credentials);
    const menuGroups = await getToastMenus(token.accessToken, credentials.restaurantGuid);

    // Flatten all items
    const allItems = menuGroups.flatMap((group) =>
      group.menuItems.map((item) => ({
        venue_id: venueId,
        provider: "toast",
        external_id: item.guid,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image_url: item.imageUrl,
        is_available: item.isAvailable,
        is_featured: false,
        raw_data: item,
        synced_at: new Date().toISOString(),
      }))
    );

    // Delete old items for this venue/provider and insert fresh
    await supabaseAdmin
      .from("pos_menu_items")
      .delete()
      .eq("venue_id", venueId)
      .eq("provider", "toast");

    if (allItems.length > 0) {
      const { error } = await supabaseAdmin
        .from("pos_menu_items")
        .insert(allItems);

      if (error) {
        return { itemCount: 0, error: String(error) };
      }
    }

    // Update last_synced_at on the integration record
    await supabaseAdmin
      .from("venue_integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("venue_id", venueId)
      .eq("provider", "toast");

    return { itemCount: allItems.length };
  } catch (err) {
    return {
      itemCount: 0,
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}
