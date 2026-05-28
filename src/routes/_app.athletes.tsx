import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageStub } from "@/components/app/PageStub";

export const Route = createFileRoute("/_app/athletes")({
  head: () => ({ meta: [{ title: "Atletas · PDA Sport" }] }),
  component: () => (
    <PageStub
      icon={Users}
      eyebrow="Plantel"
      title="Atletas"
      description="Perfil individual, estatísticas acumuladas, evolução semanal e histórico de heatmaps por jogador."
    />
  ),
});
