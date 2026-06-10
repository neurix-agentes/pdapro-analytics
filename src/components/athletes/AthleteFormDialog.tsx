import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeams } from "@/hooks/queries";
import { useCreateAthlete, useUpdateAthlete } from "@/hooks/mutations";
import { uploadAthletePhoto, deleteAthletePhoto } from "@/lib/storage";
import { POSITIONS, DOMINANT_FEET, type Athlete } from "@/types";
import { useClubStore } from "@/store";

const schema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(120),
  nickname: z.string().trim().max(60).optional().or(z.literal("")),
  team_id: z.string().min(1, "Time obrigatório"),
  position: z.string().min(1, "Posição obrigatória"),
  secondary_position: z.string().optional(),
  dominant_foot: z.enum(["Direito", "Esquerdo", "Ambidestro"]).optional(),
  jersey_number: z.coerce.number().int().min(0).max(999).optional().or(z.nan()),
  birth_date: z.string().optional(),
  height_cm: z.coerce.number().min(0).max(260).optional().or(z.nan()),
  weight_kg: z.coerce.number().min(0).max(200).optional().or(z.nan()),
  status: z.enum(["active", "inactive"]).default("active"),
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  athlete?: Athlete | null;
}

const NONE = "__none__";

export function AthleteFormDialog({ open, onOpenChange, athlete }: Props) {
  const clubId = useClubStore((s) => s.currentClubId);
  const { data: teams = [] } = useTeams();
  const teamOptions = teams.filter((t) => !t.archived);
  const create = useCreateAthlete();
  const update = useUpdateAthlete();

  const [form, setForm] = useState({
    name: "", nickname: "", team_id: "", position: "",
    secondary_position: "", dominant_foot: "", jersey_number: "",
    birth_date: "", height_cm: "", weight_kg: "", status: "active",
  });

  useEffect(() => {
    if (athlete) {
      setForm({
        name: athlete.name ?? "",
        nickname: athlete.nickname ?? "",
        team_id: athlete.team_id ?? "",
        position: athlete.position ?? "",
        secondary_position: athlete.secondary_position ?? "",
        dominant_foot: athlete.dominant_foot ?? "",
        jersey_number: athlete.jersey_number ? String(athlete.jersey_number) : "",
        birth_date: athlete.birth_date ?? "",
        height_cm: athlete.height_cm ? String(athlete.height_cm) : "",
        weight_kg: athlete.weight_kg ? String(athlete.weight_kg) : "",
        status: athlete.status ?? "active",
      });
    } else {
      setForm({
        name: "", nickname: "", team_id: teamOptions[0]?.id ?? "", position: "",
        secondary_position: "", dominant_foot: "", jersey_number: "",
        birth_date: "", height_cm: "", weight_kg: "", status: "active",
      });
    }
  }, [athlete, open]); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

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
    const payload = {
      club_id: clubId,
      team_id: v.team_id,
      name: v.name,
      nickname: v.nickname || null,
      position: v.position,
      secondary_position: v.secondary_position && v.secondary_position !== NONE ? v.secondary_position : null,
      dominant_foot: v.dominant_foot ?? null,
      jersey_number: Number.isFinite(v.jersey_number) ? Number(v.jersey_number) : null,
      birth_date: v.birth_date || null,
      height_cm: Number.isFinite(v.height_cm) ? Number(v.height_cm) : null,
      weight_kg: Number.isFinite(v.weight_kg) ? Number(v.weight_kg) : null,
      status: v.status,
    };
    try {
      if (athlete) {
        await update.mutateAsync({ id: athlete.id, patch: payload });
        toast.success("Atleta atualizado.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Atleta cadastrado.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{athlete ? "Editar atleta" : "Novo atleta"}</DialogTitle>
          <DialogDescription>
            Cadastro esportivo. O atleta ainda não é um usuário da plataforma nesta fase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nickname">Apelido</Label>
            <Input id="nickname" value={form.nickname} onChange={(e) => set("nickname", e.target.value)} maxLength={60} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="jersey">Número da camisa</Label>
            <Input id="jersey" type="number" min={0} max={999} value={form.jersey_number} onChange={(e) => set("jersey_number", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Time *</Label>
            <Select value={form.team_id} onValueChange={(v) => set("team_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o time" /></SelectTrigger>
              <SelectContent>
                {teamOptions.length === 0 && <SelectItem value="__empty__" disabled>Nenhum time disponível</SelectItem>}
                {teamOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} · {t.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Posição *</Label>
            <Select value={form.position} onValueChange={(v) => set("position", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione a posição" /></SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Posição secundária</Label>
            <Select value={form.secondary_position || NONE} onValueChange={(v) => set("secondary_position", v === NONE ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Pé dominante</Label>
            <Select value={form.dominant_foot || NONE} onValueChange={(v) => set("dominant_foot", v === NONE ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {DOMINANT_FEET.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="birth">Data de nascimento</Label>
            <Input id="birth" type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="h">Altura (cm)</Label>
            <Input id="h" type="number" min={0} max={260} value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="w">Peso (kg)</Label>
            <Input id="w" type="number" min={0} max={200} step="0.1" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="md:col-span-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando…" : athlete ? "Salvar alterações" : "Cadastrar atleta"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
