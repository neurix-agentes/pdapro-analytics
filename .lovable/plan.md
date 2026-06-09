## Problema

O clube **Teste** não pode ser excluído porque a policy `clubs owner delete` exige `is_club_owner(auth.uid(), id)`, que consulta `public.club_members`. Para esse clube não existe linha em `club_members` ligando o criador ao clube como `owner`, então a permissão falha — apesar de o `created_by` apontar para o usuário.

A função `public.tg_club_add_owner()` já existe no banco e foi escrita para inserir essa linha automaticamente após o `INSERT` em `clubs`, mas o trigger nunca foi criado (não há triggers no projeto). Resultado: todo clube criado direto pela UI fica sem membership de owner.

## Correção

### 1. Migração no banco

- Criar o trigger `AFTER INSERT ON public.clubs` que dispara `public.tg_club_add_owner()` por linha. Isso garante que, daqui pra frente, todo novo clube já nasça com a membership de owner.
- Backfill: para todo clube cujo `created_by` não tem linha correspondente em `club_members`, inserir `(club_id, user_id, role = 'owner')` com `ON CONFLICT DO NOTHING`. Isso corrige o clube "Teste" e qualquer outro clube órfão do mesmo modo.

### 2. Sem alterações de frontend

A mensagem "Sem permissão para excluir este clube." (introduzida no fix anterior, que detecta `count = 0`) continua correta como salvaguarda. Após o backfill, o DELETE do clube "Teste" funcionará normalmente pela UI.

## Validação

Depois da migração:
- Conferir que `club_members` contém uma linha `owner` para o clube "Teste" com `user_id = 0ac69a42-…` (fpgutterres).
- Excluir o clube "Teste" pela tela de Clubes — deve sumir da lista.
- Criar um novo clube de teste e confirmar que o `club_members` recebe a linha de owner automaticamente.

## Detalhes técnicos

- Trigger:
  ```sql
  CREATE TRIGGER trg_clubs_add_owner
    AFTER INSERT ON public.clubs
    FOR EACH ROW EXECUTE FUNCTION public.tg_club_add_owner();
  ```
- Backfill:
  ```sql
  INSERT INTO public.club_members (club_id, user_id, role)
  SELECT c.id, c.created_by, 'owner'
  FROM public.clubs c
  WHERE c.created_by IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = c.id AND cm.user_id = c.created_by
    )
  ON CONFLICT (club_id, user_id) DO NOTHING;
  ```
- Nenhum código de aplicação precisa mudar.
