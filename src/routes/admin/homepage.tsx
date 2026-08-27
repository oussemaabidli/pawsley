import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";

export const Route = createFileRoute("/admin/homepage")({
  component: AdminHomepage,
});

type Section = {
  id: string;
  key: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_link: string | null;
  image_url: string | null;
  visible: boolean;
  sort_order: number;
};

function AdminHomepage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_homepage"],
    queryFn: async () =>
      ((
        await supabase
          .from("homepage_sections")
          .select(
            "id,key,type,title,subtitle,cta_label,cta_link,image_url,visible,sort_order",
          )
          .order("sort_order")
      ).data ?? []) as Section[],
  });

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-display text-2xl sm:text-3xl">Homepage sections</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Edit each section in place. Sections render in sort order.
      </p>
      <div className="mt-6 grid gap-4">
        {(data ?? []).map((s) => (
          <SectionEditor
            key={s.id}
            section={s}
            onSaved={() =>
              qc.invalidateQueries({ queryKey: ["admin_homepage"] })
            }
          />
        ))}
        {(data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">No sections.</p>
        )}
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  onSaved,
}: {
  section: Section;
  onSaved: () => void;
}) {
  const [s, setS] = useState<Section>(section);
  useEffect(() => setS(section), [section]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          title: s.title || null,
          subtitle: s.subtitle || null,
          cta_label: s.cta_label || null,
          cta_link: s.cta_link || null,
          image_url: s.image_url || null,
          visible: s.visible,
          sort_order: s.sort_order,
        })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const dirty = JSON.stringify(s) !== JSON.stringify(section);
  return (
    <div className="rounded border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {s.type} · {s.key}
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs">Visible</Label>
          <Switch
            checked={s.visible}
            onCheckedChange={(v) => setS({ ...s, visible: v })}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <Label>Title</Label>
          <Input
            value={s.title ?? ""}
            onChange={(e) => setS({ ...s, title: e.target.value })}
          />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
            type="number"
            value={s.sort_order}
            onChange={(e) => setS({ ...s, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Subtitle</Label>
          <Textarea
            rows={2}
            value={s.subtitle ?? ""}
            onChange={(e) => setS({ ...s, subtitle: e.target.value })}
          />
        </div>
        <div>
          <Label>CTA label</Label>
          <Input
            value={s.cta_label ?? ""}
            onChange={(e) => setS({ ...s, cta_label: e.target.value })}
          />
        </div>
        <div>
          <Label>CTA link</Label>
          <Input
            value={s.cta_link ?? ""}
            onChange={(e) => setS({ ...s, cta_link: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Image</Label>
          <ImageUpload
            bucket="site-assets"
            folder={`homepage/${s.key}`}
            value={s.image_url ?? ""}
            onChange={(v) => setS({ ...s, image_url: v })}
            aspect="aspect-video"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={!dirty || save.isPending}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
