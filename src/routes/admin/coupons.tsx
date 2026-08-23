import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/coupons")({ component: AdminCoupons });

type Coupon = { id?: string; code: string; type: "percent" | "fixed"; value: number; min_subtotal: number | null; max_uses: number | null; expires_at: string | null; active: boolean };
const empty: Coupon = { code: "", type: "percent", value: 10, min_subtotal: 0, max_uses: null, expires_at: null, active: true };

function AdminCoupons() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin_coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const save = useMutation({
    mutationFn: async (c: Coupon) => {
      const payload = { ...c, code: c.code.toUpperCase().trim(), min_subtotal: c.min_subtotal ?? 0, max_uses: c.max_uses || null, expires_at: c.expires_at || null };
      if (c.id) { const { error } = await supabase.from("coupons").update(payload).eq("id", c.id); if (error) throw error; }
      else { const { error } = await supabase.from("coupons").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_coupons"] }); toast.success("Saved"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("coupons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_coupons"] }); toast.success("Deleted"); },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Coupons</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditing({ ...empty }); setOpen(true); }}>New coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} coupon</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div><Label>Code *</Label><Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as Coupon["type"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percent off</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Value *</Label><Input type="number" step="0.01" value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} /></div>
                  <div><Label>Min subtotal</Label><Input type="number" step="0.01" value={editing.min_subtotal ?? 0} onChange={(e) => setEditing({ ...editing, min_subtotal: Number(e.target.value) })} /></div>
                  <div><Label>Max uses (blank = unlimited)</Label><Input type="number" value={editing.max_uses ?? ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div className="col-span-2"><Label>Expires at</Label><Input type="datetime-local" value={editing.expires_at ? editing.expires_at.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                  <div className="col-span-2 flex items-center justify-between"><Label>Active</Label><Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /></div>
                </div>
                <Button className="w-full" onClick={() => save.mutate(editing)} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6 overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest">
            <tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Uses</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.type === "percent" ? `${c.value}%` : `$${c.value}`}</td>
                <td className="p-3">{c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="p-3">{c.expires_at ? formatDate(c.expires_at) : "—"}</td>
                <td className="p-3 text-xs capitalize">{c.active ? "active" : "inactive"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(c as Coupon); setOpen(true); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm(`Delete ${c.code}?`) && del.mutate(c.id!)}>Delete</Button>
                </td>
              </tr>
            ))}
            {(data?.length ?? 0) === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No coupons.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}