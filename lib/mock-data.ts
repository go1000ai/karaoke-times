export const venues = [
  {
    id: "space-karaoke",
    name: "Space Karaoke",
    neighborhood: "Koreatown, Manhattan",
    rating: 4.8,
    reviewCount: 124,
    priceRange: "$$$",
    isLive: true,
    coverCharge: null,
    hasDrinkSpecials: true,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    address: "32 W 32nd St, New York, NY 10001",
    hours: {
      today: "5:00 PM - 4:00 AM",
      monThu: "6:00 PM - 2:00 AM",
      friSat: "5:00 PM - 4:00 AM",
      sun: "4:00 PM - 1:00 AM",
    },
    isOpen: true,
    specials: [
      { type: "Happy Hour", title: "$8 Lychee Martinis", detail: "Until 9:00 PM" },
      { type: "Group Deal", title: "2-for-1 Sake Bombs", detail: "Private Rooms Only" },
    ],
    recentlyPlayed: [
      { title: "Bohemian Rhapsody", artist: "Queen", timeAgo: "3 min ago" },
      { title: "Cruel Summer", artist: "Taylor Swift", timeAgo: "12 min ago" },
    ],
    isFavorite: false,
  },
  {
    id: "sing-sing-ave-a",
    name: "Sing Sing Ave A",
    neighborhood: "East Village",
    rating: 4.5,
    reviewCount: 89,
    priceRange: "$$",
    isLive: true,
    coverCharge: "$10 Hourly",
    hasDrinkSpecials: false,
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    address: "81 Avenue A, New York, NY 10009",
    hours: {
      today: "6:00 PM - 2:00 AM",
      monThu: "6:00 PM - 2:00 AM",
      friSat: "5:00 PM - 4:00 AM",
      sun: "4:00 PM - 12:00 AM",
    },
    isOpen: true,
    specials: [],
    recentlyPlayed: [
      { title: "Don't Stop Believin'", artist: "Journey", timeAgo: "5 min ago" },
    ],
    isFavorite: true,
  },
  {
    id: "neon-echo-lounge",
    name: "Neon Echo Lounge",
    neighborhood: "Lower East Side, Manhattan",
    rating: 4.9,
    reviewCount: 128,
    priceRange: "$$$",
    isLive: false,
    coverCharge: null,
    hasDrinkSpecials: true,
    image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&q=80",
    address: "123 Ludlow St, New York, NY 10002",
    hours: {
      today: "5:00 PM - 4:00 AM",
      monThu: "6:00 PM - 2:00 AM",
      friSat: "5:00 PM - 4:00 AM",
      sun: "4:00 PM - 1:00 AM",
    },
    isOpen: true,
    specials: [
      { type: "Happy Hour", title: "$8 Lychee Martinis", detail: "Until 9:00 PM" },
      { type: "Group Deal", title: "2-for-1 Sake Bombs", detail: "Private Rooms Only" },
    ],
    recentlyPlayed: [
      { title: "Bohemian Rhapsody", artist: "Queen", timeAgo: "3 min ago" },
      { title: "Cruel Summer", artist: "Taylor Swift", timeAgo: "12 min ago" },
    ],
    isFavorite: false,
  },
  {
    id: "baby-grand",
    name: "Baby Grand",
    neighborhood: "Nolita, Manhattan",
    rating: 4.6,
    reviewCount: 76,
    priceRange: "$$",
    isLive: true,
    coverCharge: null,
    hasDrinkSpecials: true,
    image: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=600&q=80",
    address: "161 Lafayette St, New York, NY 10013",
    hours: {
      today: "7:00 PM - 3:00 AM",
      monThu: "7:00 PM - 2:00 AM",
      friSat: "7:00 PM - 3:00 AM",
      sun: "5:00 PM - 12:00 AM",
    },
    isOpen: true,
    specials: [
      { type: "Happy Hour", title: "$5 Well Drinks", detail: "Until 8:00 PM" },
    ],
    recentlyPlayed: [
      { title: "Flowers", artist: "Miley Cyrus", timeAgo: "Now" },
    ],
    isFavorite: false,
  },
];

export const events = [
  {
    id: "halloween-bash",
    title: "Halloween Karaoke Bash",
    venue: "Radio Star Karaoke",
    date: "Fri, Oct 27",
    time: "10PM",
    image: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=300&q=80",
  },
  {
    id: "broadway-night",
    title: "Broadway Only Night",
    venue: "The Duplex",
    date: "Sun, Oct 29",
    time: "8PM",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=300&q=80",
  },
  {
    id: "90s-grunge",
    title: "90s Grunge Karaoke Night",
    venue: "The Mic Drop",
    date: "Sat, Nov 4",
    time: "9PM",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80",
  },
];

export const reviews = [
  {
    id: "r1",
    author: "Sarah Jenkins",
    rating: 5,
    timeAgo: "2d ago",
    text: "The sound system here is incredible. Best private rooms in the LES! Definitely coming back for my birthday.",
    avatar: null,
  },
  {
    id: "r2",
    author: "Mike Thompson",
    rating: 4,
    timeAgo: "1w ago",
    text: "Great song selection. The drinks are a bit pricey but worth it for the vibe.",
    avatar: null,
  },
];

export const songSearchResults = [
  {
    song: "Don't Stop Believin'",
    artist: "Journey",
    venues: [
      { name: "The Sing-Along Bar", distance: "0.2 mi", neighborhood: "East Village", available: true, waitTime: null, special: "$5 Well Drinks Tonight" },
      { name: "Neon Mic Lounge", distance: "0.8 mi", neighborhood: "Lower East Side", available: true, waitTime: "20m Waitlist", special: "2-for-1 Margaritas" },
      { name: "Upper East Echo", distance: "1.1 mi", neighborhood: "", available: true, waitTime: null, special: "Free Shot with First Song" },
      { name: "East Village Vibes", distance: "2.4 mi", neighborhood: "", available: false, waitTime: null, special: null },
    ],
  },
];

export const sponsoredKJ = {
  name: "DJ Echo",
  venue: "Maru Chelsea",
  time: "Tonight 9PM - 2AM",
  isTrending: true,
  image: "https://images.unsplash.com/photo-1571266028243-3716f02d2d74?w=600&q=80",
};

export const userProfile = {
  name: "Karaoke King NYC",
  username: "@alex_vocalist",
  isPremium: true,
  isKJVerified: true,
  venuesVisited: 42,
  reviewsCount: 128,
  followers: "1.2k",
  avatar: null,
  favorites: [
    { id: "neon-tokyo", name: "Neon Tokyo NYC", neighborhood: "Upper East Side", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80" },
    { id: "vocal-battle", name: "Vocal Battle Night", neighborhood: "Every Friday", image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=300&q=80" },
  ],
};
