import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Suspense, lazy, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, formatDate } from "@/lib/format";

const ChartSection = lazy(() => import("@/components/admin/chart-section"));

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [ordersToday, ordersMonth, revenueMonth, pending, low, recent, customers] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startOfDay),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
        supabase.from("orders").select("total").gte("created_at", startOfMonth).neq("status", "cancelled").neq("status", "rejected"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id,name,stock").lt("stock", 10).eq("archived", false).order("stock").limit(5),
        supabase.from("orders").select("id,order_number,total,status,created_at,email").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const rev = (revenueMonth.data ?? []).reduce((s, r) => s + Number(r.total), 0);
      return {
        ordersToday: ordersToday.count ?? 0,
        ordersMonth: ordersMonth.count ?? 0,
        revenueMonth: rev,
        pending: pending.count ?? 0,
        low: low.data ?? [],
        recent: recent.data ?? [],
        customers: customers.count ?? 0,
      };
    },
  });

  const cards = useMemo(
    () => [
      { label: "Revenue this month", value: formatMoney(stats.data?.revenueMonth ?? 0) },
      { label: "Orders today", value: stats.data?.ordersToday ?? 0 },
      { label: "Orders this month", value: stats.data?.ordersMonth ?? 0 },
      { label: "Pending orders", value: stats.data?.pending ?? 0 },
      { label: "Customers", value: stats.data?.customers ?? 0 },
    ],
    [stats.data]
  );

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Overview</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</div>
            <div className="mt-2 font-display text-2xl">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl">Revenue — last 30 days</h2>
          </div>
          <Suspense
            fallback={<div className="mt-4 h-64 w-full animate-pulse rounded bg-muted" />}
          >
            <ChartSection />
          </Suspense>
        </section>

        <section className="rounded border border-border bg-card p-6">
          <h2 className="font-display text-xl">Top products</h2>
          <Suspense
            fallback={<div className="mt-4 h-64 w-full animate-pulse rounded bg-muted" />}
          >
            <TopProductsChart />
          </Suspense>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-border bg-card p-6">
          <h2 className="font-display text-xl">Recent orders</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {stats.data?.recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{o.email} · {formatDate(o.created_at)}</div>
                </div>
                <div className="text-right">
                  <div>{formatMoney(o.total)}</div>
                  <div className="text-xs capitalize text-muted-foreground">{o.status}</div>
                </div>
              </li>
            ))}
            {stats.data?.recent.length === 0 && <li className="py-4 text-muted-foreground">No orders yet.</li>}
          </ul>
        </section>
        <section className="rounded border border-border bg-card p-6">
          <h2 className="font-display text-xl">Low stock</h2>
          <ul className="mt-4 divide-y divide-border text-sm">
            {stats.data?.low.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>{p.name}</span>
                <span className="text-muted-foreground">{p.stock} left</span>
              </li>
            ))}
            {stats.data?.low.length === 0 && <li className="py-4 text-muted-foreground">All stocked.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function TopProductsChart() {
  const top = useQuery({
    queryKey: ["admin_top_products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("product_id,name,quantity,price,order:orders!inner(status)")
        .in("order.status", ["accepted", "preparing", "shipped", "delivered"])
        .limit(1000);
      const map = new Map<string, { name: string; qty: number; revenue: number }>();
      (data ?? []).forEach((r) => {
        const key = (r.product_id ?? r.name) as string;
        const cur = map.get(key) ?? { name: r.name, qty: 0, revenue: 0 };
        cur.qty += r.quantity;
        cur.revenue += Number(r.price) * r.quantity;
        map.set(key, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 6);
    },
  });

  if (!top.data || top.data.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">No sales yet.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {top.data.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <span className="truncate">{item.name}</span>
          <span className="ml-4 shrink-0 text-muted-foreground">{item.qty} sold</span>
        </div>
      ))}
    </div>
  );
}
