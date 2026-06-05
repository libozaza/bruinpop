"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";


// [Gen AI use] Prompt: Now that I have a landing page, I want a navigation bar at the top that shows posts, login, and sign up. If I'm not logged into an account at the landing page, I don't want the posts button to be there at the navbar for the landing page, but if I am logged in, I want the posts button to be there. I also want a profile button that shows the username of the logged in user and links to their profile page. If the user is not logged in, I want the profile button to not be there. I also want a log out button that logs the user out and redirects them to the login page. Follow the design scheme that has already been implemented with the global styles and components."
// [GenAI Use] LLM Response Start
export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <Link href="/" className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        BruinPop
      </Link>
      <div className="flex items-center gap-4 text-sm">
  
        {session ? (
          <>
            <Link href="/posts" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Posts
            </Link>
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

// [GenAI Use] LLM Response End
// [GenAI Use] Reflection: I reviewed the code and it seems to correctly implement the functionality I described in the prompt. The navbar renders links based on whether the user is logged in or not, and it includes a sign out button that also properly redirects to the login page. Although there were a few bugs in terms of linking, this was mostly due to other modular dependencies that was unrelated to the front end that was given by the AI. The design also follows the existing style pattern with respective classes for light and dark modes.