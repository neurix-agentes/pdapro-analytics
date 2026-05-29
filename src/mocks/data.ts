import type {
  Athlete, Club, Coach, Field, Heatmap, Position, Report, Session, SessionMetrics, Team, User,
} from "@/types";

export const mockUser: User = {
  id: "u_carlos",
  name: "Carlos Tavares",
  email: "carlos@gremioacademy.com",
  role: "admin",
  avatar_url: undefined,
  club_ids: ["c_gremio", "c_internacional", "c_juventude"],
};

export const mockClubs: Club[] = [
  {
    id: "c_gremio",
    name: "Grêmio Academy",
    short_name: "GAC",
    city: "Porto Alegre",
    primary_color: "#00FF88",
    active_teams: 3,
    active_athletes: 64,
    created_at: "2023-01-12",
  },
  {
    id: "c_internacional",
    name: "Internacional Base",
    short_name: "INT",
    city: "Porto Alegre",
    primary_color: "#FF4D4D",
    active_teams: 2,
    active_athletes: 41,
    created_at: "2023-06-04",
  },
  {
    id: "c_juventude",
    name: "Juventude FC",
    short_name: "JUV",
    city: "Caxias do Sul",
    primary_color: "#3B82F6",
    active_teams: 1,
    active_athletes: 22,
    created_at: "2024-02-18",
  },
];

export const mockTeams: Team[] = [
  { id: "t_gac_sub17", club_id: "c_gremio", name: "Sub-17", category: "Sub-17", coach_id: "co_carlos", athletes_count: 24, created_at: "2024-01-10" },
  { id: "t_gac_sub20", club_id: "c_gremio", name: "Sub-20", category: "Sub-20", coach_id: "co_marcos", athletes_count: 22, created_at: "2024-01-10" },
  { id: "t_gac_prof",  club_id: "c_gremio", name: "Profissional", category: "Profissional", coach_id: "co_andre", athletes_count: 18, created_at: "2023-08-01" },
  { id: "t_int_sub15", club_id: "c_internacional", name: "Sub-15", category: "Sub-15", coach_id: "co_julio", athletes_count: 20, created_at: "2024-03-05" },
  { id: "t_int_sub20", club_id: "c_internacional", name: "Sub-20", category: "Sub-20", coach_id: "co_rafa", athletes_count: 21, created_at: "2024-03-05" },
  { id: "t_juv_sub17", club_id: "c_juventude", name: "Sub-17", category: "Sub-17", coach_id: "co_diego", athletes_count: 22, created_at: "2024-04-22" },
];

export const mockCoaches: Coach[] = [
  { id: "co_carlos", club_id: "c_gremio", name: "Carlos Tavares", email: "carlos@gac.com" },
  { id: "co_marcos", club_id: "c_gremio", name: "Marcos Lima", email: "marcos@gac.com" },
  { id: "co_andre",  club_id: "c_gremio", name: "André Pereira", email: "andre@gac.com" },
  { id: "co_julio",  club_id: "c_internacional", name: "Júlio Santos", email: "julio@int.com" },
  { id: "co_rafa",   club_id: "c_internacional", name: "Rafael Dias", email: "rafa@int.com" },
  { id: "co_diego",  club_id: "c_juventude", name: "Diego Martins", email: "diego@juv.com" },
];

const POSITIONS: Position[] = ["GK", "CB", "LB", "RB", "DM", "CM", "AM", "WING", "ST"];
const FIRST = ["Lucas", "Pedro", "Rafael", "João", "Gabriel", "Matheus", "Felipe", "Bruno", "Diego", "Vinicius", "Arthur", "Enzo", "Davi", "Murilo", "Caio", "Iago", "Yuri", "Théo", "Samuel", "Léo", "Otávio", "Tiago", "Vitor", "Nícolas"];
const LAST = ["Vieira", "Almeida", "Souza", "Costa", "Oliveira", "Silva", "Lima", "Rocha", "Mendes", "Ferreira", "Gomes", "Cardoso", "Barbosa", "Ribeiro", "Pereira", "Martins", "Carvalho", "Nunes"];

function rand<T>(arr: T[], seed: number): T { return arr[seed % arr.length]; }

export const mockAthletes: Athlete[] = mockTeams.flatMap((team) =>
  Array.from({ length: Math.min(team.athletes_count, 12) }, (_, i) => {
    const seed = team.id.length * 7 + i * 31;
    return {
      id: `${team.id}_a${i + 1}`,
      team_id: team.id,
      club_id: team.club_id,
      name: `${rand(FIRST, seed)} ${rand(LAST, seed + 3)}`,
      age: 14 + ((seed + i) % 10),
      position: rand(POSITIONS, seed + i),
      jersey_number: i + 1,
      height_cm: 165 + ((seed + i) % 25),
      weight_kg: 60 + ((seed + i) % 22),
      active: true,
    } satisfies Athlete;
  }),
);

function metrics(seed: number): SessionMetrics {
  return {
    distance_km: 5 + ((seed * 7) % 80) / 10,
    sprints: 6 + (seed * 3) % 30,
    top_speed_kmh: 26 + ((seed * 11) % 90) / 10,
    avg_speed_kmh: 7 + ((seed * 5) % 35) / 10,
    high_intensity_min: 10 + (seed % 20),
    pse: 4 + (seed % 6),
  };
}

const TYPES = ["treino", "jogo", "amistoso", "avaliacao"] as const;
const STATUS = ["processed", "processed", "processed", "processing", "queued"] as const;

export const mockSessions: Session[] = mockAthletes.flatMap((a, idx) =>
  Array.from({ length: 3 }, (_, j) => {
    const seed = idx * 13 + j * 7;
    const daysAgo = j * 2 + (idx % 5);
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString();
    return {
      id: `s_${a.id}_${j}`,
      athlete_id: a.id,
      team_id: a.team_id,
      club_id: a.club_id,
      session_type: TYPES[seed % TYPES.length],
      status: STATUS[seed % STATUS.length],
      date,
      duration_min: 60 + (seed % 45),
      metrics: metrics(seed),
    } satisfies Session;
  }),
);

export const mockHeatmaps: Heatmap[] = mockSessions
  .filter((s) => s.status === "processed")
  .slice(0, 24)
  .map((s, i) => ({
    id: `h_${s.id}`,
    session_id: s.id,
    athlete_id: s.athlete_id,
    team_id: s.team_id,
    club_id: s.club_id,
    heatmap_png_url: "/heatmap-preview.jpg",
    thumbnail_url: "/heatmap-preview.jpg",
    created_at: s.date,
    metrics: s.metrics,
  })) as Heatmap[];

export const mockReports: Report[] = mockAthletes.slice(0, 18).map((a, i) => ({
  id: `r_${a.id}`,
  athlete_id: a.id,
  team_id: a.team_id,
  club_id: a.club_id,
  title: `Relatório semanal — ${a.name}`,
  period: `Semana ${20 + (i % 6)}/2026`,
  report_pdf_url: "#",
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

export const mockFields: Field[] = [
  { id: "f_gac_1", club_id: "c_gremio", name: "Campo Principal — GAC", width_m: 68, length_m: 105, surface: "natural" },
  { id: "f_gac_2", club_id: "c_gremio", name: "Campo 2 — Sintético", width_m: 60, length_m: 100, surface: "sintetico" },
  { id: "f_int_1", club_id: "c_internacional", name: "CT Parque Gigante", width_m: 68, length_m: 105, surface: "natural" },
  { id: "f_juv_1", club_id: "c_juventude", name: "CT Juventude", width_m: 65, length_m: 100, surface: "sintetico" },
];
