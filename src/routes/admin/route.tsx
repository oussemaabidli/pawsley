import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/banners", label: "Banners" },
  { to: "/admin/homepage", label: "Homepage" },
  { to: "/admin/faqs", label: "FAQs" },
  { to: "/admin/settings", label: "Settings" },
] as const;

function AdminLayout() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background">
      <aside className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="p-6 font-display text-xl">Pawsley</div>
        <nav className="mt-2 flex flex-col gap-0.5 px-3">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/admin" }} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }} className="rounded px-3 py-2 text-sm hover:bg-sidebar-accent">{n.label}</Link>
          ))}
          <Link to="/" className="mt-4 rounded px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent">← Back to store</Link>
        </nav>
      </aside>
      <main className="min-h-screen"><Outlet /></main>
    </div>
  );
}