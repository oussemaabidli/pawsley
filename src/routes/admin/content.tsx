import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Trash, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/content")({ component: AdminContent });

type NavItem = { label: string; to: string };
type PagesContent = {
  about?: { headline: string };
  contact?: { headline: string; subheadline: string };
};

function AdminContent() {
  const qc = useQueryClient();
  
  const { data: navData, isLoading: loadingNav } = useQuery({
    queryKey: ["admin_nav"],
    queryFn: async () => ((await supabase.from("site_settings").select("value").eq("key", "navigation").maybeSingle()).data?.value as NavItem[] | null) ?? [],
  });

  const { data: pagesData, isLoading: loadingPages } = useQuery({
    queryKey: ["admin_pages"],
    queryFn: async () => ((await supabase.from("site_settings").select("value").eq("key", "pages").maybeSingle()).data?.value as PagesContent | null) ?? {},
  });

  const [nav, setNav] = useState<NavItem[]>([]);
  const [pages, setPages] = useState<PagesContent>({ about: { headline: "" }, contact: { headline: "", subheadline: "" } });

  useEffect(() => { if (navData) setNav(navData); }, [navData]);
  useEffect(() => { 
    if (pagesData) {
      setPages({
        about: { headline: pagesData.about?.headline ?? "Considered by design." },
        contact: { headline: pagesData.contact?.headline ?? "Say hello", subheadline: pagesData.contact?.subheadline ?? "We'd love to hear from you." }
      });
    }
  }, [pagesData]);

  const saveNav = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({ key: "navigation", value: nav as any });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_nav"] }); qc.invalidateQueries({ queryKey: ["site_settings"] }); toast.success("Navigation saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePages = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({ key: "pages", value: pages as any });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_pages"] }); qc.invalidateQueries({ queryKey: ["site_settings"] }); toast.success("Pages content saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loadingNav || loadingPages) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-12">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">Navigation Menu</h2>
          <Button onClick={() => saveNav.mutate()} disabled={saveNav.isPending}>Save Navigation</Button>
        </div>
        <div className="space-y-4 max-w-2xl">
          {nav.map((item, i) => (
            <div key={i} className="flex gap-4 items-end">
              <div className="flex-1"><Label>Label</Label><Input value={item.label} onChange={(e) => { const n = [...nav]; n[i].label = e.target.value; setNav(n); }} /></div>
              <div className="flex-1"><Label>URL</Label><Input value={item.to} onChange={(e) => { const n = [...nav]; n[i].to = e.target.value; setNav(n); }} /></div>
              <Button variant="ghost" size="icon" onClick={() => setNav(nav.filter((_, idx) => idx !== i))}><Trash className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => setNav([...nav, { label: "New Link", to: "/" }])}><Plus className="h-4 w-4 mr-2" /> Add Link</Button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">Page Content</h2>
          <Button onClick={() => savePages.mutate()} disabled={savePages.isPending}>Save Pages</Button>
        </div>
        <div className="space-y-8 max-w-2xl">
          <div className="space-y-4 rounded border p-6">
            <h3 className="font-medium text-lg">About Page</h3>
            <div><Label>Main Headline</Label><Input value={pages.about?.headline} onChange={(e) => setPages({ ...pages, about: { ...pages.about, headline: e.target.value } })} /></div>
          </div>
          <div className="space-y-4 rounded border p-6">
            <h3 className="font-medium text-lg">Contact Page</h3>
            <div><Label>Main Headline</Label><Input value={pages.contact?.headline} onChange={(e) => setPages({ ...pages, contact: { headline: e.target.value, subheadline: pages.contact?.subheadline ?? "" } })} /></div>
            <div><Label>Sub-headline</Label><Input value={pages.contact?.subheadline} onChange={(e) => setPages({ ...pages, contact: { headline: pages.contact?.headline ?? "", subheadline: e.target.value } })} /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
