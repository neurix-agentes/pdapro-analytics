import { motion } from "framer-motion";
import type { Athlete, Session } from "@/types";

const typeTone: Record<string, string> = {
  treino: "bg-primary/10 text-primary border-primary/20",
  jogo: "bg-destructive/10 text-destructive border-destructive/20",
  amistoso: "bg-info/10 text-info border-info/20",
  avaliacao: "bg-[oklch(0.83_0.16_85/0.12)] text-[oklch(0.83_0.16_85)] border-[oklch(0.83_0.16_85/0.25)]",
};

const statusTone: Record<string, string> = {
  processed: "bg-primary/10 text-primary",
  processing: "bg-info/10 text-info animate-pulse",
  queued: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

function intensityTone(km: number) {
  if (km < 6) return "bg-info/10 text-info";
  if (km < 9) return "bg-[oklch(0.83_0.16_85/0.15)] text-[oklch(0.83_0.16_85)]";
  return "bg-destructive/10 text-destructive";
}

export function RecentSessionsTable({ sessions, athletes }: { sessions: Session[]; athletes: Athlete[] }) {
  if (!sessions.length) {
    return <div className="text-xs text-muted-foreground text-center py-10">Sem sessões no escopo atual.</div>;
  }
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
            <th className="text-left font-medium py-2">Atleta</th>
            <th className="text-left font-medium py-2">Tipo</th>
            <th className="text-left font-medium py-2">Status</th>
            <th className="text-right font-medium py-2">Dist.</th>
            <th className="text-right font-medium py-2">Sprints</th>
            <th className="text-right font-medium py-2">Top</th>
            <th className="text-right font-medium py-2">PSE</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => {
            const ath = athletes.find((a) => a.id === s.athlete_id);
            const km = s.metrics?.distance_km ?? 0;
            return (
              <motion.tr
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="border-b border-border/20 last:border-0 hover:bg-surface/30 transition"
              >
                <td className="py-2.5">
                  <div className="font-medium text-sm">{ath?.name ?? s.athlete_id}</div>
                  <div className="text-[10px] text-muted-foreground">{ath?.position} · #{ath?.jersey_number}</div>
                </td>
                <td>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeTone[s.session_type]}`}>
                    {s.session_type}
                  </span>
                </td>
                <td>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${statusTone[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="text-right">
                  <span className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${intensityTone(km)}`}>
                    {km.toFixed(1)} km
                  </span>
                </td>
                <td className="text-right text-xs tabular-nums">{s.metrics?.sprints}</td>
                <td className="text-right text-xs tabular-nums text-primary font-medium">{s.metrics?.top_speed_kmh.toFixed(1)}</td>
                <td className="text-right text-xs tabular-nums">{s.metrics?.pse ?? "—"}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
