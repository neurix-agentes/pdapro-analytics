// PDA Sport — Service layer
// clubs / teams / coaches → Supabase real
// athletes / sessions / heatmaps / reports / fields → mocks (próximas fases)

import { mockResponse } from "@/api/client";
import {
  mockFields, mockHeatmaps, mockReports, mockSessions,
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
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

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
        created_by: userRes.user.id,
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
  async remove(id: string): Promise<void> {
    // IMPORTANT: delete child rows that depend on membership FIRST, then the club,
    // and only remove club_members LAST. Deleting club_members earlier would strip
    // the caller's owner role and silently void RLS on the clubs DELETE policy
    // (is_club_owner), making the operation a no-op with no error.
    const childTables = ["heatmaps", "reports", "sessions", "athletes", "fields", "teams", "coaches", "club_invites"] as const;
    for (const t of childTables) {
      const { error } = await supabase.from(t).delete().eq("club_id", id);
      if (error) throw new Error(`${t}: ${error.message}`);
    }
    const { error: clubErr, count } = await supabase
      .from("clubs")
      .delete({ count: "exact" })
      .eq("id", id);
    if (clubErr) throw new Error(clubErr.message);
    if (count === 0) throw new Error("Sem permissão para excluir este clube.");
    const { error: memErr } = await supabase.from("club_members").delete().eq("club_id", id);
    if (memErr) throw new Error(`club_members: ${memErr.message}`);
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
  async remove(id: string): Promise<void> {
    // Detach athletes / sessions / heatmaps / reports from team before delete
    await supabase.from("athletes").update({ team_id: null }).eq("team_id", id);
    await supabase.from("sessions").update({ team_id: null }).eq("team_id", id);
    await supabase.from("reports").update({ team_id: null }).eq("team_id", id);
    const { error } = await supabase.from("teams").delete().eq("id", id);
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

export interface ClubMemberWithProfile {
  id: string;
  user_id: string;
  role: ClubRole;
  created_at: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
}

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
  async listClubMembers(clubId: string): Promise<ClubMemberWithProfile[]> {
    const { data, error } = await supabase.rpc("list_club_members_with_profiles", { _club_id: clubId });
    if (error) throw new Error(error.message);
    return (data ?? []) as ClubMemberWithProfile[];
  },
  async updateMemberRole(memberId: string, role: ClubRole): Promise<void> {
    const { error } = await supabase.from("club_members").update({ role }).eq("id", memberId);
    if (error) throw new Error(error.message);
  },
  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase.from("club_members").delete().eq("id", memberId);
    if (error) throw new Error(error.message);
  },
  async transferOwnership(clubId: string, newOwnerUserId: string): Promise<void> {
    const { error } = await supabase.rpc("transfer_club_ownership", {
      _club_id: clubId,
      _new_owner_user_id: newOwnerUserId,
    });
    if (error) throw new Error(error.message);
  },
  async myMembershipId(clubId: string): Promise<string | null> {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data, error } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.id ?? null;
  },
};

export interface InvitePreview {
  club_id: string;
  club_name: string;
  club_short_name: string | null;
  club_logo_url: string | null;
  role: ClubRole;
  email: string | null;
  expires_at: string;
  uses: number;
  max_uses: number;
  revoked: boolean;
  expired: boolean;
  exhausted: boolean;
}

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
  async preview(code: string): Promise<InvitePreview | null> {
    const { data, error } = await supabase.rpc("preview_club_invite", { _code: code.trim() });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return (row as InvitePreview | undefined) ?? null;
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
export type AthleteInput = {
  club_id: string;
  team_id: string;
  name: string;
  nickname?: string | null;
  position: string;
  secondary_position?: string | null;
  dominant_foot?: "Direito" | "Esquerdo" | "Ambidestro" | null;
  jersey_number?: number | null;
  birth_date?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  photo_url?: string | null;
  status?: "active" | "inactive";
};

function calcAge(birth?: string | null): number {
  if (!birth) return 0;
  const d = new Date(birth);
  if (isNaN(+d)) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 86400000)));
}

function mapAthleteRow(r: Record<string, unknown>): Athlete {
  const birth = (r.birth_date as string | null) ?? null;
  return {
    id: r.id as string,
    club_id: r.club_id as string,
    team_id: (r.team_id as string | null) ?? null,
    name: r.name as string,
    nickname: (r.nickname as string | null) ?? null,
    age: calcAge(birth),
    birth_date: birth,
    position: (r.position as string) ?? "",
    secondary_position: (r.secondary_position as string | null) ?? null,
    dominant_foot: (r.dominant_foot as Athlete["dominant_foot"]) ?? null,
    jersey_number: (r.jersey_number as number | null) ?? 0,
    photo_url: (r.photo_url as string | null) ?? undefined,
    height_cm: (r.height_cm as number | null) ?? undefined,
    weight_kg: (r.weight_kg as number | null) ?? undefined,
    status: ((r.status as string) === "inactive" ? "inactive" : "active"),
    active: (r.active as boolean | null) ?? true,
    last_session_at: (r.last_session_at as string | null) ?? null,
    last_report_at: (r.last_report_at as string | null) ?? null,
    gps_enabled: (r.gps_enabled as boolean | null) ?? false,
  };
}

export const athletesService = {
  async list(s: Scope = {}): Promise<Athlete[]> {
    let q = supabase.from("athletes").select("*").order("name");
    if (s.clubId) q = q.eq("club_id", s.clubId);
    if (s.teamId) q = q.eq("team_id", s.teamId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAthleteRow);
  },
  async get(id: string): Promise<Athlete | null> {
    const { data, error } = await supabase.from("athletes").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapAthleteRow(data) : null;
  },
  async create(payload: AthleteInput): Promise<Athlete> {
    const { data, error } = await supabase
      .from("athletes")
      .insert({
        club_id: payload.club_id,
        team_id: payload.team_id,
        name: payload.name.trim(),
        nickname: payload.nickname?.trim() || null,
        position: payload.position,
        secondary_position: payload.secondary_position || null,
        dominant_foot: payload.dominant_foot || null,
        jersey_number: payload.jersey_number ?? null,
        birth_date: payload.birth_date || null,
        height_cm: payload.height_cm ?? null,
        weight_kg: payload.weight_kg ?? null,
        photo_url: payload.photo_url || null,
        status: payload.status ?? "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(translateAthleteError(error.message));
    return mapAthleteRow(data);
  },
  async update(id: string, patch: Partial<AthleteInput>): Promise<void> {
    const { error } = await supabase
      .from("athletes")
      .update({
        team_id: patch.team_id,
        name: patch.name?.trim(),
        nickname: patch.nickname?.trim() || null,
        position: patch.position,
        secondary_position: patch.secondary_position || null,
        dominant_foot: patch.dominant_foot || null,
        jersey_number: patch.jersey_number ?? null,
        birth_date: patch.birth_date || null,
        height_cm: patch.height_cm ?? null,
        weight_kg: patch.weight_kg ?? null,
        photo_url: patch.photo_url ?? undefined,
        status: patch.status,
      })
      .eq("id", id);
    if (error) throw new Error(translateAthleteError(error.message));
  },
  async setStatus(id: string, status: "active" | "inactive"): Promise<void> {
    const { error } = await supabase.from("athletes").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("athletes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function translateAthleteError(msg: string): string {
  if (msg.includes("uniq_athletes_team_jersey"))
    return "Já existe um atleta com este número de camisa neste time.";
  if (msg.includes("uniq_athletes_team_name"))
    return "Já existe um atleta com este nome neste time.";
  if (msg.includes("athletes_dominant_foot_check"))
    return "Pé dominante inválido.";
  return msg;
}

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
