import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";

export const Route = createFileRoute("/admin/banners")({ component: AdminBanners });

type Banner = { id?: string; title: string | null; subtitle: string | null; image_url: string; link: string | null; sort_order: number; visible: boolean };
const empty: Banner = { title: "", subtitle: "", image_url: "", link: "", sort_order: 0, visible: true };

function AdminBanners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin_banners"],
    queryFn: async () => (await supabase.from("banners").select("*").order("sort_order")).data ?? [],
  });
  const save = useMutation({
    mutationFn: async (b: Banner) => {
      if (!b.image_url) throw new Error("Image is required");
      const payload = { ...b, title: b.title || null, subtitle: b.subtitle || null, link: b.link || null };
      if (b.id) { const { error } = await supabase.from("banners").update(payload).eq("id", b.id); if (error) throw error; }
      else { const { error } = await supabase.from("banners").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_banners"] }); toast.success("Saved"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("banners").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_banners"] }); toast.success("Deleted"); },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Banners</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditing({ ...empty }); setOpen(true); }}>New banner</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} banner</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div><Label>Image *</Label><ImageUpload bucket="site-assets" folder="banners" value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} aspect="aspect-video" /></div>
                <div><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>Subtitle</Label><Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></div>
                <div><Label>Link (e.g. /shop or /category/collars)</Label><Input value={editing.link ?? ""} onChange={(e) => setEditing({ ...editing, link: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
                  <div className="flex items-center justify-between pt-6"><Label>Visible</Label><Switch checked={editing.visible} onCheckedChange={(v) => setEditing({ ...editing, visible: v })} /></div>
                </div>
                <Button className="w-full" onClick={() => save.mutate(editing)} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(data ?? []).map((b) => (
          <div key={b.id} className="overflow-hidden rounded border border-border bg-card">
            <div className="aspect-[16/7] bg-secondary">{b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover" />}</div>
            <div className="p-4">
              <div className="font-medium">{b.title || "—"}</div>
              <div className="text-xs text-muted-foreground">{b.subtitle || ""} · sort {b.sort_order}{!b.visible && " · hidden"}</div>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(b as Banner); setOpen(true); }}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm("Delete banner?") && del.mutate(b.id!)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
        {(data?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No banners yet.</p>}
      </div>
    </div>
  );
}