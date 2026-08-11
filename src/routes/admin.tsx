import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EntityTable, useTableMutations } from "@/components/admin/entity-table";
import { PageBackground } from "@/components/site-chrome";
import {
  categoriesQuery,
  forumRepliesQuery,
  forumThreadsQuery,
  contentPagesQuery,
  gramsLabel,
  money,
  ordersQuery,
  paymentMethodsQuery,
  productsQuery,
  settingsQuery,
  shippingOptionsQuery,
} from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Store admin — manage products, prices and payments" },
      { name: "description", content: "Internal control panel for catalogue, licence pricing, crypto addresses, shipping, pages and orders." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Store admin" },
      { property: "og:description", content: "Internal control panel." },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Products", "Categories", "Payments", "Shipping", "Settings", "Pages", "Forum", "Orders"] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  const [tab, setTab] = useState<Tab>("Products");

  return (
    <PageBackground>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <header>
          <h2 className="text-3xl font-bold text-primary">Store admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in automatically — every field below writes straight to the live store.
          </p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded text-sm border transition ${
                t === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-6">
          {tab === "Products" && <ProductsPanel />}
          {tab === "Categories" && <CategoriesPanel />}
          {tab === "Payments" && <PaymentsPanel />}
          {tab === "Shipping" && <ShippingPanel />}
          {tab === "Settings" && <SettingsPanel />}
          {tab === "Pages" && <PagesPanel />}
          {tab === "Forum" && <ForumPanel />}
          {tab === "Orders" && <OrdersPanel />}
        </div>
      </main>
    </PageBackground>
  );
}

function ProductsPanel() {
  const { data: products } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <EntityTable
        title="Products"
        description="Name, description and category. Licence seat tiers are managed below each product."
        table="products"
        rows={(products ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category_id: p.category_id,
          image_url: p.image_url,
          is_active: p.is_active,
          sort_order: p.sort_order,
        }))}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "description", label: "Description", type: "textarea", width: "22rem" },
          { key: "category_id", label: "Category", type: "select", options: categoryOptions },
          { key: "image_url", label: "Image URL" },
          { key: "is_active", label: "Active", type: "boolean" },
          { key: "sort_order", label: "Order", type: "number", width: "5rem" },
        ]}
        queryKeys={[["products"]]}
        newRowDefaults={{
          name: "",
          slug: "",
          description: "",
          category_id: null,
          image_url: null,
          is_active: true,
          sort_order: (products?.length ?? 0) + 1,
        }}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Licence pricing</h3>
        {(products ?? []).map((p) => (
          <PricesTable key={p.id} productId={p.id} name={p.name} prices={p.product_prices} />
        ))}
      </div>
    </>
  );
}

function PricesTable({
  productId,
  name,
  prices,
}: {
  productId: string;
  name: string;
  prices: { id: string; grams: number; price: number; sort_order: number }[];
}) {
  return (
    <EntityTable
      title={name}
      description={`${prices.length} licence tiers — seat count and the price charged for that tier.`}
      table="product_prices"
      rows={prices.map((pr) => ({ id: pr.id, grams: pr.grams, price: pr.price, sort_order: pr.sort_order }))}
      columns={[
        { key: "grams", label: "Seats", type: "number", width: "7rem" },
        { key: "price", label: "Price", type: "number", width: "7rem" },
        { key: "sort_order", label: "Order", type: "number", width: "5rem" },
      ]}
      queryKeys={[["products"]]}
      newRowDefaults={{ product_id: productId, grams: 0, price: 0, sort_order: prices.length + 1 }}
    />
  );
}

function CategoriesPanel() {
  const { data: categories } = useQuery(categoriesQuery);
  return (
    <EntityTable
      title="Categories"
      description="Group label controls the heading each category sits under in the sidebar."
      table="categories"
      rows={(categories ?? []) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "name", label: "Name" },
        { key: "slug", label: "Slug" },
        { key: "group_label", label: "Group" },
        { key: "is_active", label: "Active", type: "boolean" },
        { key: "sort_order", label: "Order", type: "number", width: "5rem" },
      ]}
      queryKeys={[["categories"], ["products"]]}
      newRowDefaults={{ name: "", slug: "", group_label: "Products", is_active: true, sort_order: (categories?.length ?? 0) + 1 }}
    />
  );
}

function PaymentsPanel() {
  const { data: methods } = useQuery(paymentMethodsQuery);
  return (
    <EntityTable
      title="Crypto payment methods"
      description="The deposit address shown at checkout for each coin. Disable a coin to hide it from customers."
      table="payment_methods"
      rows={(methods ?? []) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "label", label: "Label" },
        { key: "code", label: "Code", width: "6rem" },
        { key: "network", label: "Network", width: "8rem" },
        { key: "address", label: "Deposit address", type: "textarea", width: "22rem" },
        { key: "gateway_note", label: "Note", type: "textarea", width: "16rem" },
        { key: "is_enabled", label: "Enabled", type: "boolean" },
        { key: "sort_order", label: "Order", type: "number", width: "5rem" },
      ]}
      queryKeys={[["payment_methods"]]}
      newRowDefaults={{
        label: "",
        code: "",
        network: "",
        address: "",
        gateway_note: "",
        is_enabled: true,
        sort_order: (methods?.length ?? 0) + 1,
      }}
    />
  );
}

function ShippingPanel() {
  const { data: options } = useQuery(shippingOptionsQuery);
  return (
    <EntityTable
      title="Shipping options"
      description="Shown as radio choices at checkout. Price is added to the order total."
      table="shipping_options"
      rows={(options ?? []) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "label", label: "Label" },
        { key: "description", label: "Description", type: "textarea", width: "22rem" },
        { key: "price", label: "Price", type: "number", width: "7rem" },
        { key: "is_default", label: "Default", type: "boolean" },
        { key: "sort_order", label: "Order", type: "number", width: "5rem" },
      ]}
      queryKeys={[["shipping_options"]]}
      newRowDefaults={{ label: "", description: "", price: 0, is_default: false, sort_order: (options?.length ?? 0) + 1 }}
    />
  );
}

function SettingsPanel() {
  const { data: settings } = useQuery(settingsQuery);
  return (
    <EntityTable
      title="Site settings"
      description="Store name, tagline, contact details, currency symbol and other global copy."
      table="site_settings"
      idKey="key"
      rows={(settings ?? []) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "key", label: "Key", width: "12rem" },
        { key: "label", label: "What it controls", width: "16rem" },
        { key: "value", label: "Value", type: "textarea", width: "24rem" },
        { key: "sort_order", label: "Order", type: "number", width: "5rem" },
      ]}
      queryKeys={[["site_settings"]]}
      newRowDefaults={{ key: "", label: "", value: "", sort_order: (settings?.length ?? 0) + 1 }}
    />
  );
}

function PagesPanel() {
  const { data: pages } = useQuery(contentPagesQuery);
  return (
    <EntityTable
      title="Content pages"
      description="Body text supports blank-line paragraphs, '## Heading' lines and '- ' bullet lines."
      table="content_pages"
      idKey="slug"
      rows={(pages ?? []) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "slug", label: "Slug", width: "12rem" },
        { key: "title", label: "Title", width: "14rem" },
        { key: "body", label: "Body", type: "textarea", width: "32rem" },
        { key: "sort_order", label: "Order", type: "number", width: "5rem" },
      ]}
      queryKeys={[["content_pages"]]}
      newRowDefaults={{ slug: "", title: "", body: "", sort_order: (pages?.length ?? 0) + 1 }}
    />
  );
}

const STATUSES = ["Awaiting payment", "Payment confirmed", "Shipped", "Delivered", "Cancelled"];

function OrdersPanel() {
  const { data: orders } = useQuery(ordersQuery);
  const { update, remove } = useTableMutations("orders", [["orders"]]);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="bg-card border border-border rounded p-4">
      <h3 className="font-semibold text-primary">Orders</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{orders?.length ?? 0} orders. Change status to move an order along.</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-2 pr-3">Order</th>
              <th className="pb-2 pr-3">Customer</th>
              <th className="pb-2 pr-3">Coin</th>
              <th className="pb-2 pr-3">Total</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="py-2 pr-3 font-mono">{o.order_number}</td>
                <td className="py-2 pr-3">
                  {o.first_name} {o.last_name}
                  <div className="text-muted-foreground">{o.email}</div>
                </td>
                <td className="py-2 pr-3">{o.payment_code}</td>
                <td className="py-2 pr-3">{money(Number(o.total))}</td>
                <td className="py-2 pr-3">
                  <select
                    aria-label={`Status for ${o.order_number}`}
                    value={o.status}
                    onChange={(e) => update.mutate({ id: o.id, idKey: "id", patch: { status: e.target.value } })}
                    className="px-2 py-1 border border-border rounded bg-background"
                  >
                    {[...new Set([o.status, ...STATUSES])].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 space-x-3 whitespace-nowrap">
                  <button onClick={() => setOpen(open === o.id ? null : o.id)} className="text-primary hover:underline">
                    {open === o.id ? "Hide" : "Details"}
                  </button>
                  <button
                    onClick={() => remove.mutate({ id: o.id, idKey: "id" })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <OrderDetails id={open} />}
    </section>
  );
}

function OrderDetails({ id }: { id: string }) {
  const { data: orders } = useQuery(ordersQuery);
  const { data: items } = useQuery({
    queryKey: ["order_items", id],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .returns<{ id: string; product_name: string; grams: number; quantity: number; unit_price: number }[]>();
      if (error) throw error;
      return data ?? [];
    },
  });
  const order = (orders ?? []).find((o) => o.id === id);
  if (!order) return null;

  return (
    <div className="mt-4 border-t border-border pt-4 text-xs space-y-2">
      <p className="font-semibold text-sm">{order.order_number}</p>
      <p className="whitespace-pre-line text-muted-foreground">{order.address}</p>
      {order.notes && <p className="text-muted-foreground">Notes: {order.notes}</p>}
      <p className="font-mono break-all">
        {order.payment_code} → {order.payment_address}
      </p>
      <ul className="list-disc pl-5">
        {(items ?? []).map((i) => (
          <li key={i.id}>
            {i.product_name} — {gramsLabel(i.grams)} × {i.quantity} — {money(Number(i.unit_price) * i.quantity)}
          </li>
        ))}
      </ul>
      <p>
        {order.shipping_label} {money(Number(order.shipping_price))} · Subtotal {money(Number(order.subtotal))} ·{" "}
        <span className="font-semibold">Total {money(Number(order.total))}</span>
      </p>
    </div>
  );
}

function ForumPanel() {
  const { data: threads } = useQuery(forumThreadsQuery);
  const { data: replies } = useQuery(forumRepliesQuery);
  return (
    <>
      <EntityTable
        title="Guide threads"
        description="Post guides, pin the important ones and lock threads that should stop receiving replies."
        table="forum_threads"
        rows={(threads ?? []) as unknown as Record<string, unknown>[]}
        columns={[
          { key: "title", label: "Title", width: "16rem" },
          { key: "slug", label: "Slug" },
          { key: "category", label: "Category" },
          { key: "author", label: "Author" },
          { key: "body", label: "Body", type: "textarea", width: "24rem" },
          { key: "is_pinned", label: "Pinned", type: "boolean" },
          { key: "is_locked", label: "Locked", type: "boolean" },
        ]}
        queryKeys={[["forum_threads"]]}
        newRowDefaults={{
          title: "",
          slug: `guide-${Math.random().toString(36).slice(2, 8)}`,
          category: "Guides",
          author: "nullsector",
          body: "",
          is_pinned: false,
          is_locked: false,
        }}
      />
      <EntityTable
        title="Replies"
        description="Moderate community replies."
        table="forum_replies"
        rows={(replies ?? []) as unknown as Record<string, unknown>[]}
        columns={[
          { key: "author", label: "Author" },
          { key: "body", label: "Body", type: "textarea", width: "28rem" },
        ]}
        queryKeys={[["forum_replies"]]}
        newRowDefaults={{ thread_id: threads?.[0]?.id ?? null, author: "nullsector", body: "" }}
      />
      <AccessCodesTable />
    </>
  );
}

function AccessCodesTable() {
  const { data: codes } = useQuery(forumAccessCodesQuery);
  return (
    <EntityTable
      title="Forum access codes"
      description="One-off $50 membership codes. Add a code after a buyer pays, then send it to them — it locks itself once redeemed."
      table="forum_access_codes"
      rows={(codes ?? []) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "code", label: "Code", width: "14rem" },
        { key: "label", label: "Note", width: "16rem" },
        { key: "is_used", label: "Redeemed", type: "boolean" },
      ]}
      queryKeys={[["forum_access_codes"]]}
      newRowDefaults={{
        code: `NS-FORUM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        label: "",
        is_used: false,
      }}
    />
  );
}

