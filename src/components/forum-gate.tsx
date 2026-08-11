import { useQuery } from "@tanstack/react-query";
import { KeyRound, Lock } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PageBackground, useSettings } from "@/components/site-chrome";
import { redeemForumCode, useForumAccess } from "@/lib/forum-access";
import { money, paymentMethodsQuery } from "@/lib/store";

/** Wraps the forum routes: shows the paid-access gate until a code is redeemed. */
export function ForumGate({ children }: { children: ReactNode }) {
  const { ready, hasAccess } = useForumAccess();
  if (!ready) return null;
  if (hasAccess) return <>{children}</>;
  return <ForumPaywall />;
}

function ForumPaywall() {
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const price = Number(settings.forum_price ?? 50);
  const { data: methods } = useQuery(paymentMethodsQuery);
  const { unlock } = useForumAccess();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const message = await redeemForumCode(code);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    unlock(code.trim().toUpperCase());
  };

  return (
    <PageBackground>
      <main className="mx-auto max-w-2xl px-6 py-14">
        <div className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
          <Lock className="h-3 w-3" /> members only
        </div>
        <h1 className="mt-4 text-3xl font-bold text-primary text-glow font-mono">/guides — paid access</h1>
        <p className="mt-3 text-sm text-foreground/75">
          The operator forum is a one-off {money(price, symbol)} membership. Pay in crypto, then redeem the access code
          we send you. Access is stored on this device.
        </p>

        <section className="mt-8 rounded border border-border bg-card/70 p-5">
          <h2 className="font-mono text-sm tracking-widest text-muted-foreground uppercase">/ 1. pay {money(price, symbol)}</h2>
          <p className="mt-2 text-sm text-foreground/70">{settings.forum_access_note ?? ""}</p>
          <ul className="mt-4 space-y-3">
            {(methods ?? [])
              .filter((m) => m.is_enabled)
              .map((m) => (
                <li key={m.id} className="rounded border border-border bg-background/50 p-3">
                  <p className="text-sm font-semibold text-primary">
                    {m.label} <span className="font-mono text-xs text-muted-foreground">{m.network || m.code}</span>
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground/80">{m.address}</p>
                </li>
              ))}
          </ul>
          {settings.contact_email && (
            <p className="mt-4 text-xs text-muted-foreground">
              Send your transaction hash to <span className="text-primary">{settings.contact_email}</span> to receive
              your code.
            </p>
          )}
        </section>

        <form onSubmit={submit} className="mt-6 rounded border border-border bg-card/70 p-5">
          <h2 className="font-mono text-sm tracking-widest text-muted-foreground uppercase">/ 2. redeem code</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="NS-FORUM-XXXXX"
              className="flex-1 rounded border border-border bg-background/60 px-3 py-2 font-mono text-sm uppercase outline-none"
            />
            <button
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" /> {busy ? "Checking…" : "Unlock forum"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </form>
      </main>
    </PageBackground>
  );
}
