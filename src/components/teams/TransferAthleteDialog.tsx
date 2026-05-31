import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAllTeams } from "@/hooks/queries";
import { useTeamStore } from "@/store";
import { toast } from "sonner";
import type { Athlete, Team } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  athlete: Athlete | null;
  fromTeam: Team | null;
}

export function TransferAthleteDialog({ open, onOpenChange, athlete, fromTeam }: Props) {
  const { data: allTeams = [] } = useAllTeams();
  const transfer = useTeamStore((s) => s.transferAthlete);
  const [toTeamId, setToTeamId] = useState("");
  const [reason, setReason] = useState("");

  const candidates = useMemo(
    () => allTeams.filter((t) => fromTeam && t.club_id === fromTeam.club_id && t.id !== fromTeam.id && !t.archived),
    [allTeams, fromTeam],
  );
  const toTeam = candidates.find((t) => t.id === toTeamId);

  function submit() {
    if (!athlete || !toTeamId) {
      toast.error("Selecione o time de destino.");
      return;
    }
    transfer(athlete.id, toTeamId, reason || undefined);
    toast.success(`${athlete.name} transferido para ${toTeam?.name ?? "novo time"}.`);
    setToTeamId("");
    setReason("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-popover/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Transferir atleta</DialogTitle>
          <DialogDescription>Mover o atleta entre times do mesmo clube.</DialogDescription>
        </DialogHeader>

        {athlete && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-2 rounded-2xl border border-border bg-surface/40 p-4"
          >
            <div className="flex items-center gap-4">
              <PlayerBadge name={athlete.name} num={athlete.jersey_number} />
              <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <TeamPill team={fromTeam} label="Origem" />
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="text-primary"
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
                <TeamPill team={toTeam ?? null} label="Destino" muted={!toTeam} />
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          <div>
            <Label>Time de destino</Label>
            <Select value={toTeamId} onValueChange={setToTeamId}>
              <SelectTrigger><SelectValue placeholder="Selecionar time" /></SelectTrigger>
              <SelectContent>
                {candidates.length === 0 && (
                  <div className="px-3 py-4 text-xs text-muted-foreground">Não há outros times neste clube.</div>
                )}
                {candidates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ex: Promoção de categoria por desempenho."
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-primary text-primary-foreground hover:opacity-90 glow-primary" disabled={!toTeamId}>
            Confirmar transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlayerBadge({ name, num }: { name: string; num: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-info/30 grid place-items-center text-sm font-bold">
        {name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
      </div>
      <div>
        <div className="font-medium text-sm">{name}</div>
        <div className="text-[11px] text-muted-foreground">#{num}</div>
      </div>
    </div>
  );
}

function TeamPill({ team, label, muted }: { team: Team | null; label: string; muted?: boolean }) {
  return (
    <div className={`rounded-xl border border-border bg-surface/60 px-3 py-2 ${muted ? "opacity-50" : ""}`}>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium">
        <ShieldCheck className="h-3 w-3 text-primary" />
        <span className="truncate">{team?.name ?? "—"}</span>
      </div>
      {team?.category && <div className="text-[10px] text-muted-foreground">{team.category}</div>}
    </div>
  );
}
