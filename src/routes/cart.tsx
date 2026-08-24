import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { PageWithSidebar, useSettings } from "@/components/site-chrome";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — review your order" },
      { name: "description", content: "Review your license tiers and quantities before checking out." },
      { property: "og:title", content: "Your cart" },
      { property: "og:description", content: "Review your order before checkout." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const settings = useSettings();
  const symbol = settings.currency_symbol ?? "$";

  return (
    <PageWithSidebar>
      <h2 className="text-3xl font-bold text-primary">Your cart</h2>

      {cart.hydrated && cart.items.length === 0 && (
        <div className="mt-8 bg-card/95 border border-border rounded p-8 text-center">
          <p className="text-sm text-foreground/70">Your cart is empty.</p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Continue shopping
          </Link>
        </div>
      )}

      {cart.items.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm bg-card/95 border border-border rounded">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-2 font-semibold">Product</th>
                  <th className="px-4 py-2 font-semibold">Price</th>
                  <th className="px-4 py-2 font-semibold">Qty</th>
                  <th className="px-4 py-2 font-semibold">Subtotal</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {cart.items.map((i) => (
                  <tr key={`${i.productId}-${i.grams}`} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link to="/product/$slug" params={{ slug: i.slug }} className="text-primary hover:underline">
                        {i.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{money(i.price, symbol)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={i.quantity}
                        aria-label={`Quantity for ${i.name}`}
                        onChange={(e) => cart.setQuantity(i.productId, i.grams, Number(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-border rounded bg-card"
                      />
                    </td>
                    <td className="px-4 py-3">{money(i.price * i.quantity, symbol)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => cart.remove(i.productId, i.grams)}
                        aria-label={`Remove ${i.name}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button onClick={cart.clear} className="text-sm text-muted-foreground hover:text-destructive">
              Clear cart
            </button>
            <div className="text-right">
              <p className="text-lg font-semibold">Subtotal: {money(cart.subtotal, symbol)}</p>
              <Link
                to="/checkout"
                className="mt-3 inline-block bg-primary text-primary-foreground rounded px-6 py-2.5 text-sm font-medium hover:opacity-90"
              >
                Proceed to checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </PageWithSidebar>
  );
}
