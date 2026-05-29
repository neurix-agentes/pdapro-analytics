import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useAthletes, useSessions } from "@/hooks/queries";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({ meta: [{ title: "Sessões · PDA Sport" }] }),
  component: SessionsPage,
});

const statusIcon = {
  processed: CheckCircle2,
  processing: Loader2,
  queued: Clock,
  failed: AlertCircle,
} as const;

const statusTone = {
  processed: "text-primary bg-primary/10 border-primary/20",
  processing: "text-info bg-info/10 border-info/20",
  queued: "text-[oklch(0.83_0.16_85)] bg-[oklch(0.83_0.16_85/0.12)] border-[oklch(0.83_0.16_85/0.25)]",
  failed: "text-destructive bg-destructive/10 border-destructive/20",
} as const;

function SessionsPage() {
  const { data: sessions = [] } = useSessions();
  const { data: athletes = [] } = useAthletes();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Análises físicas"
        title="Sessões"
        description="Cada upload GPS é processado pelo backend analítico (FastAPI) para gerar métricas e heatmap."
        actions={
          <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Upload className="h-4 w-4" /> Nova sessão
          </button>
        }
      />

      {/* Upload zone (visual) */}
      <div className="glass rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 transition p-10 text-center">
        <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Upload className="h-5 w-5" />
        </div>
        <div className="mt-3 text-sm font-semibold">Arraste um arquivo .gpx aqui</div>
        <div className="text-xs text-muted-foreground mt-1">Suporte futuro: TCX, FIT</div>
      </div>

      {/* List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Histórico de sessões</h3>
            <p className="text-[11px] text-muted-foreground">{sessions.length} registros no escopo atual</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface/30">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-5 py-3">Atleta</th>
              <th className="text-left font-medium px-3 py-3">Tipo</th>
              <th className="text-left font-medium px-3 py-3">Data</th>
              <th className="text-right font-medium px-3 py-3">Duração</th>
              <th className="text-right font-medium px-3 py-3">Dist.</th>
              <th className="text-right font-medium px-3 py-3">Sprints</th>
              <th className="text-right font-medium px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.slice(0, 40).map((s, i) => {
              const ath = athletes.find((a) => a.id === s.athlete_id);
              const Icon = statusIcon[s.status];
              return (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.008 }}
                  className="border-t border-border/30 hover:bg-surface/30 transition"
                >
                  <td className="px-5 py-3 font-medium">{ath?.name ?? s.athlete_id}</td>
                  <td className="px-3 py-3 capitalize text-muted-foreground">{s.session_type}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">
                    {new Date(s.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-3 py-3 text-right text-xs">{s.duration_min}'</td>
                  <td className="px-3 py-3 text-right">{s.metrics?.distance_km.toFixed(1)} km</td>
                  <td className="px-3 py-3 text-right">{s.metrics?.sprints}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md border ${statusTone[s.status]}`}>
                      <Icon className={`h-3 w-3 ${s.status === "processing" ? "animate-spin" : ""}`} /> {s.status}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
