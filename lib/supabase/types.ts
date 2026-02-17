export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "venue_owner" | "admin" | "advertiser";

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
}
export type MediaType = "image" | "video";
export type SongStatus = "waiting" | "up_next" | "now_singing" | "completed" | "skipped";
export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type HighlightType = "singer_of_night" | "weekly_featured" | "monthly_featured";
export type AdPlacementType = "kj_profile" | "event_listing" | "tv_display";
export type AdSlotStatus = "pending" | "accepted" | "rejected";
export type AdvertiserCategory = "liquor_brand" | "microphone" | "equipment" | "general";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          avatar_url: string | null;
          address: string | null;
          phone: string | null;
          website: string | null;
          social_links: SocialLinks;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name?: string | null;
          avatar_url?: string | null;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          social_links?: SocialLinks;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          display_name?: string | null;
          avatar_url?: string | null;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          social_links?: SocialLinks;
          created_at?: string;
          updated_at?: string;
        };
      };
      venues: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          address: string;
          city: string;
          state: string;
          neighborhood: string;
          cross_street: string;
          phone: string;
          website: string | null;
          description: string | null;
          is_private_room: boolean;
          booking_url: string | null;
          latitude: number | null;
          longitude: number | null;
          queue_paused: boolean;
          hours_of_operation: Json;
          venue_type: string;
          restrictions: Json;
          custom_rules: string[];
          age_restriction: string;
          dress_code: string;
          cover_charge: string;
          drink_minimum: string;
          parking: string;
          capacity: string | null;
          food_available: boolean;
          happy_hour_details: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          address: string;
          city?: string;
          state?: string;
          neighborhood?: string;
          cross_street?: string;
          phone?: string;
          website?: string | null;
          description?: string | null;
          is_private_room?: boolean;
          booking_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          queue_paused?: boolean;
          hours_of_operation?: Json;
          venue_type?: string;
          restrictions?: Json;
          custom_rules?: string[];
          age_restriction?: string;
          dress_code?: string;
          cover_charge?: string;
          drink_minimum?: string;
          parking?: string;
          capacity?: string | null;
          food_available?: boolean;
          happy_hour_details?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          neighborhood?: string;
          cross_street?: string;
          phone?: string;
          website?: string | null;
          description?: string | null;
          is_private_room?: boolean;
          booking_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          queue_paused?: boolean;
          hours_of_operation?: Json;
          venue_type?: string;
          restrictions?: Json;
          custom_rules?: string[];
          age_restriction?: string;
          dress_code?: string;
          cover_charge?: string;
          drink_minimum?: string;
          parking?: string;
          capacity?: string | null;
          food_available?: boolean;
          happy_hour_details?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      venue_events: {
        Row: {
          id: string;
          venue_id: string;
          kj_user_id: string | null;
          day_of_week: string;
          event_name: string;
          dj: string;
          start_time: string;
          end_time: string;
          notes: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          kj_user_id?: string | null;
          day_of_week: string;
          event_name?: string;
          dj?: string;
          start_time?: string;
          end_time?: string;
          notes?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          kj_user_id?: string | null;
          day_of_week?: string;
          event_name?: string;
          dj?: string;
          start_time?: string;
          end_time?: string;
          notes?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      venue_media: {
        Row: {
          id: string;
          venue_id: string;
          event_id: string | null;
          url: string;
          type: MediaType;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          event_id?: string | null;
          url: string;
          type?: MediaType;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          event_id?: string | null;
          url?: string;
          type?: MediaType;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      venue_promos: {
        Row: {
          id: string;
          venue_id: string;
          event_id: string | null;
          title: string;
          description: string;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          event_id?: string | null;
          title: string;
          description?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          event_id?: string | null;
          title?: string;
          description?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      song_queue: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          song_title: string;
          artist: string;
          status: SongStatus;
          position: number;
          requested_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          song_title: string;
          artist?: string;
          status?: SongStatus;
          position?: number;
          requested_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          song_title?: string;
          artist?: string;
          status?: SongStatus;
          position?: number;
          requested_at?: string;
          completed_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          rating: number;
          text: string;
          is_anonymous: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          rating: number;
          text?: string;
          is_anonymous?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          rating?: number;
          text?: string;
          is_anonymous?: boolean;
          created_at?: string;
        };
      };
      kj_reviews: {
        Row: {
          id: string;
          kj_slug: string;
          user_id: string;
          rating: number;
          text: string;
          is_anonymous: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          kj_slug: string;
          user_id: string;
          rating: number;
          text?: string;
          is_anonymous?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          kj_slug?: string;
          user_id?: string;
          rating?: number;
          text?: string;
          is_anonymous?: boolean;
          created_at?: string;
        };
      };
      review_photos: {
        Row: {
          id: string;
          review_id: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          url?: string;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          venue_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          venue_id?: string;
          created_at?: string;
        };
      };
      room_bookings: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string;
          party_size: number;
          status: BookingStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string;
          party_size?: number;
          status?: BookingStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          party_size?: number;
          status?: BookingStatus;
          created_at?: string;
        };
      };
      // ─── NEW TABLES ───
      advertiser_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          logo_url: string | null;
          description: string | null;
          website: string | null;
          category: AdvertiserCategory;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          logo_url?: string | null;
          description?: string | null;
          website?: string | null;
          category?: AdvertiserCategory;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          logo_url?: string | null;
          description?: string | null;
          website?: string | null;
          category?: AdvertiserCategory;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_placements: {
        Row: {
          id: string;
          advertiser_id: string;
          placement_type: AdPlacementType;
          image_url: string | null;
          link_url: string | null;
          headline: string | null;
          body_text: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          advertiser_id: string;
          placement_type?: AdPlacementType;
          image_url?: string | null;
          link_url?: string | null;
          headline?: string | null;
          body_text?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          advertiser_id?: string;
          placement_type?: AdPlacementType;
          image_url?: string | null;
          link_url?: string | null;
          headline?: string | null;
          body_text?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      kj_ad_slots: {
        Row: {
          id: string;
          kj_user_id: string;
          ad_placement_id: string;
          status: AdSlotStatus;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kj_user_id: string;
          ad_placement_id: string;
          status?: AdSlotStatus;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kj_user_id?: string;
          ad_placement_id?: string;
          status?: AdSlotStatus;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      singer_highlights: {
        Row: {
          id: string;
          venue_id: string;
          event_id: string | null;
          singer_user_id: string;
          highlighted_by: string;
          highlight_type: HighlightType;
          title: string | null;
          notes: string | null;
          song_title: string | null;
          song_artist: string | null;
          event_date: string;
          is_active: boolean;
          created_at: string;
          video_url: string | null;
          consent_status: "pending" | "approved" | "declined";
        };
        Insert: {
          id?: string;
          venue_id: string;
          event_id?: string | null;
          singer_user_id: string;
          highlighted_by: string;
          highlight_type?: HighlightType;
          title?: string | null;
          notes?: string | null;
          song_title?: string | null;
          song_artist?: string | null;
          event_date?: string;
          is_active?: boolean;
          created_at?: string;
          video_url?: string | null;
          consent_status?: "pending" | "approved" | "declined";
        };
        Update: {
          id?: string;
          venue_id?: string;
          event_id?: string | null;
          singer_user_id?: string;
          highlighted_by?: string;
          highlight_type?: HighlightType;
          title?: string | null;
          notes?: string | null;
          song_title?: string | null;
          song_artist?: string | null;
          event_date?: string;
          is_active?: boolean;
          created_at?: string;
          video_url?: string | null;
          consent_status?: "pending" | "approved" | "declined";
        };
      };
      kj_profiles: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          stage_name: string;
          bio: string | null;
          photo_url: string | null;
          genres: string[];
          equipment: string[];
          social_links: SocialLinks;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          stage_name: string;
          bio?: string | null;
          photo_url?: string | null;
          genres?: string[];
          equipment?: string[];
          social_links?: SocialLinks;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          stage_name?: string;
          bio?: string | null;
          photo_url?: string | null;
          genres?: string[];
          equipment?: string[];
          social_links?: SocialLinks;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      media_type: MediaType;
      song_status: SongStatus;
      booking_status: BookingStatus;
      highlight_type: HighlightType;
      ad_placement_type: AdPlacementType;
      ad_slot_status: AdSlotStatus;
      advertiser_category: AdvertiserCategory;
    };
  };
}
