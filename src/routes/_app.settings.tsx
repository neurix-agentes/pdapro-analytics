import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PageStub } from "@/components/app/PageStub";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Configurações · PDA Sport" }] }),
  component: () => (
    <PageStub
      icon={Settings}
      eyebrow="Conta"
      title="Configurações"
      description="Perfil, equipe, integrações, taxas, branding e preparação multi-tenant para clubes."
    />
  ),
});
