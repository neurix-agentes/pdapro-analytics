import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  delay?: number;
  children: ReactNode;
}

export function Panel({ title, subtitle, action, className = "", delay = 0, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass rounded-2xl p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export function PanelSkeleton({ className = "", height = 240 }: { className?: string; height?: number }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="h-4 w-1/3 rounded bg-primary/10 animate-pulse mb-2" />
      <div className="h-3 w-1/4 rounded bg-primary/5 animate-pulse mb-5" />
      <div className="rounded-xl bg-primary/5 animate-pulse" style={{ height }} />
    </div>
  );
}
