// PDA Sport — Service layer
// clubs / teams / coaches → Supabase real
// athletes / sessions / heatmaps / reports / fields → mocks (próximas fases)

import { mockResponse } from "@/api/client";
import {
  mockAthletes, mockFields, mockHeatmaps, mockReports, mockSessions,
} from "@/mocks/data";
import { supabase } from "@/integrations/supabase/client";
import type { Club, Team, Coach, Athlete, Session as PdaSession, Heatmap, Report, Field } from "@/types";

export interface Scope { clubId?: string | null; teamId?: string | null }

const inScope = <T extends { club_id: string; team_id?: string }>(s: Scope) => (item: T) => {
  if (s.clubId && item.club_id !== s.clubId) return false;
  if (s.teamId && "team_id" in item && item.team_id !== s.teamId) return false;
  return true;
};

/* ===================== CLUBS ===================== */
export const clubsService = {
  async list(): Promise<Club[]> {
    const { data, error } = await supabase
      .from("clubs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapClubRow);
  },
  async get(id: string): Promise<Club | null> {
    const { data, error } = await supabase.from("clubs").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapClubRow(data) : null;
  },
  async create(
    payload: Omit<Club, "id" | "created_at" | "active_teams" | "active_athletes">,
  ): Promise<Club> {
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr || !u.user) throw new Error("Sessão expirada. Faça login novamente.");
    const { data, error } = await supabase
      .from("clubs")
      .insert({
        name: payload.name,
        short_name: payload.short_name,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        primary_color: payload.primary_color,
        secondary_color: payload.secondary_color,
        description: payload.description,
        logo_url: payload.logo_url,
        archived: payload.archived ?? false,
        created_by: u.user.id,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapClubRow(data);
  },
  async update(id: string, patch: Partial<Club>): Promise<void> {
    const { error } = await supabase
      .from("clubs")
      .update({
        name: patch.name,
        short_name: patch.short_name,
        city: patch.city,
        state: patch.state,
        country: patch.country,
        primary_color: patch.primary_color,
        secondary_color: patch.secondary_color,
        description: patch.description,
        logo_url: patch.logo_url,
        archived: patch.archived,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
  async toggleArchive(id: string, current: boolean): Promise<void> {
    const { error } = await supabase.from("clubs").update({ archived: !current }).eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function mapClubRow(r: Record<string, unknown>): Club {
  return {
    id: r.id as string,
    name: r.name as string,
    short_name: (r.short_name as string) ?? "",
    city: (r.city as string) ?? "",
    state: (r.state as string | null) ?? undefined,
    country: (r.country as string | null) ?? undefined,
    logo_url: (r.logo_url as string | null) ?? undefined,
    primary_color: (r.primary_color as string | null) ?? undefined,
    secondary_color: (r.secondary_color as string | null) ?? undefined,
    description: (r.description as string | null) ?? undefined,
    active_teams: 0,
    active_athletes: 0,
    archived: (r.archived as boolean | null) ?? false,
    created_at: (r.created_at as string) ?? new Date().toISOString(),
  };
}

/* ===================== TEAMS ===================== */
export const teamsService = {
  async list(s: Scope = {}): Promise<Team[]> {
    let q = supabase.from("teams").select("*").order("created_at", { ascending: false });
    if (s.clubId) q = q.eq("club_id", s.clubId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTeamRow);
  },
  async get(id: string): Promise<Team | null> {
    const { data, error } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapTeamRow(data) : null;
  },
  async create(payload: Omit<Team, "id" | "created_at" | "athletes_count">): Promise<Team> {
    const { data, error } = await supabase
      .from("teams")
      .insert({
        club_id: payload.club_id,
        name: payload.name,
        category: payload.category,
        coach_id: payload.coach_id || null,
        season: payload.season,
        archived: payload.archived ?? false,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapTeamRow(data);
  },
  async update(id: string, patch: Partial<Team>): Promise<void> {
    const { error } = await supabase
      .from("teams")
      .update({
        name: patch.name,
        category: patch.category,
        coach_id: patch.coach_id || null,
        season: patch.season,
        archived: patch.archived,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
  async toggleArchive(id: string, current: boolean): Promise<void> {
    const { error } = await supabase.from("teams").update({ archived: !current }).eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function mapTeamRow(r: Record<string, unknown>): Team {
  return {
    id: r.id as string,
    club_id: r.club_id as string,
    name: r.name as string,
    category: (r.category as string) ?? "Profissional",
    coach_id: (r.coach_id as string | null) ?? undefined,
    athletes_count: 0,
    season: (r.season as string | null) ?? undefined,
    archived: (r.archived as boolean | null) ?? false,
    created_at: (r.created_at as string) ?? new Date().toISOString(),
  };
}

/* ===================== COACHES ===================== */
export const coachesService = {
  async list(s: Scope = {}): Promise<Coach[]> {
    let q = supabase.from("coaches").select("*").order("name");
    if (s.clubId) q = q.eq("club_id", s.clubId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      club_id: r.club_id,
      name: r.name,
      email: r.email ?? "",
      avatar_url: r.avatar_url ?? undefined,
    }));
  },
  async create(payload: Omit<Coach, "id">): Promise<Coach> {
    const { data, error } = await supabase
      .from("coaches")
      .insert({ club_id: payload.club_id, name: payload.name, email: payload.email, avatar_url: payload.avatar_url })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { id: data.id, club_id: data.club_id, name: data.name, email: data.email ?? "", avatar_url: data.avatar_url ?? undefined };
  },
};

/* ===================== AUTH (membership) ===================== */
export type ClubRole =
  | "owner" | "admin" | "coach" | "assistant_coach" | "analyst" | "athlete" | "member";

export const membershipService = {
  async myClubIds(): Promise<string[]> {
    const { data, error } = await supabase.from("club_members").select("club_id");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.club_id);
  },
  async myMemberships(): Promise<{ club_id: string; role: ClubRole }[]> {
    const { data, error } = await supabase.from("club_members").select("club_id, role");
    if (error) throw new Error(error.message);
    return (data ?? []) as { club_id: string; role: ClubRole }[];
  },
  async listClubMembers(clubId: string) {
    const { data, error } = await supabase
      .from("club_members")
      .select("id, user_id, role, created_at")
      .eq("club_id", clubId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

/* ===================== INVITES ===================== */
export interface ClubInvite {
  id: string;
  club_id: string;
  code: string;
  role: ClubRole;
  email: string | null;
  expires_at: string;
  max_uses: number;
  uses: number;
  revoked_at: string | null;
  created_at: string;
}

function randomCode(len = 8) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

export const invitesService = {
  async listByClub(clubId: string): Promise<ClubInvite[]> {
    const { data, error } = await supabase
      .from("club_invites")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ClubInvite[];
  },
  async create(payload: {
    club_id: string;
    role: ClubRole;
    email?: string | null;
    max_uses?: number;
    expires_in_days?: number;
  }): Promise<ClubInvite> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Sessão expirada.");
    const expires_at = new Date(
      Date.now() + (payload.expires_in_days ?? 30) * 86400000,
    ).toISOString();
    const { data, error } = await supabase
      .from("club_invites")
      .insert({
        club_id: payload.club_id,
        code: randomCode(),
        role: payload.role,
        email: payload.email ?? null,
        max_uses: payload.max_uses ?? 1,
        expires_at,
        created_by: u.user.id,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as ClubInvite;
  },
  async revoke(id: string): Promise<void> {
    const { error } = await supabase
      .from("club_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
  async redeem(code: string): Promise<string> {
    const { data, error } = await supabase.rpc("redeem_club_invite", { _code: code.trim() });
    if (error) throw new Error(translateInviteError(error.message));
    return data as string;
  },
};

function translateInviteError(msg: string) {
  if (msg.includes("invite_not_found")) return "Convite não encontrado.";
  if (msg.includes("invite_revoked")) return "Este convite foi revogado.";
  if (msg.includes("invite_expired")) return "Este convite expirou.";
  if (msg.includes("invite_exhausted")) return "Este convite já atingiu o limite de usos.";
  if (msg.includes("invite_email_mismatch")) return "Este convite é para outro e-mail.";
  if (msg.includes("not_authenticated")) return "Faça login para resgatar o convite.";
  return msg;
}

/* =====================================================
   MOCKED (próximas fases) — athletes/sessions/heatmaps/reports/fields
   ===================================================== */
export const athletesService = {
  list: (s: Scope = {}): Promise<Athlete[]> => mockResponse(mockAthletes.filter(inScope(s))),
  get: (id: string): Promise<Athlete | null> => mockResponse(mockAthletes.find((a) => a.id === id) ?? null),
};
export const sessionsService = {
  list: (s: Scope = {}): Promise<PdaSession[]> => mockResponse(mockSessions.filter(inScope(s))),
  recent: (s: Scope = {}, n = 8): Promise<PdaSession[]> =>
    mockResponse(
      [...mockSessions.filter(inScope(s))]
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, n),
    ),
};
export const heatmapsService = {
  list: (s: Scope = {}): Promise<Heatmap[]> => mockResponse(mockHeatmaps.filter(inScope(s))),
};
export const reportsService = {
  list: (s: Scope = {}): Promise<Report[]> => mockResponse(mockReports.filter(inScope(s))),
};
export const fieldsService = {
  list: (s: Scope = {}): Promise<Field[]> => mockResponse(mockFields.filter((f) => !s.clubId || f.club_id === s.clubId)),
};
