import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for use in Client Components ('use client').
 * Create a fresh one per component/hook rather than sharing a module-level
 * singleton — this is the pattern Supabase's own Next.js guide recommends,
 * since the browser client is cheap to construct and this avoids stale
 * state across fast refreshes / route changes.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
