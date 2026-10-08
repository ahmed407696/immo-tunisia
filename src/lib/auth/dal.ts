import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/**
 * Data Access Layer: the single place that reads "who is the current user"
 * on the server. Server Components, Server Actions, and Route Handlers
 * should all go through here rather than calling supabase.auth.* directly,
 * so there's exactly one spot to audit for auth bugs.
 *
 * `cache()` dedupes within a single request/render pass (not across
 * requests), so calling getUser() from a layout AND a page in the same
 * request only hits Supabase Auth once.
 *
 * Uses auth.getUser() (revalidates the JWT against Supabase), never
 * auth.getSession() (trusts the local cookie) — getSession() is fine for
 * the optimistic check in src/proxy.ts, but a server-side authorization
 * decision must use the verified version.
 *
 * This is called from the root layout (via SiteHeader) on every single
 * page, including pages that have nothing to do with auth — so if
 * Supabase isn't configured yet (no .env.local, a fresh checkout, a CI
 * build without secrets), it must degrade to "nobody is signed in" rather
 * than throwing and taking down every page / the whole build. Misconfig is
 * still reported loudly at the point someone actually tries to use an auth
 * feature (login/signup actions construct their own client and surface the
 * real error there).
 */
export const getUser = cache(async () => {
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[auth] Supabase isn't configured yet — treating every visitor as signed out.",
        err
      );
    }
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  // `role`/`locale` come back as plain `string` from PostgREST (Postgres has
  // no native enum for them — see supabase/migrations — just a `check`
  // constraint), so the client can't narrow them on its own. The cast to the
  // app-level `Profile` (src/lib/supabase/types.ts) is safe because that
  // constraint is what actually guarantees the value at write time.
  return data as Profile;
});

/** Redirects to /login if signed out; otherwise returns the verified user. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects non-admins to the home page; otherwise returns the profile. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  return profile;
}
