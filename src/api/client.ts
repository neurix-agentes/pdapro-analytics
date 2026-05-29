// PDA Sport — API client (mock layer)
// Preparado para substituição por fetch real ao backend FastAPI.

const LATENCY_MS = 180;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Simula latência de rede para reforçar UX de loading. */
export async function mockResponse<T>(data: T, ms = LATENCY_MS): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  return structuredClone(data);
}

/** Wrapper futuro de fetch real. Mantém assinatura estável. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // TODO: trocar por process.env / runtime config quando backend estiver pronto.
  const baseUrl = "";
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("pda_token") : null;
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}
