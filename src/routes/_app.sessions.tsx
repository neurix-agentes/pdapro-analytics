import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, FileUp, CheckCircle2, Loader2, Zap, MapPinned, User, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/sessions")({
  head: () => ({ meta: [{ title: "Sessões · PDA Sport" }] }),
  component: SessionsPage,
});

const STEPS = ["Enviando arquivo", "Processando GPS", "Filtrando coordenadas", "Gerando heatmap", "Calculando métricas", "Finalizando"];

function SessionsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(-1);
  const processing = step >= 0 && step < STEPS.length;
  const done = step >= STEPS.length;

  function start() {
    if (!file) return toast.error("Selecione um arquivo GPX/TCX/FIT.");
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= STEPS.length) {
          clearInterval(id);
          toast.success("Análise concluída!");
          return STEPS.length;
        }
        return s + 1;
      });
    }, 850);
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-primary">Nova sessão</div>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">Upload de arquivo GPS</h1>
        <p className="text-sm text-muted-foreground mt-1">Envie o arquivo do GPS para gerar o heatmap e o painel físico completo.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Drop zone */}
        <motion.label
          htmlFor="gps-file"
          whileHover={{ scale: 1.005 }}
          className="lg:col-span-2 cursor-pointer relative glass rounded-3xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition flex flex-col items-center justify-center p-12 min-h-[420px] text-center"
        >
          <div className={`h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ${file ? "" : "animate-pulse-glow"}`}>
            {file ? <CheckCircle2 className="h-10 w-10" /> : <Upload className="h-10 w-10" />}
          </div>
          <h3 className="mt-6 text-xl font-semibold">
            {file ? "Arquivo pronto para análise" : "Arraste seu arquivo GPS aqui"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {file ? file.name : "Suporte para .gpx · .tcx · .fit · até 25 MB"}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-2 text-xs">
            <FileUp className="h-3.5 w-3.5" /> Selecionar arquivo
          </div>
          <input
            id="gps-file"
            type="file"
            accept=".gpx,.tcx,.fit"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </motion.label>

        {/* Form */}
        <div className="glass rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-semibold">Detalhes da sessão</h3>
          <Select icon={<User className="h-4 w-4" />} label="Atleta" options={["Lucas Vieira", "Pedro Almeida", "Rafael Souza"]} />
          <Select icon={<Zap className="h-4 w-4" />} label="Posição" options={["Goleiro", "Lateral", "Zagueiro", "Volante", "Meia", "Atacante"]} />
          <Select icon={<MapPinned className="h-4 w-4" />} label="Campo" options={["Campo Principal", "Campo B", "CT Categorias"]} />
          <Select icon={<CalendarDays className="h-4 w-4" />} label="Tipo de sessão" options={["Treino tático", "Treino físico", "Jogo amistoso", "Partida oficial"]} />

          <button
            onClick={start}
            disabled={processing}
            className="w-full mt-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition glow-primary disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando…</> : <><Zap className="h-4 w-4" /> Gerar análise</>}
          </button>
        </div>
      </div>

      {/* Processing pipeline */}
      {(processing || done) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">Pipeline de processamento</h3>
            <span className="text-xs text-muted-foreground">{done ? "Concluído" : `Etapa ${step + 1}/${STEPS.length}`}</span>
          </div>
          <div className="space-y-2.5">
            {STEPS.map((s, i) => {
              const stt = i < step ? "done" : i === step && !done ? "active" : done ? "done" : "pending";
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    stt === "done" ? "bg-primary text-primary-foreground" :
                    stt === "active" ? "bg-primary/20 text-primary" :
                    "bg-surface text-muted-foreground"
                  }`}>
                    {stt === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                     stt === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                     i + 1}
                  </div>
                  <span className={`text-sm ${stt === "pending" ? "text-muted-foreground" : "text-foreground"}`}>{s}</span>
                  {stt === "active" && (
                    <div className="flex-1 h-1 rounded-full bg-surface overflow-hidden ml-2">
                      <div className="h-full w-1/2 bg-primary animate-pulse glow-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Select({ icon, label, options }: { icon: React.ReactNode; label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>
        <select className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary/60 transition appearance-none">
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
    </label>
  );
}
