## Objetivo
Adicionar ordenação por coluna na tabela de atletas e permitir upload/edição da foto do atleta.

## Etapa 1 — Ordenação na tabela
- Adicionar estado `sort` em `src/routes/_app.athletes.tsx` com `{ key: 'name' | 'age' | 'jersey_number', dir: 'asc' | 'desc' }`. Default: `name asc`.
- Tornar os cabeçalhos **Atleta**, **Camisa** e **Idade** clicáveis (botão) com indicador visual (ChevronUp/ChevronDown). Click alterna asc/desc; click em outra coluna troca a chave.
- Ordenação aplicada após os filtros existentes (busca, time, posição, status), sem alterá-los.
- Regras de comparação:
  - `name`: `localeCompare` PT-BR, case-insensitive.
  - `age` e `jersey_number`: numérico; valores nulos/undefined sempre ao final independente da direção.

## Etapa 2 — Foto do atleta na edição
- Criar bucket de storage `athlete-photos` (público, mesmo padrão de `club-logos`) caso não exista, com políticas de upload/leitura/atualização para usuários autenticados membros do clube.
- Estender `src/lib/storage.ts` com `uploadAthletePhoto(athleteId, file)` e `deleteAthletePhoto(publicUrl)` (mesmo padrão de `uploadClubLogo`: validação PNG/JPEG, limite 2MB).
- Em `src/components/athletes/AthleteFormDialog.tsx`:
  - Novo campo de foto no topo do formulário: preview circular + botão "Trocar foto" / "Remover foto" (reusar visual do `LogoUploader`, versão simplificada inline).
  - No modo **edição**: upload imediato após seleção, atualiza `photo_url` via `useUpdateAthlete` e remove arquivo antigo do storage se existir.
  - No modo **criação**: como ainda não há `athlete.id`, manter o arquivo selecionado em memória e fazer upload logo após a criação do atleta, depois persistir `photo_url` com um segundo update. Mensagens via `toast`.
  - Manter exibição já existente da foto na lista (já usa `a.photo_url`).

## Fora do escopo
- Não alterar filtros, schema da tabela `athletes` (coluna `photo_url` já existe) ou demais campos do formulário.
- Sem crop/resize de imagem nesta fase.

## Detalhes técnicos
- Cabeçalho sortável: componente local `SortableTh` dentro do arquivo de rota para evitar novo arquivo.
- `age` é derivado (já presente em `a.age`); usar diretamente.
- Bucket criado via `supabase--migration` com `storage.buckets` insert + policies em `storage.objects` filtrando por `bucket_id = 'athlete-photos'` e membership no clube (consulta a `athletes` + `club_members`).
