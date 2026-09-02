import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock, Pin } from "lucide-react";
import { ForumGate } from "@/components/forum-gate";
import { PageBackground, RichText } from "@/components/site-chrome";
import { forumThreadsQuery } from "@/lib/store";

export const Route = createFileRoute("/guides/$slug")({
  head: ({ params }) => {
    const title = `${params.slug.replace(/-[a-z0-9]{4}$/, "").replace(/-/g, " ")} — Guide`;
    return {
      meta: [
        { title },
        { name: "description", content: "Full write-up published by the NullSector team." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Full write-up published by the NullSector team." },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  ssr: false,
  component: ThreadPage,
});

function ThreadPage() {
  return (
    <PageBackground>
      <ForumGate>
        <ThreadBody />
      </ForumGate>
    </PageBackground>
  );
}

function ThreadBody() {
  const { slug } = Route.useParams();
  const { data: threads, isLoading } = useQuery(forumThreadsQuery);
  const thread = (threads ?? []).find((t) => t.slug === slug);

  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to forum
        </Link>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading post…</p>}
        {!isLoading && !thread && <h1 className="mt-6 text-2xl font-bold text-primary">Post not found</h1>}

        {thread && (
          <article className="mt-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="rounded bg-primary/15 px-2 py-0.5 text-primary uppercase tracking-wider">
                {thread.category}
              </span>
              {thread.is_pinned && <Pin className="h-3 w-3 text-[color:var(--signal)]" />}
              {thread.is_locked && <Lock className="h-3 w-3" />}
              <span>@{thread.author}</span>
              <span>{new Date(thread.created_at).toLocaleString()}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-primary text-glow">{thread.title}</h1>
            <div className="mt-6 rounded border border-border bg-card/70 p-6 leading-relaxed">
              <RichText body={thread.body} />
            </div>
          </article>
        )}
      </main>
    </>
  );
}
