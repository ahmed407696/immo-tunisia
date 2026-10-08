import { signInWithGoogle } from "@/lib/auth/actions";

// Plain form + Server Action — no client-side state needed, so this stays
// a Server Component and ships zero extra JS.
export function GoogleSignInButton() {
  return (
    <form action={signInWithGoogle} className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        or
        <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      </div>
      <button
        type="submit"
        className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.05]"
      >
        Continue with Google
      </button>
    </form>
  );
}
