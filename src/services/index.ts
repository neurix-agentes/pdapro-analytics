// PDA Sport — Service layer
// clubs / teams / coaches → Supabase real
// athletes / sessions / heatmaps / reports / fields → mocks (próximas fases)

import { mockResponse } from "@/api/client";
import {
  mockAthletes, mockFields, mockHeatmaps, mockReports, mockSessions,
} from "@/mocks/data";
import { supabase } from "@/integrations/supabase/client";
import { emitPdaDebug, serializeSupabaseError } from "@/lib/pda-debug";
import type { Club, Team, Coach, Athlete, Session as PdaSession, Heatmap, Report, Field } from "@/types";

export interface Scope { clubId?: string | null; teamId?: string | null }

const inScope = <T extends { club_id: string; team_id?: string }>(s: Scope) => (item: T) => {
  if (s.clubId && item.club_id !== s.clubId) return false;
  if (s.teamId && "team_id" in item && item.team_id !== s.teamId) return false;
  return true;
};

// === PDA AUDITORIA — flag local. Trocar para "A" | "B" | "C" | "ALL" e submeter o form.
// "ALL" = executa A, B e C automaticamente na mesma submissão e emite um resumo comparativo.
// "off" = comportamento de produção (insert + select.single com discriminação INSERT vs RETURNING).
const PDA_AUDIT_MODE = "ALL" as "off" | "A" | "B" | "C" | "ALL";

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
    emitPdaDebug({ step: "INSERT_CLUB_START", inputPayload: payload });
    // === DIAGNÓSTICO ONBOARDING ===
    const sessionRes = await supabase.auth.getSession();
    const userRes = await supabase.auth.getUser();
    const authUser = userRes.data.user;
    const sessionUser = sessionRes.data.session?.user ?? null;

    let profileRow: unknown = null;
    let profileErr: string | null = null;
    if (authUser) {
      const pr = await supabase.from("profiles").select("id,user_id,email,name").eq("user_id", authUser.id).maybeSingle();
      profileRow = pr.data;
      profileErr = pr.error?.message ?? null;
    }

    const insertPayload = {
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
      created_by: authUser?.id,
    };

    // ⚡ DIAGNÓSTICO CRÍTICO: o que o Postgres realmente enxerga via PostgREST?
    const diag = {
      step: "clubsService.create",
      sessionPresent: !!sessionRes.data.session,
      sessionUserId: sessionUser?.id ?? null,
      sessionAccessTokenPresent: !!sessionRes.data.session?.access_token,
      getUserError: userRes.error?.message ?? null,
      authUserId: authUser?.id ?? null,
      authUserEmail: authUser?.email ?? null,
      profileFound: !!profileRow,
      profileErr,
      profileRow,
      insertPayload,
    };

    emitPdaDebug({ step: "INSERT_PAYLOAD", payload: insertPayload, diag, audit_mode: PDA_AUDIT_MODE });
    console.log("INSERT_PAYLOAD", insertPayload, "AUDIT_MODE", PDA_AUDIT_MODE);

    if (userRes.error || !authUser) {
      emitPdaDebug({
        step: "INSERT_CLUB_ERROR",
        phase: "auth_precheck",
        error: serializeSupabaseError(userRes.error ?? new Error("Sessão expirada. Faça login novamente. (getUser falhou)")),
      });
      throw new Error("Sessão expirada. Faça login novamente. (getUser falhou)");
    }

    // === TRILHA 1 — Probe de role/JWT que o PostgREST está vendo AGORA ===
    try {
      const tok = sessionRes.data.session?.access_token ?? "";
      const tokenPreview = tok ? `${tok.slice(0, 12)}…${tok.slice(-6)} (len=${tok.length})` : null;
      const expiresAt = sessionRes.data.session?.expires_at ?? null;
      const expiresInSec = expiresAt ? expiresAt - Math.floor(Date.now() / 1000) : null;

      const whoami = await supabase.rpc("pda_audit_whoami");
      emitPdaDebug({
        step: "WHOAMI_BEFORE_INSERT",
        rpc: "public.pda_audit_whoami()",
        data: whoami.data,
        error: serializeSupabaseError(whoami.error),
        client_session: {
          tokenPreview,
          expiresAt,
          expiresInSec,
          expectedUserId: authUser.id,
        },
      });
    } catch (e) {
      emitPdaDebug({ step: "WHOAMI_BEFORE_INSERT_THREW", error: serializeSupabaseError(e) });
    }

    // === Helpers reutilizáveis: TESTE A / B / C ===
    const runTestA = async (suffix: string) => {
      const auditPayload = { ...insertPayload, name: `${insertPayload.name} [PDA-AUDIT-A${suffix}]` };
      emitPdaDebug({ step: "TEST_A_INSERT_ONLY_START", payload: auditPayload, query: "insert(payload) // no select" });
      const res = await supabase.from("clubs").insert(auditPayload);
      const insertError = serializeSupabaseError(res.error);
      emitPdaDebug({ step: "TEST_A_INSERT_ONLY_RESULT", insertData: res.data ?? null, insertError, status: res.status, statusText: res.statusText });
      return { ok: !res.error, status: res.status, insertData: res.data ?? null, insertError };
    };

    const runTestB = async (suffix: string) => {
      const auditPayload = { ...insertPayload, name: `${insertPayload.name} [PDA-AUDIT-B${suffix}]` };
      emitPdaDebug({ step: "TEST_B_INSERT_SELECT_ID_START", payload: auditPayload, query: "insert(payload).select('id')" });
      const res = await supabase.from("clubs").insert(auditPayload).select("id");
      const selectError = serializeSupabaseError(res.error);
      const rowsReturned = Array.isArray(res.data) ? res.data.length : null;
      emitPdaDebug({ step: "TEST_B_INSERT_SELECT_ID_RESULT", data: res.data ?? null, error: selectError, status: res.status, statusText: res.statusText, rowsReturned });
      return { ok: !res.error, status: res.status, data: res.data ?? null, selectError, rowsReturned };
    };

    const runTestC = async (suffix: string) => {
      const auditPayload = { ...insertPayload, name: `${insertPayload.name} [PDA-AUDIT-C${suffix}]` };
      emitPdaDebug({ step: "TEST_C_INSERT_RETURNING_START", payload: auditPayload, query: "insert(...).select('*').single()" });
      const res = await supabase.from("clubs").insert(auditPayload).select("*").single();
      const err = serializeSupabaseError(res.error);
      let phase: "ok" | "post_insert_select" | "insert_with_check" | "unknown" = "ok";
      if (res.error) {
        const msg = (res.error.message ?? "").toLowerCase();
        const code = (res.error as { code?: string | null }).code ?? null;
        if (code === "PGRST116") phase = "post_insert_select";
        else if (code === "42501" || msg.includes("violates row-level security")) phase = "insert_with_check";
        else phase = "unknown";
      }
      emitPdaDebug({
        step: res.error
          ? phase === "post_insert_select" ? "RETURNING_ERROR"
          : phase === "insert_with_check" ? "INSERT_ERROR"
          : "INSERT_OR_RETURNING_UNKNOWN_ERROR"
          : "TEST_C_INSERT_RETURNING_OK",
        phase, data: res.data ?? null, error: err, status: res.status, statusText: res.statusText,
      });
      return { ok: !res.error, status: res.status, data: res.data ?? null, error: err, phase };
    };

    if (PDA_AUDIT_MODE === "A") {
      const r = await runTestA("");
      if (!r.ok) throw new Error(`[TESTE A] ${r.insertError?.message ?? "falhou"}`);
      throw new Error("[TESTE A] INSERT-only ok. Veja painel de debug.");
    }
    if (PDA_AUDIT_MODE === "B") {
      const r = await runTestB("");
      if (!r.ok) throw new Error(`[TESTE B] ${r.selectError?.message ?? "falhou"}`);
      if (!(r.data as unknown[] | null)?.length) throw new Error("[TESTE B] INSERT ok mas select('id') retornou 0 linhas — RLS SELECT bloqueando.");
      throw new Error("[TESTE B] INSERT+select(id) ok. Veja painel de debug.");
    }

    if (PDA_AUDIT_MODE === "ALL") {
      const runId = Math.random().toString(36).slice(2, 6).toUpperCase();
      emitPdaDebug({ step: "AUDIT_ALL_START", runId, sequence: ["A", "B", "C"] });

      const a = await runTestA(`-${runId}`);
      const b = await runTestB(`-${runId}`);
      const c = await runTestC(`-${runId}`);

      const verdicts: string[] = [];
      if (!a.ok && (a.insertError?.message ?? "").toLowerCase().includes("violates row-level security")) {
        verdicts.push("A: INSERT bloqueado por RLS WITH CHECK → JWT chegando como anon OU outra policy reprovando.");
      } else if (a.ok) {
        verdicts.push("A: INSERT puro OK → policy de INSERT está liberando.");
      } else {
        verdicts.push(`A: falhou com erro não-RLS (code=${a.insertError?.code ?? "n/a"}).`);
      }
      if (b.ok && (b.rowsReturned ?? 0) === 0) {
        verdicts.push("B: INSERT ok mas SELECT('id') retornou 0 linhas → policy SELECT não enxerga a linha no mesmo round-trip.");
      } else if (b.ok) {
        verdicts.push("B: INSERT + select('id') OK → SELECT pós-insert funciona com cardinalidade flexível.");
      } else {
        verdicts.push(`B: falhou (code=${b.selectError?.code ?? "n/a"}) — ${b.selectError?.message ?? ""}`);
      }
      if (c.ok) {
        verdicts.push("C: insert+select.single() OK → caminho de produção funcionaria.");
      } else if (c.phase === "post_insert_select") {
        verdicts.push("C: RETURNING_ERROR (PGRST116) → INSERT passou, .single() não recebeu linha. Confirma SELECT bloqueando o returning.");
      } else if (c.phase === "insert_with_check") {
        verdicts.push("C: INSERT_ERROR (42501/RLS) → o próprio INSERT foi rejeitado, não o SELECT.");
      } else {
        verdicts.push(`C: erro desconhecido (code=${c.error?.code ?? "n/a"}).`);
      }

      const summary = {
        runId,
        A: { ok: a.ok, status: a.status, insertData: a.insertData, insertError: a.insertError },
        B: { ok: b.ok, status: b.status, rowsReturned: b.rowsReturned, data: b.data, selectError: b.selectError },
        C: { ok: c.ok, status: c.status, phase: c.phase, data: c.data, error: c.error },
        comparison: {
          insertSucceeded_A: a.ok,
          insertSucceeded_B: b.ok,
          insertSucceeded_C: c.ok,
          selectReturnedRows_B: b.rowsReturned,
          selectErrorCode_B: b.selectError?.code ?? null,
          returningErrorCode_C: c.error?.code ?? null,
        },
        verdicts,
      };

      emitPdaDebug({ step: "AUDIT_ALL_SUMMARY", ...summary });
      console.table([
        { test: "A insert-only", ok: a.ok, status: a.status, errCode: a.insertError?.code ?? "" },
        { test: "B insert+select(id)", ok: b.ok, status: b.status, rows: b.rowsReturned ?? 0, errCode: b.selectError?.code ?? "" },
        { test: "C insert+select.single()", ok: c.ok, status: c.status, phase: c.phase, errCode: c.error?.code ?? "" },
      ]);
      console.log("[PDA AUDIT ALL — VERDICTS]", verdicts);

      throw new Error(`[AUDIT ALL ${runId}] A=${a.ok ? "ok" : "fail"} • B=${b.ok ? `ok(${b.rowsReturned ?? 0}r)` : "fail"} • C=${c.ok ? "ok" : c.phase}. Veja AUDIT_ALL_SUMMARY no painel de debug.`);
    }

    // === TRILHA 2 — TESTE C (default "off" também): insert.select('*').single() com discriminação INSERT vs RETURNING ===
    emitPdaDebug({ step: "TEST_C_INSERT_RETURNING_START", query: "supabase.from('clubs').insert(...).select('*').single()" });
    const { data, error, status, statusText } = await supabase
      .from("clubs")
      .insert(insertPayload)
      .select("*")
      .single();

    console.log("INSERT_RESULT", data ?? null);
    console.log("INSERT_ERROR", error ?? null);

    if (error) {
      const serializedError = serializeSupabaseError(error);
      const msg = (error.message ?? "").toLowerCase();
      const code = (error as { code?: string | null }).code ?? null;

      // PGRST116 = "JSON object requested, multiple (or no) rows returned"
      // 42501 / "violates row-level security" = INSERT WITH CHECK rejeitado pelo Postgres
      const isReturning = code === "PGRST116";
      const isInsertRls = code === "42501" || msg.includes("violates row-level security");

      emitPdaDebug({
        step: isReturning ? "RETURNING_ERROR" : isInsertRls ? "INSERT_ERROR" : "INSERT_OR_RETURNING_UNKNOWN_ERROR",
        phase: isReturning ? "post_insert_select" : isInsertRls ? "insert_with_check" : "unknown",
        query: "insert into public.clubs returning representation",
        payload: insertPayload,
        error: serializedError,
        status,
        statusText,
        diag,
      });
      throw new Error(error.message);
    }

    emitPdaDebug({ step: "INSERT_CLUB_SUCCESS", result: data, diag });
    emitPdaDebug({ step: "SELECT_CLUB_SUCCESS", result: data, query: "implicit select from returning representation on clubs" });
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
