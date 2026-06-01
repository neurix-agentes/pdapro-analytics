## Plano — Logo do Clube + Backend Foundation

Migrar a PDA Sport de mocks para Supabase real: autenticação, banco completo, storage e API layer com upload de logo.

---

### 1. Storage — bucket de logos

Criar bucket público `club-logos` (junto aos existentes `gps-files`, `heatmaps`, `reports`), com policies:
- SELECT público (qualquer um vê)
- INSERT/UPDATE/DELETE: apenas membros do clube (path = `{club_id}/logo.{ext}`)

Limite 2MB, MIME `image/png` e `image/jpeg`.

---

### 2. Banco — schema completo

Tipos enum: `app_role` (`admin`, `club_owner`, `coach`, `athlete`), `session_type`, `session_status`, `position`.

Tabelas (todas em `public`, com RLS, GRANTs, triggers `updated_at`):

```
profiles          (user_id, name, email, avatar_url)
user_roles        (user_id, role)                              -- roles globais
clubs             (id, name, short_name, city, state, country,
                   primary_color, secondary_color, description,
                   logo_url, archived, created_by)
club_members      (club_id, user_id, role)                     -- multi-tenant
teams             (id, club_id, name, category, coach_id,
                   season, archived)
coaches           (id, club_id, name, email, avatar_url)
athletes          (id, club_id, team_id, name, age, position,
                   jersey_number, photo_url, height_cm,
                   weight_kg, active)
fields            (id, club_id, name, width_m, length_m,
                   surface, gps_lat, gps_lng)
sessions          (id, club_id, team_id, athlete_id, field_id,
                   session_type, status, date, duration_min,
                   gps_file_url, metrics jsonb)
heatmaps          (id, club_id, session_id, athlete_id,
                   heatmap_png_url, thumbnail_url, metrics jsonb)
reports           (id, club_id, team_id, athlete_id,
                   title, period, report_pdf_url)
transfers         (id, athlete_id, from_team_id, to_team_id,
                   date, reason)
```

**RLS (security definer `is_club_member(uid, club_id)` para evitar recursão):**
- `profiles`: leitura/atualização do próprio usuário.
- `clubs`: SELECT/UPDATE se `is_club_member`; INSERT por usuário autenticado (vira owner).
- `club_members`: SELECT pelos próprios membros; INSERT pelo owner do clube.
- Demais tabelas: CRUD escopado por `is_club_member(auth.uid(), club_id)`.

**Triggers:**
- `on_auth_user_created` → cria `profiles` automaticamente.
- `on_club_created` → insere criador em `club_members` como `owner`.
- `updated_at` em todas.

---

### 3. Auth

- Habilitar email/senha + Google (via `configure_social_auth` com `providers: ["google"]`).
- Sem auto-confirm (verificação de e-mail obrigatória).
- HIBP password check ligado.

Páginas:
- `/auth` → reescrever com `supabase.auth.signInWithPassword`, `signUp` e botão Google via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- `/onboarding` → nova rota guiada (3 passos): **criar 1º clube** (com logo) → **criar 1º time** → concluído. Acionada quando usuário autenticado não possui `club_members`.
- Layout `_authenticated` com `beforeLoad` redirecionando para `/auth`.
- `__root.tsx`: `onAuthStateChange` invalidando React Query.

---

### 4. API Layer — substituir mocks por Supabase

Reescrever `src/services/index.ts`: cada `*Service.list/get/create/update/archive` passa a chamar `supabase.from(...).select/insert/update`.

Stores (`src/store/index.ts`):
- `useAuthStore`: derivado de `supabase.auth.getSession()` + listener (não mais `mockUser`).
- `useClubStore.createClub/updateClub/archiveClub`: viram **mutations assíncronas** que chamam `clubsService` + `queryClient.invalidateQueries(["clubs"])`.
- `useTeamStore.*` idem.
- Manter `currentClubId`, `currentTeamId`, `currentSeason` apenas como UI state persistido.

Hooks (`src/hooks/queries.ts`): manter assinaturas (`useClubs`, `useTeams`, etc.) — só a fonte muda. Adicionar `useCurrentUserClubs()` filtrando por membership.

Remover `src/mocks/data.ts` da árvore de runtime (manter como referência opcional ou deletar).

---

### 5. Upload de logo no cadastro do Clube

`ClubFormDialog.tsx`: nova aba **"Logo"** (entre Marca e Sobre) com:
- Dropzone + `<input type="file" accept="image/png,image/jpeg">`.
- Preview circular 96px.
- Validação: ≤ 2MB, PNG/JPEG.
- Ao salvar: upload para `club-logos/{clubId}/logo.{ext}` → `getPublicUrl` → grava em `clubs.logo_url`.
- Botão "Remover logo".

Renderizar `logo_url` em:
- `ClubsTable` (avatar)
- `ClubSwitcher`
- `PageHeader` do detalhe do clube
- Fallback: iniciais coloridas atuais.

---

### 6. Detalhes técnicos

- **Migração única** via `supabase--migration` (enums + tabelas + GRANTs + RLS + triggers + storage policies + bucket).
- **Vinculação de identificadores**: trocar IDs string atuais (`c_gremio`) por `uuid` gerado pelo Postgres. Tipos em `src/types/index.ts` continuam `string` (compatível com uuid).
- **TanStack Query**: stale 30s para listas, `invalidate` em mutations.
- **Loading states**: skeletons já existentes nas páginas continuam funcionando.
- **Toast** em todas as mutations (sucesso/erro com `error.message`).
- **Onboarding empty-state**: se `useCurrentUserClubs()` retorna `[]`, redireciona para `/onboarding`.

---

### Fora de escopo (continua mock/placeholder até próximas fases)

- Upload real de GPX (apenas estrutura da tabela `sessions`).
- Geração real de heatmap PNG (apenas estrutura).
- Geração real de PDF de relatório.
- Billing, RBAC fino, audit log.
- Realtime websockets.

---

### Arquivos a criar
- `supabase/migrations/<timestamp>_backend_foundation.sql`
- `src/routes/onboarding.tsx`
- `src/components/onboarding/Step1Club.tsx`, `Step2Team.tsx`
- `src/components/clubs/LogoUploader.tsx`
- `src/lib/storage.ts` (helpers de upload)

### Arquivos a editar
- `src/services/index.ts` (Supabase real)
- `src/store/index.ts` (auth via Supabase, mutations async)
- `src/hooks/queries.ts` (+ `useCurrentUserClubs`)
- `src/routes/auth.tsx` (Supabase auth + Google)
- `src/routes/_app.tsx` (guard auth)
- `src/routes/__root.tsx` (onAuthStateChange)
- `src/components/clubs/ClubFormDialog.tsx` (aba Logo + upload)
- `src/components/clubs/ClubsTable.tsx`, `src/components/app/ClubSwitcher.tsx` (render logo_url)
- `src/types/index.ts` (campo `logo_url` em Club já existe; revisar)
- `src/mocks/data.ts` → remover do runtime
