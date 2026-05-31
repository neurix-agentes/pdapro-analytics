import { Check, ChevronsUpDown, CalendarRange } from "lucide-react";
import { useSeasonStore } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SeasonSwitcher() {
  const current = useSeasonStore((s) => s.currentSeason);
  const seasons = useSeasonStore((s) => s.seasons);
  const setSeason = useSeasonStore((s) => s.setSeason);
  const qc = useQueryClient();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group w-full rounded-xl border border-border/60 bg-surface/30 hover:bg-surface hover:border-primary/30 transition px-3 py-2 flex items-center gap-2.5">
        <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex-1 text-left min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground leading-none mb-0.5">
            Temporada
          </div>
          <div className="text-sm font-medium truncate leading-none">{current}</div>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-popover/95 backdrop-blur-xl border-border">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Temporada ativa
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {seasons.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => { setSeason(s); qc.invalidateQueries(); }}
            className="cursor-pointer focus:bg-primary/10"
          >
            <span className="flex-1">{s}</span>
            {s === current && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
