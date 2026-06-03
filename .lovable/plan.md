# Plano — Onboarding com Convites e Roles Expandidas

## Objetivo

Substituir o onboarding forçado ("crie um clube") por uma escolha clara:
1. **Criar um novo clube** (vira OWNER)
2. **Entrar em um clube existente** (via código de convite, recebe role definida pelo convite)

Expandir as roles de `club_members` para suportar o ciclo completo do time esportivo, e usar exclusivamente `club_members.role` para controle de permissões (não usar `clubs.created_by` para autorização — apenas auditoria).

## 1. Banco de dados (migração)

### Expandir enum `club_role`
Atualmente: `owner, admin, coach, member`.
Adicionar: `assistant_coach, analyst, athlete`.
Manter `member` por compatibilidade (migrado depois) ou mapear para `analyst`.

Final: `owner, admin, coach, assistant_coach, analyst, athlete` (drop `member` após migração de dados).

### Nova tabela `club_invites`
Campos de domínio:
- `club_id` (FK lógica para clubs)
- `code` (text único, ex.: 8 chars base32) — usado como link/código
- `role` (club_role) — role que o convidado receberá
- `email` (text, opcional — restringe a um e-mail específico)
- `expires_at` (timestamptz, default now() + 30d)
- `max_uses` (int, default 1), `uses` (int, default 0)
- `created_by` (uuid, default auth.uid())
- `revoked_at` (timestamptz, nullable)

Helper SQL: função `redeem_club_invite(_code text)` SECURITY DEFINER:
- Valida código ativo (não expirado, não revogado, `uses < max_uses`, email match se setado)
- Insere `club_members(club_id, user_id=auth.uid(), role)` com `ON CONFLICT DO NOTHING`
- Incrementa `uses`
- Retorna `club_id`

### RLS de `club_invites`
- SELECT: owner/admin do clube OU dono do código pelo `code` exato (lookup público restrito a 1 row via função, não policy)
- INSERT/UPDATE/DELETE: apenas owner/admin do clube (`is_club_owner`)
- O resgate **NÃO** depende de SELECT direto — usa `redeem_club_invite()` (SECURITY DEFINER) que faz lookup pelo `code`.

### GRANTs
Conceder `SELECT, INSERT, UPDATE, DELETE` em `club_invites` para `authenticated`; `EXECUTE` em `redeem_club_invite` para `authenticated`.

### RLS de `clubs` (já corrigida na última migração — manter)
Confirmar:
- INSERT com `WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid())`
- `created_by DEFAULT auth.uid()`
- Trigger `tg_club_add_owner` insere owner em `club_members` automaticamente

Permissões em todo o app passam a usar `is_club_member` / `is_club_owner` + checagem fina de role via novo helper `has_club_role(_user, _club, _roles[])` quando necessário (ex.: só COACH/ASSISTANT_COACH editam sessões).

## 2. Frontend

### `src/routes/onboarding.tsx` — refazer com 3 telas
```text
Step 0: Escolha
  ┌─ Criar novo clube  → Step 1A (form clube) → Step 2A (form time) → /dashboard
  └─ Entrar em clube   → Step 1B (código convite) → /dashboard
```
- Cards grandes com ícones (`Building2` / `Mail`), descrições conforme briefing.
- Step 1B: input do código + botão "Entrar". Chama `supabase.rpc('redeem_club_invite', { _code })`.
- Em sucesso: `setCurrentClub(clubId)`, `qc.invalidateQueries(['myClubIds'])`, navega `/dashboard`.
- Em erro: toast com mensagem da função (código inválido, expirado, e-mail divergente).

### Settings → nova aba "Membros & Convites" (`/settings`)
- Lista de membros do clube atual com sua role (somente owner/admin vê)
- Botão "Gerar convite": modal escolhe role e (opcional) e-mail/expiração → gera código
- Lista de convites ativos com botão "Copiar link" (`/onboarding?invite=CODE`) e "Revogar"
- Owner/admin pode alterar role de outros membros (exceto owner único)

### Aceite via link `/onboarding?invite=CODE`
- Se logado e código presente: pula direto para Step 1B preenchido e aciona resgate.
- Se deslogado: redireciona `/auth` preservando `?invite=` e retorna ao onboarding após login.

### `src/hooks/useAuth.ts` / hooks de role
- Novo `useMyMemberships()` retornando `[{ club_id, role }]`.
- Novo `useMyRole(clubId)` para gates de UI.

## 3. Mutations / serviços

- `useRedeemInvite(code)` → `supabase.rpc('redeem_club_invite', { _code: code })`.
- `useCreateInvite({ clubId, role, email?, expiresAt?, maxUses? })`.
- `useRevokeInvite(id)`, `useUpdateMemberRole({ clubId, userId, role })`, `useRemoveMember(...)`.

## 4. Permissões (UI guards)

Mapa inicial (ajustável depois):
- OWNER/ADMIN: tudo, inclui gestão de membros/convites/clube
- COACH/ASSISTANT_COACH: CRUD de times, atletas, sessões
- ANALYST: leitura + criação de relatórios/heatmaps
- ATHLETE: leitura do próprio perfil/sessões

Refatorar `AppShell.tsx` para esconder itens de menu conforme role no clube atual (via `useMyRole`).

## 5. Arquivos afetados

**Novos**
- `supabase/migrations/<ts>_onboarding_invites_roles.sql`
- `src/components/clubs/InviteCodeStep.tsx`
- `src/components/settings/MembersTab.tsx`
- `src/components/settings/InvitesTab.tsx`
- `src/hooks/useMyRole.ts`

**Editados**
- `src/routes/onboarding.tsx` (3 steps + suporte a `?invite=`)
- `src/routes/auth.tsx` (preservar `?invite=` no redirect pós-login)
- `src/routes/_app.settings.tsx` (abas Membros/Convites)
- `src/hooks/mutations.ts` (`useRedeemInvite`, `useCreateInvite`, `useRevokeInvite`, `useUpdateMemberRole`)
- `src/hooks/queries.ts` (`useMyMemberships`, `useClubMembers`, `useClubInvites`)
- `src/services/index.ts` (camada `invitesService`, `membershipService.updateRole`)
- `src/components/app/AppShell.tsx` (gates por role)

## 6. Validação

1. Logout → signup → onboarding mostra 2 opções.
2. "Criar clube": cria → vira OWNER em `club_members` (via trigger) → cria time → dashboard.
3. Owner abre Settings → gera convite COACH → copia link.
4. Logout → signup em outra conta → abre link `/onboarding?invite=...` → vira COACH automaticamente → vai para dashboard sem criar clube.
5. Convite expirado/revogado/2º uso (max_uses=1) é rejeitado com toast claro.
6. RLS: COACH não consegue ver/criar convites; OWNER/ADMIN consegue.

## Fora de escopo (deixar para depois)
- Convite por e-mail (envio real via Resend) — só geramos código/link agora.
- UI completa de "trocar de clube" para usuário com múltiplos memberships (o `ClubSwitcher` já existe; revisitar se necessário).
