import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Posture = {
  heatmaps_private: boolean;
  club_members_owner_only: boolean;
  storage_scoped_ok: boolean;
  storage_scoped_policy_count: number;
  debug_whoami_removed: boolean;
  checked_at: string;
};

const CHECKS: Array<{
  key: keyof Posture;
  label: string;
  fix: string;
}> = [
  {
    key: "heatmaps_private",
    label: "Bucket heatmaps privado",
    fix: "UPDATE storage.buckets SET public = false WHERE id = 'heatmaps';",
  },
  {
    key: "club_members_owner_only",
    label: "club_members.INSERT restrito a owners/admins",
    fix: "Remover branch (user_id = auth.uid()) da policy INSERT de club_members; manter apenas is_club_owner(auth.uid(), club_id).",
  },
  {
    key: "storage_scoped_ok",
    label: "Policies de storage (gps-files / reports / heatmaps) escopadas por clube",
    fix: "Recriar policies em storage.objects usando is_club_member(auth.uid(), (storage.foldername(name))[1]::uuid).",
  },
  {
    key: "debug_whoami_removed",
    label: "RPC debug_whoami removida",
    fix: "DROP FUNCTION public.debug_whoami();",
  },
];

export function SecurityPostureBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(true);

  const q = useQuery({
    queryKey: ["security_posture"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("security_posture_check");
      if (error) throw error;
      return data as Posture;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  if (q.isLoading || q.isError || !q.data || dismissed) return null;

  const failing = CHECKS.filter((c) => !q.data[c.key]);
  const allGreen = failing.length === 0;

  if (allGreen) {
    return (
      <div className="mx-6 lg:mx-8 mt-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-medium">Postura de segurança: todas as proteções ativas.</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dispensar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-6 lg:mx-8 mt-4 rounded-xl border border-destructive/40 bg-destructive/10 text-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-4 w-4" />
          <span className="font-semibold">
            {failing.length} migração{failing.length > 1 ? "ões" : ""} de segurança pendente{failing.length > 1 ? "s" : ""}
          </span>
          <span className="text-destructive/80">— aprove no chat para aplicar.</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs text-destructive/90 hover:text-destructive"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {open ? "Ocultar" : "Detalhes"}
        </button>
      </div>
      {open && (
        <div className="border-t border-destructive/30 px-4 py-3 space-y-2">
          {failing.map((c) => (
            <div key={c.key} className="space-y-1">
              <div className="flex items-start gap-2 text-xs">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{c.label}</div>
                  <pre className="mt-1 overflow-x-auto rounded-md bg-background/60 border border-border/60 px-2 py-1 text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
                    {c.fix}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
