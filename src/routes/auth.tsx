import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/admin-auth";
import { redeemInvite, useIsMember } from "@/lib/membership";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Invite Access — NullSector" },
      {
        name: "description",
        content: "NullSector is invite-only. Redeem an invite code from an existing member to access the store and guides.",
      },
      { property: "og:title", content: "Invite Access — NullSector" },
      { property: "og:description", content: "Redeem your invite code to join the NullSector network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const input =
  "w-full rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary font-mono";

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, loading } = useSession();
  const { data: isMember } = useIsMember(session?.user.id);

  useEffect(() => {
    if (session && isMember) navigate({ to: "/", replace: true });
  }, [session, isMember, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div aria-hidden className="fixed inset-0 -z-10 cyber-grid opacity-20" />
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 420px at 50% -10%, oklch(1 0 0 / 0.06), transparent 70%), radial-gradient(700px 400px at 0% 100%, oklch(1 0 0 / 0.04), transparent 70%)",
        }}
      />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded border border-primary/40 bg-primary/10 text-primary glow-border">
            <Terminal className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-mono text-2xl font-bold text-primary text-glow">NullSector</h1>
          <p className="mt-2 text-sm text-foreground/70">
            This network is invite-only. You need a code from a member to get in.
          </p>
        </div>

        {loading ? (
          <Card>Checking session…</Card>
        ) : session && !isMember ? (
          <RedeemCard onDone={() => qc.invalidateQueries()} email={session.user.email ?? ""} />
        ) : (
          <CredentialsCard />
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card/70 p-6 text-sm text-foreground/80 backdrop-blur">{children}</div>;
}

/** Sign in, or create an account with an invite code attached. */
function CredentialsCard() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "in") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      setBusy(false);
      qc.invalidateQueries();
      return;
    }

    if (!code.trim()) {
      setError("An invite code is required to create an account.");
      setBusy(false);
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/auth" },
    });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    if (!data.session) {
      setNotice("Account created — confirm your email, then sign in and redeem your code.");
      setBusy(false);
      return;
    }
    const result = await redeemInvite(code);
    if (!result.ok) setError(result.error ?? "That invite code is not valid.");
    qc.invalidateQueries();
    setBusy(false);
  };

  return (
    <Card>
      <div className="mb-4 flex gap-2 font-mono text-[11px] uppercase tracking-widest">
        {(["in", "up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded border px-3 py-2 transition ${
              mode === m
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-foreground/60 hover:text-foreground"
            }`}
          >
            {m === "in" ? "Sign in" : "Redeem invite"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && (
          <label className="block">
            <span className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Invite code
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="NS-XXXX-XXXX"
              className={input}
              autoComplete="off"
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Password
          </span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            className={input}
          />
        </label>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {notice && <p className="text-xs text-[color:var(--signal)]">{notice}</p>}

        <button
          disabled={busy}
          className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Working…" : mode === "in" ? "Sign in" : "Join with invite"}
        </button>
      </form>

      <p className="mt-4 flex items-center gap-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 text-[color:var(--signal)]" /> Codes are single-use and expire after 30 days.
      </p>
    </Card>
  );
}

/** Signed in but not yet a member: redeem a code to unlock the site. */
function RedeemCard({ onDone, email }: { onDone: () => void; email: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await redeemInvite(code);
    if (!result.ok) setError(result.error ?? "That invite code is not valid.");
    else onDone();
    setBusy(false);
  };

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-primary">
        <KeyRound className="h-4 w-4" /> Redeem invite
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Signed in as {email}. Enter the code a member gave you to unlock access.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="NS-XXXX-XXXX"
          className={input}
          autoComplete="off"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Checking…" : "Unlock access"}
        </button>
      </form>
      <button onClick={() => supabase.auth.signOut()} className="mt-4 text-xs text-primary hover:underline">
        Sign out
      </button>
    </Card>
  );
}
