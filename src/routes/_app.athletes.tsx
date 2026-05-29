import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Filter, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useAthletes, useTeams } from "@/hooks/queries";

export const Route = createFileRoute("/_app/athletes")({
  head: () => ({ meta: [{ title: "Atletas · PDA Sport" }] }),
  component: AthletesPage,
});

function AthletesPage() {
  const { data: athletes = [], isLoading } = useAthletes();
  const { data: teams = [] } = useTeams();
  const [q, setQ] = useState("");

  const list = useMemo(
    () => athletes.filter((a) => a.name.toLowerCase().includes(q.toLowerCase())),
    [athletes, q],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plantel"
        title="Atletas"
        description="Perfil individual, estatísticas acumuladas e histórico de heatmaps por jogador."
        actions={
          <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo atleta
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar atleta…"
            className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 transition"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 hover:bg-surface px-3 py-2 text-sm transition">
          <Filter className="h-4 w-4" /> Filtros
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{list.length} atletas</span>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/40">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-5 py-3">Atleta</th>
              <th className="text-left font-medium px-3 py-3">Time</th>
              <th className="text-left font-medium px-3 py-3">Posição</th>
              <th className="text-right font-medium px-3 py-3">Idade</th>
              <th className="text-right font-medium px-3 py-3">Altura</th>
              <th className="text-right font-medium px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">Carregando…</td></tr>
            )}
            {!isLoading && list.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                <Users className="h-6 w-6 mx-auto mb-2 opacity-50" /> Nenhum atleta encontrado.
              </td></tr>
            )}
            {list.map((a, i) => {
              const team = teams.find((t) => t.id === a.team_id);
              return (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.01 }}
                  className="border-t border-border/30 hover:bg-surface/30 transition cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/30 to-info/30 grid place-items-center text-xs font-bold text-foreground">
                        {a.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-[11px] text-muted-foreground">#{a.jersey_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{team?.name ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {a.position}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">{a.age}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{a.height_cm} cm</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ativo
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
