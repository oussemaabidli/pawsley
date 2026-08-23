import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account")({ component: AccountPage });

function AccountPage() {
  const { user, signOut, isAdmin } = useAuth();
  const orders = useQuery({
    queryKey: ["my_orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,order_number,status,total,created_at").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-display text-4xl">Your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && <Button asChild variant="outline"><Link to="/admin">Admin dashboard</Link></Button>}
            <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Link to="/wishlist" className="rounded border border-border p-6 hover:bg-secondary/40">
            <div className="font-display text-xl">Wishlist</div>
            <div className="mt-1 text-sm text-muted-foreground">Products you've saved</div>
          </Link>
          <div className="rounded border border-border p-6">
            <div className="font-display text-xl">Addresses</div>
            <div className="mt-1 text-sm text-muted-foreground">Manage during checkout</div>
          </div>
          <div className="rounded border border-border p-6">
            <div className="font-display text-xl">Settings</div>
            <div className="mt-1 text-sm text-muted-foreground">Profile & preferences</div>
          </div>
        </div>
        <div className="mt-12">
          <h2 className="font-display text-2xl">Orders</h2>
          <div className="mt-4 overflow-hidden rounded border border-border">
            {orders.data?.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No orders yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th><th /></tr>
                </thead>
                <tbody>
                  {orders.data?.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3 font-medium">{o.order_number}</td>
                      <td className="p-3">{formatDate(o.created_at)}</td>
                      <td className="p-3 capitalize">{o.status}</td>
                      <td className="p-3 text-right">{formatMoney(o.total)}</td>
                      <td className="p-3 text-right"><Link to="/account/orders/$id" params={{ id: o.id }} className="underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}