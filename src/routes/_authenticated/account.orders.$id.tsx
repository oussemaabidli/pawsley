import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account/orders/$id")({
  component: OrderPage,
});

type OrderItem = {
  id: string;
  product_id: string | null;
  name: string;
  image_url: string | null;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
};

function OrderPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const order = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,order_number,status,payment_status,payment_method,delivery_method,tracking_number,subtotal,discount,tax,shipping,total,shipping_address,notes,created_at,order_items(*),order_status_history(status,note,created_at)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const items = (order.data?.order_items as OrderItem[] | undefined) ?? [];
  const productIds = Array.from(
    new Set(items.map((i) => i.product_id).filter(Boolean)),
  ) as string[];
  const reviews = useQuery({
    enabled: !!user && productIds.length > 0,
    queryKey: ["my_reviews_for_order", id, user?.id, productIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("product_id")
        .eq("user_id", user!.id)
        .in("product_id", productIds);
      if (error) throw error;
      return data;
    },
  });

  if (order.isLoading)
    return (
      <SiteShell>
        <div className="container-luxe py-24">Loading…</div>
      </SiteShell>
    );
  if (!order.data)
    return (
      <SiteShell>
        <div className="container-luxe py-24 text-center">Order not found.</div>
      </SiteShell>
    );
  const o = order.data;
  const addr = o.shipping_address as {
    full_name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
  };
  const reviewedIds = new Set((reviews.data ?? []).map((r) => r.product_id));
  const canReview = o.status === "delivered";

  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <Link to="/account" className="text-sm text-muted-foreground">
          ← Back to account
        </Link>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">
            Order {o.order_number}
          </h1>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-widest capitalize">
            {o.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed {formatDate(o.created_at)}
        </p>
        <div className="mt-8 sm:mt-10 grid gap-8 sm:gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="font-display text-xl">Items</h2>
            <ul className="mt-4 divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="py-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded bg-secondary">
                      {it.image_url && (
                        <img
                          src={it.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Qty {it.quantity}
                        {it.size ? ` · ${it.size}` : ""}
                        {it.color ? ` · ${it.color}` : ""}
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatMoney(Number(it.price) * it.quantity)}
                    </div>
                  </div>
                  {canReview &&
                    it.product_id &&
                    (reviewedIds.has(it.product_id) ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        ✓ Review submitted — thank you
                      </p>
                    ) : (
                      <ReviewForm
                        productId={it.product_id}
                        orderId={o.id}
                        onDone={() =>
                          qc.invalidateQueries({
                            queryKey: ["my_reviews_for_order"],
                          })
                        }
                      />
                    ))}
                </li>
              ))}
            </ul>
            {(
              o.order_status_history as {
                status: string;
                created_at: string;
                note: string | null;
              }[]
            )?.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-xl">Timeline</h2>
                <ul className="mt-4 space-y-3">
                  {(
                    o.order_status_history as {
                      status: string;
                      created_at: string;
                      note: string | null;
                    }[]
                  ).map((h, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      <span className="capitalize">{h.status}</span>
                      <span className="text-muted-foreground">
                        · {formatDateTime(h.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <aside className="h-fit space-y-6 rounded border border-border p-6">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                Ship to
              </h3>
              <address className="mt-2 not-italic text-sm">
                {addr.full_name}
                <br />
                {addr.line1}
                <br />
                {addr.line2 && (
                  <>
                    {addr.line2}
                    <br />
                  </>
                )}
                {addr.city}
                {addr.state ? `, ${addr.state}` : ""} {addr.postal_code}
                <br />
                {addr.country}
              </address>
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{formatMoney(o.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{formatMoney(o.tax)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
                <dt>Total</dt>
                <dd>{formatMoney(o.total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

function ReviewForm({
  productId,
  orderId,
  onDone,
}: {
  productId: string;
  orderId: string;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const submit = useMutation({
    mutationFn: async () => {
      if (rating < 1) throw new Error("Please choose a rating");
      if (!user) throw new Error("Please sign in");
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        order_id: orderId,
        rating,
        comment: comment.trim() || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thanks — your review will appear once approved");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-3 rounded border border-border bg-secondary/30 p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Leave a review
      </div>
      <div
        className="mt-2 flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="text-lg leading-none"
          >
            <span
              className={
                n <= (hover || rating)
                  ? "text-accent"
                  : "text-muted-foreground/40"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      <Textarea
        rows={2}
        className="mt-2 text-sm"
        placeholder="Optional comment…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="mt-2 flex justify-end">
        <Button
          size="sm"
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
        >
          {submit.isPending ? "Submitting…" : "Submit review"}
        </Button>
      </div>
    </div>
  );
}
