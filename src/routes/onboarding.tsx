import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Building2, ShieldCheck, Sparkles, Mail, ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/useAuth";
import { useMyClubIds } from "@/hooks/queries";
import { useCreateClub, useCreateTeam, useRedeemInvite } from "@/hooks/mutations";
import { useClubStore } from "@/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Boas-vindas · PDA Sport" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    invite: typeof s.invite === "string" ? s.invite : undefined,
  }),
  component: OnboardingPage,
});

type Step = "choose" | "club" | "team" | "invite";

function OnboardingPage() {
  const navigate = useNavigate();
  const { invite } = Route.useSearch();
  const { user, loading } = useSession();
  const setCurrentClub = useClubStore((s) => s.setCurrentClub);
  const createClub = useCreateClub();
  const createTeam = useCreateTeam();
  const redeem = useRedeemInvite();
  const myClubs = useMyClubIds();

  const [step, setStep] = useState<Step>(invite ? "invite" : "choose");
  const [clubId, setClubId] = useState<string | null>(null);

  // Club fields
  const [clubName, setClubName] = useState("");
  const [shortName, setShortName] = useState("");
  const [city, setCity] = useState("");
  // Team fields
  const [teamName, setTeamName] = useState("");
  const [category, setCategory] = useState("Profissional");
  // Invite
  const [code, setCode] = useState(invite ?? "");

  // === DEBUG ===
  const [debug, setDebug] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    const h = (e: Event) => setDebug((e as CustomEvent).detail);
    window.addEventListener("pda:debug", h);
    return () => window.removeEventListener("pda:debug", h);
  }, []);

  // Intercept fetch to capture REAL headers sent to PostgREST /rest/v1/clubs
  useEffect(() => {
    const w = window as unknown as { __pdaFetchPatched?: boolean };
    if (w.__pdaFetchPatched) return;
    w.__pdaFetchPatched = true;
    const orig = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/rest/v1/clubs") && (init?.method ?? "GET").toUpperCase() === "POST") {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        const authH = headers.get("authorization") || headers.get("Authorization");
        const apikeyH = headers.get("apikey");
        let jwtClaims: unknown = null;
        if (authH?.startsWith("Bearer ")) {
          try {
            const parts = authH.slice(7).split(".");
            jwtClaims = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          } catch (e) { jwtClaims = `decode_error: ${String(e)}`; }
        }
        const fetchDiag = {
          step: "fetch.intercept",
          url,
          method: init?.method,
          hasAuthorization: !!authH,
          authPrefix: authH?.slice(0, 24) ?? null,
          authIsAnonKey: authH && apikeyH ? authH.includes(apikeyH) : null,
          apikeyPresent: !!apikeyH,
          apikeyPrefix: apikeyH?.slice(0, 24) ?? null,
          jwtSub: (jwtClaims as { sub?: string } | null)?.sub ?? null,
          jwtRole: (jwtClaims as { role?: string } | null)?.role ?? null,
          jwtExp: (jwtClaims as { exp?: number } | null)?.exp ?? null,
          nowEpoch: Math.floor(Date.now() / 1000),
          body: typeof init?.body === "string" ? init.body : "(non-string body)",
        };
        console.warn("[PDA DEBUG] fetch /rest/v1/clubs", fetchDiag);
        window.dispatchEvent(new CustomEvent("pda:debug", { detail: fetchDiag }));
      }
      return orig(input, init);
    };
  }, []);

  useEffect(() => {
    console.log("[PDA DEBUG] onboarding auth state", {
      loading,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      myClubs: { isLoading: myClubs.isLoading, data: myClubs.data },
    });
  }, [loading, user, myClubs.isLoading, myClubs.data]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: invite ? { invite } : undefined, replace: true });
  }, [loading, user, navigate, invite]);

  async function submitClub(e: FormEvent) {
    e.preventDefault();
    // Pré-checagem da sessão no clique
    const s = await supabase.auth.getSession();
    const u = await supabase.auth.getUser();
    console.log("[PDA DEBUG] click 'Criar clube'", {
      hookUserId: user?.id ?? null,
      sessionUserId: s.data.session?.user?.id ?? null,
      getUserId: u.data.user?.id ?? null,
      getUserErr: u.error?.message ?? null,
    });
    if (!u.data.user) {
      toast.error("Sessão não disponível. Faça login novamente.");
      return;
    }
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
      toast.success("Clube criado! Você é o OWNER.");
      setStep("team");
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
      toast.success("Tudo pronto! Bem-vindo à PDA Sport.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar time.");
    }
  }

  async function submitInvite(e: FormEvent) {
    e.preventDefault();
    try {
      const joinedClubId = await redeem.mutateAsync(code);
      setCurrentClub(joinedClubId);
      toast.success("Você entrou no clube!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Convite inválido.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-primary/10 blur-3xl rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl"
      >
        <DebugPanel user={user} loading={loading} myClubs={myClubs.data} debug={debug} />
        <div className="glass rounded-3xl p-8 md:p-10 glow-primary">
          <div className="flex justify-center"><Logo size="lg" /></div>

          {step === "choose" && (
            <>
              <div className="mt-8 text-center">
                <h1 className="text-2xl font-semibold">Como deseja começar?</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Escolha a opção que melhor descreve sua situação.
                </p>
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <ChoiceCard
                  icon={<Building2 className="h-6 w-6" />}
                  title="Criar um novo clube"
                  description="Sou responsável pela equipe e desejo configurar um clube do zero. Você será o OWNER."
                  cta="Criar clube"
                  onClick={() => setStep("club")}
                  highlight
                />
                <ChoiceCard
                  icon={<Mail className="h-6 w-6" />}
                  title="Entrar em um clube existente"
                  description="Recebi um convite da minha equipe. Tenho um código ou link de convite."
                  cta="Usar convite"
                  onClick={() => setStep("invite")}
                />
              </div>
            </>
          )}

          {step === "club" && (
            <form onSubmit={submitClub} className="mt-8 space-y-4">
              <Stepper current={1} of={2} />
              <Header title="Crie seu primeiro clube" subtitle="Você poderá convidar membros depois." />
              <Field label="Nome do clube" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Ex.: Grêmio FC" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sigla" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="GRE" maxLength={4} required />
                <Field label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Porto Alegre" required />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <BackButton onClick={() => setStep("choose")} />
                <button
                  type="submit"
                  disabled={createClub.isPending}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition glow-primary disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {createClub.isPending ? "Criando…" : (<>Avançar <ArrowRight className="h-4 w-4" /></>)}
                </button>
              </div>
            </form>
          )}

          {step === "team" && (
            <form onSubmit={submitTeam} className="mt-8 space-y-4">
              <Stepper current={2} of={2} />
              <Header title="Crie o primeiro time" subtitle="Você poderá criar mais times e categorias depois." />
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

          {step === "invite" && (
            <form onSubmit={submitInvite} className="mt-8 space-y-4">
              <Header title="Use seu convite" subtitle="Cole o código que você recebeu da equipe." />
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Código do convite</span>
                <div className="mt-1.5 relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    required
                    className="w-full rounded-xl bg-surface/60 border border-border pl-10 pr-3.5 py-3 text-sm tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </label>
              <div className="flex items-center gap-3 pt-2">
                <BackButton onClick={() => setStep("choose")} />
                <button
                  type="submit"
                  disabled={redeem.isPending || !code.trim()}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition glow-primary disabled:opacity-60"
                >
                  {redeem.isPending ? "Validando…" : "Entrar no clube"}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DebugPanel({
  user, loading, myClubs, debug,
}: { user: { id?: string; email?: string | null } | null; loading: boolean; myClubs: string[] | undefined; debug: Record<string, unknown> | null }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] font-mono text-amber-100 space-y-1">
      <div className="font-semibold text-amber-300">[DEBUG] Onboarding · auth + insert</div>
      <div>auth.loading: <b>{String(loading)}</b></div>
      <div>hook user.id: <b>{user?.id ?? "null"}</b></div>
      <div>hook user.email: <b>{user?.email ?? "null"}</b></div>
      <div>myClubs: <b>{myClubs ? JSON.stringify(myClubs) : "loading"}</b></div>
      {debug && (
        <details open className="mt-2">
          <summary className="cursor-pointer text-amber-300">último evento de insert</summary>
          <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px]">{JSON.stringify(debug, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

function ChoiceCard({
  icon, title, description, cta, onClick, highlight,
}: { icon: React.ReactNode; title: string; description: string; cta: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left rounded-2xl p-5 border transition flex flex-col gap-3 ${
        highlight
          ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-surface/60 hover:bg-surface"
      }`}
    >
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${highlight ? "bg-primary/15 text-primary" : "bg-surface text-foreground"}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
      <div className={`mt-auto inline-flex items-center gap-1.5 text-xs font-semibold ${highlight ? "text-primary" : "text-foreground"} group-hover:gap-2.5 transition-all`}>
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
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

function Stepper({ current, of }: { current: number; of: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: of }).map((_, i) => (
        <span
          key={i}
          className={`h-1 rounded-full transition-all ${i < current ? "w-6 bg-primary" : "w-3 bg-border"}`}
        />
      ))}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition"
    >
      Voltar
    </button>
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
