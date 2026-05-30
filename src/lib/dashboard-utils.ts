import type { Athlete, Session } from "@/types";
import type { PeriodKey, TypeFilter } from "@/components/dashboard/DashboardFilters";

export function periodDays(p: PeriodKey): number {
  return p === "7d" ? 7 : p === "30d" ? 30 : 180;
}

export function filterSessions(
  sessions: Session[],
  period: PeriodKey,
  type: TypeFilter,
): Session[] {
  const cutoff = Date.now() - periodDays(period) * 86400000;
  return sessions.filter((s) => {
    if (+new Date(s.date) < cutoff) return false;
    if (type !== "all" && s.session_type !== type) return false;
    return true;
  });
}

export function previousPeriod(sessions: Session[], period: PeriodKey, type: TypeFilter): Session[] {
  const days = periodDays(period);
  const start = Date.now() - days * 2 * 86400000;
  const end = Date.now() - days * 86400000;
  return sessions.filter((s) => {
    const t = +new Date(s.date);
    if (t < start || t >= end) return false;
    if (type !== "all" && s.session_type !== type) return false;
    return true;
  });
}

export function trendPct(current: number, prev: number): number {
  if (!prev) return current ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

export function buildLoadByDay(sessions: Session[], days: number) {
  const buckets: { label: string; km: number; count: number }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    buckets.push({
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      km: 0,
      count: 0,
    });
  }
  for (const s of sessions) {
    const t = new Date(s.date);
    t.setHours(0, 0, 0, 0);
    const idx = Math.floor((now.getTime() - t.getTime()) / 86400000);
    const bucket = buckets[days - 1 - idx];
    if (bucket) {
      bucket.km += s.metrics?.distance_km ?? 0;
      bucket.count += 1;
    }
  }
  const avgKm = buckets.reduce((s, b) => s + b.km, 0) / Math.max(1, buckets.length);
  return buckets.map((b) => ({ label: b.label, km: +b.km.toFixed(1), avg: +avgKm.toFixed(1) }));
}

export function buildIntensity(sessions: Session[], days: number) {
  const groups: Record<string, { baixa: number; media: number; alta: number }> = {};
  const labels: string[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  // group by week for 30d/season, by day for 7d
  const grouping = days <= 7 ? "day" : "week";
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = grouping === "day"
      ? d.toLocaleDateString("pt-BR", { weekday: "short" })
      : `S${getWeek(d)}`;
    if (!groups[key]) {
      groups[key] = { baixa: 0, media: 0, alta: 0 };
      labels.push(key);
    }
  }
  for (const s of sessions) {
    const d = new Date(s.date);
    const key = grouping === "day"
      ? d.toLocaleDateString("pt-BR", { weekday: "short" })
      : `S${getWeek(d)}`;
    if (!groups[key]) continue;
    const km = s.metrics?.distance_km ?? 0;
    if (km < 6) groups[key].baixa += 1;
    else if (km < 9) groups[key].media += 1;
    else groups[key].alta += 1;
  }
  return labels.map((label) => ({ label, ...groups[label] }));
}

function getWeek(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
}

export function rankAthletes(
  athletes: Athlete[],
  sessions: Session[],
  metric: "distance_km" | "sprints" | "top_speed_kmh" = "distance_km",
  n = 5,
) {
  const map = new Map<string, { sum: number; trend: number[] }>();
  for (const a of athletes) map.set(a.id, { sum: 0, trend: [0, 0, 0, 0, 0, 0, 0] });
  for (const s of sessions) {
    const entry = map.get(s.athlete_id);
    if (!entry) continue;
    const v = s.metrics?.[metric] ?? 0;
    entry.sum += metric === "top_speed_kmh" ? Math.max(0, v - entry.sum) : v;
    const daysAgo = Math.floor((Date.now() - +new Date(s.date)) / 86400000);
    const slot = Math.min(6, Math.max(0, 6 - Math.floor(daysAgo / 4)));
    entry.trend[slot] += v;
  }
  return athletes
    .map((a) => ({ athlete: a, metric: map.get(a.id)!.sum, trend: map.get(a.id)!.trend }))
    .filter((r) => r.metric > 0)
    .sort((a, b) => b.metric - a.metric)
    .slice(0, n);
}

export function radarFor(athleteId: string | null, athletes: Athlete[], sessions: Session[]) {
  const teamSessions = sessions;
  const own = sessions.filter((s) => s.athlete_id === athleteId);
  const avg = (arr: Session[], key: keyof NonNullable<Session["metrics"]>) =>
    arr.length ? arr.reduce((s, x) => s + (x.metrics?.[key] ?? 0), 0) / arr.length : 0;
  const norm = (v: number, max: number) => Math.min(100, Math.round((v / max) * 100));

  return [
    { axis: "Distância", atleta: norm(avg(own, "distance_km"), 14), media: norm(avg(teamSessions, "distance_km"), 14) },
    { axis: "Sprints", atleta: norm(avg(own, "sprints"), 36), media: norm(avg(teamSessions, "sprints"), 36) },
    { axis: "Vel. máx.", atleta: norm(avg(own, "top_speed_kmh"), 36), media: norm(avg(teamSessions, "top_speed_kmh"), 36) },
    { axis: "Vel. média", atleta: norm(avg(own, "avg_speed_kmh"), 12), media: norm(avg(teamSessions, "avg_speed_kmh"), 12) },
    { axis: "Intens. alta", atleta: norm(avg(own, "high_intensity_min"), 35), media: norm(avg(teamSessions, "high_intensity_min"), 35) },
    { axis: "PSE", atleta: norm(avg(own, "pse"), 10), media: norm(avg(teamSessions, "pse"), 10) },
  ];
  void athletes;
}
