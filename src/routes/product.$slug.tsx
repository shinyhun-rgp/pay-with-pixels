import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { useCart } from "@/lib/cart";
import { categoriesQuery, gramsLabel, money, priceRange, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const title = `${params.slug.replace(/-/g, " ")} — security software licence`;
    return {
      meta: [
        { title },
        { name: "description", content: "Choose a seat tier and check out with crypto. Instant key delivery." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Choose a seat tier and check out with crypto." },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const cart = useCart();
  const navigate = useNavigate();
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const { data: products, isLoading } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);

  const product = (products ?? []).find((p) => p.slug === slug);
  const tiers = useMemo(() => product?.product_prices ?? [], [product]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const tier = tiers.find((t) => t.id === selectedId) ?? tiers[0];
  const category = (categories ?? []).find((c) => c.id === product?.category_id);
  const related = (products ?? [])
    .filter((p) => p.category_id === product?.category_id && p.id !== product?.id)
    .slice(0, 4);

  if (isLoading) {
    return (
      <PageWithSidebar>
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </PageWithSidebar>
    );
  }

  if (!product) {
    return (
      <PageWithSidebar>
        <h2 className="text-2xl font-bold text-primary">Product not found</h2>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to shop
        </Link>
      </PageWithSidebar>
    );
  }

  const addToCart = () => {
    if (!tier) return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      grams: Number(tier.grams),
      price: Number(tier.price),
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <PageWithSidebar>
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" }))}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <nav aria-label="Breadcrumb" className="mt-3 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">
          Shop
        </Link>
        {category && (
          <>
            {" / "}
            <Link to="/" search={{ category: category.slug }} className="hover:underline">
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-foreground/70">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <ProductImage imageUrl={product.image_url} name={product.name} className="aspect-[4/3] rounded-lg shadow-lg" />

        <div>
          <h2 className="text-2xl font-bold text-primary">{product.name}</h2>
          <p className="mt-1 text-lg text-foreground/70">{priceRange(product, symbol)}</p>
          <p className="mt-4 text-sm text-foreground/75">{product.description}</p>

          <div className="mt-6">
            <span className="text-sm font-semibold">Licence tier</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {tiers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`px-3 py-1.5 rounded border text-sm transition ${
                    t.id === tier?.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-card hover:border-primary"
                  }`}
                >
                  {gramsLabel(Number(t.grams))} — {money(Number(t.price), symbol)}
                </button>
              ))}
              {tiers.length === 0 && <p className="text-sm text-muted-foreground">No licence tiers configured yet.</p>}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <label htmlFor="qty" className="text-sm font-semibold">
              Quantity
            </label>
            <input
              id="qty"
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="w-20 px-3 py-2 text-sm border border-border rounded bg-card"
            />
          </div>

          <p className="mt-6 text-lg font-semibold">
            Total: {money((Number(tier?.price) || 0) * quantity, symbol)}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={addToCart}
              disabled={!tier}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {added ? <Check className="h-4 w-4" /> : null}
              {added ? "Added to cart" : "Add to cart"}
            </button>
            <button
              onClick={() => {
                addToCart();
                navigate({ to: "/checkout" });
              }}
              disabled={!tier}
              className="rounded border border-primary px-5 py-2.5 text-sm text-primary hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
            >
              Buy now
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h3 className="text-xl font-bold text-primary">Related products</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((c) => (
              <Link
                key={c.id}
                to="/product/$slug"
                params={{ slug: c.slug }}
                className="bg-card/95 border border-border rounded p-3 text-center hover:shadow-lg transition"
              >
                <ProductImage imageUrl={c.image_url} name={c.name} className="aspect-[4/3] rounded mb-3" />
                <div className="text-primary font-semibold text-sm leading-tight">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{priceRange(c, symbol)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageWithSidebar>
  );
}
