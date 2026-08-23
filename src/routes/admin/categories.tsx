import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

type Category = { id?: string; slug: string; name: string; description: string | null; image_url: string | null; sort_order: number; visible: boolean };
const empty: Category = { slug: "", name: "", description: "", image_url: "", sort_order: 0, visible: true };
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin_categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const save = useMutation({
    mutationFn: async (c: Category) => {
      const payload = { ...c, description: c.description || null, image_url: c.image_url || null };
      if (c.id) { const { error } = await supabase.from("categories").update(payload).eq("id", c.id); if (error) throw error; }
      else { const { error } = await supabase.from("categories").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_categories"] }); toast.success("Saved"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_categories"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing({ ...empty }); setOpen(true); };
  const openEdit = (c: Category) => { setEditing({ ...c }); setOpen(true); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}>New category</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} category</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div><Label>Name *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></div>
                <div><Label>Slug *</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} /></div>
                <div><Label>Description</Label><Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                <div><Label>Image</Label><ImageUpload bucket="category-images" folder="categories" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} /></div>
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
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((c) => (
          <div key={c.id} className="flex gap-3 rounded border border-border bg-card p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-secondary">
              {c.image_url && <img src={c.image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug} · sort {c.sort_order}{!c.visible && " · hidden"}</div>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(c as Category)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm(`Delete "${c.name}"?`) && del.mutate(c.id!)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
        {(data?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
      </div>
    </div>
  );
}