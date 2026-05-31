"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <Link href="/" className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        BruinPop
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/posts" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          Posts
        </Link>
        {session ? (
          <>
            <Link
              href={`/profile/${session.user.name}`}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              @{session.user.name}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Log in
            </Link>
            <Link href="/signup" className="rounded-full bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}