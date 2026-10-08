import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Dashboard — Immo Tunisia" };

export default async function DashboardPage() {
  // Authoritative check #2 — re-verified here per Next.js's own guidance:
  // a layout doesn't gate what a nested page can do, so the check happens
  // again at the leaf. `cache()` inside the DAL means this doesn't cost a
  // second round trip to Supabase within the same request.
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}.
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Signed in as {user.email}. Listing management arrives in the next phase.
      </p>
    </div>
  );
}
