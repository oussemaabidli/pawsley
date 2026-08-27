import { supabase } from "@/integrations/supabase/client";

export function publicUrl(bucket: string, path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
