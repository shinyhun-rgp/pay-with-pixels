import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import deliveryMap from "@/assets/express-delivery-map.jpg";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { useCart, type PlacedOrder } from "@/lib/cart";
import { gramsLabel, money, paymentMethodsQuery, shippingOptionsQuery } from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — billing, shipping and crypto payment" },
      {
        name: "description",
        content: "Enter your billing and shipping details, pick a delivery speed and pay with Bitcoin or Monero.",
      },
      { property: "og:title", content: "Checkout" },
      { property: "og:description", content: "Billing, shipping and crypto payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const { data: shippingOptions } = useQuery(shippingOptionsQuery);
  const { data: paymentMethods } = useQuery(paymentMethodsQuery);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingId, setShippingId] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const enabledPayments = (paymentMethods ?? []).filter((p) => p.is_enabled);

  useEffect(() => {
    if (!shippingId && shippingOptions?.length) {
      setShippingId((shippingOptions.find((s) => s.is_default) ?? shippingOptions[0]).id);
    }
  }, [shippingOptions, shippingId]);

  useEffect(() => {
    if (!paymentId && enabledPayments.length) setPaymentId(enabledPayments[0].id);
  }, [enabledPayments, paymentId]);

  const shipping = (shippingOptions ?? []).find((s) => s.id === shippingId);
  const payment = enabledPayments.find((p) => p.id === paymentId);
  const shippingPrice = Number(shipping?.price ?? 0);
  const total = cart.subtotal + shippingPrice;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (firstName.trim().length < 2) next.firstName = "First name is required.";
    if (lastName.trim().length < 2) next.lastName = "Last name is required.";
    if (address.trim().length < 5) next.address = "Shipping address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "A valid email address is required.";
    if (!payment) next.payment = "Select a payment method.";
    if (cart.items.length === 0) next.cart = "Your cart is empty.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const order = await cart.placeOrder({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        email: email.trim(),
        notes: notes.trim(),
        shippingLabel: shipping ? `${shipping.label} ${shipping.description}`.trim() : "",
        shippingPrice,
        paymentCode: payment!.code,
        paymentAddress: payment!.address,
      });
      setPlaced(order);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Could not place the order." });
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <PageWithSidebar>
        <h2 className="text-3xl font-bold text-primary">Order received</h2>
        <p className="mt-3 text-sm text-foreground/70">
          Send exactly {money(placed.total, symbol)} worth of {placed.paymentCode} to the address below. Updates go to{" "}
          {placed.email}.
        </p>
        <div className="mt-6 bg-card/95 border border-border rounded p-6 space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Order number</p>
            <p className="text-lg font-semibold text-primary">{placed.orderNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{placed.paymentCode} address</p>
            <p className="font-mono break-all">{placed.paymentAddress}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount due</p>
            <p className="font-semibold">{money(placed.total, symbol)}</p>
          </div>
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          Continue shopping
        </Link>
      </PageWithSidebar>
    );
  }

  return (
    <PageWithSidebar>
      <h2 className="text-3xl font-bold">Checkout</h2>

      <form onSubmit={submit} className="mt-6">
        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <h3 className="text-primary font-semibold">Billing &amp; Shipping</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="First name" required error={errors.firstName}>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-sm"
                />
              </Field>
              <Field label="Last name" required error={errors.lastName}>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-sm"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Shipping address" required error={errors.address}>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-sm"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Email address" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-sm"
                />
              </Field>
            </div>
          </section>

          <section>
            <h3 className="text-primary font-semibold">Additional information</h3>
            <div className="mt-4">
              <Field label="Order Notes (optional)">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Notes about your order, e.g. special notes for delivery."
                  className="w-full px-3 py-2 border border-border rounded bg-card text-sm"
                />
              </Field>
            </div>
          </section>
        </div>

        <h3 className="mt-10 text-primary font-semibold">Your order</h3>
        <table className="mt-3 w-full text-sm border border-border bg-card/95">
          <thead>
            <tr className="bg-muted/60 text-left">
              <th className="px-3 py-2 font-semibold border-b border-border">Product</th>
              <th className="px-3 py-2 font-semibold border-b border-border">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((i) => (
              <tr key={`${i.productId}-${i.grams}`} className="border-b border-border">
                <td className="px-3 py-2">
                  {i.name} ({gramsLabel(i.grams)}) <span className="text-muted-foreground">× {i.quantity}</span>
                </td>
                <td className="px-3 py-2 text-primary">{money(i.price * i.quantity, symbol)}</td>
              </tr>
            ))}
            <tr className="border-b border-border">
              <td className="px-3 py-2 font-semibold">Subtotal</td>
              <td className="px-3 py-2 text-primary">{money(cart.subtotal, symbol)}</td>
            </tr>
            <tr className="border-b border-border align-top">
              <td className="px-3 py-2 font-semibold">Shipping</td>
              <td className="px-3 py-2">
                <div className="space-y-1">
                  {(shippingOptions ?? []).map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-primary">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingId === s.id}
                        onChange={() => setShippingId(s.id)}
                      />
                      <span>
                        {s.label} {s.description}
                        {Number(s.price) > 0 ? `: ${money(Number(s.price), symbol)}` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-semibold">Total</td>
              <td className="px-3 py-2 text-primary font-semibold">{money(total, symbol)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 space-y-3">
          {enabledPayments.map((p) => (
            <div key={p.id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="payment" checked={paymentId === p.id} onChange={() => setPaymentId(p.id)} />
                <span className="font-semibold text-primary">{p.label}</span>
              </label>
              {paymentId === p.id && (
                <div className="mt-2 bg-muted/60 border border-border rounded px-3 py-2 text-xs text-muted-foreground">
                  <p>{p.gateway_note || `${p.label} payment gateway`}</p>
                  {p.address && <p className="mt-1 font-mono break-all text-foreground/80">{p.address}</p>}
                  {p.network && <p className="mt-1">Network: {p.network}</p>}
                </div>
              )}
            </div>
          ))}
          {errors.payment && <p className="text-xs text-destructive">{errors.payment}</p>}
        </div>

        {settings.checkout_notice && (
          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">{settings.checkout_notice}</p>
        )}

        {(errors.cart || errors.submit) && (
          <p className="mt-4 text-sm text-destructive">{errors.cart ?? errors.submit}</p>
        )}

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setErrors({})}
            className="px-4 py-1.5 border border-primary text-primary rounded text-sm hover:bg-primary hover:text-primary-foreground transition"
          >
            Update Totals
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="block w-full border border-primary text-primary rounded py-2.5 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </div>
      </form>

      <section className="mt-14 text-center">
        <h3 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-brand)" }}>
          Express Delivery
        </h3>
        <img
          src={deliveryMap}
          alt="World map showing express delivery times by region"
          loading="lazy"
          width={1280}
          height={704}
          className="mt-4 w-full h-auto"
        />
      </section>
    </PageWithSidebar>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <span className="mt-1 block">{children}</span>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
