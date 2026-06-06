type DebugDetail = Record<string, unknown> & { step: string };

export function serializeSupabaseError(error: unknown) {
  if (!error) return null;

  if (error instanceof Error) {
    const e = error as Error & {
      code?: string | null;
      details?: string | null;
      hint?: string | null;
    };
    return {
      name: e.name,
      code: e.code ?? null,
      message: e.message,
      details: e.details ?? null,
      hint: e.hint ?? null,
    };
  }

  if (typeof error === "object") {
    const e = error as {
      name?: string | null;
      code?: string | null;
      message?: string | null;
      details?: string | null;
      hint?: string | null;
    };
    return {
      name: e.name ?? null,
      code: e.code ?? null,
      message: e.message ?? JSON.stringify(error),
      details: e.details ?? null,
      hint: e.hint ?? null,
    };
  }

  return {
    name: null,
    code: null,
    message: String(error),
    details: null,
    hint: null,
  };
}

export function buildPdaTrace(label: string) {
  return {
    id: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    startedAt: Date.now(),
  };
}

export function setActivePdaTrace(trace: ReturnType<typeof buildPdaTrace> | null) {
  (globalThis as { __pdaAuditTrace?: ReturnType<typeof buildPdaTrace> | null }).__pdaAuditTrace = trace;
}

export function getActivePdaTrace() {
  return (globalThis as { __pdaAuditTrace?: ReturnType<typeof buildPdaTrace> | null }).__pdaAuditTrace ?? null;
}

export function clearActivePdaTrace() {
  setActivePdaTrace(null);
}

function nextPdaSeq() {
  const g = globalThis as { __pdaDebugSeq?: number };
  g.__pdaDebugSeq = (g.__pdaDebugSeq ?? 0) + 1;
  return g.__pdaDebugSeq;
}

export function emitPdaDebug(detail: DebugDetail) {
  const event = {
    seq: nextPdaSeq(),
    at: new Date().toISOString(),
    traceId: getActivePdaTrace()?.id ?? null,
    ...detail,
  };

  console.log(`[PDA AUDIT #${event.seq}] ${event.step}`, event);

  if (typeof window !== "undefined") {
    const w = window as typeof window & { __pdaAuditLog?: unknown[] };
    w.__pdaAuditLog = [...(w.__pdaAuditLog ?? []), event].slice(-200);
    window.dispatchEvent(new CustomEvent("pda:debug", { detail: event }));
  }

  return event;
}