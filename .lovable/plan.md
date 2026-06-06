# Diagnóstico definitivo (com base nos dados reais do banco)

Consultei `public.clubs`, `public.club_members` e `pg_policy`. O cenário é:

- A policy de INSERT em `clubs` é literalmente `WITH CHECK true` — ou seja, **o INSERT em si nunca é o problema**.
- A tabela contém **9 clubes criados por este usuário**, **todos com o sufixo `[PDA-AUDIT-A-…]`** (6 deles da auditoria de hoje). **Nenhum clube `B-` ou `C-` foi gravado.**
- Para cada clube criado pelo teste A, existe a membership `owner` correspondente em `club_members` (o trigger `tg_club_add_owner` funciona).

O que isso significa, cruzando com o `AUDIT_ALL_SUMMARY`:

- **Teste A (`.insert()` sem `.select()`)** → PostgREST envia `Prefer: return=minimal`. INSERT roda, `AFTER` trigger insere a membership, transação commita. ✅ Linha gravada.
- **Testes B/C (`.insert().select(...)`)** → PostgREST envia `Prefer: return=representation` e monta `WITH ins AS (INSERT … RETURNING *) SELECT * FROM ins`. Esse outer SELECT é avaliado **contra a policy SELECT de `clubs`** (`is_club_member(auth.uid(), id)`). Mas o `AFTER INSERT` que cria a membership só executa **depois** do RETURNING — então no momento da avaliação a membership **ainda não existe**, o SELECT policy reprova a linha recém-inserida, a transação faz ROLLBACK, e PostgREST devolve `42501 "new row violates row-level security policy for table clubs"`. ❌ Nada é gravado.

Por isso o banco só tem clubes "A". E por isso o `.select("*").single()` do código real (que é o caminho `C`) sempre falha.

A escolha "Apenas 1 clube por usuário no onboarding" não corrige isso sozinha — mesmo o **primeiro** clube falha. Precisamos das duas coisas: corrigir o RLS e aplicar a regra de negócio no onboarding.

# O plano

## 1. Corrigir a SELECT policy de `clubs` (migration)

Atualizar `clubs members read` para também permitir que o autor enxergue a linha:

```sql
DROP POLICY "clubs members read" ON public.clubs;
CREATE POLICY "clubs members read"
ON public.clubs FOR SELECT TO authenticated
USING (is_club_member(auth.uid(), id) OR created_by = auth.uid());
```

Efeito: o RETURNING do INSERT passa imediatamente (porque `created_by = auth.uid()` é satisfeito na própria linha inserida), o `AFTER` trigger roda em seguida criando a membership, e o `.select("*").single()` retorna o clube. Membership de outros usuários continua sendo a única forma de ler clubes alheios.

## 2. Regra "1 clube por usuário no onboarding"

Em `src/routes/onboarding.tsx`:

- Se `myClubs.data` já tiver pelo menos 1 clube, redirecionar para `/dashboard` (e setar `currentClub` no Zustand) em vez de mostrar a escolha "Criar clube / Usar convite".
- Esconder/desabilitar o card "Criar um novo clube" quando o usuário já é membro de algum clube; ainda assim permitir "Usar convite" caso queira entrar em mais um clube via redeem (que é o caminho legítimo para multi-clube).
- O fluxo de **criar clube** fica restrito a usuários sem nenhuma membership.

Não vamos impor o limite no banco — multi-clube continua possível via convite (que já é o caso hoje para owner/admin convidando coaches).

## 3. Remover toda a instrumentação de auditoria (back to clean)

Arquivos a limpar:

- `src/services/index.ts`: remover `PDA_AUDIT_MODE`, `runTestA/B/C`, `inScope`, todo o bloco `AUDIT_ALL`, chamadas a `pda_audit_whoami` e a `emitPdaDebug` dentro do `clubsService.create`. Voltar para um único `.insert(payload).select("*").single()` enxuto.
- `src/routes/onboarding.tsx`: remover `DebugPanel`, o `useEffect` de `fetch.intercept`, o `useEffect` listener de `pda:debug`, os `console.log` de auth e os `emitPdaDebug` espalhados pelo `submitClub`.
- `src/hooks/mutations.ts`: remover quaisquer `emitPdaDebug` (`MUTATION_CREATE_CLUB_*`).
- `src/lib/pda-debug.ts`: deletar (não terá mais usuários).
- Migration: `DROP FUNCTION public.pda_audit_whoami();` e também `DROP FUNCTION public.debug_whoami();` (esta última é apontada como "não removida" pelo `security_posture_check`, então aproveita o passe).

## 4. Limpar os 6 clubes de auditoria do banco

Deletar via tool `insert` os 6 clubes `[PDA-AUDIT-A-*]` criados hoje (`KRWA`, `T9VT`, `JLJO`, `DTUO`, `NRTS`, `QPVK`) e suas memberships. Manter `TESTE SQL`, `TESTE` e `PROBE_RLS` (clubes antigos, fora do escopo).

## 5. Verificação manual após aplicar

1. Abrir `/onboarding` com usuário **novo** (sem nenhum clube) → criar clube → deve cair em `/onboarding` step "team" sem erro e o clube fica gravado.
2. Voltar para `/onboarding` com usuário que **já é membro** → deve ser redirecionado para `/dashboard` automaticamente.
3. Confirmar via `SELECT` que a linha do novo clube existe e que o usuário tem `role='owner'` em `club_members`.

# Detalhes técnicos (referência)

```text
Antes (falha):
  client → INSERT clubs RETURNING * (Prefer: return=representation)
         → outer SELECT * roda RLS clubs.SELECT (is_club_member)
         → membership ainda não existe → 42501 → ROLLBACK

Depois (ok):
  client → INSERT clubs RETURNING *
         → outer SELECT * roda RLS clubs.SELECT
            (is_club_member OR created_by = auth.uid())
         → created_by = auth.uid() ✓ → linha passa
         → AFTER trigger cria membership → COMMIT → linha retornada
```

Nenhuma mudança em policies de `club_members`, `teams`, `athletes` etc. — o problema é estritamente da combinação `RETURNING + SELECT policy + AFTER trigger` em `clubs`.
