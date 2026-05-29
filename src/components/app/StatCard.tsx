import { motion } from "framer-motion";
import type { ComponentType } from "react";

interface Props {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend?: string;
  tone?: "primary" | "warning" | "info" | "danger";
  delay?: number;
}

const tones: Record<string, string> = {
  primary: "text-primary bg-primary/10",
  warning: "text-[oklch(0.83_0.16_85)] bg-[oklch(0.83_0.16_85/0.12)]",
  info: "text-info bg-info/10",
  danger: "text-destructive bg-destructive/10",
};

export function StatCard({ icon: Icon, label, value, trend, tone = "primary", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-4 hover:border-primary/30 transition"
    >
      <div className="flex items-center justify-between">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && <span className="text-[10px] font-semibold text-primary">{trend}</span>}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight font-display">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}
