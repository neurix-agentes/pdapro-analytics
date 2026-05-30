import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { Activity, Gauge, TrendingUp, Users, Zap, Timer } from "lucide-react";
import { CountUp } from "./CountUp";

export interface Kpi {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  trend?: number; // % vs período anterior
  tone?: "primary" | "info" | "warning" | "danger";
}

const tones: Record<string, string> = {
  primary: "from-primary/25 to-primary/0 text-primary",
  info: "from-info/25 to-info/0 text-info",
  warning: "from-[oklch(0.83_0.16_85)]/25 to-transparent text-[oklch(0.83_0.16_85)]",
  danger: "from-destructive/25 to-destructive/0 text-destructive",
};

export function KpiGrid({ items, loading }: { items: Kpi[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((k, i) => (
        <motion.div
          key={k.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05 }}
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-4 relative overflow-hidden group hover:border-primary/30 transition"
        >
          <div className={`absolute inset-x-0 -top-12 h-24 bg-gradient-to-b ${tones[k.tone ?? "primary"]} opacity-40 blur-2xl pointer-events-none`} />
          <div className="relative flex items-start justify-between">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center bg-surface/70 ${tones[k.tone ?? "primary"].split(" ").slice(-1)}`}>
              <k.icon className="h-4 w-4" />
            </div>
            {typeof k.trend === "number" && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${k.trend >= 0 ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"}`}>
                {k.trend >= 0 ? "+" : ""}{k.trend.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="mt-3 text-2xl font-bold font-display tracking-tight">
            <CountUp value={k.value} decimals={k.decimals ?? 0} suffix={k.suffix ?? ""} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export const KpiIcons = { Activity, Gauge, TrendingUp, Users, Zap, Timer };
