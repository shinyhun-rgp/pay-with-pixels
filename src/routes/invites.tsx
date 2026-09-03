import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, KeyRound, Plus, Ban } from "lucide-react";
import { PageBackground } from "@/components/site-chrome";
import { useSession } from "@/lib/admin-auth";
import { inviteStatus, useCreateInvite, useMyInvites, useRevokeInvite } from "@/lib/membership";

export const Route = createFileRoute("/invites")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Invites — NullSector" },
      { name: "description", content: "Generate, copy and revoke the invite codes you hand out to trusted operators." },
      { property: "og:title", content: "Your Invites — NullSector" },
      { property: "og:description", content: "Mint single-use NullSector invite codes for people you vouch for." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitesPage,
});

const STATUS_STYLE: Record<string, string> = {
  active: "border-[color:var(--signal)]/50 text-[color:var(--signal)]",
  used: "border-border text-muted-foreground",
  expired: "border-border text-muted-foreground",
  revoked: "border-destructive/50 text-destructive",
};

function InvitesPage() {
  const { session } = useSession();
  const { data: invites, isLoading } = useMyInvites(session?.user.id);
  const create = useCreateInvite();
  const revoke = useRevokeInvite();
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync(note.trim());
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create an invite.");
    }
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <PageBackground>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-primary text-glow">
          <KeyRound className="h-6 w-6" /> Your invites
        </h1>
        <p className="mt-3 text-sm text-foreground/70">
          Each code is single-use and expires after 30 days. You can keep up to 10 open codes at a time — revoke one to
          free a slot.
        </p>

        <form onSubmit={mint} className="mt-8 flex flex-col gap-2 sm:flex-row">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Who is this for? (optional note)"
            className="flex-1 rounded border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary"
          />
          <button
            disabled={create.isPending}
            className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> {create.isPending ? "Minting…" : "Generate code"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <div className="mt-8 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading your codes…</p>}
          {!isLoading && (invites ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No codes yet. Generate one above.</p>
          )}
          {(invites ?? []).map((invite) => {
            const status = inviteStatus(invite);
            return (
              <div
                key={invite.id}
                className="flex flex-wrap items-center gap-3 rounded border border-border bg-card/70 p-4 backdrop-blur"
              >
                <span className="font-mono text-base font-semibold text-primary">{invite.code}</span>
                <span className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${STATUS_STYLE[status]}`}>
                  {status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {invite.uses}/{invite.max_uses} used
                  {invite.expires_at ? ` · expires ${new Date(invite.expires_at).toLocaleDateString()}` : ""}
                  {invite.note ? ` · ${invite.note}` : ""}
                </span>
                <span className="ml-auto flex gap-2">
                  <button
                    onClick={() => copy(invite.code)}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:border-primary hover:text-primary"
                  >
                    <Copy className="h-3 w-3" /> {copied === invite.code ? "Copied" : "Copy"}
                  </button>
                  {status === "active" && (
                    <button
                      onClick={() => revoke.mutate(invite.id)}
                      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:border-destructive hover:text-destructive"
                    >
                      <Ban className="h-3 w-3" /> Revoke
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </PageBackground>
  );
}
