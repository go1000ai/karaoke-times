import { createClient } from "@/lib/supabase/server";

export interface VenueWithEvents {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  cross_street: string;
  phone: string;
  description: string | null;
  is_private_room: boolean;
  booking_url: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_id: string | null;
  venue_events: {
    id: string;
    day_of_week: string;
    event_name: string;
    dj: string;
    start_time: string;
    end_time: string;
    notes: string;
    is_active: boolean;
  }[];
  venue_media: {
    id: string;
    url: string;
    type: string;
    is_primary: boolean;
    sort_order: number;
  }[];
}

export async function getVenues(): Promise<VenueWithEvents[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(`
      *,
      venue_events(*),
      venue_media(*)
    `)
    .order("name");

  if (error) {
    console.error("Error fetching venues:", error.message);
    return [];
  }

  return (data ?? []) as unknown as VenueWithEvents[];
}

export async function getVenueById(id: string): Promise<VenueWithEvents | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(`
      *,
      venue_events(*),
      venue_media(*),
      venue_promos(*),
      reviews(*, profiles(display_name, avatar_url))
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching venue:", error.message);
    return null;
  }

  return data as unknown as VenueWithEvents;
}

export async function getVenuesByDay(day: string): Promise<VenueWithEvents[]> {
  const supabase = await createClient();

  if (day === "Private Room Karaoke") {
    const { data, error } = await supabase
      .from("venues")
      .select(`*, venue_events(*), venue_media(*)`)
      .eq("is_private_room", true)
      .order("name");

    if (error) return [];
    return (data ?? []) as unknown as VenueWithEvents[];
  }

  // Get venue IDs that have events on this day
  const { data: eventData } = await supabase
    .from("venue_events")
    .select("venue_id")
    .eq("day_of_week", day)
    .eq("is_active", true);

  if (!eventData || eventData.length === 0) return [];

  const venueIds = [...new Set(eventData.map((e) => e.venue_id))];

  const { data, error } = await supabase
    .from("venues")
    .select(`*, venue_events(*), venue_media(*)`)
    .in("id", venueIds)
    .order("name");

  if (error) return [];
  return (data ?? []) as unknown as VenueWithEvents[];
}

export async function searchVenues(query: string): Promise<VenueWithEvents[]> {
  const supabase = await createClient();
  const q = `%${query}%`;

  const { data, error } = await supabase
    .from("venues")
    .select(`*, venue_events(*), venue_media(*)`)
    .or(`name.ilike.${q},address.ilike.${q},neighborhood.ilike.${q},city.ilike.${q}`)
    .order("name")
    .limit(20);

  if (error) {
    console.error("Error searching venues:", error.message);
    return [];
  }

  return (data ?? []) as unknown as VenueWithEvents[];
}
