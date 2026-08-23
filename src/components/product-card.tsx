import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/format";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/cart";

export type ProductCardProduct = {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  compare_at_price?: number | string | null;
  product_images?: { url: string; sort_order: number }[] | null;
};

function getFirstImage(images: ProductCardProduct["product_images"]): string | undefined {
  if (!images || images.length === 0) return undefined;
  // Avoid sort on every render — find min sort_order in a single pass
  let best = images[0];
  for (let i = 1; i < images.length; i++) {
    if (images[i].sort_order < best.sort_order) best = images[i];
  }
  return best.url;
}

export const ProductCard = memo(function ProductCard({
  product,
}: {
  product: ProductCardProduct;
}) {
  const { toggle } = useWishlist();
  const img = getFirstImage(product.product_images);
  const compare = product.compare_at_price ? Number(product.compare_at_price) : null;
  const showSale = compare && compare > Number(product.price);

  return (
    <div className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block"
        preload="intent"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
          {img ? (
            <img
              src={img}
              alt={product.name}
              width={400}
              height={500}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-muted-foreground/40">
              {product.name.charAt(0)}
            </div>
          )}
          {showSale && (
            <span className="absolute left-3 top-3 rounded-sm bg-primary px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary-foreground">
              Sale
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg leading-tight">{product.name}</h3>
          <div className="whitespace-nowrap text-sm">
            {showSale && (
              <span className="mr-1 text-muted-foreground line-through">
                {formatMoney(compare)}
              </span>
            )}
            <span>{formatMoney(product.price)}</span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle.mutate(product.id);
        }}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        aria-label="Toggle wishlist"
      >
        <Heart className="h-4 w-4" />
      </button>
    </div>
  );
});
