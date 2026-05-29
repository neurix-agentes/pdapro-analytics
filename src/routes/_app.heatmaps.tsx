import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, Maximize2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useAthletes, useHeatmaps } from "@/hooks/queries";
import heatmapImg from "@/assets/heatmap-preview.jpg";

export const Route = createFileRoute("/_app/heatmaps")({
  head: () => ({ meta: [{ title: "Heatmaps · PDA Sport" }] }),
  component: HeatmapsPage,
});

function HeatmapsPage() {
  const { data: heatmaps = [] } = useHeatmaps();
  const { data: athletes = [] } = useAthletes();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Visualizações"
        title="Heatmaps"
        description="Mapas de calor gerados pelo backend Python (mplsoccer + scipy) a partir dos arquivos GPS."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {heatmaps.map((h, i) => {
          const a = athletes.find((x) => x.id === h.athlete_id);
          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="group glass rounded-2xl overflow-hidden hover:border-primary/30 transition"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={heatmapImg} alt={a?.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-background/70 backdrop-blur text-[10px] uppercase tracking-wider font-medium">
                  {a?.position}
                </div>
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <IconBtn><Maximize2 className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn><Download className="h-3.5 w-3.5" /></IconBtn>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a?.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-medium">{h.metrics?.distance_km.toFixed(1)} km</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-7 w-7 rounded-md bg-background/70 backdrop-blur border border-border hover:text-primary transition grid place-items-center text-muted-foreground">
      {children}
    </button>
  );
}
