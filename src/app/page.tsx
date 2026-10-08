import Link from "next/link";
import { getUser } from "@/lib/auth/dal";

export default async function Home() {
  const user = await getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-black">
      <div className="flex max-w-2xl flex-col items-center gap-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Find your next property in Tunisia
        </h1>
        <p className="max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
          Browse listings for sale or rent, no account needed. Sign up only
          when you&apos;re ready to publish one of your own.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Go to your dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Create an account
            </Link>
          )}
        </div>
        <p className="text-sm text-zinc-500">
          Property search and listing pages are on the way — Phase 2
          (accounts) is what&apos;s live right now.
        </p>
      </div>
    </div>
  );
}
