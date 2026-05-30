import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Gauge, Timer, TrendingUp, Users, Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import {
  DashboardFilters, type PeriodKey, type TypeFilter,
} from "@/components/dashboard/DashboardFilters";
import { KpiGrid, type Kpi } from "@/components/dashboard/KpiGrid";
import { Panel, PanelSkeleton } from "@/components/dashboard/Panel";
import { WeeklyLoadChart } from "@/components/dashboard/WeeklyLoadChart";
import {
  PositionDistributionChart, colorForIndex, type PositionDatum,
} from "@/components/dashboard/PositionDistributionChart";
import { IntensityChart } from "@/components/dashboard/IntensityChart";
import { AthleteRankingCard } from "@/components/dashboard/AthleteRankingCard";
import { RecentHeatmapsCarousel } from "@/components/dashboard/RecentHeatmapsCarousel";
import { RecentSessionsTable } from "@/components/dashboard/RecentSessionsTable";
import { AthleteComparisonRadar } from "@/components/dashboard/AthleteComparisonRadar";
import {
  buildIntensity, buildLoadByDay, filterSessions, periodDays,
  previousPeriod, radarFor, rankAthletes, trendPct,
} from "@/lib/dashboard-utils";
import {
  useAthletes, useClubs, useSessions, useTeams,
} from "@/hooks/queries";
import { useAuthStore, useClubStore, useTeamStore } from "@/store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · PDA Sport" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clubs = useClubs();
  const teams = useTeams();
  const athletesQ = useAthletes();
  const sessionsQ = useSessions();
  const clubId = useClubStore((s) => s.currentClubId);
  const teamId = useTeamStore((s) => s.currentTeamId);

  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [type, setType] = useState<TypeFilter>("all");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const club = clubs.data?.find((c) => c.id === clubId);
  const team = teams.data?.find((t) => t.id === teamId);

  const athletes = athletesQ.data ?? [];
  const allSessions = sessionsQ.data ?? [];

  const loading = sessionsQ.isLoading || athletesQ.isLoading;

  const filtered = useMemo(
    () => filterSessions(allSessions, period, type),
    [allSessions, period, type],
  );
  const previous = useMemo(
    () => previousPeriod(allSessions, period, type),
    [allSessions, period, type],
  );

  const totals = useMemo(() => sumMetrics(filtered), [filtered]);
  const prevTotals = useMemo(() => sumMetrics(previous), [previous]);

  const kpis: Kpi[] = [
    {
      id: "athletes", icon: Users, label: "Atletas ativos",
      value: athletes.length, trend: trendPct(athletes.length, Math.max(1, athletes.length - 2)),
    },
    {
      id: "sessions", icon: Activity, label: "Sessões no período",
      value: filtered.length, trend: trendPct(filtered.length, previous.length), tone: "info",
    },
    {
      id: "distance", icon: TrendingUp, label: "Distância total",
      value: totals.distance, decimals: 1, suffix: " km",
      trend: trendPct(totals.distance, prevTotals.distance),
    },
    {
      id: "sprints", icon: Zap, label: "Sprints",
      value: totals.sprints, trend: trendPct(totals.sprints, prevTotals.sprints), tone: "warning",
    },
    {
      id: "topspeed", icon: Gauge, label: "Vel. máxima",
      value: totals.topSpeed, decimals: 1, suffix: " km/h",
      trend: trendPct(totals.topSpeed, prevTotals.topSpeed), tone: "danger",
    },
  ];

  const loadData = useMemo(
    () => buildLoadByDay(filtered, Math.min(periodDays(period), 14)),
    [filtered, period],
  );

  const posData: PositionDatum[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of athletes) counts[a.position] = (counts[a.position] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, fill: colorForIndex(i) }));
  }, [athletes]);

  const intensity = useMemo(
    () => buildIntensity(filtered, periodDays(period)),
    [filtered, period],
  );

  const ranking = useMemo(
    () => rankAthletes(athletes, filtered, "distance_km", 5),
    [athletes, filtered],
  );

  const recent = useMemo(
    () => [...filtered].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8),
    [filtered],
  );

  const heatmapSessions = useMemo(
    () => recent.filter((s) => s.status === "processed").slice(0, 8),
    [recent],
  );

  const focusedAthleteId = selectedAthleteId ?? ranking[0]?.athlete.id ?? null;
  const radarData = useMemo(
    () => radarFor(focusedAthleteId, athletes, filtered),
    [focusedAthleteId, athletes, filtered],
  );
  const focusedAthlete = athletes.find((a) => a.id === focusedAthleteId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${club?.short_name ?? "TODOS"}${team ? ` · ${team.name}` : ""}`}
        title={`Bom treino, ${user?.name.split(" ")[0] ?? "treinador"}.`}
        description="Analytics em tempo (quase) real do escopo selecionado."
        actions={
          <Link
            to="/sessions"
            className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <Zap className="h-4 w-4" /> Nova análise
          </Link>
        }
      />

      <DashboardFilters period={period} type={type} onPeriod={setPeriod} onType={setType} />

      <KpiGrid items={kpis} loading={loading} />

      <div className="grid lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <PanelSkeleton className="lg:col-span-2" />
            <PanelSkeleton />
          </>
        ) : (
          <>
            <Panel
              className="lg:col-span-2"
              title="Carga semanal"
              subtitle={`Distância (km) por dia · média ${period === "7d" ? "7d" : period === "30d" ? "14d" : "14d"}`}
              delay={0.05}
            >
              <WeeklyLoadChart data={loadData} />
            </Panel>
            <Panel title="Distribuição por posição" subtitle={`${athletes.length} atletas`} delay={0.1}>
              {posData.length ? (
                <PositionDistributionChart data={posData} />
              ) : (
                <EmptyMini label="Sem atletas" />
              )}
            </Panel>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <PanelSkeleton />
            <PanelSkeleton className="lg:col-span-2" />
          </>
        ) : (
          <>
            <Panel title="Top 5 atletas" subtitle="Por distância no período" delay={0.05}>
              <AthleteRankingCard rows={ranking} />
            </Panel>
            <Panel
              className="lg:col-span-2"
              title="Intensidade de treinos"
              subtitle="Distribuição por carga (baixa / média / alta)"
              delay={0.1}
            >
              {intensity.length ? <IntensityChart data={intensity} /> : <EmptyMini label="Sem sessões" />}
            </Panel>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {loading ? (
          <>
            <PanelSkeleton className="lg:col-span-3" />
            <PanelSkeleton className="lg:col-span-2" />
          </>
        ) : (
          <>
            <Panel
              className="lg:col-span-3"
              title="Heatmaps recentes"
              subtitle="Análises processadas no escopo atual"
              delay={0.05}
              action={
                <Link to="/heatmaps" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                  Ver todos <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            >
              <RecentHeatmapsCarousel sessions={heatmapSessions} athletes={athletes} />
            </Panel>
            <Panel
              className="lg:col-span-2"
              title="Comparativo físico"
              subtitle={focusedAthlete ? `${focusedAthlete.name} vs média do time` : "Selecione um atleta no ranking"}
              delay={0.1}
              action={
                ranking.length > 1 && (
                  <select
                    value={focusedAthleteId ?? ""}
                    onChange={(e) => setSelectedAthleteId(e.target.value || null)}
                    className="text-xs bg-surface/60 border border-border/40 rounded-md px-2 py-1 focus:outline-none focus:border-primary/50"
                  >
                    {ranking.map((r) => (
                      <option key={r.athlete.id} value={r.athlete.id}>
                        {r.athlete.name}
                      </option>
                    ))}
                  </select>
                )
              }
            >
              {focusedAthlete ? <AthleteComparisonRadar data={radarData} /> : <EmptyMini label="Sem dados" />}
            </Panel>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <PanelSkeleton height={320} />
        ) : (
          <Panel
            title="Últimas sessões"
            subtitle={`${recent.length} no período`}
            delay={0.05}
            action={
              <Link to="/sessions" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                Ver todas <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            <RecentSessionsTable sessions={recent} athletes={athletes} />
          </Panel>
        )}
      </div>

      <FooterStats clubs={clubs.data?.length ?? 0} teams={teams.data?.length ?? 0} avgDuration={totals.avgDuration} />
    </div>
  );
}

function sumMetrics(sessions: Array<{ metrics?: { distance_km: number; sprints: number; top_speed_kmh: number; high_intensity_min: number; }; duration_min: number; }>) {
  let distance = 0, sprints = 0, topSpeed = 0, hi = 0, dur = 0;
  for (const s of sessions) {
    distance += s.metrics?.distance_km ?? 0;
    sprints += s.metrics?.sprints ?? 0;
    topSpeed = Math.max(topSpeed, s.metrics?.top_speed_kmh ?? 0);
    hi += s.metrics?.high_intensity_min ?? 0;
    dur += s.duration_min ?? 0;
  }
  return {
    distance,
    sprints,
    topSpeed,
    highIntensity: hi,
    avgDuration: sessions.length ? Math.round(dur / sessions.length) : 0,
  };
}

function EmptyMini({ label }: { label: string }) {
  return (
    <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">{label}</div>
  );
}

function FooterStats({ clubs, teams, avgDuration }: { clubs: number; teams: number; avgDuration: number }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" /> Duração média {avgDuration} min
        </span>
        <span>·</span>
        <span>{clubs} clubes · {teams} times no escopo</span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em]">PDA Sport · Player Data Analytics</span>
    </div>
  );
}
