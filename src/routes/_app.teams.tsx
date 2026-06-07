import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { TeamsTable } from "@/components/teams/TeamsTable";
import { TeamFormDialog } from "@/components/teams/TeamFormDialog";
import { useTeams, useClubs, useCoaches } from "@/hooks/queries";
import { useClubStore } from "@/store";
import { useArchiveTeam, useDeleteTeam } from "@/hooks/mutations";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Team } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/teams")({
  head: () => ({ meta: [{ title: "Times · PDA Sport" }] }),
  component: TeamsPage,
});

function TeamsPage() {
  const { data: teams = [] } = useTeams();
  const { data: clubs = [] } = useClubs();
  const { data: coaches = [] } = useCoaches();
  const archiveM = useArchiveTeam();
  const currentClub = useClubStore((s) => s.currentClubId);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(teams.map((t) => t.category as string))),
    [teams],
  );

  const list = useMemo(
    () => teams.filter((t) => {
      if (cat && t.category !== cat) return false;
      if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }),
    [teams, q, cat],
  );

  const club = clubs.find((c) => c.id === currentClub);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={club?.name ?? "Plataforma"}
        title="Times"
        description="Categorias de base, profissional, feminino e society organizadas por treinador responsável."
        actions={
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo time
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar time…"
            className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 transition"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!cat} onClick={() => setCat("")}>Todas</Chip>
          {categories.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{list.length} time(s)</span>
      </div>

      <TeamsTable
        teams={list}
        clubs={clubs}
        coaches={coaches}
        onEdit={(t) => { setEditing(t); setOpen(true); }}
        onArchive={(t) => {
          archiveM.mutate({ id: t.id, current: !!t.archived }, {
            onSuccess: () => toast.success(t.archived ? "Time reativado." : "Time arquivado."),
            onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao arquivar."),
          });
        }}

      />

      <TeamFormDialog open={open} onOpenChange={setOpen} team={editing} defaultClubId={currentClub ?? undefined} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border transition ${
        active
          ? "bg-primary/15 text-primary border-primary/40"
          : "bg-surface/40 text-muted-foreground border-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
