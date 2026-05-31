# Fase 4 — Gestão de Clubes e Times

Construir o núcleo organizacional da PDA Sport: CRUD premium de clubes e times, páginas de detalhe com abas, gestão de elenco com transferência entre times, e contexto global (clube + time + temporada) persistente em toda a plataforma. Tudo com mocks — sem Supabase real, sem backend.

## 1. Modelo de dados e mocks

`**src/types/index.ts**` — estender:

- `Club`: adicionar `state`, `country`, `secondary_color`, `description`, `archived`, `season`
- `Team`: adicionar `season`, `archived`
- `TransferRecord` (novo): `{ id, athlete_id, from_team_id, to_team_id, date, reason }`

`**src/mocks/data.ts**` — adicionar:

- Campos novos nos clubes existentes (estado/país/cor secundária/descrição)
- Mais times por clube (cobrindo Sub-09, Sub-11, Sub-13, Sub-15, Sub-17, Profissional + Feminino + Society)
- Array `mockTransfers` inicial
- Helpers `nextId()`, `countTeamsByClub()`, `countAthletesByClub()`

## 2. Stores (Zustand) — contexto global

`**src/store/index.ts**` — estender:

- `clubStore`: adicionar `clubs[]`, `createClub`, `updateClub`, `archiveClub` (mutações locais sobre mock)
- `teamStore`: adicionar `teams[]`, `createTeam`, `updateTeam`, `archiveTeam`, `transferAthlete(athleteId, toTeamId)`
- Novo `seasonStore`: `currentSeason` (default `"2025/26"`), `setSeason`, persistido
- Ao trocar de clube já invalida queries (mantido) e limpa `currentTeamId`

`**src/hooks/queries.ts**` — adicionar `useSeason()` e fazer todos os hooks (`useTeams`, `useAthletes`, `useSessions`, etc.) considerarem `season` no `queryKey` para futura expansão.

## 3. Rotas novas

```
src/routes/
  _app.clubs.tsx          (refatorar: tabela premium + ações)
  _app.clubs.$clubId.tsx  (NOVA: detalhe com abas)
  _app.teams.tsx          (refatorar: tabela + filtros)
  _app.teams.$teamId.tsx  (NOVA: management com 4 abas)
```

## 4. Módulo Clubes

### `/clubs` — listagem

- Toggle de visualização **Grid** (cards atuais) / **Tabela** (nova, default)
- Tabela: logo · nome · cidade · times · atletas · criado em · status · ações
- Botão **"Novo clube"** abre `ClubFormDialog`
- Ações por linha (dropdown): Ver detalhes · Editar · Arquivar
- Busca por nome/cidade, filtro por estado, filtro arquivados

### `ClubFormDialog` (`src/components/clubs/ClubFormDialog.tsx`)

- Tabs internas: **Identidade** (nome, cidade, estado, país) · **Marca** (cor primária + secundária com swatches, upload de escudo mock) · **Sobre** (descrição)
- Validação com `react-hook-form` + `zod`
- Submit chama `clubStore.createClub` / `updateClub`, `toast` de sucesso

### `/clubs/:clubId` — detalhe

- Header: escudo grande com glow da cor do clube, nome display, cidade/estado, badge "Ativo"
- 4 KPI cards: total atletas · times · sessões · heatmaps · distância acumulada (km)
- Tabs: **Visão Geral** (mini-gráficos reutilizando dashboard widgets escopados ao clube) · **Times** (grid de times do clube + CTA novo time) · **Treinadores** (cards) · **Estatísticas** (placeholder com `PageStub` rico)

## 5. Módulo Times

### `/teams` — listagem

- Tabela: nome · categoria · clube · atletas · treinador · temporada · ações
- Filtros: categoria (chips), clube (se `clubId` global == null), temporada
- Busca instantânea
- Botão **"Novo time"** → `TeamFormDialog`

### `TeamFormDialog` (`src/components/teams/TeamFormDialog.tsx`)

- Campos: nome, categoria (Select com presets Sub-09/11/13/15/17/Profissional/Feminino/Society + opção **"Personalizado"** com input), clube (Select, pré-preenchido com clube ativo), treinador (Select), temporada

### `/teams/:teamId` — Team Management

- Header: nome, categoria, clube (breadcrumb-like), temporada, treinador, botão editar
- 4 KPIs: atletas ativos · sessões realizadas · distância média · velocidade média
- Tabs:
  1. **Elenco** — `RosterTable` (foto, nome, posição, idade, jersey, status) com filtros (posição/faixa etária) e busca; ações por linha: Ver perfil · **Transferir** · Remover. Botão "Adicionar atleta" (modal mock).
  2. **Sessões** — reusar `RecentSessionsTable` escopado ao team
  3. **Heatmaps** — grid reutilizando `RecentHeatmapsCarousel` em modo galeria
  4. **Relatórios** — lista simples mock

### `TransferAthleteDialog` (`src/components/teams/TransferAthleteDialog.tsx`)

- Visualização: card do atleta · seta animada · select "Time destino" (apenas times do mesmo clube)
- Mostra "Sub-15 → Sub-17", motivo opcional
- Confirmação dupla, chama `teamStore.transferAthlete`, registra `mockTransfers`, toast

## 6. Switchers globais (já existem — ajustes)

- `ClubSwitcher` e `TeamSwitcher` já implementados em `src/components/app/`. Verificar que estão **visíveis em toda a app** (já estão no `AppShell`).
- Adicionar pequeno **SeasonSwitcher** ao lado do TeamSwitcher (dropdown compacto com 2 temporadas mock).
- Garantir reset de team ao trocar clube (já feito) + invalidate queries.

## 7. UI / Design

- Tabelas: estilo Linear/Vercel — header sticky, linhas com hover sutil, divisores `border-border/40`, ações com `DropdownMenu` em ícone `MoreHorizontal`
- Cards/dialogs: `glass`, bordas arredondadas `rounded-2xl`, glow discreto na cor primária do clube
- Microinterações: `framer-motion` stagger nas linhas/cards; transições suaves nas tabs
- Mantém paleta dark `#050505` / primary `#00FF88` / info `#3B82F6`
- Empty states ilustrados (sem dados → CTA)

## 8. Fora de escopo (explicitamente)

- Supabase real, FastAPI, upload GPX, heatmap real, websocket, billing, auditoria persistida
- Upload real de escudo (apenas preview local via `URL.createObjectURL`)
- Permissões/RBAC (Fase posterior)

## Arquivos a criar

- `src/routes/_app.clubs.$clubId.tsx`
- `src/routes/_app.teams.$teamId.tsx`
- `src/components/clubs/ClubFormDialog.tsx`
- `src/components/clubs/ClubsTable.tsx`
- `src/components/teams/TeamFormDialog.tsx`
- `src/components/teams/TeamsTable.tsx`
- `src/components/teams/RosterTable.tsx`
- `src/components/teams/TransferAthleteDialog.tsx`
- `src/components/app/SeasonSwitcher.tsx`

## Arquivos a editar

- `src/types/index.ts` · `src/mocks/data.ts` · `src/store/index.ts` · `src/hooks/queries.ts` · `src/services/index.ts`
- `src/routes/_app.clubs.tsx` · `src/routes/_app.teams.tsx`
- `src/components/app/AppShell.tsx` (encaixe do SeasonSwitcher)

## Resultado final

Navegação fluida **Clube → Times → Elenco** com CRUD funcional sobre mocks, transferência visual de atletas entre times do mesmo clube, contexto global persistente (clube + time + temporada) respeitado por dashboard, sessões, heatmaps e relatórios — pronto para plugar Supabase na Fase 5.