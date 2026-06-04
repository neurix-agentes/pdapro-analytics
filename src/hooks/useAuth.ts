// PDA Sport — Hook de sessão Supabase
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("[PDA DEBUG] onAuthStateChange", event, { userId: s?.user?.id ?? null });
      setSession(s);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      console.log("[PDA DEBUG] getSession (init)", { userId: data.session?.user?.id ?? null });
      setSession(data.session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export type { User, Session };
