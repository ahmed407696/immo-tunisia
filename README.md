# Immo Tunisia

A modern real-estate marketplace for Tunisia — list, search, and discover properties for sale or rent, with a map-first browsing experience and support for French, Arabic (RTL), and English.

## Status

**Phase 2: Database + authentication** (in progress). Email/password and Google sign-in, a protected dashboard shell, and the full initial Postgres schema (with Row Level Security) are in place. Property listings, search, and the map come in the phases after this one.

Architecture, tech stack, cost analysis, and the full 13-phase roadmap: see the [Architecture & Launch Plan](https://claude.ai/artifact/SAu3EtPTzsuQnMCvpGMqnd).

## Tech stack

- **Framework**: Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Postgres + PostGIS, Auth, Storage)
- **Hosting**: Vercel (target)
- **Maps**: MapTiler + Leaflet (from Phase 4)
- **Images**: Cloudflare R2 (from Phase 5)
- **AI search**: Claude Haiku (from Phase 9)

## Prerequisites

- Node.js 20.9+ and npm (this repo was built against Node 22)
- A [Supabase](https://supabase.com) project (free tier is enough for development)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (or use an existing one for development).

3. **Run the database migration.** Open the Supabase dashboard → SQL Editor → New query, paste the contents of [`supabase/migrations/20261008120000_init_schema.sql`](./supabase/migrations/20261008120000_init_schema.sql), and run it. (Or, with the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) installed: `supabase link --project-ref <your-ref>` then `supabase db push`.)

4. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's **Settings → API** page.

5. **Allow the auth callback URL.** In the Supabase dashboard → **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to the Redirect URLs allow-list (and your production URL once deployed). Without this, email confirmation, password reset, and Google sign-in will all redirect back with an error.

6. **(Optional) Enable Google sign-in.** In **Authentication → Providers → Google**, add your OAuth client ID/secret. Email/password sign-in works without this step.

7. **Run the dev server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Scope (summary)

- Public browsing with no account required; accounts only for publishing listings
- Map-centric search and listing pages (location picker, draggable marker, area search)
- Full property search/filtering (location, type, price, size, rooms, etc.)
- Listing moderation workflow and admin dashboard
- Fraud/spam protections (reporting, rate limiting, validation)
- AI chatbot for natural-language property search
- SEO-friendly, mobile-first, trilingual UI
- Built to run on free-tier hosting where realistically possible

## License

TBD.
