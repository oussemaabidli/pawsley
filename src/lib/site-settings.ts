import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, Record<string, unknown>>;

export const siteSettingsQuery = {
  queryKey: ["site_settings"],
  queryFn: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value");
    if (error) throw error;
    const out: SiteSettings = {};
    (data ?? []).forEach((r) => {
      out[r.key] = (r.value as Record<string, unknown>) ?? {};
    });
    return out;
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
};

export function useSiteSettings() {
  return useQuery(siteSettingsQuery);
}

export function getBrandName(s?: SiteSettings) {
  return (s?.brand?.name as string) ?? "Pawsley";
}
