import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/site-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, update, remove } = useCart();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applying, setApplying] = useState(false);

  const shippingFlat = Number(settings?.shipping?.flat_rate ?? 0);
  const freeOver = Number(settings?.shipping?.free_over ?? 0);
  const taxRate = Number(settings?.shipping?.tax_rate ?? 0);
  const shipping = subtotal >= freeOver && freeOver > 0 ? 0 : shippingFlat;
  const taxable = Math.max(0, subtotal - discount);
  const tax = +(taxable * taxRate).toFixed(2);
  const total = Math.max(0, subtotal - discount + shipping + tax);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    try {
      const { data, error } = await supabase.from("coupons").select("code,type,value,min_subtotal,max_uses,uses,expires_at,active").ilike("code", couponCode.trim()).maybeSingle();
      if (error) throw error;
      if (!data || !data.active) { toast.error("Invalid coupon"); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("Coupon expired"); return; }
      if (data.max_uses && data.uses >= data.max_uses) { toast.error("Coupon fully redeemed"); return; }
      if (subtotal < Number(data.min_subtotal ?? 0)) { toast.error(`Requires ${formatMoney(data.min_subtotal)} minimum`); return; }
      const disc = data.type === "percent" ? +(subtotal * (Number(data.value) / 100)).toFixed(2) : Number(data.value);
      setDiscount(Math.min(disc, subtotal));
      toast.success("Coupon applied");
    } catch (e) { toast.error((e as Error).message); }
    finally { setApplying(false); }
  };

  if (!user) {
    return (
      <SiteShell>
        <div className="container-luxe py-24 text-center">
          <h1 className="font-display text-4xl">Your bag</h1>
          <p className="mt-4 text-muted-foreground">Sign in to view your bag.</p>
          <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <h1 className="font-display text-4xl md:text-5xl">Your bag</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded border border-dashed p-16 text-center text-muted-foreground">
            Your bag is empty. <Link to="/shop" className="underline">Continue shopping</Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <ul className="divide-y divide-border">
                {items.map((it) => {
                  const img = [...(it.product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
                  return (
                    <li key={it.id} className="flex gap-4 py-6">
                      <Link to="/product/$slug" params={{ slug: it.product.slug }} className="h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-secondary">
                        {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link to="/product/$slug" params={{ slug: it.product.slug }} className="font-display text-lg">{it.product.name}</Link>
                            {(it.size || it.color) && <div className="mt-1 text-xs text-muted-foreground">{[it.size, it.color].filter(Boolean).join(" · ")}</div>}
                          </div>
                          <button onClick={() => remove.mutate(it.id)} aria-label="Remove"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-auto flex items-end justify-between">
                          <div className="inline-flex items-center rounded-sm border">
                            <button className="px-2 py-1" onClick={() => update.mutate({ id: it.id, quantity: Math.max(1, it.quantity - 1) })}><Minus className="h-3 w-3" /></button>
                            <span className="w-8 text-center text-sm">{it.quantity}</span>
                            <button className="px-2 py-1" onClick={() => update.mutate({ id: it.id, quantity: Math.min(it.product.stock, it.quantity + 1) })}><Plus className="h-3 w-3" /></button>
                          </div>
                          <div className="font-medium">{formatMoney(Number(it.product.price) * it.quantity)}</div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <aside className="h-fit rounded-sm border border-border p-6">
              <h2 className="font-display text-xl">Summary</h2>
              <div className="mt-4 flex gap-2">
                <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                <Button variant="outline" onClick={applyCoupon} disabled={applying}>Apply</Button>
              </div>
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
                {discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>−{formatMoney(discount)}</dd></div>}
                <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatMoney(shipping)}</dd></div>
                <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(tax)}</dd></div>
                <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-medium"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
              </dl>
              <Button size="lg" className="mt-6 w-full rounded-none" onClick={() => navigate({ to: "/checkout", search: { code: discount > 0 ? couponCode : undefined } as never })}>
                Checkout
              </Button>
              <Button asChild variant="link" className="mt-2 w-full"><Link to="/shop">Continue shopping</Link></Button>
            </aside>
          </div>
        )}
      </div>
    </SiteShell>
  );
}