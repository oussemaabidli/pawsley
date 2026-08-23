import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });
function AdminCustomers() {
  const { data } = useQuery({
    queryKey: ["admin_customers"],
    queryFn: async () => (await supabase.from("profiles").select("id,full_name,phone,created_at").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Customers</h1>
      <div className="mt-6 overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest"><tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Joined</th></tr></thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border"><td className="p-3">{c.full_name || "—"}</td><td className="p-3">{c.phone || "—"}</td><td className="p-3">{formatDate(c.created_at)}</td></tr>
            ))}
            {(data?.length ?? 0) === 0 && <tr><td colSpan={3} className="p-10 text-center text-muted-foreground">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}