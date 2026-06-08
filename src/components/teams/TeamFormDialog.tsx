import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClubStore, useSeasonStore } from "@/store";
import { useClubs, useClubStaff } from "@/hooks/queries";
import { useCreateTeam, useUpdateTeam } from "@/hooks/mutations";
import { toast } from "sonner";

import type { Team } from "@/types";

const CATEGORIES = ["Sub-09", "Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-20", "Profissional", "Feminino", "Society"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  team?: Team | null;
  defaultClubId?: string;
}

export function TeamFormDialog({ open, onOpenChange, team, defaultClubId }: Props) {
  const createM = useCreateTeam();
  const updateM = useUpdateTeam();

  const currentClub = useClubStore((s) => s.currentClubId);
  const currentSeason = useSeasonStore((s) => s.currentSeason);
  const seasons = useSeasonStore((s) => s.seasons);
  const { data: clubs = [] } = useClubs();
  const { data: staff = [] } = useClubStaff(clubId || null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Sub-17");
  const [customCategory, setCustomCategory] = useState("");
  const [clubId, setClubId] = useState<string>(defaultClubId ?? currentClub ?? "");
  const [coachId, setCoachId] = useState<string>("");
  const [season, setSeason] = useState<string>(currentSeason);
  const isCustom = category === "__custom__";

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "");
      const cat = team?.category ?? "Sub-17";
      if (CATEGORIES.includes(cat as string)) {
        setCategory(cat as string);
        setCustomCategory("");
      } else {
        setCategory("__custom__");
        setCustomCategory(cat as string);
      }
      setClubId(team?.club_id ?? defaultClubId ?? currentClub ?? "");
      setCoachId(team?.coach_id ?? "");
      setSeason(team?.season ?? currentSeason);
    }
  }, [open, team, defaultClubId, currentClub, currentSeason]);

  async function submit() {
    const finalCategory = isCustom ? customCategory.trim() : category;
    if (!name.trim() || !clubId || !finalCategory) {
      toast.error("Preencha nome, categoria e clube.");
      return;
    }
    const payload = {
      name: name.trim(),
      category: finalCategory,
      club_id: clubId,
      coach_id: coachId || undefined,
      season,
    };
    try {
      if (team) {
        await updateM.mutateAsync({ id: team.id, patch: payload });
        toast.success("Time atualizado.");
      } else {
        await createM.mutateAsync({ ...payload, archived: false });
        toast.success("Time criado.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar time.");
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-popover/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">{team ? "Editar time" : "Novo time"}</DialogTitle>
          <DialogDescription>Configure categoria, clube e treinador responsável.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>Nome do time</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sub-17 Principal" />
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="__custom__">Personalizada…</SelectItem>
              </SelectContent>
            </Select>
            {isCustom && (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ex: Master 40+"
                className="mt-2"
              />
            )}
          </div>

          <div>
            <Label>Clube</Label>
            <Select value={clubId} onValueChange={setClubId}>
              <SelectTrigger><SelectValue placeholder="Selecionar clube" /></SelectTrigger>
              <SelectContent>
                {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Treinador</Label>
              <Select value={coachId || "__none__"} onValueChange={(v) => setCoachId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— sem treinador —</SelectItem>
                  {coaches.filter((c) => !clubId || c.club_id === clubId).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Temporada</Label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-primary text-primary-foreground hover:opacity-90 glow-primary">
            {team ? "Salvar alterações" : "Criar time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
