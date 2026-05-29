import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPinned, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFields } from "@/hooks/queries";

export const Route = createFileRoute("/_app/fields")({
  head: () => ({ meta: [{ title: "Campos · PDA Sport" }] }),
  component: FieldsPage,
});

function FieldsPage() {
  const { data: fields = [] } = useFields();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Infraestrutura"
        title="Campos"
        description="Cadastro de campos esportivos com dimensões e coordenadas GPS para calibrar análises."
        actions={
          <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo campo
          </button>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fields.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="glass rounded-2xl p-5 hover:border-primary/30 transition"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <MapPinned className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold tracking-tight">{f.name}</h3>
            <div className="text-xs text-muted-foreground capitalize">{f.surface}</div>
            <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Largura</div>
                <div className="font-medium">{f.width_m} m</div>
              </div>
              <div>
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Comprimento</div>
                <div className="font-medium">{f.length_m} m</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
