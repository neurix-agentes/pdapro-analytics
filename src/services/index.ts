// PDA Sport — Service layer
// Retorna Promises mockadas hoje; trocará por apiFetch no futuro.

import { mockResponse } from "@/api/client";
import {
  mockAthletes, mockClubs, mockCoaches, mockFields, mockHeatmaps, mockReports, mockSessions, mockTeams, mockUser,
} from "@/mocks/data";

export interface Scope { clubId?: string | null; teamId?: string | null }

const inScope = <T extends { club_id: string; team_id?: string }>(s: Scope) => (item: T) => {
  if (s.clubId && item.club_id !== s.clubId) return false;
  if (s.teamId && "team_id" in item && item.team_id !== s.teamId) return false;
  return true;
};

export const authService = {
  currentUser: () => mockResponse(mockUser),
};

export const clubsService = {
  list: () => mockResponse(mockClubs),
  get: (id: string) => mockResponse(mockClubs.find((c) => c.id === id) ?? null),
};

export const teamsService = {
  list: (s: Scope = {}) => mockResponse(mockTeams.filter((t) => !s.clubId || t.club_id === s.clubId)),
  get: (id: string) => mockResponse(mockTeams.find((t) => t.id === id) ?? null),
};

export const coachesService = {
  list: (s: Scope = {}) => mockResponse(mockCoaches.filter((c) => !s.clubId || c.club_id === s.clubId)),
};

export const athletesService = {
  list: (s: Scope = {}) => mockResponse(mockAthletes.filter(inScope(s))),
  get: (id: string) => mockResponse(mockAthletes.find((a) => a.id === id) ?? null),
};

export const sessionsService = {
  list: (s: Scope = {}) => mockResponse(mockSessions.filter(inScope(s))),
  recent: (s: Scope = {}, n = 8) =>
    mockResponse(
      [...mockSessions.filter(inScope(s))]
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, n),
    ),
};

export const heatmapsService = {
  list: (s: Scope = {}) => mockResponse(mockHeatmaps.filter(inScope(s))),
};

export const reportsService = {
  list: (s: Scope = {}) => mockResponse(mockReports.filter(inScope(s))),
};

export const fieldsService = {
  list: (s: Scope = {}) => mockResponse(mockFields.filter((f) => !s.clubId || f.club_id === s.clubId)),
};
