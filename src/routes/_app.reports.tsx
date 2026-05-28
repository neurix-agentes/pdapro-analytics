import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { PageStub } from "@/components/app/PageStub";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Relatórios · PDA Sport" }] }),
  component: () => (
    <PageStub
      icon={FileBarChart}
      eyebrow="Documentação"
      title="Relatórios"
      description="Relatórios individuais, semanais e mensais exportáveis em PDF, PNG e CSV."
    />
  ),
});
