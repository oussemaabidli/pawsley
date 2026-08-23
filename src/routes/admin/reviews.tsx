import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

function AdminReviews() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_reviews"],
    queryFn: async () => (await supabase.from("reviews").select("id,rating,comment,status,created_at,product:products(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_reviews"] }); toast.success("Updated"); },
  });
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Reviews</h1>
      <ul className="mt-6 space-y-4">
        {(data ?? []).map((r) => (
          <li key={r.id} className="rounded border border-border p-5">
            <div className="flex items-center justify-between">
              <div><div className="font-medium">{(r.product as { name: string } | null)?.name}</div><div className="text-xs text-muted-foreground capitalize">{r.status} · {"★".repeat(r.rating)}</div></div>
              <div className="flex gap-2">
                {r.status !== "approved" && <Button size="sm" onClick={() => setStatus.mutate({ id: r.id, status: "approved" })}>Approve</Button>}
                {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}>Reject</Button>}
              </div>
            </div>
            {r.comment && <p className="mt-3 text-sm">{r.comment}</p>}
          </li>
        ))}
        {(data?.length ?? 0) === 0 && <li className="rounded border border-dashed border-border p-10 text-center text-muted-foreground">No reviews yet.</li>}
      </ul>
    </div>
  );
}