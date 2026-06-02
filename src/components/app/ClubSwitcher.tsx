import { useMemo } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useClubStore, useTeamStore } from "@/store";
import { useClubs } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ClubSwitcher({ compact = false }: { compact?: boolean }) {
  const { data: clubs = [] } = useClubs();
  const currentClubId = useClubStore((s) => s.currentClubId);
  const setCurrentClub = useClubStore((s) => s.setCurrentClub);
  const setCurrentTeam = useTeamStore((s) => s.setCurrentTeam);
  const qc = useQueryClient();

  const current = useMemo(
    () => clubs.find((c) => c.id === currentClubId) ?? clubs[0],
    [clubs, currentClubId],
  );

  function selectClub(id: string) {
    if (id === currentClubId) return;
    setCurrentClub(id);
    setCurrentTeam(null);
    qc.invalidateQueries();
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="h-10 w-10 rounded-xl bg-surface/60 border border-border flex items-center justify-center hover:border-primary/40 transition">
          <Building2 className="h-4 w-4 text-primary" />
        </DropdownMenuTrigger>
        <ClubMenu clubs={clubs} currentId={current?.id} onPick={selectClub} />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group w-full rounded-xl border border-border bg-surface/40 hover:bg-surface hover:border-primary/30 transition px-3 py-2.5 flex items-center gap-3">
        {current?.logo_url ? (
          <img src={current.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover border border-border" />
        ) : (
          <div
            className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-wider"
            style={{
              background: `color-mix(in oklab, ${current?.primary_color ?? "#00FF88"} 18%, transparent)`,
              color: current?.primary_color ?? "#00FF88",
              boxShadow: `0 0 18px -6px ${current?.primary_color ?? "#00FF88"}`,
            }}
          >
            {current?.short_name ?? "—"}
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Clube</div>
          <div className="text-sm font-semibold truncate">{current?.name ?? "Selecionar"}</div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
      </DropdownMenuTrigger>
      <ClubMenu clubs={clubs} currentId={current?.id} onPick={selectClub} />
    </DropdownMenu>
  );
}

function ClubMenu({
  clubs, currentId, onPick,
}: { clubs: { id: string; name: string; city: string; short_name: string; primary_color?: string }[]; currentId?: string; onPick: (id: string) => void }) {
  return (
    <DropdownMenuContent align="start" className="w-64 bg-popover/95 backdrop-blur-xl border-border">
      <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Seus clubes
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {clubs.map((c) => (
        <DropdownMenuItem
          key={c.id}
          onClick={() => onPick(c.id)}
          className="gap-3 py-2.5 cursor-pointer focus:bg-primary/10"
        >
          <div
            className="h-8 w-8 rounded-md flex items-center justify-center text-[10px] font-bold"
            style={{
              background: `color-mix(in oklab, ${c.primary_color ?? "#00FF88"} 18%, transparent)`,
              color: c.primary_color ?? "#00FF88",
            }}
          >
            {c.short_name}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{c.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{c.city}</div>
          </div>
          {c.id === currentId && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  );
}
