## Fase 5.2.1 — Sessões reais (criar + listar)

Substituir os mocks de sessões/campos por dados reais do Supabase e permitir cadastrar uma nova sessão vinculada a um atleta e a um campo. Sem upload GPX, sem Engine, sem heatmaps.

### 1. Banco de dados (migração)

A tabela `public.sessions` já existe (club_id, team_id, athlete_id, field_id, session_type, status, date, duration_min, metrics, …). Ajustes mínimos:

- Adicionar coluna `notes TEXT` (campo "Observações").
- Adicionar valor `'pending'` ao enum `public.session_status` (hoje: queued/processing/processed/failed) para refletir o status inicial pedido. Default da coluna passa para `'pending'`.
- RLS de `sessions` e `fields`: garantir policies por clube (SELECT/INSERT membros do clube; UPDATE/DELETE owner/admin/coach) usando `is_club_member` / `has_club_role`. GRANTs para `authenticated` e `service_role`.

### 2. Service layer (`src/services/index.ts`)

- `fieldsService.list({ clubId })`: passar a consultar `public.fields` filtrando por `club_id`. Mapear para o tipo `Field`.
- `sessionsService`:
  - `list({ clubId, teamId })`: SELECT real ordenado por `date desc`, filtrado por escopo.
  - `recent(scope, n)`: idem com `limit n`.
  - `create({ club_id, athlete_id, field_id, team_id?, session_type, date, notes? })`: INSERT com `status = 'pending'`. `team_id` derivado do atleta selecionado.
- Atualizar `src/types/index.ts`: adicionar `'pending'` em `SessionStatus`, campo opcional `notes` em `Session`.

### 3. Hooks

- `src/hooks/queries.ts`: adicionar `useFields()` (escopo do clube atual). `useSessions` já existe e passará a retornar dados reais.
- `src/hooks/mutations.ts`: adicionar `useCreateSession()` que invalida `["sessions", …]`.

### 4. UI — Nova Sessão

Novo arquivo `src/components/sessions/SessionFormDialog.tsx` (modal shadcn `Dialog` + `react-hook-form` + `zod`), padrão visual igual a `AthleteFormDialog`.

Campos:
- **Atleta** (obrigatório) — combobox/lista com atletas do clube atual (`useAthletes`, somente `status='active'`), exibindo foto, nome, categoria do time e posição.
- **Campo** (obrigatório) — combobox com campos do clube (`useFields`), exibindo nome, superfície e dimensões `width_m × length_m`. Observação: a tabela `fields` não tem coluna "cidade"; usaremos a superfície + dimensões, e exibiremos a cidade do clube no cabeçalho do modal. (Sem alteração de schema para isso — confirmar se quer adicionar `city` em `fields` em fase futura.)
- **Data da sessão** (datepicker shadcn com `pointer-events-auto`).
- **Tipo da atividade** — select com `treino | jogo | amistoso | avaliacao`.
- **Observações** — textarea opcional.

Layout: wizard de etapa única com seções visuais (Atleta → Campo → Detalhes), responsivo, identidade visual atual (glass, primary glow). Validação Zod com mensagens claras; toast de sucesso/erro.

### 5. UI — Página Sessões (`src/routes/_app.sessions.tsx`)

- Botão "Nova sessão" abre o `SessionFormDialog`.
- Tabela passa a refletir dados reais (`useSessions`), incluindo status `pending` com tom neutro/aviso.
- Esconder/ocultar a zona de upload GPX (fora de escopo) ou deixá-la desabilitada com label "Em breve".
- Coluna "Campo" adicional (opcional) para mostrar o `field` vinculado.

### Fora de escopo (explícito)

- Upload de GPX, integração FastAPI, geração de heatmaps, relatórios, edição/exclusão de sessões.

### Validação

- Criar sessão de um atleta do clube atual → aparece na lista com status `pending`.
- Trocar de clube no `ClubSwitcher` filtra atletas, campos e sessões corretamente.
- RLS: usuário fora do clube não vê/cria sessões.
