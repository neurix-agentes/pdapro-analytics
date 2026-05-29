import { useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useClubStore, useTeamStore } from "@/store";
import { useClubs, useTeams } from "@/hooks/queries";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  clubs: "Clubes",
  teams: "Times",
  athletes: "Atletas",
  sessions: "Sessões",
  heatmaps: "Heatmaps",
  reports: "Relatórios",
  fields: "Campos",
  settings: "Configurações",
};

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: clubs = [] } = useClubs();
  const { data: teams = [] } = useTeams();
  const clubId = useClubStore((s) => s.currentClubId);
  const teamId = useTeamStore((s) => s.currentTeamId);

  const segments = useMemo(() => {
    const club = clubs.find((c) => c.id === clubId);
    const team = teams.find((t) => t.id === teamId);
    const last = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
    const out: string[] = [];
    if (club) out.push(club.short_name);
    if (team) out.push(team.name);
    out.push(LABELS[last] ?? last);
    return out;
  }, [clubs, teams, clubId, teamId, pathname]);

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
      {segments.map((s, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <span className={i === segments.length - 1 ? "text-foreground font-medium" : ""}>{s}</span>
        </span>
      ))}
    </nav>
  );
}
