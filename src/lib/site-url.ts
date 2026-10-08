import "server-only";
import { headers } from "next/headers";

/**
 * Canonical origin to build auth redirect URLs (email confirmation links,
 * OAuth callbacks) from. Prefers NEXT_PUBLIC_SITE_URL so production always
 * redirects to the real domain even behind a proxy/CDN; falls back to the
 * request's own host for local dev where that env var is often left unset.
 */
export async function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
