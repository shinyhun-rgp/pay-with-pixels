import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { useCart, type PlacedOrder } from "@/lib/cart";
import { money, paymentMethodsQuery } from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — pay with crypto" },
      {
        name: "description",
        content: "Review your cart and pay instantly with crypto. No forms, no accounts.",
      },
      { property: "og:title", content: "Checkout" },
      { property: "og:description", content: "Direct crypto checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";
  const { data: paymentMethods } = useQuery(paymentMethodsQuery);

  const [paymentId, setPaymentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const enabledPayments = (paymentMethods ?? []).filter((p) => p.is_enabled);

  useEffect(() => {
    if (!paymentId && enabledPayments.length) setPaymentId(enabledPayments[0].id);
  }, [enabledPayments, paymentId]);

  const payment = enabledPayments.find((p) => p.id === paymentId);
  const total = cart.subtotal;

  const pay = async () => {
    setError(null);
    if (cart.items.length === 0) return setError("Your cart is empty.");
    if (!payment) return setError("Select a payment method.");

    setSubmitting(true);
    try {
      const order = await cart.placeOrder({
        firstName: "Guest",
        lastName: "Checkout",
        address: "",
        email: "",
        notes: "",
        shippingLabel: "",
        shippingPrice: 0,
        paymentCode: payment.code,
        paymentAddress: payment.address,
      });
      setPlaced(order);
      cart.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <PageWithSidebar>
        <h2 className="text-3xl font-bold text-primary">Order received</h2>
        <p className="mt-3 text-sm text-foreground/70">
          Send exactly {money(placed.total, symbol)} worth of {placed.paymentCode} to the address below.
        </p>
        <div className="mt-6 space-y-3 rounded border border-border bg-card/95 p-6 text-sm">
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
      <p className="mt-2 text-sm text-muted-foreground">Pick a coin and pay — no details needed.</p>

      <table className="mt-6 w-full border border-border bg-card/95 text-sm">
        <tbody>
          {cart.items.map((i) => (
            <tr key={`${i.productId}-${i.grams}`} className="border-b border-border">
              <td className="px-3 py-2">
                {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
              </td>
              <td className="px-3 py-2 text-right text-primary">{money(i.price * i.quantity, symbol)}</td>
            </tr>
          ))}
          <tr>
            <td className="px-3 py-2 font-semibold">Total</td>
            <td className="px-3 py-2 text-right font-semibold text-primary">{money(total, symbol)}</td>
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
              <div className="mt-2 rounded border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <p>{p.gateway_note || `${p.label} payment`}</p>
                {p.address && <p className="mt-1 font-mono break-all text-foreground/80">{p.address}</p>}
                {p.network && <p className="mt-1">Network: {p.network}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={pay}
        disabled={submitting}
        className="mt-6 w-full rounded bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {submitting ? "Creating invoice…" : `Pay ${money(total, symbol)}`}
      </button>
    </PageWithSidebar>
  );
}
