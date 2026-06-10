// PDA Sport — Storage helpers
import { supabase } from "@/integrations/supabase/client";

const ATHLETE_PHOTOS_BUCKET = "athlete-photos";
// 10 anos — bucket privado, URL assinada de longa duração para uso direto em <img>.
const ATHLETE_PHOTO_SIGNED_TTL = 60 * 60 * 24 * 365 * 10;

function validateImage(file: File) {
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    throw new Error("Formato inválido. Use PNG ou JPEG.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Arquivo maior que 2MB.");
  }
}

export async function uploadAthletePhoto(athleteId: string, file: File): Promise<string> {
  validateImage(file);
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${athleteId}/photo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(ATHLETE_PHOTOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data, error: signErr } = await supabase.storage
    .from(ATHLETE_PHOTOS_BUCKET)
    .createSignedUrl(path, ATHLETE_PHOTO_SIGNED_TTL);
  if (signErr || !data) throw new Error(signErr?.message ?? "Falha ao gerar URL da foto.");
  return data.signedUrl;
}

export async function deleteAthletePhoto(signedUrlOrPath: string): Promise<void> {
  try {
    let path = signedUrlOrPath;
    if (signedUrlOrPath.startsWith("http")) {
      const url = new URL(signedUrlOrPath);
      const marker = `/${ATHLETE_PHOTOS_BUCKET}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx < 0) return;
      path = decodeURIComponent(url.pathname.slice(idx + marker.length));
    }
    await supabase.storage.from(ATHLETE_PHOTOS_BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}

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
