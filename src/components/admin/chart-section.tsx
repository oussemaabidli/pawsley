import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export default function ChartSection() {
  const trend = useQuery({
    queryKey: ["admin_revenue_trend"],
    staleTime: 60_000,
    queryFn: async () => {
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("orders")
        .select("total,created_at,status")
        .gte("created_at", start.toISOString())
        .neq("status", "cancelled")
        .neq("status", "rejected");
      const byDay = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        byDay.set(d.toISOString().slice(0, 10), 0);
      }
      (data ?? []).forEach((o) => {
        const k = new Date(o.created_at).toISOString().slice(0, 10);
        byDay.set(k, (byDay.get(k) ?? 0) + Number(o.total));
      });
      return Array.from(byDay.entries()).map(([date, revenue]) => ({
        date,
        label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: +revenue.toFixed(2),
      }));
    },
  });

  const totalRevenue = (trend.data ?? []).reduce((s, r) => s + r.revenue, 0);

  return (
    <>
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {formatMoney(totalRevenue)} total
        </span>
      </div>
      <ChartContainer
        config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" } }}
        className="mt-4 h-64 w-full"
      >
        <AreaChart data={trend.data ?? []}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} fontSize={11} width={48} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatMoney(Number(v))} />} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ChartContainer>
    </>
  );
}
