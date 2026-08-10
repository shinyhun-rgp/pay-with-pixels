import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductImage } from "@/components/product-image";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { categoriesQuery, priceRange, productsQuery } from "@/lib/store";

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
      <h2 className="text-3xl font-bold text-primary">{activeCategory ? activeCategory.name : "All products"}</h2>
      <p className="mt-2 text-sm text-foreground/70">
        {q ? `Results for “${q}”. ` : ""}
        Every product is priced per gram — pick a weight on the product page.
      </p>

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
            className="bg-card/95 border border-border rounded p-3 text-center hover:shadow-lg transition"
          >
            <ProductImage imageUrl={p.image_url} name={p.name} className="aspect-[4/3] rounded mb-3" />
            <h3 className="text-primary font-semibold text-sm leading-tight">{p.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{priceRange(p, symbol)}</p>
          </Link>
        ))}
      </div>
    </PageWithSidebar>
  );
}
