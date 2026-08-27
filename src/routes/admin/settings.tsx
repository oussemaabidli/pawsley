import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type Row = { key: string; value: Record<string, unknown> };

function AdminSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: async () =>
      ((await supabase.from("site_settings").select("key,value").order("key"))
        .data ?? []) as Row[],
  });
  const [newKey, setNewKey] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const createRow = useMutation({
    mutationFn: async () => {
      const k = newKey
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_");
      if (!k) throw new Error("Key required");
      const { error } = await supabase
        .from("site_settings")
        .insert({ key: k, value: {} });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      toast.success("Created");
      setOpenNew(false);
      setNewKey("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Public-safe keys: brand, social, seo, footer, shipping, contact,
            payment_public, theme, homepage.
          </p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button variant="outline">New key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New setting key</DialogTitle>
            </DialogHeader>
            <Label>Key</Label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. brand"
            />
            <Button
              onClick={() => createRow.mutate()}
              disabled={createRow.isPending}
            >
              Create
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6 grid gap-4">
        {(data ?? []).map((s) => (
          <SettingRow
            key={s.key}
            row={s}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ["admin_settings"] });
              qc.invalidateQueries({ queryKey: ["site_settings"] });
            }}
          />
        ))}
        {(data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">No settings yet.</p>
        )}
      </div>
    </div>
  );
}

function SettingRow({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const [text, setText] = useState(JSON.stringify(row.value ?? {}, null, 2));
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setText(JSON.stringify(row.value ?? {}, null, 2)), [row]);
  const save = useMutation({
    mutationFn: async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON: " + (e as Error).message);
      }
      const { error } = await supabase
        .from("site_settings")
        .update({ value: parsed as never })
        .eq("key", row.key);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      setErr(null);
      onSaved();
    },
    onError: (e: Error) => {
      setErr(e.message);
      toast.error(e.message);
    },
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .delete()
        .eq("key", row.key);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      onSaved();
    },
  });
  return (
    <div className="rounded border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="font-display text-lg">{row.key}</div>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={() => confirm(`Delete "${row.key}"?`) && del.mutate()}
        >
          Delete
        </Button>
      </div>
      <Textarea
        rows={8}
        className="mt-3 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={save.isPending}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
