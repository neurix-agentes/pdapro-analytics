import { useRef, useState, useEffect } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  currentUrl?: string | null;
  primaryColor?: string;
  shortName?: string;
  onFileSelected: (file: File | null) => void;
  onRemoveExisting?: () => void;
}

export function LogoUploader({ currentUrl, primaryColor = "#00FF88", shortName = "—", onFileSelected, onRemoveExisting }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { setPreview(currentUrl ?? null); }, [currentUrl]);

  function pick(f: File | null) {
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      toast.error("Use PNG ou JPEG.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Máximo 2MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    onFileSelected(f);
  }

  function clear() {
    setFile(null);
    setPreview(null);
    onFileSelected(null);
    onRemoveExisting?.();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-5">
      <div
        className="h-24 w-24 rounded-2xl shrink-0 grid place-items-center overflow-hidden border border-border bg-surface/40"
        style={{ boxShadow: `0 0 22px -10px ${primaryColor}` }}
      >
        {preview ? (
          <img src={preview} alt="logo" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full grid place-items-center text-sm font-bold tracking-wider"
            style={{ background: `color-mix(in oklab, ${primaryColor} 20%, transparent)`, color: primaryColor }}
          >
            {shortName.toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="text-sm font-medium">Logo do clube</div>
        <p className="text-xs text-muted-foreground">PNG ou JPEG, máximo 2MB. Recomendado: 512×512px.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 text-primary border border-primary/30 px-3 py-2 text-xs font-semibold hover:bg-primary/15 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            {preview ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {(preview || file) && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition"
            >
              <X className="h-3.5 w-3.5" /> Remover
            </button>
          )}
          {!preview && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ImageIcon className="h-3 w-3" /> Nenhuma imagem
            </span>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
