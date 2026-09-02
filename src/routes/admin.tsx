import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { EntityTable, useTableMutations } from "@/components/admin/entity-table";
import { PageBackground } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import {
  categoriesQuery,
  forumThreadsQuery,
  forumAccessCodesQuery,
  contactMessagesQuery,
  slugify,
  contentPagesQuery,
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

const TABS = ["Products", "Categories", "Payments", "Shipping", "Settings", "Pages", "Guides", "Forum access", "Contact", "Orders"] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  return (
    <PageBackground>
      <AdminGate>
        <AdminDashboard />
      </AdminGate>
    </PageBackground>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("Products");

  return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <header>
          <h2 className="text-3xl font-bold text-primary">Store admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Owner account — every field below writes straight to the live store.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-2 text-xs text-muted-foreground hover:text-destructive"
          >
            Sign out
          </button>
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
          {tab === "Guides" && <ForumPanel />}
          {tab === "Forum access" && <ForumAccessPanel />}
          {tab === "Contact" && <ContactPanel />}
          {tab === "Orders" && <OrdersPanel />}
        </div>
      </main>
  );
}

function ProductsPanel() {
  const { data: products } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <QuickProduct nextOrder={(products?.length ?? 0) + 1} />
      <EntityTable
        title="Products"
        description="One price per product. Edit any cell and it saves as soon as you leave the field."
        table="products"
        rows={(products ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          description: p.description,
          category_id: p.category_id,
          image_url: p.image_url,
          is_active: p.is_active,
          sort_order: p.sort_order,
        }))}
        columns={[
          { key: "name", label: "Name" },
          { key: "price", label: "Price", type: "number", width: "7rem" },
          { key: "slug", label: "Slug" },
          { key: "description", label: "Description", type: "textarea", width: "22rem" },
          { key: "category_id", label: "Category", type: "select", options: categoryOptions },
          { key: "image_url", label: "Image", type: "image" },
          { key: "is_active", label: "Active", type: "boolean" },
          { key: "sort_order", label: "Order", type: "number", width: "5rem" },
        ]}
        queryKeys={[["products"]]}
        allowCreate={false}
      />
    </>
  );
}

/** One-line product creation: name + price is enough, the slug is generated. */
function QuickProduct({ nextOrder }: { nextOrder: number }) {
  const qc = useQueryClient();
  const { data: categories } = useQuery(categoriesQuery);
  const [form, setForm] = useState({ name: "", price: "", category_id: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const base = slugify(form.name) || "product";
      const { error: err } = await supabase.from("products").insert({
        name: form.name.trim(),
        slug: `${base}-${Math.random().toString(36).slice(2, 5)}`,
        price: Number(form.price) || 0,
        description: form.description,
        category_id: form.category_id || null,
        is_active: true,
        sort_order: nextOrder,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      setForm({ name: "", price: "", category_id: form.category_id, description: "" });
      setError(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not add product"),
  });

  const input = "rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (form.name.trim()) create.mutate();
      }}
      className="rounded border border-border bg-card/70 p-5 space-y-3"
    >
      <h3 className="font-mono text-sm uppercase tracking-widest text-primary">/ add product</h3>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Product name"
          className={`md:col-span-2 ${input}`}
        />
        <input
          type="number"
          step="any"
          min="0"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="Price"
          className={input}
        />
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          aria-label="Category"
          className={input}
        >
          <option value="">No category</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        rows={2}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Short description (optional)"
        className={`w-full ${input}`}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        disabled={create.isPending}
        className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {create.isPending ? "Adding…" : "Add product"}
      </button>
      <p className="text-xs text-muted-foreground">Upload the image in the table below once the product exists.</p>
    </form>
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
            {i.product_name} × {i.quantity} — {money(Number(i.unit_price) * i.quantity)}
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

function QuickPost() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", category: "Guides", author: "nullsector", body: "" });
  const post = useMutation({
    mutationFn: async () => {
      const base = slugify(form.title) || "guide";
      const { error } = await supabase.from("forum_threads").insert({
        title: form.title.trim(),
        slug: `${base}-${Math.random().toString(36).slice(2, 6)}`,
        category: form.category.trim() || "Guides",
        author: form.author.trim() || "nullsector",
        body: form.body,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ title: "", category: form.category, author: form.author, body: "" });
      qc.invalidateQueries({ queryKey: ["forum_threads"] });
    },
  });

  const input = "rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (form.title.trim()) post.mutate();
      }}
      className="rounded border border-border bg-card/70 p-5 space-y-3"
    >
      <h3 className="font-mono text-sm uppercase tracking-widest text-primary">/ new post</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          className={`md:col-span-2 ${input}`}
        />
        <input
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="Section"
          className={input}
        />
      </div>
      <textarea
        rows={8}
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        placeholder="Write the guide. Blank lines make paragraphs, **bold** for emphasis."
        className={`w-full ${input}`}
      />
      <button
        disabled={post.isPending}
        className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {post.isPending ? "Publishing…" : "Publish post"}
      </button>
    </form>
  );
}

function ForumPanel() {
  const { data: threads } = useQuery(forumThreadsQuery);
  return (
    <>
      <QuickPost />
      <EntityTable
        title="Posts"
        description="Everything published on the home board. Pin what matters, lock what is finished."
        table="forum_threads"
        rows={(threads ?? []) as unknown as Record<string, unknown>[]}
        columns={[
          { key: "title", label: "Title", width: "16rem" },
          { key: "slug", label: "Slug" },
          { key: "category", label: "Section" },
          { key: "author", label: "Author" },
          { key: "body", label: "Body", type: "textarea", width: "24rem" },
          { key: "created_at", label: "Date", type: "date", width: "13rem" },
          { key: "views", label: "Views", type: "number", width: "6rem" },
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
          views: 0,
          is_pinned: false,
          is_locked: false,
        }}
      />
    </>
  );
}

function ForumAccessPanel() {
  const { data: codes } = useQuery(forumAccessCodesQuery);
  return (
    <EntityTable
      title="Forum access codes"
      description="Create a code for each paid $50 entry, then send it to the buyer. A code stops working once it is redeemed."
      table="forum_access_codes"
      rows={(codes ?? []) as unknown as Record<string, unknown>[]}
      columns={[
        { key: "code", label: "Code", width: "14rem" },
        { key: "label", label: "Note / buyer", width: "18rem" },
        { key: "is_used", label: "Used", type: "boolean" },
      ]}
      queryKeys={[["forum_access_codes"]]}
      newRowDefaults={{ code: "", label: "", is_used: false }}
    />
  );
}

function ContactPanel() {
  const { data: messages } = useQuery(contactMessagesQuery);
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const reply = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ admin_reply: text, status: "Replied", replied_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact_messages"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact_messages"] }),
  });

  return (
    <section className="space-y-4">
      <header>
        <h3 className="font-mono text-sm uppercase tracking-widest text-primary">/ contact inbox</h3>
        <p className="text-xs text-muted-foreground">
          Replies appear on the contact page as soon as you save them — the sender looks theirs up with the ticket code.
        </p>
      </header>
      {(messages ?? []).length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
      {(messages ?? []).map((m) => (
        <article key={m.id} className="rounded border border-border bg-card/70 p-5">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">{m.ref_code}</span>
            <span>{m.status}</span>
            <span>{m.name || "anon"} · {m.email}</span>
            <span>{new Date(m.created_at).toLocaleString()}</span>
          </div>
          <h4 className="mt-2 font-semibold text-foreground">{m.subject || "(no subject)"}</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/70">{m.message}</p>
          <textarea
            rows={3}
            value={drafts[m.id] ?? m.admin_reply}
            onChange={(e) => setDrafts({ ...drafts, [m.id]: e.target.value })}
            placeholder="Write a reply…"
            className="mt-3 w-full rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => reply.mutate({ id: m.id, text: drafts[m.id] ?? m.admin_reply })}
              className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Save reply
            </button>
            <button
              onClick={() => remove.mutate(m.id)}
              className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}


