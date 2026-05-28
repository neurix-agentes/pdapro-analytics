import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · PDA Sport" },
      { name: "description", content: "Acesse sua conta PDA Sport." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/dashboard" });
    }, 700);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-primary/15 blur-3xl rounded-full -z-10" />

      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 md:p-10 glow-primary">
          <div className="flex justify-center"><Logo size="lg" /></div>
          <p className="mt-4 text-center text-sm text-muted-foreground">Performance começa no acesso.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field icon={<Mail className="h-4 w-4" />} label="E-mail" type="email" placeholder="treinador@clube.com" />
            <Field icon={<Lock className="h-4 w-4" />} label="Senha" type="password" placeholder="••••••••" />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-border bg-surface accent-[color:var(--primary)]" />
                Lembrar acesso
              </label>
              <a href="#" className="text-primary hover:underline">Esqueci minha senha</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition glow-primary disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Novo aqui? <a href="#" className="text-primary hover:underline">Solicite acesso</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon, label, ...rest }: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="mt-1.5 relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          {...rest}
          className="w-full rounded-xl bg-surface/60 border border-border pl-10 pr-3.5 py-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
        />
      </div>
    </label>
  );
}
