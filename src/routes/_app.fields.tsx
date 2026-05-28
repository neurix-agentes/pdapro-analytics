import { createFileRoute } from "@tanstack/react-router";
import { MapPinned } from "lucide-react";
import { PageStub } from "@/components/app/PageStub";

export const Route = createFileRoute("/_app/fields")({
  head: () => ({ meta: [{ title: "Campos · PDA Sport" }] }),
  component: () => (
    <PageStub
      icon={MapPinned}
      eyebrow="Infraestrutura"
      title="Campos"
      description="Cadastro de campos esportivos com dimensões, orientação e coordenadas GPS para calibrar análises."
    />
  ),
});
