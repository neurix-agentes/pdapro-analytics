import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Archive } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ClubsTable } from "@/components/clubs/ClubsTable";
import { ClubFormDialog } from "@/components/clubs/ClubFormDialog";
import { useClubs, useAllTeams } from "@/hooks/queries";
import { useArchiveClub, useDeleteClub } from "@/hooks/mutations";
import type { Club } from "@/types";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/clubs")({
  head: () => ({ meta: [{ title: "Clubes · PDA Sport" }] }),
  component: ClubsPage,
});

function ClubsPage() {
  const { data: clubs = [] } = useClubs();
  const { data: teams = [] } = useAllTeams();
  const archiveM = useArchiveClub();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);

  const list = useMemo(
    () =>
      clubs.filter((c) => {
        if (!showArchived && c.archived) return false;
        const t = q.toLowerCase();
        if (!t) return true;
        return c.name.toLowerCase().includes(t) || c.city.toLowerCase().includes(t);
      }),
    [clubs, q, showArchived],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Hierarquia"
        title="Clubes"
        description="Gerencie clubes, times e treinadores conectados à sua conta."
        actions={
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo clube
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou cidade…"
            className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 transition"
          />
        </div>
        <button
          onClick={() => setShowArchived((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            showArchived
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-surface/60 hover:bg-surface text-muted-foreground"
          }`}
        >
          <Archive className="h-4 w-4" /> Arquivados
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{list.length} clube(s)</span>
      </div>

      <ClubsTable
        clubs={list}
        teams={teams}
        onEdit={(c) => { setEditing(c); setOpen(true); }}
        onArchive={(c) => {
          archiveM.mutate({ id: c.id, current: !!c.archived }, {
            onSuccess: () => toast.success(c.archived ? "Clube reativado." : "Clube arquivado."),
            onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao arquivar."),
          });
        }}

      />

      <ClubFormDialog open={open} onOpenChange={setOpen} club={editing} />
    </div>
  );
}
