import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export type UploadResult = { path: string; url: string };

export async function uploadImage(
  bucket: string,
  file: File,
  folder = "",
): Promise<UploadResult> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder ? folder.replace(/\/$/, "") + "/" : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, TEN_YEARS);
  if (sErr) throw sErr;
  return { path, url: data.signedUrl };
}