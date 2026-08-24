import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/admin-auth";

/** Renders children only for the owner account; otherwise shows a sign-in card. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const { data: isAdmin, isLoading: checking } = useIsAdmin(session?.user.id);

  if (loading) return <Card>Checking session…</Card>;
  if (!session) return <SignInCard />;
  if (checking) return <Card>Verifying access…</Card>;
  if (!isAdmin)
    return (
      <Card>
        <p>This account has no admin access.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-3 text-primary hover:underline">
          Sign out
        </button>
      </Card>
    );

  return <>{children}</>;
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded border border-border bg-card/70 p-6 text-sm text-foreground/80">
      {children}
    </div>
  );
}

function SignInCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (mode: "in" | "up") => {
    setBusy(true);
    setError(null);
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
    const { error: err } = await fn;
    if (err) setError(err.message);
    setBusy(false);
  };

  const input = "w-full rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <Card>
      <h2 className="font-mono text-sm uppercase tracking-widest text-primary">/ owner sign-in</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        The first account created here becomes the owner. Everyone else is locked out.
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit("in");
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={input}
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={input}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            disabled={busy}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Sign in
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("up")}
            className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
          >
            Create owner account
          </button>
        </div>
      </form>
    </Card>
  );
}
