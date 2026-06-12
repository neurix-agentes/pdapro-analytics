# Corrigir contagem de atletas por time

## Problema
Em `src/services/index.ts`, `mapTeamRow` define `athletes_count: 0` fixo. Por isso o card/coluna "Atletas" sempre exibe 0, mesmo havendo atletas vinculados ao time.

## Solução
Calcular a contagem real a partir da tabela `athletes` (apenas atletas com `status = 'active'`, alinhado ao filtro padrão usado no app), em `teamsService.list` e `teamsService.get`.

### Etapa 1 — `teamsService.list`
- Após buscar `teams`, consultar `athletes` com:
  `select('team_id').in('team_id', teamIds).eq('status','active')`
- Agregar em um `Map<teamId, number>` e popular `athletes_count` em cada time retornado.
- Se a lista de times vier vazia, pular a query.

### Etapa 2 — `teamsService.get`
- Após buscar o time, executar `select('id', { count: 'exact', head: true }).eq('team_id', id).eq('status','active')` em `athletes` e preencher `athletes_count`.

### Etapa 3 — Também atualizar `clubsService` (mesmo bug latente)
- `active_teams` e `active_athletes` estão fixos em 0 em `mapClubRow`. Como o card de clubes já exibe esses valores, popular ambos em `clubsService.list`/`get` usando contagens reais (`teams` por `club_id`, `athletes` ativos por `club_id`).
- Manter escopo: só ajustar se for trivial; caso contrário, deixar fora desta fase e abrir como follow-up.

## Fora de escopo
- Não criar view/RPC nem migration; tudo no client.
- Não alterar tipos (`Team.athletes_count` continua `number`).
- Sem mudanças em UI, filtros, ordenação ou mocks.

## Validação
- Abrir `/teams` → coluna "Atletas" reflete o número real de atletas ativos.
- `TeamSwitcher` mostra o mesmo valor.
- `/clubs/:id` (se Etapa 3 for aplicada) mostra contagens reais.
