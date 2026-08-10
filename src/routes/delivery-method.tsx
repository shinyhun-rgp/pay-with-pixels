import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InfoCard, InfoPage } from "@/components/site-chrome";
import { shippingOptionsQuery, money } from "@/lib/store";

export const Route = createFileRoute("/delivery-method")({
  head: () => ({
    meta: [
      { title: "Delivery Method — shipping options" },
      { name: "description", content: "Standard and priority license provisioning options and what each includes." },
      { property: "og:title", content: "Delivery Method" },
      { property: "og:description", content: "Standard and express shipping options for every order." },
    ],
  }),
  component: DeliveryMethodPage,
});

function DeliveryMethodPage() {
  const { data: options } = useQuery(shippingOptionsQuery);

  return (
    <InfoPage title="Delivery method" lead="Pick a shipping speed at checkout.">
      <InfoCard title="Available options">
        <ul className="list-disc pl-5 space-y-1">
          {(options ?? []).map((o) => (
            <li key={o.id}>
              <span className="font-semibold text-foreground">{o.label}</span> — {o.description || "Standard handling"}
              {Number(o.price) > 0 ? ` (${money(Number(o.price))})` : " (free)"}
            </li>
          ))}
        </ul>
      </InfoCard>
      <InfoCard title="Tracking">
        <p>
          License keys and signed installer links are emailed as soon as payment confirms. Enterprise onboarding details are
          sent by the same channel within one business day.
        </p>
      </InfoCard>
      <InfoCard title="Address accuracy">
        <p>
          Use the address format shown on the delivery time page. Incorrect or incomplete addresses are the single most
          common cause of a failed delivery, and there are no reships in case of seizure.
        </p>
      </InfoCard>
    </InfoPage>
  );
}
