import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // TV display page — allow iframe embedding for kiosks/signage
        source: "/venue/:id/tv",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com https://*.supabase.co https://is1-ssl.mzstatic.com https://is2-ssl.mzstatic.com https://is3-ssl.mzstatic.com https://is4-ssl.mzstatic.com https://is5-ssl.mzstatic.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://lrclib.net https://itunes.apple.com",
              "frame-src 'self' https://www.youtube-nocookie.com",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self' *",
            ].join("; "),
          },
        ],
      },
      {
        // All other pages — strict security
        source: "/((?!venue/[^/]+/tv).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com https://*.supabase.co https://is1-ssl.mzstatic.com https://is2-ssl.mzstatic.com https://is3-ssl.mzstatic.com https://is4-ssl.mzstatic.com https://is5-ssl.mzstatic.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://lrclib.net https://itunes.apple.com",
              "frame-src 'self' https://www.youtube-nocookie.com",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
