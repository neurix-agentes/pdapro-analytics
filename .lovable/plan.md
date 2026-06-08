
# PDA Sport — Arquitetura Funcional de Usuários, Convites e Vínculos

## 1. Diagnóstico do estado atual

O que já existe e funciona:
- `auth.users` (Supabase Auth) + `profiles` (1:1, criado por trigger `handle_new_user`).
- `clubs` com `created_by`; trigger `tg_club_add_owner` cria automaticamente um `club_members` com role `owner`.
- `club_members(club_id, user_id, role)` — enum `club_role` com `owner | admin | coach | member` (já cobre staff básico).
- `club_invites` com `code`, `role`, `email`, `max_uses`, `expires_at` + função `redeem_club_invite(code)` que valida e cria a membership.
- `teams.coach_id uuid` — coluna existe, **mas não há FK nem UI** para selecioná-la. Hoje é sempre `NULL`.
- `coaches` — tabela separada (`id, club_id, name, email, avatar_url`) **desconectada** de `auth.users`/`profiles`. É um "diretório de contatos", não um usuário real.
- `athletes` — tabela sem `user_id`. Atleta hoje é só um registro, não um usuário logado.
- Onboarding cobre apenas dois caminhos: "criar clube" (vira owner) e "tenho convite" (resgata código).

Lacunas estruturais:
1. **Duas representações concorrentes de treinador**: `club_members.role='coach'` (usuário real) vs `coaches` (registro solto). Nada conecta os dois.
2. **Vínculo coach→time inexistente na prática**: `teams.coach_id` aponta para onde? `coaches.id`? `club_members.id`? `auth.users.id`? Não há FK, e a UI não usa.
3. **Atleta não é usuário**: `athletes` não tem `user_id`, então não há como um atleta logar e ver os próprios dados.
4. **Falta o papel `assistant_coach`** no enum `club_role`.
5. **Onboarding sempre força criar clube ou inserir código**: não existe estado "usuário logado sem clube esperando convite".

## 2. Cenários — fluxo recomendado

### Cenário 1 — Treinador se cadastra sozinho pela landing
Ele **vira owner do próprio clube**. É a hipótese natural para o público inicial (treinador amador / categoria de base que adota a ferramenta por conta própria).

Fluxo:
1. Signup → `/onboarding` → escolhe "Criar clube".
2. Trigger cria `club_members(role='owner')` automaticamente (já funciona).
3. Wizard cria o primeiro time. **Esse time recebe `coach_id = auth.uid()` por padrão** (o próprio owner é o treinador principal até convidar alguém).
4. Owner pode depois convidar `coach` / `assistant_coach` / `admin` e reatribuir o time.

Não criar "clube automático invisível" — manter o passo explícito do wizard atual.

### Cenário 2 — Treinador recebe convite de um clube existente
Owner gera um convite com `role='coach'` (ou `assistant_coach`) na tela de Membros do clube. Opções:
- **Por e-mail**: convite com `email` preenchido → sistema envia link `/onboarding?invite=CODE`. Se o usuário ainda não tem conta, faz signup e o `redeem_club_invite` valida que `auth.email == invite.email`.
- **Por código aberto**: convite sem e-mail, `max_uses` configurável, owner compartilha o código manualmente.

Identificação como treinador:
- O role vem **do convite**, não de auto-declaração. `redeem_club_invite` já grava `club_members.role = invite.role`.
- "Lista de treinadores do clube" = `SELECT * FROM club_members JOIN profiles WHERE role IN ('coach','assistant_coach','owner','admin')`. Não precisa da tabela `coaches`.

**Recomendação**: deprecar a tabela `coaches` como entidade primária. O treinador real é sempre uma `membership` (usuário + role). `coaches` pode virar só uma view derivada ou ser removida na Fase 5.

### Cenário 3 — Atleta recebe convite (Fase 5+, não agora)
Duas opções, escolher uma como padrão:

**Opção A — Atleta como usuário logado** (recomendado, alinhado ao SaaS):
- Adicionar `athletes.user_id uuid NULL` (vínculo opcional com `auth.users`).
- Novo role `athlete` em `club_role` (ou usar `member` como "visitante somente leitura").
- Convite gera `club_members(role='athlete')` + cria/vincula registro `athletes`.
- RLS para atleta: vê **apenas** sessões/heatmaps/relatórios onde `athletes.user_id = auth.uid()`.

**Opção B — Atleta sem login** (mais simples, OK para amador):
- Atleta é só um registro, treinador faz tudo por ele.
- Relatórios são compartilhados por link público assinado (Supabase signed URL).

Para a Fase 5 inicial, sugiro **Opção B** como default e **Opção A** atrás de feature flag — o público amador raramente quer logar, e isso evita explodir o escopo.

## 3. Estrutura final proposta

```text
Club
├── Memberships (club_members)
│   ├── owner          (criador, único, full control)
│   ├── admin          (gestão sem deletar clube)
│   ├── coach          (gerencia times atribuídos)
│   ├── assistant_coach (read+write em times atribuídos)
│   └── athlete        (read-only nos próprios dados)  ← Fase 5+
├── Teams
│   └── coach_id → club_members.id (FK)  ← treinador principal
│   └── team_staff (N:N) ← assistentes/co-techs  ← Fase 5+
├── Athletes
│   └── user_id → auth.users (NULL se atleta sem login)
├── Sessions / Heatmaps / Reports (escopo já correto por club_id)
```

## 4. Campo "Treinador" no cadastro de Time — decisão

Hoje a coluna existe, ninguém preenche, e não há FK. Três caminhos:

| Opção | Trade-off |
|---|---|
| **Manter `teams.coach_id` + adicionar FK para `club_members.id`** e dropdown "Selecionar treinador existente" no form | Recomendado. Reaproveita o que já existe, alinha com a arquitetura final. |
| Esconder o campo até a Fase 5 | Limpa a UI mas adia uma decisão simples. |
| Trocar por texto livre | Anti-padrão SaaS, vira dívida técnica. |

**Recomendado**: dropdown com "Sem treinador definido" + "Selecionar treinador existente" (lista filtrada por `club_members.role IN ('owner','admin','coach','assistant_coach')` do mesmo clube). Permitir `NULL`.

## 5. Sequência de implementação recomendada

Ordem proposta (cada passo é um PR pequeno e verificável):

1. **Schema — staff completo**
   - `ALTER TYPE club_role ADD VALUE 'assistant_coach'`.
   - Adicionar FK `teams.coach_id → club_members(id) ON DELETE SET NULL`.
   - (Opcional Fase 5) `ALTER TYPE club_role ADD VALUE 'athlete'` + `athletes.user_id`.

2. **Tela "Membros do clube"** (`/clubs/:id/members` ou aba em `/settings`)
   - Listar `club_members` com nome (join `profiles`), role, data de entrada.
   - Owner/admin pode mudar role, remover membro, transferir ownership.
   - Botão "Convidar membro" abre dialog com role + e-mail opcional + expiração.
   - Lista de convites pendentes com revogar/copiar link.

3. **Vínculo coach → time**
   - Form de Team: dropdown `coach_id` populado pelos staff members do clube.
   - Tabela de Teams mostra nome do treinador (join).
   - RLS adicional (opcional): coach só edita times onde `coach_id = membership do user`.

4. **Deprecar `coaches`**
   - Migrar referências (se houver) para `club_members`.
   - Remover a tabela ou deixar como view de compatibilidade.

5. **Fase 5 — Atletas como usuários** (quando o produto pedir)
   - Adicionar `athletes.user_id` + role `athlete`.
   - Convite específico de atleta que vincula `auth.users` ↔ `athletes`.
   - RLS de leitura nos próprios heatmaps/sessions/reports.

6. **Polish de convites**
   - E-mail transacional via Resend (template "Você foi convidado para o clube X").
   - Página `/invite/:code` pública com preview (nome do clube, role oferecida) antes do signup/login.

## 6. O que NÃO fazer agora

- Não criar role `athlete` antes da Fase 5 (escopo).
- Não remover `teams.coach_id` — usar.
- Não implementar atleta-com-login até validar com usuários reais.
- Não tocar em `redeem_club_invite` — já cobre o caso de role variável.

---

## Próximo passo

Se aprovar a direção, sugiro começar pelo **bloco 1 + 2** (schema de staff + tela de Membros com convites por role) num único ciclo. Isso destrava coach→time (bloco 3) sem mexer em atletas. Quer que eu detalhe o plano de implementação só desses dois blocos?
