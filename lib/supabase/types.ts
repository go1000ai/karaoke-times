export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "venue_owner" | "admin";

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
}
export type MediaType = "image" | "video";
export type SongStatus = "waiting" | "up_next" | "now_singing" | "completed" | "skipped";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

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
          description: string | null;
          is_private_room: boolean;
          booking_url: string | null;
          latitude: number | null;
          longitude: number | null;
          queue_paused: boolean;
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
          description?: string | null;
          is_private_room?: boolean;
          booking_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          queue_paused?: boolean;
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
          description?: string | null;
          is_private_room?: boolean;
          booking_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          queue_paused?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      venue_events: {
        Row: {
          id: string;
          venue_id: string;
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
          url: string;
          type: MediaType;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          url: string;
          type?: MediaType;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      media_type: MediaType;
      song_status: SongStatus;
      booking_status: BookingStatus;
    };
  };
}
