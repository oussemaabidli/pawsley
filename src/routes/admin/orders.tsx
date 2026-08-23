import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["pending","accepted","preparing","shipped","delivered","cancelled","refunded","rejected"] as const;

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: async () => (await supabase.from("orders").select("id,order_number,email,status,total,created_at").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: typeof STATUSES[number] }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_orders"] }); toast.success("Order updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Orders</h1>
      <div className="mt-6 overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {(data ?? []).map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 font-medium">{o.order_number}</td>
                <td className="p-3">{o.email}</td>
                <td className="p-3">{formatDate(o.created_at)}</td>
                <td className="p-3">{formatMoney(o.total)}</td>
                <td className="p-3">
                  <Select value={o.status} onValueChange={(v) => update.mutate({ id: o.id, status: v as typeof STATUSES[number] })}>
                    <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {(data?.length ?? 0) === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}