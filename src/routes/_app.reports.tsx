import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileBarChart, Download } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useReports, useAthletes } from "@/hooks/queries";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Relatórios · PDA Sport" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: reports = [] } = useReports();
  const { data: athletes = [] } = useAthletes();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Exportações"
        title="Relatórios"
        description="Relatórios PDF gerados automaticamente com métricas físicas, comparativos e gráficos."
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => {
          const a = athletes.find((x) => x.id === r.athlete_id);
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="glass rounded-2xl p-4 hover:border-primary/30 transition group"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-info/10 text-info grid place-items-center shrink-0">
                  <FileBarChart className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{a?.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{r.period}</div>
                </div>
                <button className="h-8 w-8 rounded-lg bg-surface/60 border border-border hover:text-primary transition grid place-items-center text-muted-foreground opacity-0 group-hover:opacity-100">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
