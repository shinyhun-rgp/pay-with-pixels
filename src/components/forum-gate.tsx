import { useQuery } from "@tanstack/react-query";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSettings } from "@/components/site-chrome";
import { redeemForumCode, useForumAccess } from "@/lib/forum-access";
import { money, paymentMethodsQuery } from "@/lib/store";

/** Wraps forum content behind the paid access code. */
export function ForumGate({ children }: { children: ReactNode }) {
  const { unlocked, ready, unlock } = useForumAccess();
  if (!ready) return <p className="px-6 py-12 text-sm text-muted-foreground">Checking access…</p>;
  if (unlocked) return <>{children}</>;
  return <LockScreen onUnlocked={unlock} />;
}

function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const price = Number(settings.forum_price ?? 50) || 50;
  const { data: methods } = useQuery(paymentMethodsQuery);
  const coins = (methods ?? []).filter((m) => m.is_enabled);
  const [coinId, setCoinId] = useState<string | null>(null);
  const coin = coins.find((c) => c.id === coinId) ?? coins[0];

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await redeemForumCode(code);
    if (result.ok) onUnlocked();
    else setError(result.error);
    setBusy(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-lg border border-border bg-card/70 p-6 backdrop-blur">
        <span className="grid h-12 w-12 place-items-center rounded border border-primary/40 bg-primary/10 text-primary glow-border">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-primary text-glow">{settings.forum_name ?? "Forum"}</h1>
        <p className="mt-2 text-sm text-foreground/75">
          {settings.forum_intro ??
            "Private operator forum. One-time entry fee, paid in crypto, unlocked with an access code."}
        </p>

        <p className="mt-6 font-mono text-3xl text-primary">{money(price, symbol)}</p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">one-time entry · lifetime access</p>

        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">/ 1. send payment</h2>
          {coins.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Payment options are being set up. Check back shortly.
            </p>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {coins.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCoinId(c.id)}
                    className={`rounded border px-3 py-1.5 font-mono text-xs transition ${
                      coin?.id === c.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground/70 hover:border-primary/60"
                    }`}
                  >
                    {c.code || c.label}
                  </button>
                ))}
              </div>
              {coin && (
                <div className="mt-3 rounded border border-border bg-background/60 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {coin.label} {coin.network && `· ${coin.network}`}
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-primary">{coin.address}</p>
                  {coin.gateway_note && <p className="mt-2 text-xs text-muted-foreground">{coin.gateway_note}</p>}
                </div>
              )}
            </>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            / 2. enter access code
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            After payment clears you receive a one-time access code
            {settings.contact_email ? ` at ${settings.contact_email}` : ""}. Enter it below to unlock the forum.
          </p>
          <form onSubmit={submit} className="mt-3 space-y-3">
            <label className="block">
              <span className="sr-only">Access code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ACCESS-CODE"
                autoComplete="off"
                className="w-full rounded border border-border bg-background/60 px-3 py-2 font-mono text-sm outline-none focus:border-primary"
              />
            </label>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" /> {busy ? "Checking…" : "Unlock forum"}
            </button>
          </form>
          <p className="mt-4 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-[color:var(--signal)]" /> Codes are single-use and tied to one entry
            payment.
          </p>
        </section>
      </div>
    </main>
  );
}
