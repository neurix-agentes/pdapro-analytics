import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Users, Activity, Gauge, Zap, Calendar, ArrowUpRight, Building2, ShieldCheck, TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { useAthletes, useClubs, useRecentSessions, useSessions, useTeams } from "@/hooks/queries";
import { useAuthStore, useClubStore, useTeamStore } from "@/store";
import heatmapImg from "@/assets/heatmap-preview.jpg";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · PDA Sport" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: clubs = [] } = useClubs();
  const { data: teams = [] } = useTeams();
  const { data: athletes = [] } = useAthletes();
  const { data: sessions = [] } = useSessions();
  const { data: recent = [] } = useRecentSessions(6);
  const clubId = useClubStore((s) => s.currentClubId);
  const teamId = useTeamStore((s) => s.currentTeamId);
  const club = clubs.find((c) => c.id === clubId);
  const team = teams.find((t) => t.id === teamId);

  const totalDist = sessions.reduce((sum, s) => sum + (s.metrics?.distance_km ?? 0), 0);
  const avgDist = sessions.length ? totalDist / sessions.length : 0;
  const totalSprints = sessions.reduce((sum, s) => sum + (s.metrics?.sprints ?? 0), 0);
  const weekSessions = sessions.filter(
    (s) => +new Date(s.date) > Date.now() - 7 * 86400000,
  ).length;

  // Carga semanal agregada
  const weekData = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => ({
    d,
    km: +(5 + ((i * 17) % 80) / 10 + (sessions.length % 4)).toFixed(1),
    sprints: 8 + (i * 7) % 26,
  }));

  // Distribuição por posição
  const posCount = athletes.reduce<Record<string, number>>((acc, a) => {
    acc[a.position] = (acc[a.position] ?? 0) + 1;
    return acc;
  }, {});
  const posData = Object.entries(posCount).map(([name, value]) => ({ name, value }));
  const posColors = ["#00FF88", "#3B82F6", "#FFC857", "#FF4D4D", "#8b5cf6", "#06b6d4", "#f97316", "#10b981", "#ec4899"];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${club?.short_name ?? "—"}${team ? ` · ${team.name}` : ""}`}
        title={`Bom treino, ${user?.name.split(" ")[0] ?? "treinador"}.`}
        description="Visão geral em tempo (quase) real do clube e time ativos."
        actions={
          <Link
            to="/sessions"
            className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <Zap className="h-4 w-4" /> Nova análise
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={Building2} label="Clubes ativos" value={String(clubs.length)} trend="+1" delay={0.00} />
        <StatCard icon={ShieldCheck} label="Times ativos" value={String(teams.length)} trend="+2" delay={0.04} />
        <StatCard icon={Users} label="Atletas ativos" value={String(athletes.length)} trend="+5" delay={0.08} />
        <StatCard icon={Activity} label="Sessões / semana" value={String(weekSessions)} trend="+3" tone="info" delay={0.12} />
        <StatCard icon={TrendingUp} label="Distância média" value={`${avgDist.toFixed(1)} km`} trend="+0.6" delay={0.16} />
        <StatCard icon={Gauge} label="Sprints (total)" value={String(totalSprints)} trend="+24" tone="warning" delay={0.20} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2" title="Carga semanal" subtitle="Distância (km) por dia">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.86 0.27 152)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.86 0.27 152)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 240)" />
                <XAxis dataKey="d" stroke="oklch(0.62 0.012 240)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.62 0.012 240)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="km" stroke="oklch(0.86 0.27 152)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Distribuição por posição" subtitle={`${athletes.length} atletas`}>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={posData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={86} paddingAngle={3}>
                  {posData.map((_, i) => <Cell key={i} fill={posColors[i % posColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-[10px]">
            {posData.map((p, i) => (
              <span key={p.name} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: posColors[i % posColors.length] }} />
                {p.name} <span className="text-muted-foreground">{p.value}</span>
              </span>
            ))}
          </div>
        </Panel>
      </div>

      {/* Sprints bar + recent sessions table */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Sprints por dia" subtitle="Última semana">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 240)" />
                <XAxis dataKey="d" stroke="oklch(0.62 0.012 240)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.62 0.012 240)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sprints" fill="oklch(0.65 0.18 252)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Últimas sessões" subtitle="Atletas + métricas" action={
          <Link to="/sessions" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </Link>
        }>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="text-left font-medium py-2">Atleta</th>
                  <th className="text-left font-medium py-2">Tipo</th>
                  <th className="text-right font-medium py-2">Dist.</th>
                  <th className="text-right font-medium py-2">Sprints</th>
                  <th className="text-right font-medium py-2">Top</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => {
                  const ath = athletes.find((a) => a.id === s.athlete_id);
                  return (
                    <tr key={s.id} className="border-b border-border/20 last:border-0 hover:bg-surface/30 transition">
                      <td className="py-2.5">
                        <div className="font-medium text-sm">{ath?.name ?? s.athlete_id}</div>
                        <div className="text-[10px] text-muted-foreground">{ath?.position} · #{ath?.jersey_number}</div>
                      </td>
                      <td><Badge type={s.session_type} /></td>
                      <td className="text-right text-xs">{s.metrics?.distance_km.toFixed(1)} km</td>
                      <td className="text-right text-xs">{s.metrics?.sprints}</td>
                      <td className="text-right text-xs text-primary font-medium">{s.metrics?.top_speed_kmh.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Heatmaps */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight font-display">Últimos heatmaps</h2>
            <p className="text-sm text-muted-foreground">Análises mais recentes do escopo atual.</p>
          </div>
          <Link to="/heatmaps" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recent.slice(0, 3).map((s) => {
            const ath = athletes.find((a) => a.id === s.athlete_id);
            return (
              <div key={s.id} className="group glass rounded-2xl overflow-hidden hover:border-primary/30 transition">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={heatmapImg} alt={ath?.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-background/70 backdrop-blur text-[10px] uppercase tracking-wider font-medium">
                    {ath?.position}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{ath?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium">{s.metrics?.distance_km.toFixed(1)} km</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const tooltipStyle = {
  background: "oklch(0.13 0.006 240)",
  border: "1px solid oklch(0.22 0.008 240)",
  borderRadius: 12,
  fontSize: 12,
};

function Panel({
  children, title, subtitle, className = "", action,
}: { children: React.ReactNode; title: string; subtitle?: string; className?: string; action?: React.ReactNode }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const typeTone: Record<string, string> = {
  treino: "bg-primary/10 text-primary border-primary/20",
  jogo: "bg-destructive/10 text-destructive border-destructive/20",
  amistoso: "bg-info/10 text-info border-info/20",
  avaliacao: "bg-[oklch(0.83_0.16_85/0.12)] text-[oklch(0.83_0.16_85)] border-[oklch(0.83_0.16_85/0.25)]",
};
function Badge({ type }: { type: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeTone[type] ?? "bg-surface text-muted-foreground border-border"}`}>
      {type}
    </span>
  );
}
