import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductImage } from "@/components/product-image";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { Lock, Pin, RefreshCw } from "lucide-react";
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
      <ForumTeaser />


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

/** Promo strip pointing at the paid members forum. */
function ForumTeaser() {
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const price = Number(settings.forum_price ?? 50) || 50;
  const { data: threads } = useQuery(forumThreadsQuery);
  const latest = (threads ?? []).slice(0, 4);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card/70">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="font-mono text-sm uppercase tracking-widest text-primary">
            {settings.forum_name ?? "Members forum"}
          </h2>
        </div>
        <Link
          to="/forum"
          className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Get access — {symbol}
          {price}
        </Link>
      </header>
      <ul className="divide-y divide-border">
        {latest.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
            <Pin
              className={`h-3.5 w-3.5 shrink-0 ${t.is_pinned ? "text-[color:var(--signal)]" : "text-muted-foreground/40"}`}
            />
            <span className="shrink-0 rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              {t.category}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">{t.title}</span>
            <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
          </li>
        ))}
        {latest.length === 0 && (
          <li className="px-4 py-6 text-sm text-muted-foreground">Members-only write-ups drop here.</li>
        )}
      </ul>
    </section>
  );
}
