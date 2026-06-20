import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Users, CalendarDays, Activity } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAthletes, useFields, useClub, useTeams } from "@/hooks/queries";
import { useCreateSession } from "@/hooks/mutations";
import { useClubStore } from "@/store";
import type { SessionType } from "@/types";

const schema = z.object({
  athlete_id: z.string().min(1, "Selecione um atleta"),
  field_id: z.string().min(1, "Selecione um campo"),
  date: z.string().min(1, "Informe a data"),
  session_type: z.enum(["treino", "jogo", "amistoso", "avaliacao"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "treino", label: "Treino" },
  { value: "jogo", label: "Jogo oficial" },
  { value: "amistoso", label: "Amistoso" },
  { value: "avaliacao", label: "Avaliação física" },
];

export function SessionFormDialog({ open, onOpenChange }: Props) {
  const clubId = useClubStore((s) => s.currentClubId);
  const { data: club } = useClub(clubId ?? undefined);
  const { data: athletes = [] } = useAthletes();
  const { data: fields = [] } = useFields();
  const { data: teams = [] } = useTeams();
  const create = useCreateSession();

  const activeAthletes = useMemo(
    () => athletes.filter((a) => a.status === "active"),
    [athletes],
  );

  const [form, setForm] = useState({
    athlete_id: "",
    field_id: "",
    date: nowLocalInput(),
    session_type: "treino" as SessionType,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        athlete_id: "",
        field_id: "",
        date: nowLocalInput(),
        session_type: "treino",
        notes: "",
      });
    }
  }, [open]);

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const selectedAthlete = activeAthletes.find((a) => a.id === form.athlete_id);
  const selectedField = fields.find((f) => f.id === form.field_id);
  const teamOf = (athleteTeamId: string | null | undefined) =>
    teams.find((t) => t.id === athleteTeamId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId) {
      toast.error("Selecione um clube primeiro.");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    const v = parsed.data;
    const ath = activeAthletes.find((a) => a.id === v.athlete_id);
    if (!ath) {
      toast.error("Atleta inválido.");
      return;
    }
    try {
      await create.mutateAsync({
        club_id: clubId,
        athlete_id: v.athlete_id,
        field_id: v.field_id,
        team_id: ath.team_id ?? null,
        session_type: v.session_type,
        date: new Date(v.date).toISOString(),
        notes: v.notes || null,
      });
      toast.success("Sessão criada com status pendente.");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const busy = create.isPending;
  const initials = (selectedAthlete?.name || "?")
    .split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova sessão</DialogTitle>
          <DialogDescription>
            Vincule um atleta e um campo. A sessão será criada com status <span className="text-primary font-medium">pendente</span> — o upload de GPS e o processamento entrarão em fases seguintes.
            {club?.city && <span className="block text-[11px] mt-1 text-muted-foreground/70">Clube: {club.name} · {club.city}</span>}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-5">
          {/* ATLETA */}
          <section className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" /> Atleta
            </div>
            <Select value={form.athlete_id} onValueChange={(v) => set("athlete_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder={activeAthletes.length ? "Selecione um atleta" : "Nenhum atleta ativo neste clube"} />
              </SelectTrigger>
              <SelectContent>
                {activeAthletes.length === 0 && (
                  <SelectItem value="__empty__" disabled>Nenhum atleta ativo</SelectItem>
                )}
                {activeAthletes.map((a) => {
                  const t = teamOf(a.team_id);
                  return (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}{t ? ` · ${t.category}` : ""} · {a.position}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedAthlete && (
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-2.5">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-info/30 grid place-items-center text-sm font-bold shrink-0">
                  {selectedAthlete.photo_url ? (
                    <img src={selectedAthlete.photo_url} alt={selectedAthlete.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{selectedAthlete.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {teamOf(selectedAthlete.team_id)?.name ?? "Sem time"}
                    {teamOf(selectedAthlete.team_id)?.category && ` · ${teamOf(selectedAthlete.team_id)?.category}`}
                    {" · "}{selectedAthlete.position}
                    {selectedAthlete.jersey_number ? ` · #${selectedAthlete.jersey_number}` : ""}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* CAMPO */}
          <section className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Campo
            </div>
            <Select value={form.field_id} onValueChange={(v) => set("field_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder={fields.length ? "Selecione um campo" : "Cadastre um campo antes"} />
              </SelectTrigger>
              <SelectContent>
                {fields.length === 0 && (
                  <SelectItem value="__empty__" disabled>Nenhum campo cadastrado</SelectItem>
                )}
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} · {f.surface} · {f.width_m}×{f.length_m} m
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedField && (
              <div className="rounded-lg border border-border/60 bg-background/40 p-2.5 text-[11px] text-muted-foreground">
                <div className="text-sm font-semibold text-foreground">{selectedField.name}</div>
                Superfície: <span className="capitalize text-foreground">{selectedField.surface}</span>
                {" · "}Dimensões: <span className="text-foreground">{selectedField.width_m} × {selectedField.length_m} m</span>
              </div>
            )}
          </section>

          {/* DETALHES */}
          <section className="rounded-xl border border-border bg-surface/40 p-4 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="date" className="flex items-center gap-1.5 text-xs">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> Data da sessão *
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5 text-primary" /> Tipo da atividade *
              </Label>
              <Select value={form.session_type} onValueChange={(v) => set("session_type", v as SessionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="notes" className="text-xs">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                maxLength={1000}
                placeholder="Notas do treinador, contexto, condições do campo…"
                rows={3}
              />
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy || !clubId}>
              {busy ? "Criando…" : "Criar sessão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
