import { Check, ChevronsUpDown, Users } from "lucide-react";
import { useTeamStore } from "@/store";
import { useTeams } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TeamSwitcher() {
  const { data: teams = [] } = useTeams();
  const currentTeamId = useTeamStore((s) => s.currentTeamId);
  const setCurrentTeam = useTeamStore((s) => s.setCurrentTeam);
  const qc = useQueryClient();

  const current = teams.find((t) => t.id === currentTeamId) ?? null;

  function pick(id: string | null) {
    setCurrentTeam(id);
    qc.invalidateQueries();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group w-full rounded-xl border border-border/60 bg-surface/30 hover:bg-surface hover:border-primary/30 transition px-3 py-2 flex items-center gap-2.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium truncate">
            {current ? current.name : "Todos os times"}
          </div>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-popover/95 backdrop-blur-xl border-border">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Time ativo
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => pick(null)} className="cursor-pointer focus:bg-primary/10">
          <span className="flex-1">Todos os times</span>
          {!current && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {teams.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => pick(t.id)}
            className="cursor-pointer focus:bg-primary/10 gap-3"
          >
            <span className="flex-1">
              <span className="text-sm">{t.name}</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{t.athletes_count} atletas</span>
            </span>
            {t.id === current?.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
