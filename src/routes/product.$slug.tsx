import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import {
  ProductCard,
  type ProductCardProduct,
} from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/format";
import { useCart, useWishlist } from "@/lib/cart";
import { StarRating } from "@/components/star-rating";
import { Heart, Truck, Shield, RotateCw } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="container-luxe py-24 text-center">{error.message}</div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-luxe py-24 text-center">Product not found.</div>
    </SiteShell>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const { toggle } = useWishlist();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const product = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,slug,name,description,short_description,price,compare_at_price,sku,stock,sizes,colors,specifications,rating_avg,rating_count,pet_type,category_id,product_images(url,sort_order,alt),category:categories(name,slug)",
        )
        .eq("slug", slug)
        .eq("visible", true)
        .eq("archived", false)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const related = useQuery({
    enabled: !!product.data?.category_id,
    queryKey: ["related", product.data?.category_id, product.data?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,product_images(url,sort_order)",
        )
        .eq("category_id", product.data!.category_id!)
        .eq("visible", true)
        .eq("archived", false)
        .neq("id", product.data!.id)
        .limit(4);
      return (data ?? []) as unknown as ProductCardProduct[];
    },
  });

  const reviews = useQuery({
    enabled: !!product.data?.id,
    queryKey: ["product_reviews", product.data?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id,rating,comment,created_at,admin_reply")
        .eq("product_id", product.data!.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (product.isLoading)
    return (
      <SiteShell>
        <div className="container-luxe py-24">Loading…</div>
      </SiteShell>
    );
  if (!product.data) return null;
  const p = product.data;
  const images = [...(p.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const compare = p.compare_at_price ? Number(p.compare_at_price) : null;

  return (
    <SiteShell>
      <div className="container-luxe py-10">
        <nav className="mb-8 text-xs text-muted-foreground">
          <Link to="/shop">Shop</Link>
          {p.category && (
            <>
              {" "}
              /{" "}
              <Link
                to="/category/$slug"
                params={{ slug: (p.category as { slug: string }).slug }}
              >
                {(p.category as { name: string }).name}
              </Link>
            </>
          )}
          {" / "}
          <span className="text-foreground">{p.name}</span>
        </nav>
        <div className="grid gap-8 md:gap-12 lg:grid-cols-2">
          <div>
            <div className="aspect-[4/5] overflow-hidden rounded-sm bg-secondary">
              {images[imgIdx] ? (
                <img
                  src={images[imgIdx].url}
                  alt={images[imgIdx].alt ?? p.name}
                  width={800}
                  height={1000}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-8xl text-muted-foreground/30">
                  {p.name.charAt(0)}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {images.map((im, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`aspect-square overflow-hidden rounded-sm border ${i === imgIdx ? "border-foreground" : "border-transparent"}`}
                  >
                    <img
                      src={im.url}
                      alt=""
                      width={200}
                      height={200}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">
              {p.name}
            </h1>
            {p.rating_count > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <StarRating
                  rating={Number(p.rating_avg)}
                  className="text-accent"
                />
                <span className="text-muted-foreground">
                  {Number(p.rating_avg).toFixed(1)} ({p.rating_count})
                </span>
              </div>
            )}
            <div className="mt-4 flex items-baseline gap-3 font-display text-2xl">
              <span>{formatMoney(p.price)}</span>
              {compare && compare > Number(p.price) && (
                <span className="text-muted-foreground line-through text-lg">
                  {formatMoney(compare)}
                </span>
              )}
            </div>
            {p.short_description && (
              <p className="mt-6 text-muted-foreground">
                {p.short_description}
              </p>
            )}

            {p.sizes && p.sizes.length > 0 && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Size
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`rounded-sm border px-4 py-2 text-sm ${size === s ? "border-foreground bg-foreground text-background" : "border-border"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {p.colors && p.colors.length > 0 && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Color
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.colors.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`rounded-sm border px-4 py-2 text-sm capitalize ${color === c ? "border-foreground bg-foreground text-background" : "border-border"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-2 sm:gap-3">
              <Button
                size="lg"
                className="flex-1 rounded-none"
                disabled={p.stock <= 0}
                onClick={() => add.mutate({ product_id: p.id, size, color })}
              >
                {p.stock > 0 ? "Add to bag" : "Sold out"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-none"
                onClick={() => toggle.mutate(p.id)}
                aria-label="Wishlist"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            {p.stock > 0 && p.stock < 10 && (
              <div className="mt-2 text-xs text-accent-foreground/80">
                Only {p.stock} left
              </div>
            )}

            <ul className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
              <li className="flex flex-col items-center gap-2 text-center">
                <Truck className="h-4 w-4" />
                Free ship $75+
              </li>
              <li className="flex flex-col items-center gap-2 text-center">
                <RotateCw className="h-4 w-4" />
                30-day returns
              </li>
              <li className="flex flex-col items-center gap-2 text-center">
                <Shield className="h-4 w-4" />
                Crafted with care
              </li>
            </ul>

            {p.description && (
              <div className="mt-10 border-t border-border pt-6">
                <h2 className="font-display text-xl">Details</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {p.description}
                </p>
              </div>
            )}

            {p.specifications &&
              Object.keys(p.specifications as object).length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h2 className="font-display text-xl">Specifications</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                    {Object.entries(
                      p.specifications as Record<string, unknown>,
                    ).map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted-foreground capitalize">
                          {k}
                        </dt>
                        <dd>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
          </div>
        </div>

        {(reviews.data?.length ?? 0) > 0 && (
          <section className="mt-20 border-t border-border pt-10">
            <h2 className="font-display text-3xl">Reviews</h2>
            <div className="mt-6 space-y-6">
              {reviews.data!.map((r) => (
                <div key={r.id} className="border-b border-border pb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StarRating rating={r.rating} className="text-accent" />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5">
                        Verified purchase
                      </span>
                      {formatDate(r.created_at)}
                    </div>
                  </div>
                  <p className="mt-3">{r.comment}</p>
                  {r.admin_reply && (
                    <div className="mt-3 rounded-sm bg-secondary p-3 text-sm">
                      <strong>Reply from the team:</strong> {r.admin_reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {(related.data?.length ?? 0) > 0 && (
          <section className="mt-20 border-t border-border pt-10">
            <h2 className="font-display text-3xl">You may also love</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {related.data!.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
