import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Users, Calendar, ShieldCheck, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useTeams, useCoaches, useClubs } from "@/hooks/queries";
import { useClubStore, useTeamStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/teams")({
  head: () => ({ meta: [{ title: "Times · PDA Sport" }] }),
  component: TeamsPage,
});

function TeamsPage() {
  const { data: teams = [] } = useTeams();
  const { data: coaches = [] } = useCoaches();
  const { data: clubs = [] } = useClubs();
  const clubId = useClubStore((s) => s.currentClubId);
  const currentTeamId = useTeamStore((s) => s.currentTeamId);
  const setCurrentTeam = useTeamStore((s) => s.setCurrentTeam);
  const qc = useQueryClient();

  const club = clubs.find((c) => c.id === clubId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={club?.name ?? "Clube"}
        title="Times"
        description="Categorias de base, profissional e amador organizadas por treinador responsável."
        actions={
          <button className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo time
          </button>
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {teams.map((t, i) => {
          const coach = coaches.find((c) => c.id === t.coach_id);
          const active = t.id === currentTeamId;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`glass rounded-2xl p-5 transition cursor-pointer ${
                active ? "border-primary/50 glow-primary" : "hover:border-primary/30"
              }`}
              onClick={() => {
                setCurrentTeam(t.id);
                qc.invalidateQueries();
              }}
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <button className="text-muted-foreground hover:text-foreground transition">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold font-display tracking-tight">{t.name}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">{t.category}</div>
              </div>
              <div className="mt-5 space-y-2.5 text-xs">
                <Row icon={Users} label="Atletas" value={`${t.athletes_count}`} />
                <Row icon={Calendar} label="Criado em" value={new Date(t.created_at).toLocaleDateString("pt-BR")} />
              </div>
              {coach && (
                <div className="mt-5 pt-4 border-t border-border/40 flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br from-info to-primary text-primary-foreground font-bold text-[10px] grid place-items-center">
                    {coach.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div className="text-[11px]">
                    <div className="font-medium">{coach.name}</div>
                    <div className="text-muted-foreground">Treinador</div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
