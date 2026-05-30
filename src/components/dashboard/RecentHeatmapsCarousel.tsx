import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heatmapImg from "@/assets/heatmap-preview.jpg";
import type { Athlete, Session } from "@/types";

interface Props {
  sessions: Session[];
  athletes: Athlete[];
}

export function RecentHeatmapsCarousel({ sessions, athletes }: Props) {
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, loop: false });
  if (!sessions.length) {
    return <div className="text-xs text-muted-foreground text-center py-10">Sem heatmaps no escopo atual.</div>;
  }
  return (
    <div className="relative">
      <div className="overflow-hidden -mx-1" ref={ref}>
        <div className="flex gap-3 px-1">
          {sessions.map((s, i) => {
            const ath = athletes.find((a) => a.id === s.athlete_id);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="shrink-0 w-44 group cursor-pointer"
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden glass">
                  <img
                    src={heatmapImg}
                    alt={ath?.name ?? "heatmap"}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-[11px] font-semibold truncate">{ath?.name}</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      {ath?.position} · {s.metrics?.distance_km.toFixed(1)} km
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-background/70 backdrop-blur text-[9px] uppercase tracking-wider font-medium">
                    {new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => api?.scrollPrev()}
        className="absolute -left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full glass flex items-center justify-center hover:text-primary transition"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => api?.scrollNext()}
        className="absolute -right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full glass flex items-center justify-center hover:text-primary transition"
        aria-label="Próximo"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
