// PDA Sport — Storage helpers
import { supabase } from "@/integrations/supabase/client";

const LOGOS_BUCKET = "club-logos";

export async function uploadClubLogo(clubId: string, file: File): Promise<string> {
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    throw new Error("Formato inválido. Use PNG ou JPEG.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Arquivo maior que 2MB.");
  }
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${clubId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteClubLogo(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    const marker = `/${LOGOS_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx < 0) return;
    const path = url.pathname.slice(idx + marker.length);
    await supabase.storage.from(LOGOS_BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}
