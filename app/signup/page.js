"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const passwordRules = [
    { label: "At least 8 characters", met: password.length >= 8 },
  ];
  const showPasswordRules = passwordFocused || password.length > 0;

  const usernameRules = [
    { label: "6–20 characters", met: username.length >= 6 && username.length <= 20 },
    { label: "Letters, numbers, . - _ only", met: /^[a-zA-Z0-9_.-]*$/.test(username) && username.length > 0 },
  ];
  const showUsernameRules = usernameFocused || username.length > 0;

  const confirmRules = [
    { label: "Passwords match", met: confirm.length > 0 && confirm === password },
  ];
  const showConfirmRules = confirmFocused || confirm.length > 0;

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);


    // Create the account
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      setError("Server error. Please try again later.");
      setLoading(false);
      return;
    }

    // error handling for failed signup
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    // log in with credentials
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
    } else {
      router.push("/posts");
      router.refresh();
    }
  }

// Given that you are an expetr front-end developer in react, next.js, jsx, and tailwind css, create the front-end logic and UI for a bruinpop signup page.
// Build a centered account creation form that allows a new user to enter a username, password, and password confirmation. Use react inputs, where the username input is connected to username and setusername, the password input is connected to password and setpassword, and the confirm password input is connected to confirm and setconfirm.
// The form should submit through a handleSignup function. Include front-ednm signup behavior with a loading state that disables the submit button while the account is being created and changes the button text from “Sign up” to “Creating account…”. Include conditional rendering for an error message that only appears when an error value exists.
// Style the page using tailwind css. The layout should center the signup form inside the page, keep the form compact with a max width, and include clean spacing, labels, and a login link that routes users to /login.

// LLM Response Start: Here is a clean front-end implementation of the BruinPop signup page based on your requirements.
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Create your BruinPop account
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            {showUsernameRules && (
              <ul className="mt-2 space-y-1">
                {usernameRules.map((rule) => (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.met ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    <span>{rule.met ? "✓" : "✗"}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            {showPasswordRules && (
              <ul className="mt-2 space-y-1">
                {passwordRules.map((rule) => (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.met ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    <span>{rule.met ? "✓" : "✗"}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            {showConfirmRules && (
              <ul className="mt-2 space-y-1">
                {confirmRules.map((rule) => (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.met ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    <span>{rule.met ? "✓" : "✗"}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-zinc-500">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
// This JSX renders the front-end structure for a BruinPop account creation page. The outer container uses flex, flex-1, items-center, and justify-center to center the signup form within the available page space. The inner wrapper uses w-full, max-w-sm, and space-y-6 to keep the form narrow, readable, and evenly spaced.
// The form is connected to handleSignup through the onSubmit prop, so submitting the form triggers the signup logic defined elsewhere in the component. Each input is a controlled React component. The username field reads from username and updates through setUsername, the password field reads from password and updates through setPassword, and the confirm password field reads from confirm and updates through setConfirm.
// The password and confirm password inputs both use type="password" so the entered text is hidden. They also use autoComplete="new-password", which tells the browser that these fields are for creating a new password rather than logging in with an existing one.
// The error message is conditionally rendered with {error && (...)}, so it only appears when the error state contains a value. The submit button uses the loading state to prevent duplicate signup attempts by disabling the button while the account creation request is processing. The button text also changes dynamically from Sign up to Creating account….
// Tailwind CSS handles the component’s visual styling, including layout, spacing, typography, borders, rounded corners, focus rings, hover behavior, disabled opacity, and dark mode variants. The link at the bottom points to /login, giving users who already have an account a path back to the login page.
// LLM Response End

// Reflection: Since frontend was not covered as deeply in class, I used GenAI to help make the UI cleaner and faster instead of spending too much time on repetitive layout and tailwind styling.
// This let me focus more on the harder backend parts, like API calls, auth logic, database work, and making sure everything actually connected correctly.
