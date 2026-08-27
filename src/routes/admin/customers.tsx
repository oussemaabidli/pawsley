import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});
function AdminCustomers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_customers"],
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("id,full_name,phone,created_at")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-display text-2xl sm:text-3xl">Customers</h1>
      <div className="mt-6 overflow-x-auto rounded border border-border">
        <table className="min-w-[480px] w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3 hidden sm:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td colSpan={3} className="p-3">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))}
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{c.full_name || "—"}</td>
                <td className="p-3">{c.phone || "—"}</td>
                <td className="p-3 hidden sm:table-cell">
                  {formatDate(c.created_at)}
                </td>
              </tr>
            ))}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-10 text-center text-muted-foreground"
                >
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
