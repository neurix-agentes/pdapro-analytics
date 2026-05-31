import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, Activity, Flame, ArrowLeft, MapPin, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useClub, useAllTeams, useCoaches } from "@/hooks/queries";
import { useTeamStore } from "@/store";
import { mockAthletes, mockSessions, mockHeatmaps } from "@/mocks/data";

export const Route = createFileRoute("/_app/clubs/$clubId")({
  head: () => ({ meta: [{ title: "Clube · PDA Sport" }] }),
  component: ClubDetailPage,
});

function ClubDetailPage() {
  const { clubId } = useParams({ from: "/_app/clubs/$clubId" });
  const { data: club } = useClub(clubId);
  const { data: allTeams = [] } = useAllTeams();
  const { data: coaches = [] } = useCoaches();
  const setTeam = useTeamStore((s) => s.setCurrentTeam);

  const teams = useMemo(() => allTeams.filter((t) => t.club_id === clubId), [allTeams, clubId]);
  const athletes = useMemo(() => mockAthletes.filter((a) => a.club_id === clubId), [clubId]);
  const sessions = useMemo(() => mockSessions.filter((s) => s.club_id === clubId), [clubId]);
  const heatmaps = useMemo(() => mockHeatmaps.filter((h) => h.club_id === clubId), [clubId]);
  const totalKm = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.metrics?.distance_km ?? 0), 0),
    [sessions],
  );

  if (!club) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Clube não encontrado.{" "}
        <Link to="/clubs" className="text-primary underline">Voltar</Link>
      </div>
    );
  }

  const primary = club.primary_color ?? "#00FF88";

  return (
    <div className="space-y-8">
      <Link to="/clubs" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Clubes
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 relative overflow-hidden"
      >
        <div
          className="absolute inset-x-0 -top-24 h-48 opacity-25 blur-3xl pointer-events-none"
          style={{ background: primary }}
        />
        <div className="relative flex flex-wrap items-end gap-6">
          <div
            className="h-24 w-24 rounded-2xl grid place-items-center text-2xl font-bold tracking-wider shrink-0"
            style={{
              background: `color-mix(in oklab, ${primary} 20%, transparent)`,
              color: primary,
              boxShadow: `0 0 28px -8px ${primary}`,
            }}
          >
            {club.short_name}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-[0.18em] text-primary mb-1">Clube</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-display">{club.name}</h1>
            <div className="mt-1.5 text-sm text-muted-foreground inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> {club.city}{club.state ? ` · ${club.state}` : ""}{club.country ? ` · ${club.country}` : ""}
            </div>
            {club.description && (
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{club.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Desde</div>
            <div className="font-display text-xl">{new Date(club.created_at).getFullYear()}</div>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={ShieldCheck} label="Times" value={teams.length} accent={primary} />
        <Kpi icon={Users} label="Atletas" value={athletes.length} />
        <Kpi icon={Activity} label="Sessões" value={sessions.length} />
        <Kpi icon={Flame} label="Heatmaps" value={heatmaps.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Distância acumulada</div>
          <div className="mt-1.5 font-display text-3xl font-bold">{totalKm.toFixed(1)} <span className="text-base text-muted-foreground">km</span></div>
          <div className="mt-1 text-xs text-muted-foreground">somatório de todas as sessões registradas neste clube</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Treinadores</div>
          <div className="mt-1.5 font-display text-3xl font-bold">{coaches.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">profissionais ativos vinculados</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-surface/40">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="coaches">Treinadores</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-6 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                to="/teams/$teamId"
                params={{ teamId: t.id }}
                onClick={() => setTeam(t.id)}
                className="glass rounded-2xl p-4 hover:border-primary/30 transition"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.category}</div>
                <div className="mt-1 font-semibold">{t.name}</div>
                <div className="mt-2 text-xs text-muted-foreground">{t.athletes_count} atletas</div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="pt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <Link
                key={t.id}
                to="/teams/$teamId"
                params={{ teamId: t.id }}
                onClick={() => setTeam(t.id)}
                className="glass rounded-2xl p-5 hover:border-primary/40 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.season ?? "—"}</span>
                </div>
                <div className="mt-3">
                  <div className="font-display text-lg">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.category}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t.athletes_count} atletas</span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition">Abrir →</span>
                </div>
              </Link>
            ))}
            <Link
              to="/teams"
              className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-surface/30 transition p-5 grid place-items-center text-muted-foreground min-h-[160px] group"
            >
              <div className="flex flex-col items-center gap-2 group-hover:text-primary">
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">Adicionar time</span>
              </div>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="coaches" className="pt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((c) => (
              <div key={c.id} className="glass rounded-2xl p-5 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-info to-primary text-primary-foreground font-bold grid place-items-center">
                  {c.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="pt-6">
          <div className="glass rounded-2xl p-10 text-center">
            <Activity className="h-8 w-8 mx-auto mb-3 text-primary opacity-70" />
            <div className="font-display text-lg">Estatísticas avançadas em breve</div>
            <div className="text-sm text-muted-foreground mt-1">
              Análises agregadas e benchmarks do clube serão habilitados na próxima fase.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: number; accent?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" style={accent ? { color: accent } : undefined} /> {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
