// PDA Sport — Zustand stores
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";
import { mockUser } from "@/mocks/data";

/* ----------------------- AUTH ----------------------- */
interface AuthState {
  user: User | null;
  setUser: (u: User | null) => void;
  hasRole: (r: Role) => boolean;
  hasAnyRole: (rs: Role[]) => boolean;
  logout: () => void;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: mockUser, // mock login automático
  setUser: (user) => set({ user }),
  hasRole: (r) => get().user?.role === r,
  hasAnyRole: (rs) => !!get().user && rs.includes(get().user!.role),
  logout: () => set({ user: null }),
}));

/* ----------------------- CLUB ----------------------- */
interface ClubState {
  currentClubId: string | null;
  setCurrentClub: (id: string) => void;
}
export const useClubStore = create<ClubState>()(
  persist(
    (set) => ({
      currentClubId: "c_gremio",
      setCurrentClub: (id) => set({ currentClubId: id, /* reset team on club change */ }),
    }),
    { name: "pda.club" },
  ),
);

/* ----------------------- TEAM ----------------------- */
interface TeamState {
  currentTeamId: string | null;
  setCurrentTeam: (id: string | null) => void;
}
export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      currentTeamId: "t_gac_sub17",
      setCurrentTeam: (id) => set({ currentTeamId: id }),
    }),
    { name: "pda.team" },
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
