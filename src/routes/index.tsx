import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDA Sport — Player Data Analytics" },
      { name: "description", content: "Plataforma premium de tracking GPS, heatmaps e analytics de desempenho para treinadores e clubes de futebol." },
      { property: "og:title", content: "PDA Sport — Player Data Analytics" },
      { property: "og:description", content: "Tracking GPS, heatmaps automáticos e analytics físicos de nível profissional." },
    ],
  }),
  component: LandingPage,
});
