import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCreateClub, useUpdateClub } from "@/hooks/mutations";
import { LogoUploader } from "@/components/clubs/LogoUploader";
import type { Club } from "@/types";

const PALETTE = ["#00FF88", "#3B82F6", "#FF4D4D", "#FFC857", "#A78BFA", "#F472B6", "#22D3EE", "#F97316"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  club?: Club | null;
}

export function ClubFormDialog({ open, onOpenChange, club }: Props) {
  const createM = useCreateClub();
  const updateM = useUpdateClub();
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [shortName, setShortName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [primary, setPrimary] = useState("#00FF88");
  const [secondary, setSecondary] = useState("#0A2540");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(club?.name ?? "");
      setShortName(club?.short_name ?? "");
      setCity(club?.city ?? "");
      setState(club?.state ?? "");
      setCountry(club?.country ?? "Brasil");
      setPrimary(club?.primary_color ?? "#00FF88");
      setSecondary(club?.secondary_color ?? "#0A2540");
      setDescription(club?.description ?? "");
    }
  }, [open, club]);

  function submit() {
    if (!name.trim() || !city.trim()) {
      toast.error("Preencha nome e cidade.");
      return;
    }
    const payload = {
      name: name.trim(),
      short_name: (shortName || name.slice(0, 3)).toUpperCase(),
      city: city.trim(),
      state: state || undefined,
      country: country || undefined,
      primary_color: primary,
      secondary_color: secondary,
      description: description || undefined,
    };
    if (club) {
      update(club.id, payload);
      toast.success("Clube atualizado.");
    } else {
      create(payload);
      toast.success("Clube criado.");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-popover/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">{club ? "Editar clube" : "Novo clube"}</DialogTitle>
          <DialogDescription>Cadastre informações institucionais do clube.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="identity" className="mt-2">
          <TabsList className="bg-surface/40">
            <TabsTrigger value="identity">Identidade</TabsTrigger>
            <TabsTrigger value="brand">Marca</TabsTrigger>
            <TabsTrigger value="about">Sobre</TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome do clube</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Grêmio Academy" />
              </div>
              <div>
                <Label>Sigla</Label>
                <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="GAC" maxLength={4} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Porto Alegre" />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="RS" maxLength={2} />
              </div>
              <div>
                <Label>País</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brand" className="space-y-5 pt-4">
            <ColorPicker label="Cor primária" value={primary} onChange={setPrimary} />
            <ColorPicker label="Cor secundária" value={secondary} onChange={setSecondary} />
            <div className="rounded-xl border border-border bg-surface/40 p-4 flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-xl grid place-items-center text-sm font-bold tracking-wider"
                style={{
                  background: `color-mix(in oklab, ${primary} 22%, transparent)`,
                  color: primary,
                  boxShadow: `0 0 22px -6px ${primary}`,
                }}
              >
                {(shortName || name.slice(0, 3) || "—").toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold">{name || "Nome do clube"}</div>
                <div className="text-xs text-muted-foreground">{city || "Cidade"}{state ? ` · ${state}` : ""}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about" className="pt-4">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o clube, foco esportivo, categorias atendidas…"
              rows={5}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-primary text-primary-foreground hover:opacity-90 glow-primary">
            {club ? "Salvar alterações" : "Criar clube"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 flex-wrap mt-1.5">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-9 w-9 rounded-lg border-2 transition ${value === c ? "border-foreground scale-110" : "border-transparent hover:border-border"}`}
            style={{ background: c, boxShadow: value === c ? `0 0 14px -2px ${c}` : undefined }}
            aria-label={c}
          />
        ))}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 ml-2 font-mono text-xs"
        />
      </div>
    </div>
  );
}
