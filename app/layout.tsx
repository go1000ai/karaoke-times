import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Mr_Dafoe } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import GlobalNav from "@/components/GlobalNav";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const mrDafoe = Mr_Dafoe({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dafoe",
  display: "swap",
});

const SITE_URL = "https://karaoketimes.net";
const SITE_NAME = "Karaoke Times NYC";
const SITE_DESCRIPTION =
  "The most complete directory of karaoke nights, KJs, and karaoke venues in NYC. Find karaoke every night of the week across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island. Browse by neighborhood, view the interactive map, and request songs at participating venues.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Karaoke Nights, KJs & Venues in New York City`,
    template: "%s | Karaoke Times NYC",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "karaoke NYC",
    "karaoke New York",
    "karaoke nights",
    "karaoke bars NYC",
    "private karaoke rooms NYC",
    "karaoke Manhattan",
    "karaoke Brooklyn",
    "karaoke Queens",
    "karaoke Bronx",
    "karaoke Staten Island",
    "KJ NYC",
    "karaoke jockey",
    "karaoke schedule",
    "where to sing karaoke NYC",
    "karaoke tonight",
  ],
  authors: [{ name: "Karaoke Times" }],
  creator: "Karaoke Times",
  publisher: "Karaoke Times",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Karaoke Nights, KJs & Venues in New York City`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Karaoke Times NYC — the NYC karaoke directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Karaoke Nights, KJs & Venues in NYC`,
    description: SITE_DESCRIPTION,
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Karaoke Times",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  category: "entertainment",
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "Karaoke Times",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: SITE_DESCRIPTION,
  sameAs: [
    "https://www.facebook.com/karaoketimesnyc",
    "https://www.instagram.com/karaoketimesnyc",
  ],
  areaServed: {
    "@type": "City",
    name: "New York",
  },
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakarta.variable} ${mrDafoe.variable}`}>
      <head>
        <link
          rel="preload"
          href="/fonts/material-icons-round.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          href="/fonts/material-icons.css"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className="bg-bg-dark text-text-primary antialiased">
        <ServiceWorkerRegistration />
        <ThemeProvider>
          <AuthProvider>
            <GlobalNav />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
