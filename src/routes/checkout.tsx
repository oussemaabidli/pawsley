import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSiteSettings } from "@/lib/site-settings";
import { formatMoney } from "@/lib/format";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal } = useCart();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "United States",
    delivery: "standard",
    notes: "",
  });

  const shippingFlat = Number(settings?.shipping?.flat_rate ?? 0);
  const freeOver = Number(settings?.shipping?.free_over ?? 0);
  const taxRate = Number(settings?.shipping?.tax_rate ?? 0);
  const shipping = subtotal >= freeOver && freeOver > 0 ? 0 : shippingFlat;
  const tax = +(subtotal * taxRate).toFixed(2);
  const total = subtotal + shipping + tax;

  const update = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const placeOrder = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    if (
      !form.full_name ||
      !form.line1 ||
      !form.city ||
      !form.country ||
      !form.email
    ) {
      toast.error("Please complete required fields");
      return;
    }
    setSubmitting(true);
    try {
      const address = {
        full_name: form.full_name,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        country: form.country,
      };
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          email: form.email,
          subtotal,
          discount: 0,
          tax,
          shipping,
          total,
          shipping_address: address,
          billing_address: address,
          delivery_method: form.delivery,
          payment_method: "cod",
          notes: form.notes || null,
        })
        .select("id,order_number")
        .single();
      if (error) throw error;
      const orderItems = items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        name: it.product.name,
        image_url:
          [...(it.product.product_images ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          )[0]?.url ?? null,
        price: it.product.price,
        quantity: it.quantity,
        size: it.size,
        color: it.color,
      }));
      const { error: itErr } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itErr) throw itErr;
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      toast.success(`Order ${order.order_number} placed`);
      navigate({ to: "/account/orders/$id", params: { id: order.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user)
    return (
      <SiteShell>
        <div className="container-luxe py-24 text-center">
          <p>Please sign in to check out.</p>
          <Button asChild className="mt-4">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </SiteShell>
    );

  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">
          Checkout
        </h1>
        <div className="mt-8 sm:mt-10 grid gap-8 sm:gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <section>
              <h2 className="font-display text-2xl">Contact</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Full name *</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
            </section>
            <section>
              <h2 className="font-display text-2xl">Shipping address</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Address line 1 *</Label>
                  <Input
                    value={form.line1}
                    onChange={(e) => update("line1", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address line 2</Label>
                  <Input
                    value={form.line2}
                    onChange={(e) => update("line2", e.target.value)}
                  />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label>State / Region</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input
                    value={form.postal_code}
                    onChange={(e) => update("postal_code", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                  />
                </div>
              </div>
            </section>
            <section>
              <h2 className="font-display text-2xl">Delivery</h2>
              <RadioGroup
                value={form.delivery}
                onValueChange={(v) => update("delivery", v)}
                className="mt-4 space-y-2"
              >
                <label className="flex items-center gap-3 rounded border border-border p-3">
                  <RadioGroupItem value="standard" /> Standard — 3–5 business
                  days
                </label>
                <label className="flex items-center gap-3 rounded border border-border p-3">
                  <RadioGroupItem value="express" /> Express — 1–2 business days
                </label>
              </RadioGroup>
            </section>

            <section>
              <h2 className="font-display text-2xl">Order notes</h2>
              <Input
                className="mt-4"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Anything we should know?"
              />
            </section>
          </div>
          <aside className="h-fit rounded border border-border p-6">
            <h2 className="font-display text-xl">Your order</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2">
                  <span>
                    {it.product.name} × {it.quantity}
                  </span>
                  <span>
                    {formatMoney(Number(it.product.price) * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatMoney(shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{formatMoney(tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatMoney(total)}</dd>
              </div>
            </dl>
            <Button
              size="lg"
              className="mt-6 w-full rounded-none"
              disabled={submitting}
              onClick={placeOrder}
            >
              {submitting ? "Placing…" : "Place order"}
            </Button>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
