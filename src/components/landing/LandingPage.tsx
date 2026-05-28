import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity, BarChart3, Download, Gauge, MapPin, PlayCircle,
  Radio, ShieldCheck, Sparkles, TrendingUp, Trophy, Zap,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import heroImg from "@/assets/hero-dashboard.jpg";
import heatmapImg from "@/assets/heatmap-preview.jpg";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <Showcase />
      <Benefits />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Recursos</a>
            <a href="#showcase" className="hover:text-foreground transition">Plataforma</a>
            <a href="#benefits" className="hover:text-foreground transition">Para quem</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition">
              Entrar
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition glow-primary">
              Acessar plataforma
              <Zap className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-24 px-6">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Player Data Analytics · v1.0
          </div>

          <h1 className="mt-7 text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            O sistema operacional do{" "}
            <span className="text-primary text-glow">desempenho atlético</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tracking GPS, heatmaps automáticos e analytics físicos de nível profissional.
            Transforme cada sessão em decisão de treino.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 glow-primary"
            >
              Testar grátis <Zap className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/40 px-6 py-3.5 text-sm font-semibold backdrop-blur hover:bg-surface transition"
            >
              <PlayCircle className="h-4 w-4" /> Ver demonstração
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16"
        >
          <div className="absolute -inset-x-20 -inset-y-10 bg-gradient-to-b from-primary/20 to-transparent blur-3xl opacity-50 -z-10" />
          <div className="glass rounded-3xl p-2 glow-primary">
            <img
              src={heroImg}
              alt="Dashboard PDA Sport"
              width={1600}
              height={1024}
              className="rounded-2xl w-full"
            />
          </div>

          {/* Floating metric chips */}
          <FloatingChip className="left-4 md:-left-8 top-12" icon={<Gauge className="h-4 w-4" />} label="Vel. máx" value="32.4 km/h" />
          <FloatingChip className="right-4 md:-right-6 top-32" icon={<TrendingUp className="h-4 w-4" />} label="Distância" value="10.8 km" delay={0.4} />
          <FloatingChip className="left-8 bottom-10" icon={<Activity className="h-4 w-4" />} label="Sprints" value="27" delay={0.7} />
        </motion.div>
      </div>
    </section>
  );
}

function FloatingChip({
  className = "", icon, label, value, delay = 0.2,
}: { className?: string; icon: React.ReactNode; label: string; value: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 + delay }}
      className={`hidden md:flex absolute ${className} glass rounded-xl px-4 py-3 items-center gap-3 shadow-xl`}
    >
      <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">{icon}</div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
    </motion.div>
  );
}

function Marquee() {
  const items = ["Hudl-grade analytics", "GPS · GPX · TCX · FIT", "Heatmaps científicos", "Relatórios PDF", "Multi-tenant ready", "Análise comparativa"];
  return (
    <section className="border-y border-border/50 bg-surface/30 py-5 overflow-hidden">
      <div className="flex gap-12 whitespace-nowrap animate-[scroll_30s_linear_infinite] text-sm text-muted-foreground">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll{to{transform:translateX(-33.333%)}}`}</style>
    </section>
  );
}

const FEATURES = [
  { icon: MapPin, title: "Tracking GPS", desc: "Importe arquivos GPX, TCX e FIT com filtragem automática de ruído e normalização de coordenadas." },
  { icon: Activity, title: "Heatmaps automáticos", desc: "Visualizações geradas por algoritmos científicos no backend Python. Zonas dominantes em segundos." },
  { icon: BarChart3, title: "Analytics físico", desc: "Distância, velocidade máxima, sprints, aceleração e intensidade calculados por sessão." },
  { icon: Download, title: "Relatórios premium", desc: "Exporte PDFs, PNGs e CSVs individuais, semanais ou mensais com identidade visual do clube." },
  { icon: Radio, title: "Comparação de desempenho", desc: "Compare sessões lado a lado: heatmaps, intensidade, zonas e métricas sincronizadas." },
  { icon: ShieldCheck, title: "Multi-tenant ready", desc: "Arquitetura preparada para clubes, categorias de base e operação SaaS por assinatura." },
];

function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fade} className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recursos</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
            Tudo que um departamento <br className="hidden md:block" />de análise precisa.
          </h2>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fade}
              transition={{ ...fade.transition, delay: i * 0.06 }}
              className="group relative glass rounded-2xl p-6 hover:border-primary/30 transition-all hover:-translate-y-1"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/20 transition">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section id="showcase" className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-[var(--gradient-radial)] opacity-60" />
      <div className="mx-auto max-w-7xl relative">
        <motion.div {...fade} className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Plataforma</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Heatmaps científicos. Decisões claras.</h2>
          <p className="mt-4 text-muted-foreground">
            O backend faz o trabalho científico. Você vê só o que importa: zonas, intensidades e performance.
          </p>
        </motion.div>

        <motion.div {...fade} className="mt-14 grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass rounded-2xl overflow-hidden glow-primary">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Sessão · Lateral Direito · 90 min
              </div>
              <span className="text-xs text-muted-foreground">Intensidade alta</span>
            </div>
            <img src={heatmapImg} alt="Heatmap" loading="lazy" width={1024} height={768} className="w-full" />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {[
              { k: "Distância total", v: "10.8 km", c: "text-primary" },
              { k: "Velocidade máxima", v: "32.4 km/h", c: "text-[oklch(0.83_0.16_85)]" },
              { k: "Sprints (>24 km/h)", v: "27", c: "text-info" },
              { k: "Zona dominante", v: "Meio-campo direito", c: "text-foreground" },
            ].map((m) => (
              <div key={m.k} className="glass rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.k}</div>
                  <div className={`mt-1 text-2xl font-bold ${m.c}`}>{m.v}</div>
                </div>
                <Trophy className="h-5 w-5 text-muted-foreground/40" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Benefits() {
  const groups = [
    { title: "Para treinadores", items: ["Decisões baseadas em dados reais", "Sessões registradas em segundos", "Histórico físico individual"] },
    { title: "Para clubes", items: ["Visão por categoria e equipe", "Padronização de análise", "Relatórios exportáveis"] },
    { title: "Categorias de base", items: ["Evolução semanal por atleta", "Monitoramento de carga", "Comparações entre talentos"] },
  ];
  return (
    <section id="benefits" className="py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fade} className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Para quem</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Do amador ao profissional.</h2>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {groups.map((g, i) => (
            <motion.div
              key={g.title}
              {...fade}
              transition={{ ...fade.transition, delay: i * 0.08 }}
              className="glass rounded-2xl p-7"
            >
              <h3 className="text-xl font-semibold">{g.title}</h3>
              <ul className="mt-5 space-y-3">
                {g.items.map((it) => (
                  <li key={it} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fade} className="relative glass rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-info/10" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[80%] bg-primary/30 blur-3xl rounded-full" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Comece a treinar <span className="text-primary text-glow">com dados</span>.
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
              Crie sua conta gratuita, envie um arquivo GPS e receba a análise completa em minutos.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/dashboard" className="rounded-xl bg-primary text-primary-foreground px-7 py-3.5 text-sm font-semibold glow-primary hover:opacity-90 transition">
                Acessar plataforma
              </Link>
              <Link to="/auth" className="rounded-xl border border-border bg-surface/40 px-7 py-3.5 text-sm font-semibold hover:bg-surface transition">
                Já tenho conta
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 px-6 py-12">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo />
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PDA Sport · Player Data Analytics
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacidade</a>
          <a href="#" className="hover:text-foreground">Termos</a>
          <a href="#" className="hover:text-foreground">Contato</a>
        </div>
      </div>
    </footer>
  );
}
