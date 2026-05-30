import { motion } from "framer-motion";
import { Calendar, Filter, Download } from "lucide-react";
import { toast } from "sonner";

export type PeriodKey = "7d" | "30d" | "season";
export type TypeFilter = "all" | "treino" | "jogo" | "amistoso" | "avaliacao";

interface Props {
  period: PeriodKey;
  type: TypeFilter;
  onPeriod: (p: PeriodKey) => void;
  onType: (t: TypeFilter) => void;
}

const periods: { id: PeriodKey; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "season", label: "Temporada" },
];

const types: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "treino", label: "Treino" },
  { id: "jogo", label: "Jogo" },
  { id: "amistoso", label: "Amistoso" },
  { id: "avaliacao", label: "Avaliação" },
];

export function DashboardFilters({ period, type, onPeriod, onType }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass rounded-2xl p-3 flex flex-wrap items-center gap-2 justify-between"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2">
          <Calendar className="h-3.5 w-3.5" />
          Período
        </div>
        <SegGroup>
          {periods.map((p) => (
            <SegButton key={p.id} active={period === p.id} onClick={() => onPeriod(p.id)}>
              {p.label}
            </SegButton>
          ))}
        </SegGroup>

        <span className="mx-1 h-5 w-px bg-border/60" />

        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2">
          <Filter className="h-3.5 w-3.5" />
          Tipo
        </div>
        <SegGroup>
          {types.map((t) => (
            <SegButton key={t.id} active={type === t.id} onClick={() => onType(t.id)}>
              {t.label}
            </SegButton>
          ))}
        </SegGroup>
      </div>

      <button
        onClick={() => toast.info("Exportação será habilitada na próxima fase")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 hover:border-primary/40 hover:text-primary transition px-3 py-1.5 text-xs font-medium"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar
      </button>
    </motion.div>
  );
}

function SegGroup({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex items-center rounded-lg bg-surface/40 p-0.5">{children}</div>;
}
function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
        active
          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
