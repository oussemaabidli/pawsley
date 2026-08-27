import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/faqs")({ component: AdminFaqs });

type FAQ = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  visible: boolean;
};

function AdminFaqs() {
  const qc = useQueryClient();
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () =>
      ((await supabase.from("faqs").select("*").order("sort_order")).data ??
        []) as FAQ[],
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<FAQ>>({
    question: "",
    answer: "",
    sort_order: 0,
    visible: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveFaq = useMutation({
    mutationFn: async () => {
      if (!form.question || !form.answer)
        throw new Error("Question and answer are required");
      if (editingId) {
        const { error } = await supabase
          .from("faqs")
          .update(form)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("faqs").insert({
          question: form.question,
          answer: form.answer,
          sort_order: form.sort_order,
          visible: form.visible,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast.success(editingId ? "FAQ updated" : "FAQ created");
      setOpen(false);
      setForm({ question: "", answer: "", sort_order: 0, visible: true });
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFaq = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (faq: FAQ) => {
    setForm(faq);
    setEditingId(faq.id);
    setOpen(true);
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl">Manage FAQs</h1>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditingId(null);
              setForm({
                question: "",
                answer: "",
                sort_order: 0,
                visible: true,
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>Add FAQ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit FAQ" : "New FAQ"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Question</Label>
                <Input
                  value={form.question}
                  onChange={(e) =>
                    setForm({ ...form, question: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Answer</Label>
                <Textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Visible</Label>
                  <Switch
                    checked={form.visible}
                    onCheckedChange={(v) => setForm({ ...form, visible: v })}
                  />
                </div>
              </div>
              <Button
                onClick={() => saveFaq.mutate()}
                disabled={saveFaq.isPending}
                className="w-full"
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-8 rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : null}
            {faqs.map((f) => (
              <TableRow
                key={f.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openEdit(f)}
              >
                <TableCell>{f.sort_order}</TableCell>
                <TableCell className="font-medium">{f.question}</TableCell>
                <TableCell>{f.visible ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFaq.mutate(f.id);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
