import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "./delivery-time";

export const Route = createFileRoute("/shipping-and-packaging")({
  head: () => ({
    meta: [
      { title: "Security and Compliance — signed builds and licensing" },
      {
        name: "description",
        content: "Code signing, SBOMs, data handling and licensing terms for every build we ship.",
      },
      { property: "og:title", content: "Security and Compliance" },
      { property: "og:description", content: "How we sign, scan and license every build." },
    ],
  }),
  component: () => <ContentPage slug="shipping-and-packaging" />,
});
