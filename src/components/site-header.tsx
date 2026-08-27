import { Link } from "@tanstack/react-router";
import { ShoppingBag, Heart, User, Menu, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useSiteSettings, getBrandName } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const defaultNav = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const { data: settings } = useSiteSettings();
  const brand = getBrandName(settings);
  const nav =
    (settings?.navigation as unknown as { to: string; label: string }[]) ??
    defaultNav;
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container-luxe flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation menu</SheetTitle>
                <SheetDescription>Main site navigation links</SheetDescription>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4 text-lg font-display">
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="hover:text-accent"
                  >
                    {n.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="hover:text-accent"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="font-display text-2xl tracking-tight">
            {brand}
          </Link>
          <nav className="hidden gap-8 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm tracking-wide text-foreground/80 transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Search">
            <Link to="/shop">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Account">
            <Link to={user ? "/account" : "/auth"}>
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Cart"
          >
            <Link to="/cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
