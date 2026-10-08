import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (+ Partial Prefetching) is Next.js 16's opt-in static-shell /
  // streaming model. It's a great fit for this app long-term (public listing pages
  // are cacheable; auth-only bits stream in) but it requires every component that
  // reads cookies()/session state to sit behind a <Suspense> boundary (or use the
  // `use cache: private` directive), which is a lot of extra ceremony to get right
  // while the auth/data-model foundations are still being built. Deliberately left
  // OFF for now (plain dynamic rendering, like every current Supabase+Next.js guide
  // assumes) so Phase 2 (auth) ships correctly and simply. Revisit turning this back
  // on as a performance pass once the core app is feature-complete — see
  // node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md
  // cacheComponents: true,
  // partialPrefetching: true,
  images: {
    remotePatterns: [
      // Supabase Storage (used during early development / small media)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Cloudflare R2 custom domain for listing images (Phase 5+) — replace
      // with the actual bucket's public hostname once it's provisioned.
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
