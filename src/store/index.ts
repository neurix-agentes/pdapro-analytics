// PDA Sport — Zustand stores
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User, Club, Team, TransferRecord } from "@/types";
import { mockUser, mockClubs, mockTeams, mockAthletes, mockTransfers } from "@/mocks/data";

/* ----------------------- AUTH ----------------------- */
interface AuthState {
  user: User | null;
  setUser: (u: User | null) => void;
  hasRole: (r: Role) => boolean;
  hasAnyRole: (rs: Role[]) => boolean;
  logout: () => void;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: mockUser,
  setUser: (user) => set({ user }),
  hasRole: (r) => get().user?.role === r,
  hasAnyRole: (rs) => !!get().user && rs.includes(get().user!.role),
  logout: () => set({ user: null }),
}));

/* ----------------------- CLUB ----------------------- */
let _clubSeq = mockClubs.length;
interface ClubState {
  currentClubId: string | null;
  version: number; // bump to force selector re-renders after mutations
  setCurrentClub: (id: string) => void;
  createClub: (data: Omit<Club, "id" | "created_at" | "active_teams" | "active_athletes">) => Club;
  updateClub: (id: string, patch: Partial<Club>) => void;
  archiveClub: (id: string) => void;
  bump: () => void;
}
export const useClubStore = create<ClubState>()(
  persist(
    (set, get) => ({
      currentClubId: "c_gremio",
      version: 0,
      setCurrentClub: (id) => set({ currentClubId: id }),
      createClub: (data) => {
        _clubSeq += 1;
        const club: Club = {
          ...data,
          id: `c_new_${_clubSeq}`,
          created_at: new Date().toISOString().slice(0, 10),
          active_teams: 0,
          active_athletes: 0,
        };
        mockClubs.push(club);
        get().bump();
        return club;
      },
      updateClub: (id, patch) => {
        const idx = mockClubs.findIndex((c) => c.id === id);
        if (idx >= 0) mockClubs[idx] = { ...mockClubs[idx], ...patch };
        get().bump();
      },
      archiveClub: (id) => {
        const idx = mockClubs.findIndex((c) => c.id === id);
        if (idx >= 0) mockClubs[idx] = { ...mockClubs[idx], archived: !mockClubs[idx].archived };
        get().bump();
      },
      bump: () => set((s) => ({ version: s.version + 1 })),
    }),
    { name: "pda.club", partialize: (s) => ({ currentClubId: s.currentClubId }) },
  ),
);

/* ----------------------- TEAM ----------------------- */
let _teamSeq = mockTeams.length;
interface TeamState {
  currentTeamId: string | null;
  version: number;
  setCurrentTeam: (id: string | null) => void;
  createTeam: (data: Omit<Team, "id" | "created_at" | "athletes_count">) => Team;
  updateTeam: (id: string, patch: Partial<Team>) => void;
  archiveTeam: (id: string) => void;
  transferAthlete: (athleteId: string, toTeamId: string, reason?: string) => void;
  bump: () => void;
}
export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      currentTeamId: "t_gac_sub17",
      version: 0,
      setCurrentTeam: (id) => set({ currentTeamId: id }),
      createTeam: (data) => {
        _teamSeq += 1;
        const team: Team = {
          ...data,
          id: `t_new_${_teamSeq}`,
          athletes_count: 0,
          created_at: new Date().toISOString().slice(0, 10),
        };
        mockTeams.push(team);
        get().bump();
        return team;
      },
      updateTeam: (id, patch) => {
        const idx = mockTeams.findIndex((t) => t.id === id);
        if (idx >= 0) mockTeams[idx] = { ...mockTeams[idx], ...patch };
        get().bump();
      },
      archiveTeam: (id) => {
        const idx = mockTeams.findIndex((t) => t.id === id);
        if (idx >= 0) mockTeams[idx] = { ...mockTeams[idx], archived: !mockTeams[idx].archived };
        get().bump();
      },
      transferAthlete: (athleteId, toTeamId, reason) => {
        const aIdx = mockAthletes.findIndex((a) => a.id === athleteId);
        const team = mockTeams.find((t) => t.id === toTeamId);
        if (aIdx < 0 || !team) return;
        const fromTeamId = mockAthletes[aIdx].team_id;
        mockAthletes[aIdx] = { ...mockAthletes[aIdx], team_id: toTeamId, club_id: team.club_id };
        mockTransfers.unshift({
          id: `tr_${Date.now()}`,
          athlete_id: athleteId,
          from_team_id: fromTeamId,
          to_team_id: toTeamId,
          date: new Date().toISOString(),
          reason,
        } as TransferRecord);
        get().bump();
      },
      bump: () => set((s) => ({ version: s.version + 1 })),
    }),
    { name: "pda.team", partialize: (s) => ({ currentTeamId: s.currentTeamId }) },
  ),
);

/* ----------------------- SEASON ----------------------- */
interface SeasonState {
  currentSeason: string;
  seasons: string[];
  setSeason: (s: string) => void;
}
export const useSeasonStore = create<SeasonState>()(
  persist(
    (set) => ({
      currentSeason: "2025/26",
      seasons: ["2024/25", "2025/26", "2026/27"],
      setSeason: (s) => set({ currentSeason: s }),
    }),
    { name: "pda.season" },
  ),
);

/* ----------------------- NOTIFICATIONS ----------------------- */
export interface Notification {
  id: string;
  title: string;
  body?: string;
  time: string;
  read: boolean;
  tone?: "info" | "success" | "warning";
}
interface NotificationsState {
  items: Notification[];
  unread: () => number;
  markAllRead: () => void;
}
export const useNotificationStore = create<NotificationsState>((set, get) => ({
  items: [
    { id: "n1", title: "Sessão processada", body: "Lucas Vieira — Sub-17", time: "há 4 min", read: false, tone: "success" },
    { id: "n2", title: "Novo heatmap disponível", body: "Pedro Almeida — Volante", time: "há 18 min", read: false, tone: "info" },
    { id: "n3", title: "Upload em fila", body: "GPS_treino_28.gpx", time: "há 1 h", read: true, tone: "warning" },
  ],
  unread: () => get().items.filter((n) => !n.read).length,
  markAllRead: () => set({ items: get().items.map((n) => ({ ...n, read: true })) }),
}));

/* ----------------------- SIDEBAR ----------------------- */
interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      collapsed: false,
      toggle: () => set({ collapsed: !get().collapsed }),
    }),
    { name: "pda.sidebar" },
  ),
);
