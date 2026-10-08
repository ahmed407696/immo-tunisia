import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Must be created fresh per request (it closes over the current
 * request's cookies via next/headers) — never module-level singleton this.
 *
 * `cookies()` is async in Next.js 16, so this factory is async too.
 *
 * Call cookies() before the env check, not after: reading cookies() is
 * what tells Next.js's build-time prerenderer that a route is dynamic. If
 * the env check threw first whenever Supabase isn't configured (caught
 * further up, in the DAL), cookies() would never run and a misconfigured
 * build could silently bake a wrong static result (e.g. a permanent
 * redirect-to-login) into the page instead of evaluating auth per-request.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `setAll` was called from a Server Component, which can't set
          // cookies on the response. Safe to ignore here because
          // src/proxy.ts refreshes the session cookie on every request.
        }
      },
    },
  });
}
