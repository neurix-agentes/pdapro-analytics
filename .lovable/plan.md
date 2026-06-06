
# Plano de auditoria — INSERT em `public.clubs`

## Por que esse plano

O erro real é `new row violates row-level security policy for table "clubs"`. Essa mensagem é gerada pelo Postgres no momento do `INSERT` (avaliação de `WITH CHECK`), **nunca** num `SELECT` pós-insert. Logo:

- A hipótese "INSERT passa e SELECT pós-insert falha" **não bate com a mensagem**. Se fosse o SELECT, o erro seria `JSON object requested, multiple (or no) rows returned` (do `.single()`) ou um retorno `data: null` sem erro.
- A policy `clubs auth insert` é `WITH CHECK (true)` e restrita ao role `{authenticated}`. A única forma de essa policy reprovar um INSERT é a requisição estar chegando como role **`anon`** (JWT ausente/expirado no momento exato do INSERT) ou estar sendo avaliada uma policy diferente da listada.

Vou executar **as duas trilhas em paralelo** numa só rodada de diagnóstico, sem corrigir nada ainda.

---

## Trilha 1 — Probe de role/JWT no momento do INSERT

Objetivo: provar se o PostgREST está vendo `authenticated` ou `anon` no exato momento da chamada que falha.

Ações (sem alterar policies):

1. Criar uma RPC `pda_audit_whoami()` (SECURITY INVOKER, não-DEFINER) que retorna `auth.uid()`, `auth.role()`, `current_user`, `current_setting('request.jwt.claims', true)`.
   - Não-DEFINER é essencial: precisamos do role que o PostgREST está aplicando à request, não o role do owner da função.
2. Em `clubsService.create`, imediatamente antes do `.insert(...)`, chamar `supabase.rpc('pda_audit_whoami')` e logar em `emitPdaDebug` como `step: "WHOAMI_BEFORE_INSERT"`.
3. Logar também `supabase.auth.getSession()` → `access_token` (apenas tamanho/primeiros chars, não o token completo) e `expires_at`, para detectar token expirado.
4. Inspecionar o request real no Network: confirmar se o header `Authorization: Bearer ...` está presente na chamada POST `/rest/v1/clubs`.

Resultado esperado:
- Se `WHOAMI_BEFORE_INSERT.auth_role === "anon"` → confirmado: cliente Supabase está sem JWT nessa chamada. Causa raiz fora da policy.
- Se `auth_role === "authenticated"` e o INSERT mesmo assim falha → existe outra policy/constraint reprovando (precisa investigar `pg_policies` para INSERT em runtime).

---

## Trilha 2 — TESTE A / B / C (insert sem returning)

Objetivo solicitado pelo usuário: separar erro de INSERT vs erro de SELECT pós-insert.

Em `src/services/index.ts > clubsService.create`, atrás de uma flag `PDA_AUDIT_MODE` (constante local no topo do arquivo, valor `"A" | "B" | "C" | "off"`) executar:

- **TESTE A** — `await supabase.from("clubs").insert(insertPayload)` (sem `.select`). Logar:
  - `step: "TEST_A_INSERT_ONLY"`, `insertData`, `insertError` serializado.
- **TESTE B** — `await supabase.from("clubs").insert(insertPayload).select("id")` (sem `.single()`). Logar:
  - `step: "TEST_B_INSERT_SELECT_ID"`, `data`, `error`.
- **TESTE C** — manter `.insert().select("*").single()` mas envolver em dois `try/catch` lógicos (na verdade: detectar se o `error.code` é do PostgREST de "0 rows" vs erro de RLS no insert) e emitir dois eventos distintos:
  - `step: "INSERT_ERROR"` quando `error.message` contém `violates row-level security` ou código `42501`.
  - `step: "RETURNING_ERROR"` quando `error.code === "PGRST116"` (`JSON object requested, multiple (or no) rows returned`) — esse é o sintoma real de "SELECT pós-insert bloqueado pela policy de leitura".

Os três rodam na mesma submissão do formulário, sequencialmente, todos com payload diferente em `name` (`PDA-AUDIT-A`, `PDA-AUDIT-B`, `PDA-AUDIT-C`) para não colidir. Em caso de TESTE A/B criarem linhas órfãs, anotar os ids no log para limpeza posterior por migration.

---

## Interpretação cruzada dos resultados

| Trilha 1 (`auth_role`) | TESTE A (`insert`) | TESTE B (`insert+select id`) | Conclusão |
|---|---|---|---|
| `anon` | falha com `violates RLS` | falha igual | **Causa: JWT não está sendo anexado** ao request — problema no client/auth, não em policy. Próximo passo: investigar por que `supabase-js` envia anon nessa chamada (provavelmente sessão perdida ou client diferente). |
| `authenticated` | falha com `violates RLS` | falha igual | Existe outra policy/constraint INSERT além da listada, ou a policy real em runtime difere do schema reportado. Próximo passo: `SELECT * FROM pg_policies WHERE tablename='clubs'` em runtime. |
| `authenticated` | sucesso | sucesso | INSERT está OK. O `.single()` original quebra **apenas no retorno**. Causa: trigger de membership corre, mas a policy SELECT `is_club_member` ainda não enxerga a linha no mesmo round-trip. Aí sim a hipótese do usuário se confirma. |
| `authenticated` | sucesso | falha com `PGRST116` | Confirma policy SELECT bloqueando o returning. |

Só depois desse cruzamento eu proponho a correção (que será uma de três coisas bem distintas dependendo do quadrante).

---

## Entregáveis desta rodada

1. Migration: criar RPC `public.pda_audit_whoami()` (não-DEFINER, retorna `jsonb`).
2. Edição em `src/services/index.ts`:
   - Adicionar constante `PDA_AUDIT_MODE`.
   - Adicionar `WHOAMI_BEFORE_INSERT` antes do insert.
   - Adicionar branches dos TESTES A/B/C atrás da flag.
   - Adicionar discriminação `INSERT_ERROR` vs `RETURNING_ERROR` pelo `error.code`.
3. Sem alteração em policies, sem alteração em mutations.ts, sem alteração na UI.

## Como rodar

Após aplicar:
1. Setar `PDA_AUDIT_MODE = "A"`, submeter o form de onboarding, copiar o painel de debug.
2. Trocar para `"B"`, submeter de novo.
3. Trocar para `"C"`, submeter de novo.
4. Colar os três logs aqui. Aí eu apresento o diagnóstico final e a correção recomendada (ainda sem aplicar, como combinado).

## Notas técnicas

- A RPC `pda_audit_whoami` é diferente da `debug_whoami` antiga (que foi marcada para remoção): aquela era SECURITY DEFINER (mascara o role real); esta é INVOKER (essencial para o teste).
- Nenhum dos testes mexe em `club_members`, então o trigger `tg_club_add_owner` continua se comportando como em produção.
- Os logs já vão para `window.__pdaAuditLog` (debug panel existente). Nada novo de UI.
