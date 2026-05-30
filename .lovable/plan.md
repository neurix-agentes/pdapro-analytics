# Fase 3 — Lovable Cloud + Dashboard Analytics Premium

## Parte 1 — Conectar Lovable Cloud

Vou habilitar o Lovable Cloud (Supabase gerenciado) para preparar autenticação real e storage de arquivos GPS.

**O que será provisionado automaticamente:**

- Projeto Supabase conectado
- Cliente browser (`@/integrations/supabase/client`)
- Cliente admin server-side (`client.server.ts`)
- Middleware de auth para server functions
- Variáveis de ambiente (`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` etc.)

**O que NÃO será implementado nesta fase** (apenas conexão + estrutura):

- Migrations das tabelas reais (athletes, sessions, heatmaps...) — fica para Fase 4
- Login real / signup UI funcional — Fase 4
- Upload real de GPX para Storage — Fase 4
- RLS policies definitivas — Fase 4

**O que será preparado:**

- Criação dos buckets de Storage: `gps-files` (privado), `heatmaps` (público), `reports` (privado) via migration
- RLS básico nos buckets (somente authenticated insert/select)
- Stub de `authStore` apontando para `supabase.auth` (mantendo mock fallback enquanto não houver users)

Pergunta: a migration das tabelas de domínio (clubs, teams, athletes, sessions, heatmaps, reports, fields, coaches, user_roles) entra agora junto com a conexão, ou só na Fase 4 quando formos plugar auth real? **Recomendação:** só a conexão + buckets agora — mantém o mock layer intacto para a Fase 3 do dashboard. Confirme se concorda.

## Parte 2 — Dashboard Analytics Premium

Refatorar `src/routes/_app.dashboard.tsx` para um analytics hub de nível Hudl/StatsBomb. Tudo reativo aos switchers de Clube/Time já existentes.

### 2.1 Estrutura visual (grid bento)

```
┌─────────────────────────────────────────────────────────┐
│  Filters bar: Período | Tipo sessão | Posição | Export │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│  KPI 1   │  KPI 2   │  KPI 3   │  KPI 4   │   KPI 5    │
│ Atletas  │ Sessões  │ Distância│ Sprints  │ Vel. Máx   │
├──────────┴──────────┴──────────┼──────────┴────────────┤
│  Carga Semanal (AreaChart)     │ Distribuição Posições │
│  com comparativo média do clube│  (RadialBar/Pie)      │
├────────────────────────────────┼───────────────────────┤
│  Top 5 Atletas (ranking card)  │ Intensidade Treinos   │
│  com sparklines individuais    │  (BarChart stacked)   │
├────────────────────────────────┼───────────────────────┤
│  Heatmaps Recentes (carousel)  │ Sessões Recentes      │
│  thumbnails clicáveis          │  (DataTable)          │
├────────────────────────────────┴───────────────────────┤
│  Comparativo Atleta vs Média Time (radar chart)        │
└────────────────────────────────────────────────────────┘
```

### 2.2 Componentes novos (`src/components/dashboard/`)

- `DashboardFilters.tsx` — período (7d/30d/temporada), tipo sessão, posição. Estado via `useState` + URL search params.
- `KpiGrid.tsx` — 5 StatCards com trend % vs período anterior.
- `WeeklyLoadChart.tsx` — AreaChart com linha de média do clube sobreposta.
- `PositionDistributionChart.tsx` — RadialBarChart (Recharts).
- `IntensityChart.tsx` — BarChart stacked (baixa/média/alta intensidade).
- `AthleteRankingCard.tsx` — Top 5 por distância/sprints com sparkline mini.
- `RecentHeatmapsCarousel.tsx` — embla-carousel com thumbnails (usa `heatmap-preview.jpg` existente como mock).
- `RecentSessionsTable.tsx` — tabela com badges semânticos (intensidade, status processing/processed).
- `AthleteComparisonRadar.tsx` — RadarChart com 6 dimensões físicas, atleta selecionado vs média.

### 2.3 Data layer (mocks)

Estender `src/mocks/data.ts`:

- Métricas físicas mais ricas por atleta (acceleration, deceleration, HSR distance, PSE histórico)
- Histórico de 8 semanas de carga por atleta (para sparklines + trend)
- Função `computeAggregates(scope, period)` para KPIs derivados

Estender `src/hooks/queries.ts`:

- `useDashboardKpis(period)`
- `useWeeklyLoad(period)`
- `useAthleteRanking(metric, n)`
- `useAthleteComparison(athleteId)`

Todos reagem a `clubId`/`teamId` via `useScope` (já implementado).

### 2.4 Estados premium

- **Loading:** skeleton shimmer custom (gradient neon sutil) em cada widget, não bloco genérico.
- **Empty:** ilustração + CTA "Importar primeira sessão" quando scope vazio.
- **Animations:** Framer Motion stagger nos cards (delay incremental 0.05s), hover lift + glow nos KPIs, número animado (count-up) nos valores KPI.

### 2.5 Visual / tokens

- Reaproveitar `glass`, `--shadow-glow`, `--primary` já em `styles.css`.
- Adicionar tokens: `--chart-grid`, `--intensity-low/med/high`, gradient overlays para cards premium.
- Tipografia: números em font-display (já configurada), tabular-nums para alinhamento.

## Detalhes técnicos

- **Sem mudança de rotas** — apenas refatora `_app.dashboard.tsx`.
- **Sem backend real** — toda data via service mock + TanStack Query (latência 180ms já mantém UX de loading realista).
- **Filtros** persistem em URL via `Route.useSearch` do TanStack Router (preparar `validateSearch`).
- **Recharts** já instalado; embla-carousel verificar no `package.json` (instalar se faltar).

## Fora de escopo desta fase

- Auth real / login funcional
- Upload GPX real
- Tabelas de domínio no Supabase
- Edge functions / FastAPI
- Realtime websocket
- Export PDF/CSV (botão visível, mas no-op com toast)

---

Confirme:

1. Pode habilitar Lovable Cloud agora (somente conexão + buckets, sem migrations de domínio)? sim
2. Pode seguir com o dashboard conforme layout acima, ou prefere ajustar algum widget? sim