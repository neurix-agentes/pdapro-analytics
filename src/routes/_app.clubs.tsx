import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Building2, Plus, Users, ShieldCheck, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useClubs, useTeams } from "@/hooks/queries";
import { useClubStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/clubs")({
  head: () => ({ meta: [{ title: "Clubes · PDA Sport" }] }),
  component: ClubsPage,
});

function ClubsPage() {
  const { data: clubs = [] } = useClubs();
  const { data: teams = [] } = useTeams();
  const setCurrentClub = useClubStore((s) => s.setCurrentClub);
  const currentClubId = useClubStore((s) => s.currentClubId);
  const qc = useQueryClient();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Hierarquia"
        title="Clubes"
        description="Gerencie clubes, times e treinadores conectados à sua conta. Selecione um clube para focar dashboard e análises."
        actions={
          <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo clube
          </button>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {clubs.map((c, i) => {
          const clubTeams = teams.filter((t) => t.club_id === c.id);
          const active = c.id === currentClubId;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`group glass rounded-2xl p-5 transition cursor-pointer relative overflow-hidden ${
                active ? "border-primary/50 glow-primary" : "hover:border-primary/30"
              }`}
              onClick={() => {
                setCurrentClub(c.id);
                qc.invalidateQueries();
              }}
            >
              <div
                className="absolute inset-x-0 -top-20 h-40 opacity-20 blur-3xl pointer-events-none"
                style={{ background: c.primary_color ?? "#00FF88" }}
              />
              <div className="relative flex items-start justify-between">
                <div
                  className="h-12 w-12 rounded-xl grid place-items-center text-sm font-bold tracking-wider"
                  style={{
                    background: `color-mix(in oklab, ${c.primary_color ?? "#00FF88"} 22%, transparent)`,
                    color: c.primary_color ?? "#00FF88",
                  }}
                >
                  {c.short_name}
                </div>
                {active && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                    Ativo
                  </span>
                )}
              </div>
              <div className="relative mt-4">
                <h3 className="text-lg font-semibold tracking-tight font-display">{c.name}</h3>
                <p className="text-xs text-muted-foreground">{c.city}</p>
              </div>
              <div className="relative mt-5 grid grid-cols-2 gap-3">
                <Stat icon={ShieldCheck} value={clubTeams.length} label="times" />
                <Stat icon={Users} value={c.active_athletes} label="atletas" />
              </div>
              <div className="relative mt-5 pt-4 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">desde {new Date(c.created_at).getFullYear()}</span>
                <Link
                  to="/teams"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver times <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          );
        })}

        <button className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-surface/30 transition p-5 grid place-items-center text-muted-foreground min-h-[260px] group">
          <div className="flex flex-col items-center gap-2 group-hover:text-primary transition">
            <div className="h-12 w-12 rounded-xl border border-border bg-surface/60 grid place-items-center">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Adicionar clube</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string }) {
  return (
    <div className="rounded-lg bg-surface/40 border border-border/40 px-3 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-wider">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}
