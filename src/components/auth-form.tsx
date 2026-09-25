"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = { mode: "login" | "signup"; initialError?: string; initialNotice?: string };

export function AuthForm({ mode, initialError, initialNotice }: Props) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [notice] = useState(initialNotice ?? "");
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    const body = Object.fromEntries(data.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "unknown");
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("network");
    } finally {
      setPending(false);
    }
  }

  const errorMessage = isSignup
    ? error === "exists" ? "There’s already an account with that email. Log in instead."
      : error === "details" ? "Enter your name, a valid email, and a password with at least 10 characters."
        : error ? "We couldn’t create your account. Please try again." : ""
    : error === "session" ? "Your session expired. Please log in again."
      : error === "network" ? "Could not reach Money Trail. Check your connection and try again."
        : error ? "That email and password combination didn’t work. Try again." : "";

  return <>
    {notice && <p className="form-success" role="status">{notice}</p>}
    {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    <form onSubmit={submit} className="auth-form">
      {isSignup && <label>Your name<input type="text" name="name" placeholder="How should we call you?" autoComplete="name" required minLength={2} maxLength={120} />
      </label>}
      <label>Email address<input type="email" name="email" placeholder="you@example.com" autoComplete="email" required /></label>
      <label>Password<input type="password" name="password" placeholder={isSignup ? "At least 10 characters" : "Your password"} autoComplete={isSignup ? "new-password" : "current-password"} required minLength={isSignup ? 10 : undefined} /></label>
      <button className="button button-dark button-full" type="submit" disabled={pending}>
        {pending ? "Please wait…" : isSignup ? "Create my account" : "Log in"} <span>→</span>
      </button>
    </form>
    <p className="auth-switch">{isSignup ? "Already have an account? " : "New to Money Trail? "}<Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link></p>
  </>;
}
