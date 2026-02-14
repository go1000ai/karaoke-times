// Types and constants for the KJ Flyer Generator feature

export interface FlyerRequest {
  // Event Basics
  eventName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  coverCharge: string;

  // Vibe & Theme
  theme: string;
  moodDescription: string;
  dressCode: string;
  specialFeatures: string[];

  // Specials & Promos
  drinkSpecials: string;
  foodDeals: string;
  prizes: string;
  promoText: string;

  // Custom Image (optional)
  imageUrl?: string;

  // Metadata
  venueId: string;
}

export interface CopyData {
  headline: string;
  tagline: string;
  body: string;
  highlights: string[];
  socialCaption: string;
  hashtags: string[];
  imageKeywords: string[];
}

export interface FlyerResponse {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  copyData?: CopyData;
  error?: string;
}

export interface N8nWebhookResponse {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  copyData?: CopyData;
  error?: string | null;
}

export const THEME_OPTIONS = [
  "Open Mic Karaoke",
  "Hip-Hop & R&B Night",
  "Latin Karaoke",
  "K-Pop Night",
  "80s/90s Throwback",
  "Rock & Metal Karaoke",
  "Broadway & Show Tunes",
  "Country Karaoke",
  "Reggaeton Night",
  "Duets Night",
  "Karaoke Contest",
  "Custom",
] as const;

export const FEATURE_OPTIONS = [
  "Live Band",
  "Karaoke Contest",
  "Cash Prizes",
  "Drink Specials",
  "DJ Set",
  "Open Bar Hour",
  "Costume Theme",
  "Ladies Night",
  "Birthday Package",
  "Late Night",
] as const;
