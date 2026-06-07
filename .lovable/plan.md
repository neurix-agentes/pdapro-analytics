## Diagnóstico — estado atual do projeto

Após verificação direta no código e no banco, **as 4 etapas pedidas já estão implementadas** nas iterações anteriores desta sessão. Não há mudanças estruturais pendentes; só falta a validação manual em runtime.

### ETAPA 1 — Policy de leitura de `clubs` ✅
Já aplicada via migração. Policy atual (`clubs members read`):
```
USING (is_club_member(auth.uid(), id) OR created_by = auth.uid())
```

### ETAPA 2 — Limpeza da auditoria ✅
- `src/lib/pda-debug.ts` — deletado
- `DebugPanel`, `PDA_AUDIT_MODE`, `runTestA/B/C`, `emitPdaDebug`, interceptadores de fetch — removidos
- Funções `public.pda_audit_whoami()` e `public.debug_whoami()` — DROP confirmado no banco (`pg_proc` retorna vazio)
- Clubes `[PDA-AUDIT-A-*]` — purgados
- Única referência remanescente ao nome `debug_whoami` é o **campo do retorno do `security_posture_check`** consumido pelo `SecurityPostureBanner` — é legítimo, não é resíduo

### ETAPA 3 — Onboarding ✅
`src/routes/onboarding.tsx` já implementa:
- Tela de escolha "Criar clube" / "Possuo convite"
- Wizard de criação (nome, sigla, cidade) + criação automática do membership OWNER (via trigger)
- Fluxo de convite (`redeem_club_invite`)
- Redirect automático para `/dashboard` quando o usuário já é membro de algum clube (regra "1 clube por usuário")

### ETAPA 4 — Contexto global ✅
`useClubStore` (Zustand + persist) já expõe `currentClubId` / `setCurrentClub`. Todos os hooks de query (`useTeams`, `useAthletes`, `useSessions`, `useHeatmaps`, `useReports`, `useFields`) já filtram por `clubId` via `useScope()`.

---

## O que falta — apenas validação em runtime

Não vou alterar código. Plano de validação que você executa no preview:

1. **Criar clube (usuário novo)** — login com conta sem clube → `/onboarding` → "Criar clube" → preencher → deve criar sem erro 42501 e ir para o step "team".
2. **Redirect automático** — sair e logar com usuário que já é membro → ao abrir `/onboarding` deve redirecionar para `/dashboard` sem mostrar o wizard.
3. **Convite** — gerar invite no painel, abrir `/onboarding?invite=CODIGO` em outra conta → deve entrar no clube e ir pro dashboard.
4. **Scope multi-clube** — trocar de clube no `ClubSwitcher` e confirmar que dashboard/teams/atletas refletem o novo `currentClubId`.

Se algum dos 4 passos falhar, abrimos um diff cirúrgico no ponto exato. Se passarem, a plataforma está estabilizada e pronta para a Fase 5.

---

## Nada será criado, editado ou removido neste plano
A estabilização arquitetural já foi entregue nas mensagens anteriores. Este plano é só o checkpoint de QA antes de avançar para Fase 5 (Gestão de Atletas / Sessões / PDA Sport Engine).
