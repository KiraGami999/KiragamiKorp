"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function AdminLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string; redirect?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Login failed.");
      }

      window.location.href = data.redirect ?? "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="admin-user" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-acid/70">
          Operator ID
        </label>
        <input
          id="admin-user"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full border-2 border-acid/50 bg-ink px-4 py-3 font-mono text-sm text-acid caret-acid outline-none focus:border-acid"
        />
      </div>

      <div>
        <label htmlFor="admin-pass" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-acid/70">
          Passkey
        </label>
        <input
          id="admin-pass"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border-2 border-acid/50 bg-ink px-4 py-3 font-mono text-sm text-acid caret-acid outline-none focus:border-acid"
        />
      </div>

      {error ? (
        <p role="alert" className="border-l-2 border-paper bg-paper/5 px-3 py-2 font-mono text-xs text-paper">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full border-2 border-acid bg-acid px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-ink transition-colors hover:bg-transparent hover:text-acid disabled:opacity-50"
      >
        {loading ? "Authenticating…" : "Enter Ops Deck"}
      </button>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-acid/40">
        <Link href="/" className="hover:text-acid">
          Abort to public net
        </Link>
      </p>
    </form>
  );
}
