// PDA Sport — TanStack Query hooks
import { useQuery } from "@tanstack/react-query";
import {
  athletesService, clubsService, coachesService, fieldsService,
  heatmapsService, membershipService, invitesService, reportsService, sessionsService, teamsService,
} from "@/services";
import { useClubStore, useTeamStore, useSeasonStore } from "@/store";

function useScope() {
  const clubId = useClubStore((s) => s.currentClubId);
  const teamId = useTeamStore((s) => s.currentTeamId);
  const season = useSeasonStore((s) => s.currentSeason);
  return { clubId, teamId, season };
}

export const useMyClubIds = () =>
  useQuery({ queryKey: ["myClubIds"], queryFn: () => membershipService.myClubIds() });

export const useClubs = () =>
  useQuery({ queryKey: ["clubs"], queryFn: () => clubsService.list() });

export const useClub = (id: string | undefined) =>
  useQuery({
    queryKey: ["club", id],
    queryFn: () => (id ? clubsService.get(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useTeams = () => {
  const { clubId } = useScope();
  return useQuery({ queryKey: ["teams", clubId], queryFn: () => teamsService.list({ clubId }) });
};

export const useAllTeams = () =>
  useQuery({ queryKey: ["teams", "all"], queryFn: () => teamsService.list() });

export const useTeam = (id: string | undefined) =>
  useQuery({
    queryKey: ["team", id],
    queryFn: () => (id ? teamsService.get(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useCoaches = () => {
  const { clubId } = useScope();
  return useQuery({ queryKey: ["coaches", clubId], queryFn: () => coachesService.list({ clubId }) });
};

export const useAthletes = () => {
  const s = useScope();
  return useQuery({ queryKey: ["athletes", s.clubId, s.teamId], queryFn: () => athletesService.list(s) });
};

export const useTeamAthletes = (teamId: string | undefined) =>
  useQuery({
    queryKey: ["athletes", "team", teamId],
    queryFn: () => (teamId ? athletesService.list({ teamId }) : Promise.resolve([])),
    enabled: !!teamId,
  });

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

export const useMyMemberships = () =>
  useQuery({ queryKey: ["myMemberships"], queryFn: () => membershipService.myMemberships() });

export const useMyRole = (clubId: string | null | undefined) => {
  const q = useMyMemberships();
  const role = q.data?.find((m) => m.club_id === clubId)?.role ?? null;
  return { ...q, role };
};

export const useClubInvites = (clubId: string | null | undefined) =>
  useQuery({
    queryKey: ["clubInvites", clubId],
    queryFn: () => (clubId ? invitesService.listByClub(clubId) : Promise.resolve([])),
    enabled: !!clubId,
  });

export const useClubMembers = (clubId: string | null | undefined) =>
  useQuery({
    queryKey: ["clubMembers", clubId],
    queryFn: () => (clubId ? membershipService.listClubMembers(clubId) : Promise.resolve([])),
    enabled: !!clubId,
  });
