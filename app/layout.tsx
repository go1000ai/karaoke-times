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

export const metadata: Metadata = {
  title: "Karaoke Times NYC",
  description: "Your ultimate guide to the karaoke scene in NYC",
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
