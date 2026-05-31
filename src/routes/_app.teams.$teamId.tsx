import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, ShieldCheck, Activity, Gauge, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/PageHeader";
import { RosterTable } from "@/components/teams/RosterTable";
import { TransferAthleteDialog } from "@/components/teams/TransferAthleteDialog";
import { TeamFormDialog } from "@/components/teams/TeamFormDialog";
import { RecentSessionsTable } from "@/components/dashboard/RecentSessionsTable";
import { useTeam, useTeamAthletes, useClubs, useCoaches } from "@/hooks/queries";
import { mockSessions, mockHeatmaps, mockReports } from "@/mocks/data";
import type { Athlete } from "@/types";

export const Route = createFileRoute("/_app/teams/$teamId")({
  head: () => ({ meta: [{ title: "Time · PDA Sport" }] }),
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { teamId } = useParams({ from: "/_app/teams/$teamId" });
  const { data: team } = useTeam(teamId);
  const { data: athletes = [] } = useTeamAthletes(teamId);
  const { data: clubs = [] } = useClubs();
  const { data: coaches = [] } = useCoaches();
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAthlete, setTransferAthlete] = useState<Athlete | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const sessions = useMemo(() => mockSessions.filter((s) => s.team_id === teamId), [teamId]);
  const heatmaps = useMemo(() => mockHeatmaps.filter((h) => h.team_id === teamId), [teamId]);
  const reports = useMemo(() => mockReports.filter((r) => r.team_id === teamId), [teamId]);
  const avgKm = sessions.length
    ? sessions.reduce((s, x) => s + (x.metrics?.distance_km ?? 0), 0) / sessions.length
    : 0;
  const avgSpeed = sessions.length
    ? sessions.reduce((s, x) => s + (x.metrics?.avg_speed_kmh ?? 0), 0) / sessions.length
    : 0;

  if (!team) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Time não encontrado. <Link to="/teams" className="text-primary underline">Voltar</Link>
      </div>
    );
  }

  const club = clubs.find((c) => c.id === team.club_id);
  const coach = coaches.find((c) => c.id === team.coach_id);

  return (
    <div className="space-y-8">
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Times
      </Link>

      <PageHeader
        eyebrow={`${club?.name ?? ""} · ${team.category}`}
        title={team.name}
        description={coach ? `Treinador responsável: ${coach.name} · Temporada ${team.season ?? "—"}` : `Temporada ${team.season ?? "—"}`}
        actions={
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium hover:bg-surface inline-flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" /> Editar time
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Atletas ativos" value={athletes.length.toString()} />
        <Kpi icon={Activity} label="Sessões" value={sessions.length.toString()} />
        <Kpi icon={Gauge} label="Distância média" value={`${avgKm.toFixed(1)} km`} />
        <Kpi icon={ShieldCheck} label="Velocidade média" value={`${avgSpeed.toFixed(1)} km/h`} />
      </div>

      <Tabs defaultValue="roster">
        <TabsList className="bg-surface/40">
          <TabsTrigger value="roster">Elenco</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="pt-6">
          <RosterTable
            athletes={athletes}
            onTransfer={(a) => { setTransferAthlete(a); setTransferOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="sessions" className="pt-6">
          <div className="glass rounded-2xl p-5">
            <RecentSessionsTable sessions={sessions.slice(0, 12)} athletes={athletes} />
          </div>
        </TabsContent>

        <TabsContent value="heatmaps" className="pt-6">
          {heatmaps.length === 0 ? (
            <div className="glass rounded-2xl py-16 text-center text-sm text-muted-foreground">
              Nenhum heatmap para este time ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {heatmaps.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <img src={h.heatmap_png_url} alt="" className="aspect-[16/10] w-full object-cover" />
                  <div className="p-3">
                    <div className="text-xs font-medium truncate">
                      {athletes.find((a) => a.id === h.athlete_id)?.name ?? h.athlete_id}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="pt-6">
          {reports.length === 0 ? (
            <div className="glass rounded-2xl py-16 text-center text-sm text-muted-foreground">
              Nenhum relatório disponível.
            </div>
          ) : (
            <div className="glass rounded-2xl divide-y divide-border/30">
              {reports.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">{r.period}</div>
                  </div>
                  <button className="text-xs text-primary hover:underline">Abrir PDF</button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TransferAthleteDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        athlete={transferAthlete}
        fromTeam={team}
      />
      <TeamFormDialog open={editOpen} onOpenChange={setEditOpen} team={team} />
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
