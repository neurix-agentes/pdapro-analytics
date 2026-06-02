import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/useAuth";
import { useMyClubIds } from "@/hooks/queries";
import { useCreateClub, useCreateTeam } from "@/hooks/mutations";
import { useClubStore } from "@/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Boas-vindas · PDA Sport" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const setCurrentClub = useClubStore((s) => s.setCurrentClub);
  const createClub = useCreateClub();
  const createTeam = useCreateTeam();
  const myClubs = useMyClubIds();

  const [step, setStep] = useState<1 | 2>(1);
  const [clubId, setClubId] = useState<string | null>(null);

  // Club fields
  const [clubName, setClubName] = useState("");
  const [shortName, setShortName] = useState("");
  const [city, setCity] = useState("");
  // Team fields
  const [teamName, setTeamName] = useState("");
  const [category, setCategory] = useState("Profissional");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  async function submitClub(e: FormEvent) {
    e.preventDefault();
    try {
      const club = await createClub.mutateAsync({
        name: clubName,
        short_name: shortName.toUpperCase().slice(0, 4),
        city,
        country: "Brasil",
        primary_color: "#00FF88",
        secondary_color: "#0A2540",
        archived: false,
      });
      setClubId(club.id);
      setCurrentClub(club.id);
      await myClubs.refetch();
      toast.success("Clube criado!");
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar clube.");
    }
  }

  async function submitTeam(e: FormEvent) {
    e.preventDefault();
    if (!clubId) return;
    try {
      await createTeam.mutateAsync({
        club_id: clubId,
        name: teamName,
        category,
        season: "2025/26",
        archived: false,
      });
      toast.success("Time criado! Bem-vindo à PDA Sport.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar time.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-primary/10 blur-3xl rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg"
      >
        <div className="glass rounded-3xl p-8 md:p-10 glow-primary">
          <div className="flex justify-center"><Logo size="lg" /></div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <StepDot active={step >= 1} done={step > 1} icon={<Building2 className="h-3.5 w-3.5" />} label="Clube" />
            <div className="h-px w-10 bg-border" />
            <StepDot active={step >= 2} icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Time" />
          </div>

          {step === 1 ? (
            <form onSubmit={submitClub} className="mt-8 space-y-4">
              <Header
                title="Crie seu primeiro clube"
                subtitle="Você é o owner — convide outros membros depois."
              />
              <Field label="Nome do clube" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Ex.: Grêmio FC" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sigla" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="GRE" maxLength={4} required />
                <Field label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Porto Alegre" required />
              </div>
              <button
                type="submit"
                disabled={createClub.isPending}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition glow-primary disabled:opacity-60"
              >
                {createClub.isPending ? "Criando…" : "Avançar"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitTeam} className="mt-8 space-y-4">
              <Header
                title="Crie o primeiro time"
                subtitle="Você poderá criar mais times e categorias depois."
              />
              <Field label="Nome do time" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Ex.: Profissional" required />
              <Field label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Profissional, Sub-20…" required />
              <button
                type="submit"
                disabled={createTeam.isPending}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition glow-primary disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {createTeam.isPending ? "Concluindo…" : "Entrar na plataforma"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function StepDot({ active, done, icon, label }: { active: boolean; done?: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold transition ${
          done ? "bg-primary text-primary-foreground" : active ? "bg-primary/15 text-primary border border-primary/30" : "bg-surface text-muted-foreground border border-border"
        }`}
      >
        {icon}
      </div>
      <span className={`text-[11px] uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <input
        {...rest}
        className="mt-1.5 w-full rounded-xl bg-surface/60 border border-border px-3.5 py-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
      />
    </label>
  );
}
