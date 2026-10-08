import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Authoritative check #1 (the proxy's redirect for /dashboard/* is only
  // the optimistic, early bounce — see src/lib/supabase/proxy.ts).
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
        <Link href="/dashboard" className="font-semibold">
          Dashboard
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-black/15 px-3 py-1.5 font-medium hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.05]"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
