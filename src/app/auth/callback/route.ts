import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands here after: Google OAuth, email-confirmation links, and
 * password-reset links — anything where we passed our own `redirectTo` /
 * `emailRedirectTo` to Supabase (see src/lib/auth/actions.ts). Supabase
 * appends a PKCE `code` param; exchanging it sets the session cookies via
 * the server client below.
 *
 * Required one-time setup in the Supabase dashboard once a project exists:
 * Authentication → URL Configuration → add this route
 * (e.g. https://yourdomain.com/auth/callback, and http://localhost:3000/auth/callback
 * for local dev) to the "Redirect URLs" allow-list, or the exchange below
 * is rejected.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback`);
}
