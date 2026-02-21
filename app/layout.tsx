import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import GlobalNav from "@/components/GlobalNav";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Mr+Dafoe&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round&display=block"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round&display=block"
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
