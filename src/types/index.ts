// PDA Sport — Entidades de domínio
// Tipos espelhando o futuro schema Supabase.

export type Role = "admin" | "club" | "coach" | "athlete";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  club_ids: string[];
}

export interface Club {
  id: string;
  name: string;
  short_name: string;
  city: string;
  state?: string;
  country?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  description?: string;
  active_teams: number;
  active_athletes: number;
  archived?: boolean;
  created_at: string;
}

export type AgeCategory =
  | "Sub-09" | "Sub-11" | "Sub-13" | "Sub-15" | "Sub-17" | "Sub-20"
  | "Profissional" | "Feminino" | "Society" | "Amador";

export interface Team {
  id: string;
  club_id: string;
  name: string;
  category: AgeCategory | string;
  coach_id?: string;
  athletes_count: number;
  season?: string;
  archived?: boolean;
  created_at: string;
}

export interface Coach {
  id: string;
  club_id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export type Position =
  | "GK" | "DEF" | "LB" | "RB" | "CB" | "MID" | "CM" | "DM" | "AM" | "WING" | "FW" | "ST";

export interface Athlete {
  id: string;
  team_id: string;
  club_id: string;
  name: string;
  age: number;
  position: Position;
  jersey_number: number;
  photo_url?: string;
  height_cm?: number;
  weight_kg?: number;
  active: boolean;
}

export interface TransferRecord {
  id: string;
  athlete_id: string;
  from_team_id: string;
  to_team_id: string;
  date: string;
  reason?: string;
}

export type SessionType = "treino" | "jogo" | "amistoso" | "avaliacao";
export type SessionStatus = "processed" | "processing" | "queued" | "failed";

export interface SessionMetrics {
  distance_km: number;
  sprints: number;
  top_speed_kmh: number;
  avg_speed_kmh: number;
  high_intensity_min: number;
  pse?: number;
}

export interface Session {
  id: string;
  athlete_id: string;
  team_id: string;
  club_id: string;
  field_id?: string;
  session_type: SessionType;
  status: SessionStatus;
  date: string;
  duration_min: number;
  gps_file_url?: string;
  metrics?: SessionMetrics;
}

export interface Heatmap {
  id: string;
  session_id: string;
  athlete_id: string;
  team_id: string;
  club_id: string;
  heatmap_png_url: string;
  thumbnail_url?: string;
  created_at: string;
  metrics?: SessionMetrics;
}

export interface Report {
  id: string;
  athlete_id: string;
  team_id: string;
  club_id: string;
  title: string;
  period: string;
  report_pdf_url: string;
  created_at: string;
}

export interface Field {
  id: string;
  club_id: string;
  name: string;
  width_m: number;
  length_m: number;
  surface: "natural" | "sintetico" | "society";
  gps_lat?: number;
  gps_lng?: number;
}
