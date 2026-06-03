## Correção — RLS de `clubs` no onboarding

### Causa raiz

A política de INSERT da tabela `clubs` é:

```
WITH CHECK (auth.uid() = created_by)
```

Ela só passa se o cliente enviar `created_by` exatamente igual ao `auth.uid()` do JWT. Hoje o `clubsService.create` faz isso, **mas**:

1. Se a sessão estiver levemente fora de sincronia (signup → onboarding antes do listener atualizar), `getUser()` pode retornar um id, mas o JWT enviado no header ainda ser de outro estado → `auth.uid()` no banco ≠ `created_by` enviado → RLS violada.
2. Nenhuma tabela em `public` tem `GRANT` explícito para `authenticated`/`service_role` (verificado em `information_schema.role_table_grants` → 0 linhas). Hoje o acesso ocorre só via privilégios herdados do schema — frágil e fora do padrão Lovable Cloud.
3. A política depende 100% do cliente lembrar de mandar `created_by`. Qualquer caminho futuro que esqueça quebra com o mesmo erro.

### Plano

**1. Migration de correção** (`fix_clubs_rls_onboarding`):

- `ALTER TABLE public.clubs ALTER COLUMN created_by SET DEFAULT auth.uid();`
  Garante que mesmo se o cliente não enviar `created_by`, o Postgres preenche com o usuário autenticado.

- Recriar a INSERT policy de `clubs` para ser tolerante e correta:
  ```sql
  DROP POLICY "clubs auth insert" ON public.clubs;
  CREATE POLICY "clubs auth insert" ON public.clubs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
  ```
  Combinado com o DEFAULT acima, isso é à prova de cliente: se omitir `created_by`, o default vira `auth.uid()` e a check passa; se enviar errado, falha como deve.

- Adicionar `GRANT`s explícitos em todas as tabelas `public` (corrige fragilidade arquitetural):
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON
    public.clubs, public.club_members, public.teams, public.coaches,
    public.athletes, public.fields, public.sessions, public.heatmaps,
    public.reports, public.transfers, public.profiles
    TO authenticated;
  GRANT SELECT ON public.user_roles TO authenticated;
  GRANT ALL ON
    public.clubs, public.club_members, public.teams, public.coaches,
    public.athletes, public.fields, public.sessions, public.heatmaps,
    public.reports, public.transfers, public.profiles, public.user_roles
    TO service_role;
  ```

- Reforçar a INSERT policy de `club_members` para cobrir o caso do trigger SECURITY DEFINER (já cobre, mas explicitar):
  *(sem mudanças — política atual `is_club_owner OR user_id = auth.uid()` já contempla o trigger e o owner.)*

**2. Ajuste no `clubsService.create`** (`src/services/index.ts`):

- Manter `created_by: u.user.id` (cinto + suspensório com o DEFAULT).
- Adicionar fallback: se `supabase.auth.getUser()` falhar ou retornar `null`, lançar erro claro **antes** do insert, em vez de deixar o RLS falhar opaco.
- Após criar o clube, fazer um `await` curto e em seguida invalidar `myClubIds` (já feito no hook) — mantém comportamento.

**3. Garantir owner em `club_members` mesmo se o trigger falhar** (defesa em profundidade):

- No `useCreateClub` (`src/hooks/mutations.ts`), após `clubsService.create`, fazer um `upsert` idempotente em `club_members` com `{ club_id, user_id, role: 'owner' }` (`onConflict: 'club_id,user_id'`). O trigger já faz isso, mas o upsert garante que o usuário **sempre** vire membro do clube que acabou de criar, mesmo em cenários de erro do trigger.

**4. Isolamento e segurança (sem mudanças, apenas confirmar)**:

- SELECT/UPDATE/DELETE de `clubs` continuam restritos a membros via `is_club_member` / `is_club_owner`.
- Demais tabelas (`teams`, `athletes`, etc.) continuam escopadas por `is_club_member(auth.uid(), club_id)`.
- Nenhum acesso a clubes de terceiros é aberto.

### Validação (após aplicar)

1. Logout → signup novo usuário → onboarding cria clube → cria time → `/dashboard` sem erro.
2. `select * from clubs` no SQL editor com outro usuário não deve listar o clube alheio (RLS SELECT ok).
3. `select * from club_members where user_id = auth.uid()` deve conter o registro `owner` do clube recém-criado.

### Arquivos tocados

- `supabase/migrations/<timestamp>_fix_clubs_rls_onboarding.sql` (nova)
- `src/services/index.ts` (ajuste pequeno no `create`)
- `src/hooks/mutations.ts` (upsert defensivo em `club_members`)

### Fora de escopo

- Refator de policies das demais tabelas.
- Mudanças no fluxo visual do onboarding.
- Convite de outros membros (próxima fase).
