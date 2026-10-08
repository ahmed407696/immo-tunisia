import Link from "next/link";
import { getUser } from "@/lib/auth/dal";

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
      <Link href="/" className="font-semibold">
        Immo Tunisia
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <Link href="/dashboard" className="font-medium hover:underline">
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="font-medium hover:underline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
