import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { useState } from "react";
import { ForumGate } from "@/components/forum-gate";
import { PageBackground, RichText } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import { forumRepliesQuery, forumThreadsQuery } from "@/lib/store";

export const Route = createFileRoute("/guides/$slug")({
  head: ({ params }) => {
    const title = `${params.slug.replace(/-[a-z0-9]{4}$/, "").replace(/-/g, " ")} — Guides`;
    return {
      meta: [
        { title },
        { name: "description", content: "Community cybersecurity guide and discussion thread." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Community cybersecurity guide and discussion thread." },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: () => (
    <ForumGate>
      <ThreadPage />
    </ForumGate>
  ),
});

function ThreadPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const { data: threads, isLoading } = useQuery(forumThreadsQuery);
  const { data: replies } = useQuery(forumRepliesQuery);
  const [form, setForm] = useState({ author: "", body: "" });

  const thread = (threads ?? []).find((t) => t.slug === slug);
  const threadReplies = (replies ?? []).filter((r) => r.thread_id === thread?.id);

  const post = useMutation({
    mutationFn: async () => {
      if (!thread) return;
      const { error } = await supabase.from("forum_replies").insert({
        thread_id: thread.id,
        author: form.author.trim() || "anon",
        body: form.body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ author: "", body: "" });
      qc.invalidateQueries({ queryKey: ["forum_replies"] });
    },
  });

  return (
    <PageBackground>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/guides" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> All guides
        </Link>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading thread…</p>}

        {!isLoading && !thread && <h1 className="mt-6 text-2xl font-bold text-primary">Thread not found</h1>}

        {thread && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{thread.category}</span>
              <span>@{thread.author}</span>
              <span>{new Date(thread.created_at).toLocaleString()}</span>
              {thread.is_locked && (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> locked
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-primary text-glow">{thread.title}</h1>

            <article className="mt-6 rounded border border-border bg-card/70 p-5">
              <RichText body={thread.body} />
            </article>

            <h2 className="mt-10 font-mono text-sm tracking-widest text-muted-foreground uppercase">
              / {threadReplies.length} replies
            </h2>
            <ul className="mt-4 space-y-3">
              {threadReplies.map((r) => (
                <li key={r.id} className="rounded border border-border bg-card/50 p-4">
                  <p className="text-xs font-mono text-muted-foreground">
                    @{r.author} · {new Date(r.created_at).toLocaleString()}
                  </p>
                  <div className="mt-2">
                    <RichText body={r.body} />
                  </div>
                </li>
              ))}
              {threadReplies.length === 0 && <li className="text-sm text-muted-foreground">No replies yet.</li>}
            </ul>

            {!thread.is_locked && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (form.body.trim()) post.mutate();
                }}
                className="mt-8 space-y-3 rounded border border-border bg-card/70 p-5"
              >
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Handle (optional)"
                  className="w-full rounded border border-border bg-background/60 px-3 py-2 text-sm font-mono outline-none"
                />
                <textarea
                  required
                  rows={5}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Add your reply…"
                  className="w-full rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none"
                />
                <button
                  disabled={post.isPending}
                  className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {post.isPending ? "Posting…" : "Post reply"}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </PageBackground>
  );
}
