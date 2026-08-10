import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InfoCard, InfoPage } from "@/components/site-chrome";
import { paymentMethodsQuery } from "@/lib/store";

export const Route = createFileRoute("/payment-and-delivery")({
  head: () => ({
    meta: [
      { title: "Payment and Delivery — crypto only" },
      {
        name: "description",
        content: "We accept cryptocurrency only. See the accepted coins, how payment confirmation works and how orders ship.",
      },
      { property: "og:title", content: "Payment and Delivery" },
      { property: "og:description", content: "Crypto-only payments and how orders are delivered." },
    ],
  }),
  component: PaymentAndDelivery,
});

function PaymentAndDelivery() {
  const { data: methods } = useQuery(paymentMethodsQuery);
  const enabled = (methods ?? []).filter((m) => m.is_enabled);

  return (
    <InfoPage
      title="Payment and delivery"
      lead="We are a crypto-only store. Here is how paying and receiving your order works."
    >
      <InfoCard title="Accepted payment methods">
        <p>Cryptocurrency is the only payment method we accept. No cards, PayPal or bank transfers.</p>
        <ul className="list-disc pl-5 space-y-1">
          {enabled.map((m) => (
            <li key={m.id}>
              {m.label}
              {m.network ? ` — ${m.network} network` : ""}
            </li>
          ))}
          {enabled.length === 0 && <li>No payment methods are enabled right now.</li>}
        </ul>
      </InfoCard>
      <InfoCard title="How a crypto payment works">
        <p>
          At checkout you pick a coin and we show the deposit address for it. Send the exact order total on the stated
          network — coins sent on the wrong network cannot be recovered.
        </p>
        <p>Your order moves to “Payment confirmed” once the transaction is confirmed on-chain.</p>
      </InfoCard>
      <InfoCard title="How delivery works">
        <p>
          Licenses are priced per seat. Once payment confirms, keys and signed installers are issued
          — see{" "}
          <Link to="/shipping-and-packaging" className="text-primary hover:underline">
            shipping and packaging
          </Link>{" "}
          for the exact process and{" "}
          <Link to="/delivery-time" className="text-primary hover:underline">
            delivery time
          </Link>{" "}
          for regional estimates.
        </p>
      </InfoCard>
      <InfoCard title="Refunds">
        <p>
          Refunds are returned in the same coin you paid with, to a wallet address you provide, minus the network fee.
          There are no reships in case of seizure.
        </p>
      </InfoCard>
    </InfoPage>
  );
}
