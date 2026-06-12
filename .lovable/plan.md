## Contexto
`AthleteFormDialog.handlePickPhoto` e `uploadAthletePhoto` já validam tipo (PNG/JPEG) e tamanho (2MB), mas as mensagens são genéricas ("Use PNG ou JPEG.", "Máximo 2MB.") e não cobrem casos como arquivo vazio ou extensão não reconhecida. Vamos reforçar a validação e tornar as mensagens claras e acionáveis, mantendo o limite atual.

## Etapa 1 — Centralizar regras de validação
- Em `src/lib/storage.ts`, exportar constantes e função reutilizável:
  - `ATHLETE_PHOTO_MAX_BYTES = 2 * 1024 * 1024`
  - `ATHLETE_PHOTO_ACCEPTED_TYPES = ["image/png", "image/jpeg"]`
  - `ATHLETE_PHOTO_ACCEPTED_LABEL = "PNG ou JPEG"`
  - `validateAthletePhoto(file): { ok: true } | { ok: false; message: string }` cobrindo:
    - arquivo ausente / vazio (`size === 0`) → "Arquivo vazio ou inválido."
    - tipo MIME não permitido → "Formato não suportado. Envie um arquivo PNG ou JPEG."
    - tamanho acima do limite → "Arquivo muito grande (`X.XX MB`). O limite é 2 MB."
- `uploadAthletePhoto` passa a chamar `validateAthletePhoto` (em vez do `validateImage` local) e lança `Error(message)` quando inválido, garantindo mensagem consistente caso o upload seja chamado fora do dialog.

## Etapa 2 — Aplicar no AthleteFormDialog
- Em `src/components/athletes/AthleteFormDialog.tsx`:
  - Substituir as checagens inline em `handlePickPhoto` por `validateAthletePhoto(file)`; em caso de erro, exibir `toast.error(result.message)` e abortar.
  - Resetar `fileInputRef.current.value` após erro para permitir reenvio do mesmo arquivo já corrigido.
  - Atualizar o texto auxiliar abaixo de "Foto do atleta" para: `"PNG ou JPEG, até 2 MB."` (mantém formato atual, só formaliza unidade).
  - No `<input type="file">`, manter `accept="image/png,image/jpeg"` (já presente) — apenas garante o filtro nativo do browser.

## Fora do escopo
- Não alterar o bucket, RLS, upload pendente em criação, fluxo de remoção, nem o limite de 2 MB.
- Sem crop/resize/conversão de imagem.
- Sem alterações em outros uploaders (ex.: `LogoUploader`).

## Detalhes técnicos
- Tamanho exibido com `(file.size / (1024 * 1024)).toFixed(2)`.
- `validateAthletePhoto` é pura e síncrona, evitando duplicação entre UI e camada de storage e garantindo que qualquer caller futuro receba a mesma mensagem.
