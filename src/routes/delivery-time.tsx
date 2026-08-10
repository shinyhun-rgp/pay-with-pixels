import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageBackground, RichText } from "@/components/site-chrome";
import { contentPagesQuery } from "@/lib/store";

export const Route = createFileRoute("/delivery-time")({
  head: () => ({
    meta: [
      { title: "License Activation Time — how fast keys arrive" },
      {
        name: "description",
        content: "Confirmation times per coin and how license keys are delivered after payment.",
      },
      { property: "og:title", content: "License Activation Time" },
      { property: "og:description", content: "Confirmation times and license key delivery." },
    ],
  }),
  component: () => <ContentPage slug="delivery-time" />,
});

export function ContentPage({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery(contentPagesQuery);
  const page = (data ?? []).find((p) => p.slug === slug);

  return (
    <PageBackground>
      <main className="mx-auto max-w-3xl px-6 py-12">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && !page && <p className="text-sm text-muted-foreground">This page has no content yet.</p>}
        {page && (
          <>
            <h2 className="text-3xl font-bold">{page.title}</h2>
            <div className="mt-6">
              <RichText body={page.body} />
            </div>
          </>
        )}
      </main>
    </PageBackground>
  );
}
