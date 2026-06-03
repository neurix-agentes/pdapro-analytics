import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2, Mail, KeyRound, Users, ShieldAlert } from "lucide-react";
import { useClubStore } from "@/store";
import { useClubInvites, useClubMembers, useMyRole } from "@/hooks/queries";
import { useCreateInvite, useRevokeInvite } from "@/hooks/mutations";
import type { ClubRole } from "@/services";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Configurações · PDA Sport" }] }),
  component: SettingsPage,
});

const ROLES: { value: ClubRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "coach", label: "Treinador" },
  { value: "assistant_coach", label: "Auxiliar técnico" },
  { value: "analyst", label: "Analista" },
  { value: "athlete", label: "Atleta" },
];

function SettingsPage() {
  const clubId = useClubStore((s) => s.currentClubId);
  const { role } = useMyRole(clubId);
  const isAdmin = role === "owner" || role === "admin";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Conta</div>
        <h1 className="text-2xl font-semibold mt-1">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie membros, convites e dados do clube.
        </p>
      </div>

      {!clubId && (
        <Notice icon={<ShieldAlert className="h-4 w-4" />}>
          Selecione um clube no menu lateral para gerenciar membros e convites.
        </Notice>
      )}

      {clubId && !isAdmin && (
        <Notice icon={<ShieldAlert className="h-4 w-4" />}>
          Apenas owners e admins podem gerenciar membros e convites deste clube.
        </Notice>
      )}

      {clubId && isAdmin && (
        <>
          <MembersSection clubId={clubId} />
          <InvitesSection clubId={clubId} />
        </>
      )}
    </div>
  );
}

function Notice({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 flex items-start gap-3 text-sm text-muted-foreground">
      <span className="text-warning mt-0.5">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function MembersSection({ clubId }: { clubId: string }) {
  const { data, isLoading } = useClubMembers(clubId);
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5">
      <header className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Membros</h2>
        <span className="text-xs text-muted-foreground">({data?.length ?? 0})</span>
      </header>
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Carregando…</div>
      ) : (
        <ul className="divide-y divide-border/60">
          {(data ?? []).map((m) => (
            <li key={m.id} className="py-3 flex items-center justify-between text-sm">
              <span className="font-mono text-xs text-muted-foreground truncate max-w-[60%]">{m.user_id}</span>
              <RolePill role={m.role as ClubRole} />
            </li>
          ))}
          {(data ?? []).length === 0 && (
            <li className="py-3 text-xs text-muted-foreground">Nenhum membro além de você.</li>
          )}
        </ul>
      )}
    </section>
  );
}

function InvitesSection({ clubId }: { clubId: string }) {
  const { data, isLoading } = useClubInvites(clubId);
  const create = useCreateInvite();
  const revoke = useRevokeInvite(clubId);
  const [role, setRole] = useState<ClubRole>("coach");
  const [email, setEmail] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({ club_id: clubId, role, email: email || null });
      toast.success("Convite gerado!");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar convite.");
    }
  }

  const inviteUrl = (code: string) =>
    `${window.location.origin}/onboarding?invite=${encodeURIComponent(code)}`;

  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-5">
      <header className="flex items-center gap-2 mb-4">
        <Mail className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Convites</h2>
      </header>

      <form onSubmit={handleCreate} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 mb-5">
        <label className="block">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Papel</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ClubRole)}
            className="mt-1 w-full rounded-xl bg-surface/60 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/60"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">E-mail (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="restringir a um e-mail"
            className="mt-1 w-full rounded-xl bg-surface/60 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/60"
          />
        </label>
        <button
          type="submit"
          disabled={create.isPending}
          className="self-end rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {create.isPending ? "Gerando…" : "Gerar convite"}
        </button>
      </form>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Carregando…</div>
      ) : (
        <ul className="divide-y divide-border/60">
          {(data ?? []).map((inv) => {
            const active = !inv.revoked_at && new Date(inv.expires_at) > new Date() && inv.uses < inv.max_uses;
            return (
              <li key={inv.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono tracking-widest text-foreground">{inv.code}</span>
                    <RolePill role={inv.role} />
                    {!active && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">inativo</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {inv.email ?? "Aberto"} · usa {inv.uses}/{inv.max_uses} · expira {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl(inv.code));
                      toast.success("Link copiado!");
                    }}
                    className="rounded-lg border border-border bg-surface/60 px-2.5 py-1.5 text-xs hover:bg-surface inline-flex items-center gap-1.5"
                  >
                    <Copy className="h-3 w-3" /> Copiar link
                  </button>
                  {active && (
                    <button
                      onClick={() => revoke.mutate(inv.id)}
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/20 inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3 w-3" /> Revogar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {(data ?? []).length === 0 && (
            <li className="py-3 text-xs text-muted-foreground">Nenhum convite gerado ainda.</li>
          )}
        </ul>
      )}
    </section>
  );
}

function RolePill({ role }: { role: ClubRole }) {
  const label = ROLES.find((r) => r.value === role)?.label
    ?? (role === "owner" ? "Owner" : role);
  return (
    <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
      {label}
    </span>
  );
}
