import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Ticket,
  Star,
  Users,
  Image,
  Home,
  HelpCircle,
  Settings,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/contacts", label: "Messages", icon: MessageSquare },
  { to: "/admin/homepage", label: "Homepage", icon: Home },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

// Hoisted to module level so React sees a stable component identity across
// re-renders of AdminLayout — prevents unnecessary unmount/remount of the nav.
function AdminSidebar({ onLinkClick }: { onLinkClick: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3 mt-2">
      {nav.map((n) => {
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/admin" }}
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground",
            }}
            className="flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors"
            onClick={onLinkClick}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-70" />
            {n.label}
          </Link>
        );
      })}
      <Link
        to="/"
        className="mt-4 flex items-center gap-3 rounded px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
        onClick={onLinkClick}
      >
        ← Back to store
      </Link>
    </nav>
  );
}

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Mobile top bar ── */}
      <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <span className="font-display text-lg">Pawsley Admin</span>
        <button
          onClick={() => setOpen(!open)}
          className="rounded p-1.5 hover:bg-sidebar-accent transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile slide-down nav ── */}
      {open && (
        <div className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:hidden">
          <AdminSidebar onLinkClick={closeMenu} />
          <div className="h-3" />
        </div>
      )}

      {/* ── Desktop layout ── */}
      <div className="md:grid md:grid-cols-[240px_1fr] md:min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:block border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <div className="p-6 font-display text-xl">Pawsley Admin</div>
          <AdminSidebar onLinkClick={closeMenu} />
        </aside>

        {/* Main content */}
        <main className="min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
