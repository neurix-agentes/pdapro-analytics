import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { Athlete } from "@/types";

export interface RankRow {
  athlete: Athlete;
  metric: number;
  trend: number[];
}

export function AthleteRankingCard({ rows, unit = "km" }: { rows: RankRow[]; unit?: string }) {
  if (!rows.length) {
    return <div className="text-xs text-muted-foreground text-center py-10">Sem dados no escopo atual.</div>;
  }
  const max = Math.max(...rows.map((r) => r.metric));
  return (
    <ol className="space-y-2.5">
      {rows.map((r, i) => (
        <motion.li
          key={r.athlete.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className="flex items-center gap-3 group"
        >
          <span
            className={`w-6 h-6 shrink-0 rounded-md text-[10px] font-bold flex items-center justify-center ${
              i === 0 ? "bg-primary/20 text-primary" : "bg-surface/60 text-muted-foreground"
            }`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium">{r.athlete.name}</div>
              <div className="text-xs font-semibold tabular-nums text-primary">
                {r.metric.toFixed(1)} <span className="text-[10px] text-muted-foreground font-normal">{unit}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-[10px] text-muted-foreground">{r.athlete.position} · #{r.athlete.jersey_number}</div>
              <div className="flex-1 h-1 rounded-full bg-surface/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                  style={{ width: `${(r.metric / max) * 100}%` }}
                />
              </div>
              <div className="w-14 h-6 -my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r.trend.map((v, k) => ({ v, k }))}>
                    <defs>
                      <linearGradient id={`spark-${r.athlete.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.86 0.27 152)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="oklch(0.86 0.27 152)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="oklch(0.86 0.27 152)" strokeWidth={1.5} fill={`url(#spark-${r.athlete.id})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
