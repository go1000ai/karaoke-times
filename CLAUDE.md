# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Karaoke Nights is a full-stack web app for discovering and managing karaoke events in NYC. It supports multiple user roles: regular users, venue owners, KJs (karaoke jockeys), and admins.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Styling**: Tailwind CSS 4 via PostCSS, plus glass-morphism custom classes (`.glass-card`)
- **Database/Auth**: Supabase (PostgreSQL + Auth + Real-time subscriptions)
- **UI**: Radix UI primitives, Framer Motion animations, Lucide React + Material Icons
- **Email**: Resend
- **Maps**: MapLibre GL
- **POS Integration**: Toast API
- **Deployment**: Vercel

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Start production server
```

All commands must be run from the `karaoke-times/` subdirectory.

## Architecture

### Routing & Pages

Uses Next.js App Router (`app/` directory). Key route groups:
- `/` — Home page with venue showcase
- `/venue/[id]` — Venue detail
- `/dashboard/**` — Venue owner dashboard (events, bookings, queue, media, promos, staff, integrations)
- `/admin/` — Admin dashboard
- `/map/` — Interactive venue map
- `/kj/[slug]` — KJ profile page; `/kj/[slug]/review` — Review a KJ
- `/add-event` — Submit new karaoke event
- `/review/[venueId]` — Write venue review
- `/search/`, `/favorites/`, `/profile/`, `/notifications/` — User-facing pages

### API Routes (`app/api/`)

- `active-venue/` — Active venue from cookies
- `admin/sync-sheet/` — Google Sheets CSV sync
- `toast/` — Toast POS integration (sync-menu, test-connection)
- `notify-booking/`, `send-reminder/`, `invite-kj/` — Email notifications via Resend
- `request-connection/`, `respond-connection/` — KJ connection request workflow

### Data Layer (`lib/`)

- `lib/supabase/client.ts` — Browser-side Supabase client
- `lib/supabase/server.ts` — Server-side Supabase client
- `lib/supabase/middleware.ts` — Session refresh logic
- `lib/supabase/types.ts` — Database TypeScript types
- `lib/data/` — Query helpers organized by domain (venues, bookings, queue, reviews, favorites, kjs)
- `lib/auth.ts` — Auth helpers: `getUser()`, `requireAuth()`, `requireAdmin()`, `requireVenueOwner()`
- `lib/mock-data.ts` — Static venue data synced from Google Sheets via `scripts/sync-sheet.ts`

### Authentication & Authorization

Supabase Auth with SSR. Middleware (`middleware.ts`) handles session refresh. Four roles defined as a DB enum: `user`, `venue_owner`, `admin`, `kj`. Role checks use helpers in `lib/auth.ts`.

### Real-Time

Song queue updates use Supabase real-time subscriptions via `hooks/useQueueSubscription.ts`.

### Database

Migrations live in `supabase/migrations/` (001–014). Key tables: `profiles`, `venues`, `venue_events`, `venue_media`, `venue_promos`, `song_queue`, `reviews`, `review_photos`, `kj_reviews`, `favorites`, `room_bookings`, `venue_staff`, `venue_integrations`, `event_reminders`.

### Provider Setup

Root layout wraps the app with `ThemeProvider` and `AuthProvider` context providers.

## Scripts

```bash
npx tsx scripts/seed.ts         # Seed database with initial data
npx tsx scripts/seed-users.ts   # Create test users
npx tsx scripts/sync-sheet.ts   # Sync venues from Google Sheets CSV
```

## Styling

Custom utility classes defined in `app/globals.css`:
- `.glass-card` — Frosted glass card (blur + semi-transparent bg)
- `.neon-glow-green`, `.neon-glow-pink` — Neon text shadow effects
- `.hide-scrollbar` — Cross-browser scrollbar hiding

Theme colors (Tailwind `@theme` variables): `--color-primary` (#00FFC2 cyan), `--color-accent` (#FF007A pink), `--color-bg-dark` (#0B0B0F), `--color-card-dark` (#16161E).

## Conventions

- Components use PascalCase filenames; utilities use kebab-case
- Database tables and columns use snake_case
- `"use client"` directive for interactive/browser components; `"use server"` for Server Actions in `lib/data/`
- Fonts: Plus Jakarta Sans (body), Mr Dafoe (decorative) from Google Fonts
- UI uses `material-icons-round` class for Material Icons alongside Lucide React icons
- Mobile-first responsive design with Tailwind breakpoints

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
