import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductImage } from "@/components/product-image";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { Pin, Lock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { categoriesQuery, forumThreadsQuery, productPrice, productsQuery } from "@/lib/store";

type ShopSearch = { q?: string; category?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    category: typeof search.category === "string" && search.category ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Security Software Store — licenses delivered instantly" },
      {
        name: "description",
        content: "Buy EDR, SIEM, firewall, pentest and encryption software licenses. Signed builds, crypto-only checkout.",
      },
      { property: "og:title", content: "Security Software Store" },
      { property: "og:description", content: "Licensed security tooling for blue and red teams, delivered instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),

  component: ShopPage,
});

function ShopPage() {
  const { q, category } = Route.useSearch();
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const { data: products, isLoading } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);

  const activeCategory = (categories ?? []).find((c) => c.slug === category);
  const term = (q ?? "").toLowerCase();

  const visible = (products ?? [])
    .filter((p) => p.is_active)
    .filter((p) => (activeCategory ? p.category_id === activeCategory.id : true))
    .filter((p) => (term ? `${p.name} ${p.description}`.toLowerCase().includes(term) : true));

  return (
    <PageWithSidebar>
      <GuideBoard />


      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading products…</p>}

      {!isLoading && visible.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">No products match this filter yet.</p>
      )}

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6">
        {visible.map((p) => (
          <Link
            key={p.id}
            to="/product/$slug"
            params={{ slug: p.slug }}
            className="group rounded border border-border bg-card/60 p-3 transition hover:border-primary/60 hover:glow-border"
          >
            <ProductImage imageUrl={p.image_url} name={p.name} className="aspect-[4/3] rounded mb-3" />
            <h3 className="text-sm font-semibold leading-tight text-foreground group-hover:text-primary">{p.name}</h3>
            <p className="mt-1 font-mono text-xs text-primary">{productPrice(p, symbol)}</p>
          </Link>
        ))}
      </div>

    </PageWithSidebar>
  );
}

/** Home board: latest posts published from the admin panel, forum-style rows. */
function GuideBoard() {
  const qc = useQueryClient();
  const { data: threads, isLoading } = useQuery(forumThreadsQuery);
  const [section, setSection] = useState("Latest posts");

  const sections = ["Latest posts", ...Array.from(new Set((threads ?? []).map((t) => t.category)))];
  const list = (threads ?? []).filter((t) => section === "Latest posts" || t.category === section);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card/70">
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
                className={`h-3.5 w-3.5 shrink-0 ${t.is_pinned ? "text-[color:var(--signal)]" : "text-muted-foreground/40"}`}
              />
              <span className="shrink-0 rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                {t.category}
              </span>
              {t.is_locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{t.title}</span>
              <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
                {t.is_pinned ? "Sticked" : `${t.views} views`}
              </span>
              <span className="hidden shrink-0 font-mono text-xs text-primary md:inline">@{t.author}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
