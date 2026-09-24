"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Laptop, Loader2, LogOut, Smartphone } from "lucide-react";
import { Button, Field, Notice, Panel, Time, adminFetch } from "@/components/admin/ui";
import { cn } from "@/lib/utils/cn";
import type { AdminSessionInfo } from "@/lib/admin/db-auth";

type Status = { tone: "success" | "error"; text: string } | null;

export function SecuritySection({
  username,
  displayName,
  hasDatabaseAdmin,
  onProfileChange,
}: {
  username: string;
  displayName: string | null;
  hasDatabaseAdmin: boolean;
  onProfileChange: (profile: { username: string; displayName: string | null }) => void;
}) {
  if (!hasDatabaseAdmin) {
    return (
      <Panel title="Security" description="Credential changes are stored in the database.">
        <Notice tone="info">
          You&apos;re signed in with the bootstrap credentials from environment variables. Run{" "}
          <code className="font-mono">npm run db:seed</code> to create the database admin, then sign in again to
          manage your password, username and sessions here.
        </Notice>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <PasswordPanel username={username} />
      <ProfilePanel username={username} displayName={displayName} onProfileChange={onProfileChange} />
      <GatePanel />
      <SessionsPanel />
    </div>
  );
}

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setStatus(null);
    try {
      setStatus({ tone: "success", text: await action() });
      return true;
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, status, run };
}

function scorePassword(password: string, username: string): { score: number; label: string; tips: string[] } {
  const tips: string[] = [];
  let score = 0;
  if (password.length >= 10) score++;
  else tips.push("at least 10 characters");
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else tips.push("mix upper and lower case");
  if (/\d/.test(password)) score++;
  else tips.push("add a number");
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else tips.push("add a symbol");
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    score = Math.min(score, 1);
    tips.unshift("don't include your username");
  }
  if (/^(.)\1+$/.test(password) || /password|123456|qwerty/i.test(password)) {
    score = Math.min(score, 1);
    tips.unshift("avoid common patterns");
  }
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score], tips };
}

function Form({ onSubmit, children }: { onSubmit: () => void; children: ReactNode }) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}

function PasswordPanel({ username }: { username: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, status, run } = useSubmit();
  const strength = scorePassword(next, username);
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current && next.length >= 10 && next === confirm && !busy;

  async function submit() {
    const ok = await run(async () => {
      const result = await adminFetch<{ revokedSessions: number }>("/api/admin/security/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      return result.revokedSessions
        ? `Password updated. ${result.revokedSessions} other session(s) were signed out.`
        : "Password updated.";
    });
    if (ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  return (
    <Panel title="Password" description="Changing it signs out every other device.">
      <Form onSubmit={() => void submit()}>
        <input type="text" autoComplete="username" value={username} readOnly hidden />
        <Field label="Current password" type="password" autoComplete="current-password" value={current} onChange={setCurrent} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Field label="New password" type="password" autoComplete="new-password" value={next} onChange={setNext} />
            {next ? (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((bar) => (
                    <span
                      key={bar}
                      className={cn(
                        "h-1.5 flex-1 border border-ink",
                        bar < strength.score ? (strength.score >= 4 ? "bg-acid" : strength.score >= 3 ? "bg-ink" : "bg-[#f5a524]") : "bg-transparent",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60">
                  {strength.label}
                  {strength.tips.length ? ` — ${strength.tips.slice(0, 2).join(", ")}` : ""}
                </p>
              </div>
            ) : null}
          </div>
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            hint={mismatch ? "Passwords don't match." : undefined}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="border-2 border-ink bg-ink px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-acid transition-colors hover:bg-acid hover:text-ink disabled:opacity-40"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </div>
        {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
      </Form>
    </Panel>
  );
}

function ProfilePanel({
  username,
  displayName,
  onProfileChange,
}: {
  username: string;
  displayName: string | null;
  onProfileChange: (profile: { username: string; displayName: string | null }) => void;
}) {
  const [nextUsername, setNextUsername] = useState(username);
  const [nextDisplayName, setNextDisplayName] = useState(displayName ?? "");
  const [password, setPassword] = useState("");
  const { busy, status, run } = useSubmit();
  const changed = nextUsername.trim() !== username || nextDisplayName.trim() !== (displayName ?? "");

  async function submit() {
    const ok = await run(async () => {
      const result = await adminFetch<{ username: string; displayName: string | null }>("/api/admin/security/profile", {
        method: "POST",
        body: JSON.stringify({ username: nextUsername, displayName: nextDisplayName, currentPassword: password }),
      });
      onProfileChange(result);
      return result.username !== username ? `You now sign in as ${result.username}.` : "Profile updated.";
    });
    if (ok) setPassword("");
  }

  return (
    <Panel title="Identity" description="Your sign-in username and the name shown in this deck.">
      <Form onSubmit={() => void submit()}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Username"
            value={nextUsername}
            maxLength={40}
            autoComplete="off"
            hint="Letters, numbers, dot, dash or underscore."
            onChange={setNextUsername}
          />
          <Field label="Display name" value={nextDisplayName} maxLength={80} onChange={setNextDisplayName} />
        </div>
        {changed ? (
          <Field
            label="Confirm with current password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        ) : null}
        <Button variant="primary" type="submit" disabled={!changed || !password || busy}>
          {busy ? "Saving…" : "Save identity"}
        </Button>
        {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
      </Form>
    </Panel>
  );
}

function GatePanel() {
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const { busy, status, run } = useSubmit();

  async function submit() {
    const ok = await run(async () => {
      await adminFetch("/api/admin/security/gate", {
        method: "POST",
        body: JSON.stringify({ newPhrase: phrase, currentPassword: password }),
      });
      return "Clearance phrase updated. Use it next time you open the samurai terminal.";
    });
    if (ok) {
      setPhrase("");
      setPassword("");
    }
  }

  return (
    <Panel
      title="Clearance phrase"
      description="The code typed into the hidden samurai terminal before the login screen appears."
    >
      <Form onSubmit={() => void submit()}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="New phrase"
            value={phrase}
            maxLength={120}
            autoComplete="off"
            placeholder="6–120 characters"
            onChange={setPhrase}
          />
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>
        <Button variant="primary" type="submit" disabled={phrase.trim().length < 6 || !password || busy}>
          {busy ? "Saving…" : "Change phrase"}
        </Button>
        {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
      </Form>
    </Panel>
  );
}

function describeAgent(userAgent: string | null): { label: string; mobile: boolean } {
  if (!userAgent) return { label: "Unknown device", mobile: false };
  const mobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const browser =
    /Edg\//.test(userAgent) ? "Edge" :
    /OPR\//.test(userAgent) ? "Opera" :
    /Chrome\//.test(userAgent) ? "Chrome" :
    /Firefox\//.test(userAgent) ? "Firefox" :
    /Safari\//.test(userAgent) ? "Safari" : "Browser";
  const os =
    /Windows/.test(userAgent) ? "Windows" :
    /iPhone|iPad/.test(userAgent) ? "iOS" :
    /Mac OS X/.test(userAgent) ? "macOS" :
    /Android/.test(userAgent) ? "Android" :
    /Linux/.test(userAgent) ? "Linux" : "";
  return { label: os ? `${browser} on ${os}` : browser, mobile };
}

function SessionsPanel() {
  const [sessions, setSessions] = useState<AdminSessionInfo[] | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ sessions: AdminSessionInfo[] }>("/api/admin/security/sessions");
      setSessions(data.sessions);
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Couldn't load sessions." });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  async function revokeOthers() {
    setBusy(true);
    try {
      const { revoked } = await adminFetch<{ revoked: number }>("/api/admin/security/sessions", { method: "DELETE" });
      setStatus({ tone: "success", text: revoked ? `Signed out ${revoked} other session(s).` : "No other sessions were active." });
      await load();
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Couldn't revoke sessions." });
    } finally {
      setBusy(false);
    }
  }

  const others = sessions?.filter((session) => !session.current).length ?? 0;

  return (
    <Panel
      title="Active sessions"
      description="Every device currently signed in. Sessions expire after 14 days."
      actions={
        <Button variant="danger" disabled={!others || busy} onClick={() => void revokeOthers()}>
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out other devices
        </Button>
      }
    >
      {sessions === null && !status ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" /> : null}
      {sessions?.length ? (
        <ul className="divide-y-2 divide-ink/10 border-2 border-ink">
          {sessions.map((session) => {
            const agent = describeAgent(session.userAgent);
            const Icon = agent.mobile ? Smartphone : Laptop;
            return (
              <li key={session.id} className="flex items-center gap-4 px-4 py-3">
                <Icon className="h-5 w-5 shrink-0 text-ink" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-ink">
                    {agent.label}
                    {session.current ? <span className="bg-acid px-1.5 py-0.5 text-[9px] text-ink">This device</span> : null}
                  </p>
                  <p className="mt-1 text-xs text-ink/55">
                    {session.ipAddress ?? "Unknown IP"} · signed in <Time iso={session.createdAt} relative /> · expires{" "}
                    <Time iso={session.expiresAt} relative />
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {status ? <div className="mt-4"><Notice tone={status.tone}>{status.text}</Notice></div> : null}
    </Panel>
  );
}
