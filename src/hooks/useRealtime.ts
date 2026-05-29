// PDA Sport — Stub para WebSocket / realtime futuro.
// Hoje é no-op; futuramente conectará a um canal Supabase Realtime
// para invalidar queries (sessions, heatmaps) ao receber eventos.

import { useEffect } from "react";

export function useRealtime(_channel?: string) {
  useEffect(() => {
    // TODO: conectar WebSocket / Supabase Realtime
    return () => {
      // cleanup
    };
  }, [_channel]);
}
