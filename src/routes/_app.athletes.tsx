import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Users, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { useAthletes, useTeams } from "@/hooks/queries";
import { useSetAthleteStatus, useDeleteAthlete } from "@/hooks/mutations";
import { POSITIONS, type Athlete } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AthleteFormDialog } from "@/components/athletes/AthleteFormDialog";

export const Route = createFileRoute("/_app/athletes")({
  head: () => ({ meta: [{ title: "Atletas · PDA Sport" }] }),
  component: AthletesPage,
});

const ALL = "__all__";

function AthletesPage() {
  const { data: athletes = [], isLoading } = useAthletes();
  const { data: teams = [] } = useTeams();

  const [q, setQ] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>(ALL);
  const [positionFilter, setPositionFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  type SortKey = "name" | "age" | "jersey_number";
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Athlete | null>(null);
  const [toDelete, setToDelete] = useState<Athlete | null>(null);

  const setStatus = useSetAthleteStatus();
  const removeAthlete = useDeleteAthlete();

  const list = useMemo(() => {
    const filtered = athletes.filter((a) => {
      if (statusFilter !== ALL && a.status !== statusFilter) return false;
      if (teamFilter !== ALL && a.team_id !== teamFilter) return false;
      if (positionFilter !== ALL && a.position !== positionFilter) return false;
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    const numCompare = (av: number | null | undefined, bv: number | null | undefined) => {
      const aMissing = !av || av <= 0;
      const bMissing = !bv || bv <= 0;
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1; // nulos sempre ao final
      if (bMissing) return -1;
      return ((av as number) - (bv as number)) * dir;
    };
    const sorted = [...filtered].sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) * dir;
      if (sort.key === "age") return numCompare(a.age, b.age);
      return numCompare(a.jersey_number, b.jersey_number);
    });
    return sorted;
  }, [athletes, q, teamFilter, positionFilter, statusFilter, sort]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(a: Athlete) {
    setEditing(a);
    setFormOpen(true);
  }

  async function toggleArchive(a: Athlete) {
    try {
      await setStatus.mutateAsync({ id: a.id, status: a.status === "active" ? "inactive" : "active" });
      toast.success(a.status === "active" ? "Atleta arquivado." : "Atleta reativado.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await removeAthlete.mutateAsync(toDelete.id);
      toast.success("Atleta removido.");
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plantel"
        title="Atletas"
        description="Cadastro esportivo de atletas vinculados aos times do clube."
        actions={
          <button
            onClick={openNew}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold glow-primary hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo atleta
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar atleta…"
            className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 transition"
          />
        </div>

        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Time" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os times</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Posição" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas posições</SelectItem>
            {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Arquivados</SelectItem>
            <SelectItem value={ALL}>Todos</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-muted-foreground">{list.length} atleta(s)</span>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/40">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-5 py-3">
                <SortBtn label="Atleta" active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} />
              </th>
              <th className="text-left font-medium px-3 py-3">
                <SortBtn label="Camisa" active={sort.key === "jersey_number"} dir={sort.dir} onClick={() => toggleSort("jersey_number")} />
              </th>
              <th className="text-left font-medium px-3 py-3">Posição</th>
              <th className="text-left font-medium px-3 py-3">Time</th>
              <th className="text-right font-medium px-3 py-3">
                <SortBtn label="Idade" align="right" active={sort.key === "age"} dir={sort.dir} onClick={() => toggleSort("age")} />
              </th>
              <th className="text-right font-medium px-3 py-3">Altura</th>
              <th className="text-right font-medium px-3 py-3">Status</th>
              <th className="text-right font-medium px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground text-sm">Carregando…</td></tr>
            )}
            {!isLoading && list.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground text-sm">
                <Users className="h-6 w-6 mx-auto mb-2 opacity-50" /> Nenhum atleta encontrado.
              </td></tr>
            )}
            {list.map((a, i) => {
              const team = teams.find((t) => t.id === a.team_id);
              const initials = a.name.split(" ").map((s) => s[0]).slice(0, 2).join("");
              return (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.01 }}
                  className="border-t border-border/30 hover:bg-surface/30 transition"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {a.photo_url ? (
                        <img src={a.photo_url} alt={a.name} className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/30 to-info/30 grid place-items-center text-xs font-bold">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{a.name}</div>
                        {a.nickname && (
                          <div className="text-[11px] text-muted-foreground">"{a.nickname}"</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{a.jersey_number ? `#${a.jersey_number}` : "—"}</td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {a.position || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{team?.name ?? "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{a.age || "—"}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">{a.height_cm ? `${a.height_cm} cm` : "—"}</td>
                  <td className="px-3 py-3 text-right">
                    {a.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> arquivado
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 rounded-md hover:bg-surface grid place-items-center text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => toggleArchive(a)}>
                          {a.status === "active" ? (
                            <><Archive className="h-3.5 w-3.5 mr-2" /> Arquivar</>
                          ) : (
                            <><ArchiveRestore className="h-3.5 w-3.5 mr-2" /> Reativar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => setToDelete(a)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AthleteFormDialog open={formOpen} onOpenChange={setFormOpen} athlete={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atleta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente {toDelete?.name}. Para preservar histórico, prefira arquivar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
