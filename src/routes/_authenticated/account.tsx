import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

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
    <div className="mt-3 rounded border border-border bg-secondary/30 p-3 max-w-sm">
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

function OrderRow({
  order,
  reviewedProductIds,
}: {
  order: any;
  reviewedProductIds: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const canReview = order.status === "delivered";

  return (
    <>
      <tr
        className="border-t border-border cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <td className="p-3 font-medium">{order.order_number}</td>
        <td className="p-3 hidden sm:table-cell">
          {formatDate(order.created_at)}
        </td>
        <td className="p-3 capitalize">{order.status}</td>
        <td className="p-3 text-right">{formatMoney(order.total)}</td>
        <td className="p-3 text-right text-muted-foreground">
          {open ? (
            <ChevronUp className="h-4 w-4 inline-block" />
          ) : (
            <ChevronDown className="h-4 w-4 inline-block" />
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} className="p-0 border-t-0">
            <div className="bg-secondary/10 px-4 py-4 sm:px-6">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Order Items
              </h4>
              <ul className="divide-y divide-border rounded border border-border bg-background">
                {order.order_items?.map((it: any) => (
                  <li key={it.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-secondary">
                        {it.image_url && (
                          <img
                            src={it.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{it.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Qty {it.quantity}
                          {it.size ? ` · ${it.size}` : ""}
                          {it.color ? ` · ${it.color}` : ""}
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        {formatMoney(Number(it.price) * it.quantity)}
                      </div>
                    </div>
                    {canReview &&
                      it.product_id &&
                      (reviewedProductIds.has(it.product_id) ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          ✓ Review submitted — thank you
                        </p>
                      ) : (
                        <ReviewForm
                          productId={it.product_id}
                          orderId={order.id}
                          onDone={() =>
                            qc.invalidateQueries({
                              queryKey: ["my_all_reviews"],
                            })
                          }
                        />
                      ))}
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AccountPage() {
  const { user, signOut, isAdmin } = useAuth();

  const orders = useQuery({
    queryKey: ["my_orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,order_number,status,total,created_at,order_items(*)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const allReviews = useQuery({
    queryKey: ["my_all_reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("product_id")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });
  const reviewedProductIds = new Set(
    allReviews.data?.map((r) => r.product_id) ?? [],
  );

  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">Your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button asChild variant="outline">
                <Link to="/admin">Admin dashboard</Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
        <div className="mt-6 sm:mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Link
            to="/wishlist"
            className="rounded border border-border p-6 hover:bg-secondary/40"
          >
            <div className="font-display text-xl">Wishlist</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Products you've saved
            </div>
          </Link>
          <div className="rounded border border-border p-6">
            <div className="font-display text-xl">Addresses</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Manage during checkout
            </div>
          </div>
          <div className="rounded border border-border p-6">
            <div className="font-display text-xl">Settings</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Profile & preferences
            </div>
          </div>
        </div>
        <div className="mt-12">
          <h2 className="font-display text-2xl">Orders</h2>
          <div className="mt-4 overflow-x-auto rounded border border-border">
            {orders.data?.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              <table className="min-w-[500px] w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3 hidden sm:table-cell">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {orders.data?.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      reviewedProductIds={reviewedProductIds}
                    />
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
