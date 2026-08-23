import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

const PAGE_SIZE = 25;

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin_products", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await supabase
        .from("products")
        .select("id,name,slug,price,stock,visible,archived,featured", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data ?? [], count: count ?? 0 };
    },
  });

  const filtered = useMemo(() => {
    if (!debouncedQ.trim()) return data?.items ?? [];
    const lower = debouncedQ.toLowerCase();
    return (data?.items ?? []).filter((p) => p.name.toLowerCase().includes(lower));
  }, [data?.items, debouncedQ]);

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_products"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleArchive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("products").update({ archived }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_products"] }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Products</h1>
        <Button asChild><Link to="/admin/products/new">New product</Link></Button>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <Input className="max-w-sm" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <span className="text-sm text-muted-foreground">{data?.count ?? 0} total</span>
      </div>
      <div className="mt-4 overflow-hidden rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td colSpan={5} className="p-3"><div className="h-4 animate-pulse rounded bg-muted" /></td>
                </tr>
              ))
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <Link to="/admin/products/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.name}</Link>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="p-3">{formatMoney(p.price)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3 text-xs capitalize">
                    {p.archived ? "archived" : p.visible ? "visible" : "hidden"}
                    {p.featured ? " · featured" : ""}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleArchive.mutate({ id: p.id, archived: !p.archived })}>
                      {p.archived ? "Restore" : "Archive"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                      if (confirm(`Delete "${p.name}"? This cannot be undone.`)) del.mutate(p.id);
                    }}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
            {filtered.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No products.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
