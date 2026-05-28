import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function PageStub({
  icon: Icon, title, eyebrow, description,
}: { icon: LucideIcon; title: string; eyebrow: string; description: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</div>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
      </div>

      <div className="glass rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[70%] bg-primary/15 blur-3xl rounded-full" />
        <div className="relative">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center glow-primary">
            <Icon className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Em construção</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Esta área será conectada ao backend Python e Supabase em breve. A arquitetura visual e de dados já está preparada.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Roadmap PDA Sport v1.0
          </div>
        </div>
      </div>
    </motion.div>
  );
}
