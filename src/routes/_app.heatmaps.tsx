import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { PageStub } from "@/components/app/PageStub";

export const Route = createFileRoute("/_app/heatmaps")({
  head: () => ({ meta: [{ title: "Heatmaps · PDA Sport" }] }),
  component: () => (
    <PageStub
      icon={Flame}
      eyebrow="Análise espacial"
      title="Heatmaps"
      description="Grid de heatmaps históricos, visualização ampliada, métricas detalhadas e comparação entre sessões."
    />
  ),
});
