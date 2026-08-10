import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Pin, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { PageBackground, RichText } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import { forumRepliesQuery, forumThreadsQuery, slugify } from "@/lib/store";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Operator Guides & Forum — NullSector" },
      {
        name: "description",
        content: "Read and post hands-on cybersecurity guides, tooling write-ups and hardening playbooks.",
      },
      { property: "og:title", content: "Operator Guides & Forum" },
      { property: "og:description", content: "Community guides on security tooling, hardening and detection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidesPage,
});

const CATEGORIES = ["Guides", "Tooling", "Hardening", "Threat Intel", "Support"];

function GuidesPage() {
  const qc = useQueryClient();
  const { data: threads, isLoading } = useQuery(forumThreadsQuery);
  const { data: replies } = useQuery(forumRepliesQuery);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", category: "Guides", body: "" });
  const [filter, setFilter] = useState("All");

  const create = useMutation({
    mutationFn: async () => {
      const base = slugify(form.title) || "thread";
      const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("forum_threads").insert({
        title: form.title.trim(),
        slug,
        category: form.category,
        author: form.author.trim() || "anon",
        body: form.body.trim(),
      });
      if (error) throw error;
      return slug;
    },
    onSuccess: () => {
      setForm({ title: "", author: "", category: "Guides", body: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["forum_threads"] });
    },
  });

  const list = (threads ?? []).filter((t) => filter === "All" || t.category === filter);
  const replyCount = (id: string) => (replies ?? []).filter((r) => r.thread_id === id).length;

  return (
    <PageBackground>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary text-glow font-mono">/guides</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Write-ups, playbooks and tooling notes. Anyone can start a thread or reply.
            </p>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New thread
          </button>
        </div>

        {open && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.title.trim()) create.mutate();
            }}
            className="mt-6 space-y-3 rounded border border-border bg-card/70 p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Thread title"
                className="md:col-span-2 rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Handle (optional)"
              className="w-full rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none font-mono"
            />
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6}
              placeholder="Write your guide. Use **bold** and blank lines for paragraphs."
              className="w-full rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none"
            />
            <button
              disabled={create.isPending}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {create.isPending ? "Posting…" : "Publish thread"}
            </button>
          </form>
        )}

        <div className="mt-8 flex flex-wrap gap-2 font-mono text-xs">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded border px-3 py-1 transition ${
                filter === c ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading threads…</p>}
        {!isLoading && list.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">No threads yet — be the first to post.</p>
        )}

        <ul className="mt-6 space-y-3">
          {list.map((t) => (
            <li key={t.id}>
              <Link
                to="/guides/$slug"
                params={{ slug: t.slug }}
                className="block rounded border border-border bg-card/60 p-4 transition hover:border-primary/60"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{t.category}</span>
                  {t.is_pinned && <Pin className="h-3 w-3 text-[color:var(--signal)]" />}
                  {t.is_locked && <Lock className="h-3 w-3" />}
                  <span>@{t.author}</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">{t.title}</h2>
                <div className="mt-1 line-clamp-2 text-sm text-foreground/60">
                  <RichText body={t.body.slice(0, 180)} />
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <MessageSquare className="h-3 w-3" /> {replyCount(t.id)} replies
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </PageBackground>
  );
}
