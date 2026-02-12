"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface Integration {
  id: string;
  provider: string;
  restaurant_guid: string;
  is_active: boolean;
  last_synced_at: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string;
  is_available: boolean;
  is_featured: boolean;
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string | null>(null);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect form
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [restaurantGuid, setRestaurantGuid] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!venue) {
        setLoading(false);
        return;
      }
      setVenueId(venue.id);

      // Check for existing integration
      const { data: integrationData } = await supabase
        .from("venue_integrations")
        .select("id, provider, restaurant_guid, is_active, last_synced_at")
        .eq("venue_id", venue.id)
        .eq("provider", "toast")
        .single();

      if (integrationData) {
        setIntegration(integrationData);

        // Fetch synced menu items
        const { data: items } = await supabase
          .from("pos_menu_items")
          .select("id, name, description, price, category, is_available, is_featured")
          .eq("venue_id", venue.id)
          .eq("provider", "toast")
          .order("category")
          .order("name");

        setMenuItems((items as MenuItem[]) || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, supabase]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId || !clientId || !clientSecret || !restaurantGuid) return;

    setConnecting(true);
    setError("");
    setMessage("");

    // Test the connection first
    const testRes = await fetch("/api/toast/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, restaurantGuid }),
    });

    const testResult = await testRes.json();

    if (!testResult.success) {
      setConnecting(false);
      setError(testResult.error || "Could not connect to Toast.");
      return;
    }

    // Save integration
    const { data: saved, error: saveError } = await supabase
      .from("venue_integrations")
      .upsert(
        {
          venue_id: venueId,
          provider: "toast",
          client_id: clientId,
          client_secret: clientSecret,
          restaurant_guid: restaurantGuid,
          is_active: true,
        },
        { onConflict: "venue_id,provider" }
      )
      .select("id, provider, restaurant_guid, is_active, last_synced_at")
      .single();

    setConnecting(false);

    if (saveError) {
      setError("Failed to save integration. Please try again.");
      return;
    }

    setIntegration(saved);
    setMessage(
      `Connected to Toast${testResult.restaurantName ? ` (${testResult.restaurantName})` : ""}! You can now sync your menu.`
    );
    setClientId("");
    setClientSecret("");
    setRestaurantGuid("");
  };

  const handleSync = async () => {
    if (!venueId) return;

    setSyncing(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/toast/sync-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId }),
    });

    const result = await res.json();
    setSyncing(false);

    if (!res.ok) {
      setError(result.error || "Sync failed.");
      return;
    }

    setMessage(result.message);

    // Refresh menu items
    const { data: items } = await supabase
      .from("pos_menu_items")
      .select("id, name, description, price, category, is_available, is_featured")
      .eq("venue_id", venueId)
      .eq("provider", "toast")
      .order("category")
      .order("name");

    setMenuItems((items as MenuItem[]) || []);

    // Update integration last_synced_at
    setIntegration((prev) =>
      prev ? { ...prev, last_synced_at: new Date().toISOString() } : prev
    );
  };

  const toggleFeatured = async (itemId: string, currentlyFeatured: boolean) => {
    await supabase
      .from("pos_menu_items")
      .update({ is_featured: !currentlyFeatured })
      .eq("id", itemId);

    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_featured: !currentlyFeatured } : item
      )
    );
  };

  const handleDisconnect = async () => {
    if (!integration || !venueId) return;

    await supabase
      .from("venue_integrations")
      .update({ is_active: false })
      .eq("id", integration.id);

    setIntegration(null);
    setMenuItems([]);
    setMessage("Toast disconnected.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group menu items by category
  const categories = menuItems.reduce<Record<string, MenuItem[]>>(
    (acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  const featuredItems = menuItems.filter((item) => item.is_featured);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-1">
        POS Integration
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Connect your POS system to automatically sync menu items, drink
        specials, and more.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <p className="text-green-400 text-sm">{message}</p>
        </div>
      )}

      {/* Toast Connection */}
      <div className="glass-card rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <span className="material-icons-round text-orange-400">
              point_of_sale
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white">Toast POS</h2>
            <p className="text-text-muted text-xs">
              Sync menus and drink specials from your Toast system
            </p>
          </div>
          {integration?.is_active && (
            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Connected
            </span>
          )}
        </div>

        {integration?.is_active ? (
          <div>
            <div className="flex items-center justify-between bg-card-dark rounded-xl p-4 mb-4">
              <div>
                <p className="text-xs text-text-muted">Restaurant GUID</p>
                <p className="text-sm text-white font-mono">
                  {integration.restaurant_guid}
                </p>
                {integration.last_synced_at && (
                  <p className="text-xs text-text-muted mt-1">
                    Last synced:{" "}
                    {new Date(integration.last_synced_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="bg-primary text-black font-bold text-sm px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {syncing ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-icons-round text-base">
                      sync
                    </span>
                  )}
                  {syncing ? "Syncing..." : "Sync Menu"}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="text-text-muted hover:text-red-400 transition-colors px-2"
                  title="Disconnect"
                >
                  <span className="material-icons-round">link_off</span>
                </button>
              </div>
            </div>

            {/* Featured Specials */}
            {featuredItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">
                  Featured Specials ({featuredItems.length})
                </p>
                <p className="text-text-muted text-xs mb-3">
                  These items show on your TV display and venue page.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {featuredItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-accent/5 border border-accent/20 rounded-xl p-3"
                    >
                      <p className="text-white font-semibold text-sm">
                        {item.name}
                      </p>
                      {item.price && (
                        <p className="text-accent font-bold text-sm">
                          ${item.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items by Category */}
            {Object.keys(categories).length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                  All Menu Items ({menuItems.length})
                </p>
                <p className="text-text-muted text-xs mb-3">
                  Star items to feature them as specials on your TV display
                  and venue page.
                </p>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {Object.entries(categories).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-xs font-bold text-primary mb-2">
                        {category} ({items.length})
                      </p>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-card-dark rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() =>
                                  toggleFeatured(item.id, item.is_featured)
                                }
                                className={`flex-shrink-0 ${
                                  item.is_featured
                                    ? "text-accent"
                                    : "text-text-muted hover:text-accent"
                                } transition-colors`}
                                title={
                                  item.is_featured
                                    ? "Remove from specials"
                                    : "Add to specials"
                                }
                              >
                                <span className="material-icons-round text-lg">
                                  {item.is_featured ? "star" : "star_border"}
                                </span>
                              </button>
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    item.is_available
                                      ? "text-white"
                                      : "text-text-muted line-through"
                                  }`}
                                >
                                  {item.name}
                                </p>
                              </div>
                            </div>
                            {item.price && (
                              <span className="text-sm font-bold text-text-secondary ml-2 flex-shrink-0">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {menuItems.length === 0 && (
              <div className="text-center py-8 bg-card-dark rounded-xl">
                <span className="material-icons-round text-3xl text-text-muted mb-2">
                  restaurant_menu
                </span>
                <p className="text-text-muted text-sm">
                  No menu items synced yet. Click &quot;Sync Menu&quot; to pull
                  items from Toast.
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-3">
            <p className="text-text-muted text-xs mb-2">
              Get your API credentials from Toast Web: Integrations → Toast
              API access → Manage credentials
            </p>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
              required
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 placeholder:text-text-muted font-mono"
            />
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Client Secret"
              required
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 placeholder:text-text-muted font-mono"
            />
            <input
              type="text"
              value={restaurantGuid}
              onChange={(e) => setRestaurantGuid(e.target.value)}
              placeholder="Restaurant GUID"
              required
              className="w-full bg-card-dark border border-border rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 placeholder:text-text-muted font-mono"
            />
            <button
              type="submit"
              disabled={connecting}
              className="w-full bg-orange-500 text-white font-bold text-sm py-3 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connecting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-icons-round text-lg">link</span>
                  Connect Toast
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* SkyTab (Coming Soon) */}
      <div className="glass-card rounded-2xl p-5 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <span className="material-icons-round text-blue-400">
              point_of_sale
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white">SkyTab POS</h2>
            <p className="text-text-muted text-xs">
              Shift4 SkyTab integration
            </p>
          </div>
          <span className="text-xs font-bold text-text-muted bg-white/5 px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8 glass-card rounded-2xl p-5">
        <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
          How POS Integration Works
        </p>
        <div className="space-y-2.5">
          {[
            {
              icon: "link",
              text: "Connect your POS with API credentials from your Toast admin",
            },
            {
              icon: "sync",
              text: "Sync your menu — drinks, food, and prices are pulled automatically",
            },
            {
              icon: "star",
              text: "Feature specials — star items to show them on your TV display and venue page",
            },
            {
              icon: "tv",
              text: "Customers see your featured specials on the bar TV and when browsing your venue",
            },
          ].map((step) => (
            <div key={step.icon} className="flex items-center gap-3">
              <span className="material-icons-round text-accent text-lg">
                {step.icon}
              </span>
              <span className="text-sm text-text-secondary">{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
