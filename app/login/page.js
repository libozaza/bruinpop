"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false, 
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
    } else {
      router.push("/posts"); 
      router.refresh(); 
    }
  }

// Gen AI Prompt: 
// Given that you are an expert front-end developer in react, next.js, jsx, and tailwind css, create the front-end logic and UI for a bruinpop login page.
// Build a centered login form that lets a user enter their username and password. Use react inputs, with the username connectde to username and setusername, and the password value connected to password and setpassword.
// The form should submit through a handleLogin function. Add basic front-end login behavior, inculding a loading state that disables the submit button while the login request is processing, and changes the button text from “Log in” to “Logging in…”. Also include an error area that only appears when an error message exists.
// Style the page with tailwind css so the form is cenetred, compact, and clean. Include labels for both inputs, proper autocomplete values for username and current password, focus styling for the input fields, and a signup link at the bottom that goes to /signup.

// LLM Response Start: Here is a clean front-end implementation of the BruinPop login page based on your requirements.

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Login to BruinPop
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-zinc-500">
          Don't have an account?{" "}
          <a href="/signup" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

// This JSX renders the front-end structure for the BruinPop login page. The outer containers use flexbox and Tailwind utility classes to center the login form horizontally and vertically within the available page space. The inner wrapper limits the form width with max-w-sm and adds vertical spacing between the heading, form, and signup link.
// The form is wired to handleLogin through the onSubmit event, so submitting the form triggers the login logic defined elsewhere in the component. Both inputs are controlled components: the username field reads from username and updates through setUsername, while the password field reads from password and updates through setPassword. This keeps the form values synchronized with React state.
// The error message uses conditional rendering with {error && (...)}, so the red error text only appears when the error variable contains a value. The submit button uses the loading state to prevent duplicate submissions by disabling the button during the login process. It also switches the button label between Log in and Logging in… based on that same state.
// The Tailwind classes handle the visual design, including border styling, padding, rounded corners, focus rings, typography, hover behavior, disabled opacity, and dark mode variants. The /signup anchor provides a simple navigation path for users who need to create an account.
// LLM Response End

// Reflection: Since frontend was not covered as deeply in class, I used GenAI to help make the UI cleaner and faster instead of spending too much time on repetitive layout and tailwind styling.
// This let me focus more on the harder backend parts, like API calls, auth logic, database work, and making sure everything actually connected correctly.
