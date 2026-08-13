import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  group_label: string;
  sort_order: number;
  is_active: boolean;
};

export type ProductPrice = {
  id: string;
  product_id: string;
  grams: number;
  price: number;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
  sort_order: number;
  product_prices: ProductPrice[];
};

export type PaymentMethod = {
  id: string;
  label: string;
  code: string;
  address: string;
  network: string;
  gateway_note: string;
  is_enabled: boolean;
  sort_order: number;
};

export type ShippingOption = {
  id: string;
  label: string;
  description: string;
  price: number;
  is_default: boolean;
  sort_order: number;
};

export type Setting = { key: string; value: string; label: string; sort_order: number };

export type ContentPage = { slug: string; title: string; body: string; sort_order: number };

export type OrderRow = {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  address: string;
  email: string;
  notes: string;
  shipping_label: string;
  shipping_price: number;
  subtotal: number;
  total: number;
  payment_code: string;
  payment_address: string;
  status: string;
  created_at: string;
};

const sel = (s: string): string => s;

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select(sel("*"))
      .order("sort_order")
      .returns<Category[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(sel("*, product_prices(*)"))
      .order("sort_order")
      .returns<Product[]>();
    if (error) throw error;
    return (data ?? []).map((p) => ({
      ...p,
      product_prices: [...(p.product_prices ?? [])].sort((a, b) => a.grams - b.grams),
    }));
  },
});

export const paymentMethodsQuery = queryOptions({
  queryKey: ["payment_methods"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select(sel("*"))
      .order("sort_order")
      .returns<PaymentMethod[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export const shippingOptionsQuery = queryOptions({
  queryKey: ["shipping_options"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("shipping_options")
      .select(sel("*"))
      .order("sort_order")
      .returns<ShippingOption[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select(sel("*"))
      .order("sort_order")
      .returns<Setting[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export const contentPagesQuery = queryOptions({
  queryKey: ["content_pages"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("content_pages")
      .select(sel("*"))
      .order("sort_order")
      .returns<ContentPage[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(sel("*"))
      .order("created_at", { ascending: false })
      .returns<OrderRow[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export function settingsMap(rows: Setting[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows ?? []) out[r.key] = r.value;
  return out;
}

export function money(value: number, symbol = "$"): string {
  return `${symbol}${Number(value || 0).toFixed(2)}`;
}

/** License tier label. The stored numeric tier is the number of seats/devices. */
export function gramsLabel(seats: number): string {
  const n = Number(seats) || 0;
  if (n >= 1000) return "Unlimited site licence";
  return n === 1 ? "1 seat" : `${n} seats`;
}


export function priceRange(product: Product, symbol = "$"): string {
  const prices = product.product_prices.map((p) => Number(p.price));
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? money(min, symbol) : `${money(min, symbol)} – ${money(max, symbol)}`;
}

export const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Deterministic gradient so each product looks distinct without image assets. */
export function productGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const h1 = 185 + (hash % 90); // cyan → violet band only
  const h2 = (h1 + 30 + (hash % 40)) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 22%), hsl(${h2} 65% 12%))`;
}


/**
 * Background for a product tile: the image when a usable URL is set,
 * otherwise the deterministic gradient. Handles blank/whitespace values and
 * quotes the URL so paths with spaces or parentheses still resolve.
 */
export function productBackground(imageUrl: string | null | undefined, seed: string): string {
  const url = (imageUrl ?? "").trim();
  if (!url) return productGradient(seed);
  const safe = url.replace(/["\\]/g, encodeURIComponent);
  return `center/cover no-repeat url("${safe}"), ${productGradient(seed)}`;
}

export type ForumThread = {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  views: number;
  created_at: string;
};

export type ForumReply = {
  id: string;
  thread_id: string;
  author: string;
  body: string;
  created_at: string;
};

export const forumThreadsQuery = queryOptions({
  queryKey: ["forum_threads"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select(sel("*"))
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<ForumThread[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export const forumRepliesQuery = queryOptions({
  queryKey: ["forum_replies"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("forum_replies")
      .select(sel("*"))
      .order("created_at")
      .returns<ForumReply[]>();
    if (error) throw error;
    return data ?? [];
  },
});

export type ContactMessage = {
  id: string;
  ref_code: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  admin_reply: string;
  status: string;
  replied_at: string | null;
  created_at: string;
};

export const contactMessagesQuery = queryOptions({
  queryKey: ["contact_messages"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select(sel("*"))
      .order("created_at", { ascending: false })
      .returns<ContactMessage[]>();
    if (error) throw error;
    return data ?? [];
  },
});
