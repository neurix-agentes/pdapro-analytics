import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Users, Activity, Gauge, Zap, TrendingUp, Calendar, Download, FileBarChart, ArrowUpRight } from "lucide-react";
import heatmapImg from "@/assets/heatmap-preview.jpg";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · PDA Sport" }] }),
  component: DashboardPage,
});

const weekData = [
  { d: "Seg", km: 6.2, sprints: 12 },
  { d: "Ter", km: 8.1, sprints: 18 },
  { d: "Qua", km: 5.4, sprints: 10 },
  { d: "Qui", km: 9.6, sprints: 24 },
  { d: "Sex", km: 7.8, sprints: 19 },
  { d: "Sáb", km: 11.2, sprints: 31 },
  { d: "Dom", km: 4.5, sprints: 8 },
];

function DashboardPage() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary">Overview</div>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">Bom treino, Carlos.</h1>
            <p className="text-sm text-muted-foreground mt-1">Resumo da última semana de treinos e análises físicas.</p>
          </div>
          <Link to="/sessions" className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Zap className="h-4 w-4" /> Nova análise
          </Link>
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KPI icon={Users} label="Atletas ativos" value="24" trend="+3" />
        <KPI icon={Activity} label="Sessões" value="142" trend="+12" />
        <KPI icon={TrendingUp} label="Distância média" value="8.4 km" trend="+0.6" />
        <KPI icon={Gauge} label="Vel. máxima" value="33.1 km/h" trend="+1.2" tone="warning" />
        <KPI icon={Zap} label="Sprints" value="487" trend="+24" tone="info" />
        <KPI icon={Calendar} label="Esta semana" value="18" trend="+5" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Carga semanal" subtitle="Distância e sprints por dia" />
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
                <Tooltip contentStyle={{ background: "oklch(0.13 0.006 240)", border: "1px solid oklch(0.22 0.008 240)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="km" stroke="oklch(0.86 0.27 152)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Sprints" subtitle="Por sessão" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 240)" />
                <XAxis dataKey="d" stroke="oklch(0.62 0.012 240)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.62 0.012 240)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.13 0.006 240)", border: "1px solid oklch(0.22 0.008 240)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="sprints" fill="oklch(0.65 0.18 252)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Heatmaps */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Últimos heatmaps</h2>
            <p className="text-sm text-muted-foreground">Análises mais recentes do seu time.</p>
          </div>
          <Link to="/heatmaps" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: "Lucas Vieira", pos: "Lateral Direito", date: "Hoje · 18:30" },
            { name: "Pedro Almeida", pos: "Volante", date: "Ontem · 19:10" },
            { name: "Rafael Souza", pos: "Atacante", date: "26 mai · 17:00" },
          ].map((a) => (
            <div key={a.name} className="group glass rounded-2xl overflow-hidden hover:border-primary/30 transition">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={heatmapImg} alt={a.name} loading="lazy" width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-background/70 backdrop-blur text-[10px] uppercase tracking-wider font-medium">
                  {a.pos}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.date}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <IconBtn><Download className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn><FileBarChart className="h-3.5 w-3.5" /></IconBtn>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KPI({
  icon: Icon, label, value, trend, tone = "primary",
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; trend: string; tone?: "primary" | "warning" | "info" }) {
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    warning: "text-[oklch(0.83_0.16_85)] bg-[oklch(0.83_0.16_85/0.1)]",
    info: "text-info bg-info/10",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-semibold text-primary">{trend}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl p-5 ${className}`}>{children}</div>;
}
function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-7 w-7 rounded-md border border-border bg-surface/60 hover:bg-surface hover:text-primary transition flex items-center justify-center text-muted-foreground">
      {children}
    </button>
  );
}
