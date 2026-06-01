// PDA Sport — Zustand stores (apenas UI state; CRUD vai via mutations.ts)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockAthletes, mockTransfers } from "@/mocks/data";
import type { TransferRecord } from "@/types";

/* ----------------------- CLUB (scope UI) ----------------------- */
interface ClubState {
  currentClubId: string | null;
  setCurrentClub: (id: string | null) => void;
}
export const useClubStore = create<ClubState>()(
  persist(
    (set) => ({
      currentClubId: null,
      setCurrentClub: (id) => set({ currentClubId: id }),
    }),
    { name: "pda.club" },
  ),
);

/* ----------------------- TEAM (scope UI) ----------------------- */
interface TeamState {
  currentTeamId: string | null;
  setCurrentTeam: (id: string | null) => void;
  transferAthlete: (athleteId: string, toTeamId: string, reason?: string) => void;
}
export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      currentTeamId: null,
      setCurrentTeam: (id) => set({ currentTeamId: id }),
      // local-only (mocks): athletes ainda não estão no DB
      transferAthlete: (athleteId, toTeamId, reason) => {
        const aIdx = mockAthletes.findIndex((a) => a.id === athleteId);
        if (aIdx < 0) return;
        const fromTeamId = mockAthletes[aIdx].team_id;
        mockAthletes[aIdx] = { ...mockAthletes[aIdx], team_id: toTeamId };
        mockTransfers.unshift({
          id: `tr_${Date.now()}`,
          athlete_id: athleteId,
          from_team_id: fromTeamId,
          to_team_id: toTeamId,
          date: new Date().toISOString(),
          reason,
        } as TransferRecord);
        set({});
      },
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
