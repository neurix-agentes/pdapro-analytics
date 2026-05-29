// PDA Sport — TanStack Query hooks (escopo: club / team atual)
import { useQuery } from "@tanstack/react-query";
import {
  athletesService, clubsService, coachesService, fieldsService,
  heatmapsService, reportsService, sessionsService, teamsService,
} from "@/services";
import { useClubStore, useTeamStore } from "@/store";

function useScope() {
  const clubId = useClubStore((s) => s.currentClubId);
  const teamId = useTeamStore((s) => s.currentTeamId);
  return { clubId, teamId };
}

export const useClubs = () =>
  useQuery({ queryKey: ["clubs"], queryFn: () => clubsService.list() });

export const useTeams = () => {
  const { clubId } = useScope();
  return useQuery({ queryKey: ["teams", clubId], queryFn: () => teamsService.list({ clubId }) });
};

export const useCoaches = () => {
  const { clubId } = useScope();
  return useQuery({ queryKey: ["coaches", clubId], queryFn: () => coachesService.list({ clubId }) });
};

export const useAthletes = () => {
  const s = useScope();
  return useQuery({ queryKey: ["athletes", s.clubId, s.teamId], queryFn: () => athletesService.list(s) });
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
