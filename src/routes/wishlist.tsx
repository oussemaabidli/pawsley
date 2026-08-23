import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useWishlist, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { X } from "lucide-react";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const { user } = useAuth();
  const { items, toggle } = useWishlist();
  const { add } = useCart();

  if (!user) return (
    <SiteShell>
      <div className="container-luxe py-24 text-center">
        <h1 className="font-display text-4xl">Wishlist</h1>
        <p className="mt-4 text-muted-foreground">Sign in to save products you love.</p>
        <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
      </div>
    </SiteShell>
  );

  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <h1 className="font-display text-4xl md:text-5xl">Wishlist</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded border border-dashed p-16 text-center text-muted-foreground">Nothing saved yet.</div>
        ) : (
          <ul className="mt-10 divide-y divide-border">
            {items.map((it) => {
              const p = it.product as { id: string; slug: string; name: string; price: number; product_images: { url: string; sort_order: number }[] };
              const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
              return (
                <li key={it.id} className="flex items-center gap-4 py-6">
                  <Link to="/product/$slug" params={{ slug: p.slug }} className="h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
                    {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex-1">
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="font-display text-lg">{p.name}</Link>
                    <div className="text-sm">{formatMoney(p.price)}</div>
                  </div>
                  <Button variant="outline" onClick={() => add.mutate({ product_id: p.id })}>Add to bag</Button>
                  <button onClick={() => toggle.mutate(p.id)} aria-label="Remove"><X className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SiteShell>
  );
}