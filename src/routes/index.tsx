import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { StarRating } from "@/components/star-rating";
import {
  ProductCard,
  type ProductCardProduct,
} from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// ─── Query factories — shared between loader and useQuery ────────────────────
// Defined at module level so they can be reused in both the route loader
// (prefetching on navigation/hover) and the component (useQuery), no duplication.

const HOME_STALE = 5 * 60_000; // 5 min — homepage data changes infrequently

const sectionsQuery = () => ({
  queryKey: ["homepage_sections"],
  staleTime: HOME_STALE,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("id,key,type,title,subtitle,cta_label,cta_link,image_url,sort_order")
      .eq("visible", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Section[];
  },
});

const categoriesQuery = () => ({
  queryKey: ["home_featured_categories"],
  staleTime: HOME_STALE,
  queryFn: async () => {
    const { data } = await supabase
      .from("categories")
      .select("id,slug,name,image_url")
      .eq("visible", true)
      .order("sort_order")
      .limit(6);
    return data ?? [];
  },
});

// ONE consolidated product query replacing the previous 3 separate calls.
// Fetches all homepage products in a single round-trip; sliced client-side.
const homeProductsQuery = () => ({
  queryKey: ["home_all_products"],
  staleTime: HOME_STALE,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,slug,name,price,compare_at_price,featured,sales_count,created_at,product_images(url,sort_order)",
      )
      .eq("visible", true)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) throw error;
    return (data ?? []) as unknown as HomeProduct[];
  },
});

const reviewsQuery = () => ({
  queryKey: ["home_reviews"],
  staleTime: HOME_STALE,
  queryFn: async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id,rating,comment,created_at,product:products(name)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3);
    return data ?? [];
  },
});

export const Route = createFileRoute("/")({
  // Prefetch all homepage data during navigation. Because router.tsx has
  // defaultPreload:"intent", this fires when the user hovers the home link —
  // so data is already cached by the time they click.
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.prefetchQuery(sectionsQuery()),
      queryClient.prefetchQuery(categoriesQuery()),
      queryClient.prefetchQuery(homeProductsQuery()),
      queryClient.prefetchQuery(reviewsQuery()),
    ]);
  },
  component: HomePage,
});

type Section = {
  id: string;
  key: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_link: string | null;
  image_url: string | null;
  sort_order: number;
};

type HomeProduct = ProductCardProduct & {
  featured: boolean;
  sales_count: number;
  created_at: string;
};

function HomePage() {
  // All queries are served from cache populated by the route loader.
  const sections = useQuery(sectionsQuery());
  const featuredCats = useQuery(categoriesQuery());
  const allProducts = useQuery(homeProductsQuery());
  const reviews = useQuery(reviewsQuery());

  const bySection = useMemo(
    () =>
      Object.fromEntries(
        (sections.data ?? []).map((s) => [s.key.toLowerCase(), s]),
      ),
    [sections.data],
  );

  // Derive 3 homepage sections from the single pooled product query client-side.
  const products = allProducts.data ?? [];
  const featured = useMemo(
    () => products.filter((p) => p.featured).slice(0, 8),
    [products],
  );
  const best = useMemo(
    () => [...products].sort((a, b) => b.sales_count - a.sales_count).slice(0, 4),
    [products],
  );
  const fresh = useMemo(() => products.slice(0, 4), [products]);

  return (
    <SiteShell>
      {bySection.hero && (
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="container-luxe grid gap-8 py-12 md:gap-12 md:grid-cols-2 md:items-center md:py-32">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-accent-foreground/70">
                {bySection.hero.subtitle ? "The collection" : ""}
              </div>
              <h1 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
                {bySection.hero.title}
              </h1>
              {bySection.hero.subtitle && (
                <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base md:text-lg">
                  {bySection.hero.subtitle}
                </p>
              )}
              {bySection.hero.cta_label && (
                <Button asChild size="lg" className="mt-6 rounded-none px-8">
                  <Link to={bySection.hero.cta_link ?? "/shop"}>
                    {bySection.hero.cta_label}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary">
              {bySection.hero.image_url ? (
                <img
                  src={bySection.hero.image_url}
                  alt=""
                  width={800}
                  height={1000}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-7xl sm:text-9xl text-muted-foreground/30">
                  ✦
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {bySection.featured_categories &&
        (featuredCats.data?.length ?? 0) > 0 && (
          <section className="container-luxe py-12 sm:py-20">
            <SectionHeading section={bySection.featured_categories} />
            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
              {featuredCats.data!.map((c) => (
                <Link
                  key={c.id}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="group text-center"
                >
                  <div className="aspect-square overflow-hidden rounded-full bg-secondary">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        width={200}
                        height={200}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-2xl text-muted-foreground/50">
                        {c.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-sm">{c.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

      {bySection.featured_products && (
        <section className="container-luxe py-12 sm:py-20">
          <SectionHeading section={bySection.featured_products} />
          <ProductGrid products={featured} />
        </section>
      )}

      {bySection.promo && (
        <section className="bg-primary text-primary-foreground">
          <div className="container-luxe grid gap-6 py-14 sm:py-20 text-center md:py-28">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">
              {bySection.promo.title}
            </h2>
            {bySection.promo.subtitle && (
              <p className="mx-auto max-w-xl text-sm sm:text-base text-primary-foreground/70">
                {bySection.promo.subtitle}
              </p>
            )}
            {bySection.promo.cta_label && (
              <div>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="mt-2 rounded-none"
                >
                  <Link to={bySection.promo.cta_link ?? "/shop"}>
                    {bySection.promo.cta_label}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {bySection.best_sellers && (best?.length ?? 0) > 0 && (
        <section className="container-luxe py-12 sm:py-20">
          <SectionHeading section={bySection.best_sellers} />
          <ProductGrid products={best} />
        </section>
      )}

      {bySection.new_arrivals && (fresh?.length ?? 0) > 0 && (
        <section className="container-luxe py-12 sm:py-20">
          <SectionHeading section={bySection.new_arrivals} />
          <ProductGrid products={fresh} />
        </section>
      )}

      {bySection.brand_story && (
        <section className="container-luxe grid gap-12 py-20 md:grid-cols-2 md:items-center">
          <div className="aspect-[5/4] rounded-sm bg-secondary" />
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Our story
            </div>
            <h2 className="mt-4 font-display text-4xl">
              {bySection.brand_story.title}
            </h2>
            {bySection.brand_story.subtitle && (
              <p className="mt-6 text-muted-foreground">
                {bySection.brand_story.subtitle}
              </p>
            )}
            <Button asChild variant="link" className="mt-4 px-0">
              <Link to="/about">
                Read more <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {bySection.reviews && (reviews.data?.length ?? 0) > 0 && (
        <section className="border-t border-border/60 bg-secondary/40">
          <div className="container-luxe py-12 sm:py-20">
            <SectionHeading section={bySection.reviews} centered />
            <div className="mt-8 grid gap-4 sm:gap-8 sm:grid-cols-2 md:grid-cols-3">
              {reviews.data!.map((r) => (
                <figure
                  key={r.id}
                  className="rounded-sm border border-border/60 bg-background p-5 sm:p-8"
                >
                  <StarRating rating={r.rating} className="text-accent" />
                  <blockquote className="mt-4 font-display text-base sm:text-lg leading-snug">
                    "{r.comment}"
                  </blockquote>
                  <figcaption className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                    {(r.product as { name: string } | null)?.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}

function SectionHeading({
  section,
  centered,
}: {
  section: Section;
  centered?: boolean;
}) {
  return (
    <div
      className={
        centered ? "text-center" : "flex items-end justify-between gap-4"
      }
    >
      <div>
        <h2 className="font-display text-3xl md:text-4xl">{section.title}</h2>
        {section.subtitle && (
          <p className="mt-2 text-muted-foreground">{section.subtitle}</p>
        )}
      </div>
      {!centered && section.cta_label && (
        <Button asChild variant="link" className="px-0">
          <Link to={section.cta_link ?? "/shop"}>
            {section.cta_label} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function ProductGrid({ products }: { products: ProductCardProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="mt-8 rounded-sm border border-dashed border-border p-10 sm:p-16 text-center text-muted-foreground">
        No products yet. Add products in the admin dashboard.
      </div>
    );
  }
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}


