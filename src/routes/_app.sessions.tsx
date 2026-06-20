import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, CheckCircle2, Clock, AlertCircle, Loader2, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useAthletes, useFields, useSessions } from "@/hooks/queries";
import { SessionFormDialog } from "@/components/sessions/SessionFormDialog";
import type { SessionStatus } from "@/types";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({ meta: [{ title: "Sessões · PDA Sport" }] }),
  component: SessionsPage,
});

const statusIcon: Record<SessionStatus, typeof CheckCircle2> = {
  pending: Hourglass,
  processed: CheckCircle2,
  processing: Loader2,
  queued: Clock,
  failed: AlertCircle,
};

const statusTone: Record<SessionStatus, string> = {
  pending: "text-muted-foreground bg-muted/40 border-border",
  processed: "text-primary bg-primary/10 border-primary/20",
  processing: "text-info bg-info/10 border-info/20",
  queued: "text-[oklch(0.83_0.16_85)] bg-[oklch(0.83_0.16_85/0.12)] border-[oklch(0.83_0.16_85/0.25)]",
  failed: "text-destructive bg-destructive/10 border-destructive/20",
};

const statusLabel: Record<SessionStatus, string> = {
  pending: "pendente",
  processed: "processado",
  processing: "processando",
  queued: "na fila",
  failed: "falhou",
};

function SessionsPage() {
  const { data: sessions = [], isLoading } = useSessions();
  const { data: athletes = [] } = useAthletes();
  const { data: fields = [] } = useFields();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Análises físicas"
        title="Sessões"
        description="Cadastre sessões vinculadas a atletas e campos. O upload de GPS e o processamento analítico entram em fases seguintes."
        actions={
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nova sessão
          </button>
        }
      />

      <SessionFormDialog open={open} onOpenChange={setOpen} />

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Histórico de sessões</h3>
            <p className="text-[11px] text-muted-foreground">
              {isLoading ? "Carregando…" : `${sessions.length} registros no escopo atual`}
            </p>
          </div>
        </div>

        {!isLoading && sessions.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted-foreground">
            Nenhuma sessão cadastrada ainda. Clique em <span className="text-foreground font-medium">Nova sessão</span> para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface/30">
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-medium px-5 py-3">Atleta</th>
                  <th className="text-left font-medium px-3 py-3">Campo</th>
                  <th className="text-left font-medium px-3 py-3">Tipo</th>
                  <th className="text-left font-medium px-3 py-3">Data</th>
                  <th className="text-right font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 80).map((s, i) => {
                  const ath = athletes.find((a) => a.id === s.athlete_id);
                  const fld = fields.find((f) => f.id === s.field_id);
                  const Icon = statusIcon[s.status];
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.01 }}
                      className="border-t border-border/30 hover:bg-surface/30 transition"
                    >
                      <td className="px-5 py-3 font-medium">{ath?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{fld?.name ?? "—"}</td>
                      <td className="px-3 py-3 capitalize text-muted-foreground">{s.session_type}</td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">
                        {new Date(s.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md border ${statusTone[s.status]}`}>
                          <Icon className={`h-3 w-3 ${s.status === "processing" ? "animate-spin" : ""}`} /> {statusLabel[s.status]}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
