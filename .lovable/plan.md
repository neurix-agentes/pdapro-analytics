## Escopo
Auditar o fluxo de onboarding para descobrir exatamente qual valor está chegando em `created_by` quando o app tenta criar o primeiro clube, exibindo esse diagnóstico em **console + UI temporária**.

## O que já confirmei
- O **único ponto de criação de clube** hoje passa por `src/hooks/mutations.ts` → `clubsService.create(...)`.
- O **INSERT atual** está em `src/services/index.ts` e hoje monta este payload antes do `.insert(...)`:
  - `name`
  - `short_name`
  - `city`
  - `state`
  - `country`
  - `primary_color`
  - `secondary_color`
  - `description`
  - `logo_url`
  - `archived`
  - `created_by: u.user.id`
- Esse `u.user.id` vem de `await supabase.auth.getUser()` dentro do service.
- O backend hospedado está saudável.
- No snapshot atual não havia logs de console/rede para esse erro, então para ver o **payload real** preciso instrumentar o fluxo e reproduzir.

## Plano
### 1) Instrumentar autenticação no onboarding
Adicionar diagnóstico temporário em:
- `src/hooks/useAuth.ts`
- `src/routes/onboarding.tsx`
- `src/components/app/AppShell.tsx`

Vou registrar e exibir:
- `auth loading`
- `session?.user?.id`
- `user?.id`
- estado de `useMyClubIds()` durante o onboarding
- momento exato do clique em “Criar clube”
- se algum hook/contexto está entregando `user = null`

### 2) Instrumentar o service que faz o INSERT
Adicionar logs temporários em `src/services/index.ts` ao redor de `supabase.from('clubs').insert(...)` para mostrar:
- resultado de `supabase.auth.getSession()`
- resultado de `supabase.auth.getUser()`
- `auth user`
- `auth uid`
- `payload enviado ao insert`
- valor calculado para `created_by`
- retorno de erro completo do insert

Também vou manter uma cópia serializável do payload real enviado para poder exibir na UI de diagnóstico.

### 3) Verificar existência de profile do usuário
No mesmo fluxo de diagnóstico, checar e mostrar se existe `profile` para `user.id` antes da criação do clube:
- `profile found: yes/no`
- `profile.user_id`
- `profile.email`

Isso responde se o trigger de criação de perfil rodou para o usuário que está tentando concluir o onboarding.

### 4) Exibir um painel temporário de debug na tela
Como você escolheu **Console + UI**, vou adicionar no onboarding um painel temporário com:
- status da sessão
- `user.id`
- `created_by` efetivo
- payload completo do insert
- status de `profile`
- resultado/erro bruto do insert

Assim você consegue ver o valor real sem depender só do DevTools.

### 5) Endurecer a guarda do submit sem alterar o objetivo da auditoria
Sem mexer ainda em RLS, vou impedir tentativa prematura de criação quando a autenticação ainda não estiver pronta:
- botão desabilitado enquanto a sessão estiver carregando
- mensagem explícita se `user.id` ou `getUser()` não estiver disponível no submit

Isso ajuda a provar se o problema é corrida de autenticação.

### 6) Validar e fechar o diagnóstico
Depois de instrumentar, vou reproduzir o fluxo e confirmar:
- qual valor chegou em `created_by`
- se `auth.uid()` parece indisponível no momento do insert
- se o `profile` existe para esse usuário
- se o problema vem de sessão nula, race de auth, redirect prematuro, ou payload divergente

## Detalhes técnicos
### Arquivos que serão alterados
- `src/services/index.ts`
- `src/hooks/useAuth.ts`
- `src/routes/onboarding.tsx`
- `src/components/app/AppShell.tsx`

### Resultado esperado da auditoria
Ao final, teremos visível:
- o **payload exato** passado para `supabase.from('clubs').insert(...)`
- o **valor exato de `created_by`**
- o **`user.id` disponível no momento da criação**
- a confirmação de existência ou ausência do `profile`
- a indicação clara de qual camada está falhando antes da policy ser avaliada

### Fora de escopo nesta etapa
- refatorar toda a arquitetura multi-clube
- reescrever RLS sem antes capturar o diagnóstico real
- remover permanentemente os logs temporários nesta mesma etapa