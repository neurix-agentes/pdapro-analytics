// PDA Sport — TanStack Query hooks (escopo: club / team / season atual)
import { useQuery } from "@tanstack/react-query";
import {
  athletesService, clubsService, coachesService, fieldsService,
  heatmapsService, reportsService, sessionsService, teamsService,
} from "@/services";
import { useClubStore, useTeamStore, useSeasonStore } from "@/store";

function useScope() {
  const clubId = useClubStore((s) => s.currentClubId);
  const teamId = useTeamStore((s) => s.currentTeamId);
  const season = useSeasonStore((s) => s.currentSeason);
  const clubVer = useClubStore((s) => s.version);
  const teamVer = useTeamStore((s) => s.version);
  return { clubId, teamId, season, v: clubVer + teamVer };
}

export const useClubs = () => {
  const v = useClubStore((s) => s.version);
  return useQuery({ queryKey: ["clubs", v], queryFn: () => clubsService.list() });
};

export const useClub = (id: string | undefined) => {
  const v = useClubStore((s) => s.version);
  return useQuery({
    queryKey: ["club", id, v],
    queryFn: () => (id ? clubsService.get(id) : Promise.resolve(null)),
    enabled: !!id,
  });
};

export const useTeams = () => {
  const { clubId, v } = useScope();
  return useQuery({ queryKey: ["teams", clubId, v], queryFn: () => teamsService.list({ clubId }) });
};

export const useAllTeams = () => {
  const v = useTeamStore((s) => s.version);
  return useQuery({ queryKey: ["teams", "all", v], queryFn: () => teamsService.list() });
};

export const useTeam = (id: string | undefined) => {
  const v = useTeamStore((s) => s.version);
  return useQuery({
    queryKey: ["team", id, v],
    queryFn: () => (id ? teamsService.get(id) : Promise.resolve(null)),
    enabled: !!id,
  });
};

export const useCoaches = () => {
  const { clubId } = useScope();
  return useQuery({ queryKey: ["coaches", clubId], queryFn: () => coachesService.list({ clubId }) });
};

export const useAthletes = () => {
  const s = useScope();
  return useQuery({ queryKey: ["athletes", s.clubId, s.teamId, s.v], queryFn: () => athletesService.list(s) });
};

export const useTeamAthletes = (teamId: string | undefined) => {
  const v = useTeamStore((s) => s.version);
  return useQuery({
    queryKey: ["athletes", "team", teamId, v],
    queryFn: () => (teamId ? athletesService.list({ teamId }) : Promise.resolve([])),
    enabled: !!teamId,
  });
};

export const useSessions = () => {
  const s = useScope();
  return useQuery({ queryKey: ["sessions", s.clubId, s.teamId], queryFn: () => sessionsService.list(s) });
};

export const useRecentSessions = (n = 8) => {
  const s = useScope();
  return useQuery({
    queryKey: ["sessions", "recent", s.clubId, s.teamId, n],
    queryFn: () => sessionsService.recent(s, n),
  });
};

export const useHeatmaps = () => {
  const s = useScope();
  return useQuery({ queryKey: ["heatmaps", s.clubId, s.teamId], queryFn: () => heatmapsService.list(s) });
};

export const useReports = () => {
  const s = useScope();
  return useQuery({ queryKey: ["reports", s.clubId, s.teamId], queryFn: () => reportsService.list(s) });
};

export const useFields = () => {
  const { clubId } = useScope();
  return useQuery({ queryKey: ["fields", clubId], queryFn: () => fieldsService.list({ clubId }) });
};
