# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `karaoke-times/` subdirectory:

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Start production server
```

Seed/sync scripts:
```bash
npx tsx scripts/seed.ts              # Seed venues from mock data
npx tsx scripts/seed-users.ts        # Create test users
npx tsx scripts/seed-venue-owners-kjs.ts  # Create test owners/KJs
npx tsx scripts/sync-sheet.ts        # Sync from Google Sheets CSV
npx tsx scripts/dedup-venues.ts      # Remove duplicate venues
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 via PostCSS (`@tailwindcss/postcss`), no tailwind.config file
- **Database/Auth**: Supabase (PostgreSQL + Auth + Real-time + RLS)
- **UI**: Radix UI primitives, Framer Motion, Lucide React + Material Icons (`material-icons-round`)
- **Email**: Resend | **Maps**: MapLibre GL | **POS**: Toast API | **PWA**: web-push + VAPID
- **Deployment**: Vercel at karaoke-times.vercel.app

## Architecture

### Two Data Sources (Critical Pattern)

1. **Mock data** (`lib/mock-data.ts`): Hardcoded `karaokeEvents[]` with NYC venues. Uses slug IDs like `"fusion-east-monday"`.
2. **Supabase `venues` table**: Dynamic venues created by owners/KJs. Uses UUID IDs.

These are **separate sources**. `lib/resolve-venue-id.ts` bridges them via `resolveVenueId()` which does an `ilike` name lookup. If a song is submitted with a different UUID than the KJ dashboard expects, the queue appears empty on the KJ side but shows fine on the singer's My Queue (which fetches by `user_id`).

### Routing

App Router (`app/`). Key route groups:
- `/` — Home page showcase (venue gallery, card stack, featured singers)
- `/venue/[id]` — Venue detail | `/venue/[id]/tv` — TV display for live queue
- `/dashboard/**` — Multi-role dashboard (owner/KJ/singer/advertiser) with 30+ sub-pages
- `/admin/**` — Admin panel (users, venues, events, bookings, reviews, sync, announcements)
- `/kj/[slug]` — KJ profile | `/map` — Interactive map | `/search` — Venue search
- `/signin` — Auth | `/auth/callback` — OAuth callback (Google)

### API Routes (`app/api/`)

- `active-venue/` — Get active venue from cookies
- `youtube/search/` — YouTube song search proxy
- `generate-flyer/` — AI flyer generation (n8n webhook)
- `push/subscribe/`, `push/send/` — PWA push notifications
- `toast/sync-menu/`, `toast/test-connection/` — Toast POS integration
- `notify-booking/`, `send-reminder/`, `invite-kj/` — Email via Resend
- `request-connection/`, `respond-connection/` — KJ connection workflow
- `admin/sync-sheet/` — Google Sheets CSV sync
- `lyrics/` — Lyrics search | `flyers/` — List saved flyers

### Data Layer

- `lib/supabase/client.ts` — Browser client | `lib/supabase/server.ts` — Server client
- `lib/supabase/middleware.ts` — Session refresh (called from root `middleware.ts`)
- `lib/supabase/types.ts` — Auto-generated DB types (18K+ bytes)
- `lib/data/` — Server Actions (`"use server"`) organized by domain: `venues.ts`, `queue.ts`, `bookings.ts`, `reviews.ts`, `favorites.ts`, `kjs.ts`
- `lib/auth.ts` — `getUser()`, `getUserProfile()`, `requireAuth()`, `requireAdmin()`, `requireVenueOwner()`, `requireKJOrOwner()`, `requireAdvertiser()`
- `lib/permissions.ts` — Role-based permission system with `hasPermission(role, permission)`. Owner-only: `staff.manage`, `integration.manage`. KJ gets everything else.

### Queue System

Songs in `song_queue` table with statuses: `waiting` → `up_next` → `now_singing` → `completed`/`skipped`.

- **Singer view** (`dashboard/my-queue`): Fetches by `user_id` — always works
- **KJ view** (`dashboard/queue`): Fetches by `venue_id` — requires correct UUID
- **TV display** (`venue/[id]/tv`): Fetches by UUID from URL
- **Real-time**: `hooks/useQueueSubscriptionById.ts` (by UUID), `hooks/useQueueSubscription.ts` (by name)

### Auth & Roles

Supabase Auth with SSR. Middleware refreshes sessions. Roles stored in `profiles.role`: `user`, `venue_owner`, `kj`, `advertiser`, `admin`. Google OAuth supported.

### Database

15 migrations in `supabase/migrations/` (001–015). Key tables: `profiles`, `venues`, `venue_events`, `venue_media`, `venue_promos`, `song_queue`, `reviews`, `kj_reviews`, `favorites`, `room_bookings`, `venue_staff`, `venue_integrations`, `event_reminders`, `push_subscriptions`, `connection_requests`.

RLS: SELECT on `song_queue` is public (`USING (true)`).

## Styling

Theme colors defined in `app/globals.css` as `@theme` variables:
- `--color-primary`: #00FFC2 (cyan) | `--color-accent`: #FF007A (pink)
- `--color-bg-dark`: #0B0B0F | `--color-card-dark`: #16161E

Custom classes: `.glass-card` (frosted glass), `.neon-glow-green`/`.neon-glow-pink` (neon text shadows), `.hide-scrollbar`

17 custom keyframe animations including TV display effects (`tvSlideIn`, `tvKenBurns`, `tvShimmer`, `tvGlow`, `tvFloat`).

Fonts: Plus Jakarta Sans (body), Mr Dafoe (decorative script).

## Conventions

- Components: PascalCase filenames | Utilities: kebab-case | DB: snake_case
- `"use client"` for interactive components | `"use server"` for Server Actions in `lib/data/`
- Path alias: `@/*` maps to project root
- Mobile-first responsive design with Tailwind breakpoints
- Root layout wraps app with `ThemeProvider` + `AuthProvider`
- `next.config.ts` allows remote images from `lh3.googleusercontent.com` and `images.unsplash.com`

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- `N8N_WEBHOOK_URL` (flyer generator)
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
