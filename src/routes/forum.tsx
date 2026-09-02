import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Pin, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ForumGate } from "@/components/forum-gate";
import { PageBackground, useSettings } from "@/components/site-chrome";
import { forumThreadsQuery } from "@/lib/store";

export const Route = createFileRoute("/forum")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Members Forum — NullSector operator write-ups" },
      {
        name: "description",
        content:
          "Private NullSector forum: operator guides, tooling notes and playbooks. One-time $50 crypto entry unlocks lifetime access.",
      },
      { property: "og:title", content: "NullSector Members Forum" },
      { property: "og:description", content: "Paid-entry forum with operator guides and tooling write-ups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForumPage,
});

function ForumPage() {
  return (
    <PageBackground>
      <ForumGate>
        <ForumBoard />
      </ForumGate>
    </PageBackground>
  );
}

function ForumBoard() {
  const qc = useQueryClient();
  const settings = useSettings();
  const { data: threads, isLoading } = useQuery(forumThreadsQuery);
  const [section, setSection] = useState("Latest posts");

  const sections = ["Latest posts", ...Array.from(new Set((threads ?? []).map((t) => t.category)))];
  const list = (threads ?? []).filter((t) => section === "Latest posts" || t.category === section);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-primary text-glow">{settings.forum_name ?? "Members Forum"}</h1>
      <p className="mt-2 text-sm text-foreground/70">Full write-ups and playbooks, members only.</p>

      <section className="mt-8 overflow-hidden rounded-lg border border-border bg-card/70">
        <header className="flex items-center gap-4 overflow-x-auto border-b border-border px-4">
          <nav className="flex flex-1 items-center gap-4 whitespace-nowrap">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`border-b-2 py-3 text-sm transition ${
                  s === section
                    ? "border-primary text-foreground"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </nav>
          <button
            aria-label="Refresh posts"
            onClick={() => qc.invalidateQueries({ queryKey: ["forum_threads"] })}
            className="text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        {isLoading && <p className="px-4 py-6 text-sm text-muted-foreground">Loading posts…</p>}
        {!isLoading && list.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground">No posts yet — publish one from the admin panel.</p>
        )}

        <ul className="divide-y divide-border">
          {list.map((t) => (
            <li key={t.id}>
              <Link
                to="/guides/$slug"
                params={{ slug: t.slug }}
                className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-primary/5"
              >
                <Pin
                  className={`h-3.5 w-3.5 shrink-0 ${
                    t.is_pinned ? "text-[color:var(--signal)]" : "text-muted-foreground/40"
                  }`}
                />
                <span className="shrink-0 rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                  {t.category}
                </span>
                {t.is_locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{t.title}</span>
                <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
                  {t.is_pinned ? "Stickied" : `${t.views} views`}
                </span>
                <span className="hidden shrink-0 font-mono text-xs text-primary md:inline">@{t.author}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
