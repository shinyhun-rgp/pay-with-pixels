import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, ShieldCheck, ShoppingCart, Terminal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ProductImage } from "@/components/product-image";
import { useCart } from "@/lib/cart";
import { categoriesQuery, money, priceRange, productsQuery, settingsMap, settingsQuery } from "@/lib/store";

const NAV = [
  { label: "STORE", to: "/" },
  { label: "GUIDES", to: "/guides" },
  { label: "CART", to: "/cart" },
] as const;


export function useSettings() {
  const { data } = useQuery(settingsQuery);
  return settingsMap(data);
}

export function SiteHeader() {
  const navigate = useNavigate();
  const cart = useCart();
  const settings = useSettings();
  const { data: categories } = useQuery(categoriesQuery);
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("all");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { q: term || undefined, category: category === "all" ? undefined : category } });
  };

  return (
    <header className="relative border-b border-border">
      <div className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 cyber-grid opacity-30" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 320px at 15% -20%, oklch(0.82 0.14 200 / 0.22), transparent 70%), radial-gradient(700px 300px at 90% 0%, oklch(0.6 0.2 300 / 0.16), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded border border-primary/40 bg-primary/10 text-primary glow-border">
                <Terminal className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-2xl md:text-3xl font-bold text-primary text-glow font-mono tracking-tight">
                  {settings.store_name ?? ""}
                </span>
                <span className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  secure software supply
                </span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-foreground/75 max-w-sm">{settings.tagline ?? ""}</p>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {settings.contact_email ?? ""}
            </p>
          </div>

          <form onSubmit={submit} className="flex-1 max-w-xl w-full">
            <div className="flex items-stretch bg-card/80 border border-border rounded overflow-hidden font-mono text-sm">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Category"
                className="px-3 bg-muted/60 border-r border-border outline-none text-xs"
              >
                <option value="all">All categories</option>
                {(categories ?? []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={settings.search_placeholder ?? "search tooling…"}
                aria-label="Search products"
                className="flex-1 px-3 py-2 outline-none bg-transparent"
              />
              <button type="submit" className="px-4 bg-primary text-primary-foreground" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[color:var(--signal)]" /> Signed builds · instant license delivery ·
              crypto-only
            </p>
          </form>

          <Link to="/cart" className="flex items-center gap-2 text-primary hover:opacity-80">
            <span className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cart.count > 0 && (
                <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center">
                  {cart.count}
                </span>
              )}
            </span>
            <span className="text-sm font-semibold font-mono">
              {money(cart.subtotal, settings.currency_symbol ?? "$")}
            </span>
          </Link>
        </div>
      </div>

      <nav className="bg-card/70 backdrop-blur border-t border-border">
        <ul className="mx-auto max-w-7xl px-6 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-mono tracking-widest text-foreground/70">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-primary border-primary" }}
                className="hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/** Right-hand column: search, grouped categories and a product list. */
export function ShopSidebar() {
  const navigate = useNavigate();
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const { data: categories } = useQuery(categoriesQuery);
  const { data: products } = useQuery(productsQuery);
  const [term, setTerm] = useState("");

  const groups = new Map<string, typeof categories>();
  for (const c of categories ?? []) {
    if (!c.is_active) continue;
    const list = groups.get(c.group_label) ?? [];
    list.push(c);
    groups.set(c.group_label, list);
  }

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-8 text-sm">
      <section>
        <h3 className="text-[11px] font-mono tracking-[0.25em] text-muted-foreground uppercase border-b border-border pb-2">
          / search
        </h3>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/", search: { q: term || undefined } });
          }}
        >
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={settings.search_placeholder ?? "search tooling…"}
            aria-label="Search products"
            className="flex-1 min-w-0 px-3 py-1.5 border border-border rounded bg-card/70 outline-none font-mono text-xs"
          />
          <button className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-xs font-semibold">Go</button>
        </form>
      </section>

      <section>
        <h3 className="text-[11px] font-mono tracking-[0.25em] text-muted-foreground uppercase border-b border-border pb-2">
          / categories
        </h3>
        <div className="mt-3 space-y-4">
          {[...groups.entries()].map(([group, list]) => (
            <div key={group}>
              <p className="text-primary font-semibold text-xs uppercase tracking-wider">{group}</p>
              <ul className="mt-1 space-y-1">
                {(list ?? []).map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/"
                      search={{ category: c.slug }}
                      className="block pl-3 py-1 border-b border-border/60 text-foreground/70 hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-mono tracking-[0.25em] text-muted-foreground uppercase border-b border-border pb-2">
          / featured
        </h3>
        <ul className="mt-3 space-y-3">
          {(products ?? [])
            .filter((p) => p.is_active)
            .slice(0, 5)
            .map((p) => (
              <li key={p.id}>
                <Link to="/product/$slug" params={{ slug: p.slug }} className="flex gap-3 group">
                  <ProductImage imageUrl={p.image_url} name={p.name} className="h-12 w-12 shrink-0 rounded" />
                  <span className="min-w-0">
                    <span className="block text-primary font-semibold text-[13px] leading-tight group-hover:underline">
                      {p.name}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5 font-mono">{priceRange(p, symbol)}</span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </aside>
  );
}

export function SiteFooter() {
  const settings = useSettings();
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur mt-10">
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
        <p>{settings.footer_text ?? ""}</p>
        <div className="flex gap-4">
          <Link to="/guides" className="text-primary hover:underline">
            Guides
          </Link>
          <Link to="/payment-and-delivery" className="text-primary hover:underline">
            Payment
          </Link>
          <Link to="/order-tracking" className="text-primary hover:underline">
            Track order
          </Link>
          <Link to="/admin" className="text-primary hover:underline">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <div aria-hidden className="fixed inset-0 -z-10 cyber-grid opacity-20" />
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1000px 500px at 80% -10%, oklch(0.82 0.14 200 / 0.10), transparent 70%), radial-gradient(900px 500px at 0% 100%, oklch(0.6 0.2 300 / 0.10), transparent 70%)",
        }}
      />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

/** Page shell with the shop sidebar on the right, like the storefront layout. */
export function PageWithSidebar({ children }: { children: ReactNode }) {
  return (
    <PageBackground>
      <main className="mx-auto max-w-7xl px-6 py-8 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0">{children}</div>
        <ShopSidebar />
      </main>
    </PageBackground>
  );
}

/** Simple content page shell used by the informational routes. */
export function InfoPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <PageBackground>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-3xl font-bold text-primary text-glow">{title}</h2>
        {lead && <p className="mt-3 text-foreground/70">{lead}</p>}
        <div className="mt-8 space-y-6">{children}</div>
      </main>
    </PageBackground>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-card/70 backdrop-blur border border-border rounded p-5">
      <h3 className="font-semibold text-primary font-mono text-sm">{title}</h3>
      <div className="mt-2 text-sm text-foreground/75 space-y-2">{children}</div>
    </section>
  );
}

/** Renders the lightweight markdown used by editable content pages. */
export function RichText({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/);
  return (
    <div className="space-y-4 text-sm text-foreground/80">
      {blocks.map((block, i) => (
        <p key={i} className="leading-relaxed">
          {block.split("\n").map((line, j) => (
            <span key={j} className="block">
              {renderInline(line)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function renderInline(line: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-foreground font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
