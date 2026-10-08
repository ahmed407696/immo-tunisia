import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = ["/dashboard"];

/**
 * Called from the root src/proxy.ts (Next.js 16's renamed middleware) on
 * every request. Two jobs:
 *
 *  1. Refresh the Supabase session cookie so it doesn't silently expire
 *     mid-visit (auth.getUser() revalidates the token against Supabase Auth
 *     and rewrites the cookie if it refreshed the access token).
 *  2. An *optimistic* redirect for obviously-protected paths. This is a
 *     cheap, early bounce for signed-out users — it is NOT the real
 *     authorization check. The authoritative check lives in the DAL
 *     (src/lib/auth/dal.ts) and runs again in the protected layout itself,
 *     per Next.js's own guidance: proxy/middleware should never be the only
 *     line of defense.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let url: string, anonKey: string;
  try {
    ({ url, anonKey } = getSupabaseEnv());
  } catch {
    // Supabase isn't configured yet. Proxy runs on every request, so
    // failing here would 500 the entire site rather than just the auth
    // bits — let everything through unmodified instead.
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not add code between createServerClient and auth.getUser() — it
  // reads/writes cookies above and a dropped await here can cause random
  // session loss. See the Supabase SSR guide for why.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // IMPORTANT: return supabaseResponse as-is. If you need to change it,
  // copy the cookies from supabaseResponse onto the new response instead of
  // creating a bare NextResponse.next()/redirect(), or the refreshed
  // session cookie never reaches the browser and users get logged out at
  // random.
  return supabaseResponse;
}
