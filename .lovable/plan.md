
# PDA Sport — Fase 2: Arquitetura SaaS Escalável

Transformar a base atual em uma plataforma SaaS multi-clubes / multi-times com hierarquia completa, mantendo o visual dark premium já estabelecido. **Sem backend real** — toda a camada de dados será mockada mas estruturada como se já existisse uma API.

---

## 1. Camada de Dados (Mock + Tipos)

Criar a estrutura `src/` preparada para a API futura:

```text
src/
├── types/           → entidades TS (Club, Team, Coach, Athlete, Session, Heatmap, Report, Field)
├── api/             → client fetch + interceptors (mock por enquanto)
├── services/        → clubsService, teamsService, athletesService, sessionsService...
├── hooks/           → useClubs, useTeams, useAthletes (TanStack Query wrappers)
├── store/           → authStore, clubStore, teamStore, athleteStore, sessionStore, notificationStore (Zustand)
└── mocks/           → dados realistas: 3 clubes, ~6 times, ~40 atletas, ~80 sessões, heatmaps
```

**Entidades hierárquicas** — toda Session pertence a Athlete → Team → Club. Os services aceitam filtros `clubId`/`teamId` para refletir o switcher ativo.

## 2. Stores Zustand

- `authStore` — usuário atual, role (`admin | club | coach | athlete`), helpers `hasRole`, `hasPermission`
- `clubStore` — `currentClubId`, lista de clubes do usuário, `setCurrentClub()`
- `teamStore` — `currentTeamId` (escopo ao clube ativo), `setCurrentTeam()`
- `athleteStore`, `sessionStore` — caches locais + filtros ativos
- `notificationStore` — toasts/feed in-app

Trocar clube ou time **invalida queries** dependentes via `queryClient.invalidateQueries` → dashboard, atletas, sessões e heatmaps se atualizam automaticamente.

## 3. Sidebar Premium (Refatorar `AppShell`)

Topo da sidebar:

```text
┌──────────────────────────┐
│ [Logo] Grêmio Academy ▼  │  ← ClubSwitcher (dropdown shadcn)
│        Sub-17        ▼   │  ← TeamSwitcher (escopo ao clube)
├──────────────────────────┤
│ ○ Dashboard              │
│ ○ Atletas                │
│ ○ Sessões                │
│ ○ Heatmaps               │
│ ○ Relatórios             │
│ ○ Campos                 │
│ ○ Configurações          │
└──────────────────────────┘
```

- Switchers usam `DropdownMenu` shadcn com avatares dos clubes
- Sidebar colapsável (modo `w-16` apenas ícones) com toggle persistido
- Item ativo: glow `--shadow-glow` + barra lateral neon
- Hover: lift sutil + transition Framer Motion
- Bottom: botão "Nova sessão" + perfil compacto

## 4. Header Global

- **Breadcrumbs dinâmicos** (Clube › Time › Página)
- **Busca global** (`Cmd+K`) — `Command` shadcn com atalhos para atletas/sessões mockados
- **Sino de notificações** — popover com feed do `notificationStore`
- **Status do sistema** — chip verde "Operacional"
- **Avatar do treinador** — dropdown com perfil/logout

## 5. Rotas

Adicionar/renomear para alinhar à hierarquia:

| Rota | Conteúdo |
|---|---|
| `/_app/dashboard` | KPIs globais filtrados por clube/time ativo |
| `/_app/clubs` | **NOVA** — lista de clubes, cards com times/atletas |
| `/_app/teams` | **NOVA** — times do clube ativo, gestão de elenco |
| `/_app/athletes` | Tabela premium com filtro por time |
| `/_app/sessions` | Lista + drawer de detalhes (mock) |
| `/_app/heatmaps` | Galeria de heatmaps mockados |
| `/_app/reports` | Relatórios PDF mockados |
| `/_app/fields` | Cadastro de campos |
| `/_app/settings` | Perfil, clube, integrações, billing (stub) |
| `/auth` | Visual de login (já existe — manter) |

## 6. Dashboard Atualizado

Cards mockados reagindo ao switcher:
- Clubes ativos / Times ativos / Atletas ativos
- Sessões semanais / Distância média / Sprints / PSE médio
- Gráficos Recharts: carga semanal (Area), distribuição por posição (Pie), top sprinters (Bar)
- Tabela "Últimas sessões" premium com badges de intensidade

## 7. Design System (consolidar)

Garantir tokens em `src/styles.css` e componentes base padronizados:
- `StatCard`, `DataTable`, `EmptyState`, `PageHeader`, `Section`
- Badges semânticas (success/warning/danger/info) com glow sutil
- Skeletons premium para loading states
- Toasts via `sonner` (já presente)
- Motion: stagger nos cards do dashboard, fade nas trocas de rota

## 8. Arquitetura Preparada para o Futuro

- `api/client.ts` com interceptor de token + tratamento de erro centralizado
- `hooks/useRealtime.ts` stub (placeholder para WebSocket)
- `services/*` retornando Promises (mock hoje, fetch amanhã)
- Tipos compartilhados em `src/types` espelhando o schema Supabase futuro

---

## Fora do escopo desta fase

- Upload GPX real, FastAPI, Supabase, billing, IA, WebSocket real, RBAC enforçado no backend
- Mobile-first (apenas desktop + tablet básico)
- Login funcional (mantém o visual atual)

---

## Detalhes técnicos

- **Stack**: continua TanStack Router (não React Router) + TanStack Query + Zustand + shadcn + Framer Motion + Recharts
- **Mocks**: arquivos TS em `src/mocks/` retornados pelos services com `setTimeout` para simular latência
- **Persistência do switcher**: `localStorage` via Zustand `persist` middleware
- **Type-safety**: cada service tipado com as entidades de `src/types`

Posso seguir com a implementação?
