# Immo Tunisia

A modern real-estate marketplace for Tunisia — list, search, and discover properties for sale or rent, with a map-first browsing experience and support for French, Arabic (RTL), and English.

## Status

**Phase 2: Database + authentication** (wrapping up). Email/password and Google sign-in, a protected dashboard shell, and the full Postgres schema (with Row Level Security, hardened per Supabase's own security/performance advisors) are in place and running against a live dev Supabase project. Property listings, search, and the map come in the phases after this one.

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

2. **Get a Supabase project.** A dev project for this app already exists (ref `udoswdtoozjwqhfulsui`, provisioned via the Supabase MCP tools) — if you have access to it, grab its URL and anon/publishable key from **Settings → API** in the dashboard and skip to step 4. To point this checkout at a different project instead (your own, or a fresh one), create it at [supabase.com](https://supabase.com) and continue with step 3.

3. **Run the database migrations, in order**, against that new project — Supabase dashboard → SQL Editor → New query, paste each file's contents, run it (or `supabase link --project-ref <your-ref>` then `supabase db push` with the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)):
   - [`20261008120000_init_schema.sql`](./supabase/migrations/20261008120000_init_schema.sql) — tables, RLS policies, triggers
   - [`20261008130000_rls_perf_and_security_hardening.sql`](./supabase/migrations/20261008130000_rls_perf_and_security_hardening.sql) — indexes + RLS perf fixes from Supabase's advisors
   - [`20261008140000_close_handle_new_user_public_grant.sql`](./supabase/migrations/20261008140000_close_handle_new_user_public_grant.sql) — closes a direct-RPC path to the signup trigger function

   Each migration file's header comment explains what it fixes and, just as importantly, what it deliberately leaves alone and why.

4. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's **Settings → API** page. After any migration, regenerate `src/lib/supabase/database.types.ts` (see the comment at the top of that file) — `src/lib/supabase/types.ts` layers the app's own literal-union types on top of it and doesn't need touching unless the schema's shape actually changes.

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
