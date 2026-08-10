import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InfoCard, InfoPage, useSettings } from "@/components/site-chrome";
import { categoriesQuery } from "@/lib/store";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us — who we are and how we ship" },
      { name: "description", content: "An independent team licensing audited security software worldwide, crypto-only." },
      { property: "og:title", content: "About us" },
      { property: "og:description", content: "Who we are and how the store works." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const settings = useSettings();
  const { data: categories } = useQuery(categoriesQuery);
  const groups = [...new Set((categories ?? []).map((c) => c.group_label))];

  return (
    <InfoPage title="About us" lead="Audited tooling, signed builds, instant license delivery.">
      <InfoCard title="What we do">
        <p>
          {settings.store_name ?? "We"} licenses security software to blue and red teams worldwide. Every
          product is priced per seat, so you license exactly the number of operators you need.
        </p>
      </InfoCard>
      <InfoCard title="Our catalogue">
        <ul className="list-disc pl-5 space-y-1">
          {groups.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </InfoCard>
      <InfoCard title="Support">
        <p>Questions about an order go to {settings.contact_email ?? "our support address"} — usually answered same day.</p>
      </InfoCard>
    </InfoPage>
  );
}
