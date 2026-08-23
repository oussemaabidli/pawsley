import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { StarRating } from "@/components/star-rating";
import { ProductCard, type ProductCardProduct } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
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

function HomePage() {
  const sections = useQuery({
    queryKey: ["homepage_sections"],
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

  const featuredCats = useQuery({
    queryKey: ["home_featured_categories"],
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
  const featured = useProductBlock({ featured: true, limit: 8 });
  const best = useProductBlock({ orderBy: "sales_count", limit: 4 });
  const fresh = useProductBlock({ orderBy: "created_at", limit: 4 });
  const reviews = useQuery({
    queryKey: ["home_reviews"],
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

  const bySection = useMemo(() => Object.fromEntries((sections.data ?? []).map((s) => [s.key, s])), [sections.data]);

  return (
    <SiteShell>
      {bySection.hero && (
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="container-luxe grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-32">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-accent-foreground/70">
                {bySection.hero.subtitle ? "The collection" : ""}
              </div>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-7xl">
                {bySection.hero.title}
              </h1>
              {bySection.hero.subtitle && (
                <p className="mt-6 max-w-lg text-base text-muted-foreground md:text-lg">
                  {bySection.hero.subtitle}
                </p>
              )}
              {bySection.hero.cta_label && (
                <Button asChild size="lg" className="mt-8 rounded-none px-8">
                  <Link to={bySection.hero.cta_link ?? "/shop"}>
                    {bySection.hero.cta_label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary">
              {bySection.hero.image_url ? (
                <img src={bySection.hero.image_url} alt="" width={800} height={1000} loading="eager" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-9xl text-muted-foreground/30">
                  ✦
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {bySection.featured_categories && (featuredCats.data?.length ?? 0) > 0 && (
        <section className="container-luxe py-20">
          <SectionHeading section={bySection.featured_categories} />
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {featuredCats.data!.map((c) => (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="group text-center"
              >
                <div className="aspect-square overflow-hidden rounded-full bg-secondary">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} width={200} height={200} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
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
        <section className="container-luxe py-20">
          <SectionHeading section={bySection.featured_products} />
          <ProductGrid products={featured.data ?? []} />
        </section>
      )}

      {bySection.promo && (
        <section className="bg-primary text-primary-foreground">
          <div className="container-luxe grid gap-6 py-20 text-center md:py-28">
            <h2 className="font-display text-4xl md:text-5xl">{bySection.promo.title}</h2>
            {bySection.promo.subtitle && <p className="mx-auto max-w-xl text-primary-foreground/70">{bySection.promo.subtitle}</p>}
            {bySection.promo.cta_label && (
              <div>
                <Button asChild variant="secondary" size="lg" className="mt-2 rounded-none">
                  <Link to={bySection.promo.cta_link ?? "/shop"}>{bySection.promo.cta_label}</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {bySection.best_sellers && (best.data?.length ?? 0) > 0 && (
        <section className="container-luxe py-20">
          <SectionHeading section={bySection.best_sellers} />
          <ProductGrid products={best.data ?? []} />
        </section>
      )}

      {bySection.new_arrivals && (fresh.data?.length ?? 0) > 0 && (
        <section className="container-luxe py-20">
          <SectionHeading section={bySection.new_arrivals} />
          <ProductGrid products={fresh.data ?? []} />
        </section>
      )}

      {bySection.brand_story && (
        <section className="container-luxe grid gap-12 py-20 md:grid-cols-2 md:items-center">
          <div className="aspect-[5/4] rounded-sm bg-secondary" />
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Our story</div>
            <h2 className="mt-4 font-display text-4xl">{bySection.brand_story.title}</h2>
            {bySection.brand_story.subtitle && (
              <p className="mt-6 text-muted-foreground">{bySection.brand_story.subtitle}</p>
            )}
            <Button asChild variant="link" className="mt-4 px-0">
              <Link to="/about">Read more <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      )}

      {bySection.reviews && (reviews.data?.length ?? 0) > 0 && (
        <section className="border-t border-border/60 bg-secondary/40">
          <div className="container-luxe py-20">
            <SectionHeading section={bySection.reviews} centered />
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {reviews.data!.map((r) => (
                <figure key={r.id} className="rounded-sm border border-border/60 bg-background p-8">
                  <StarRating rating={r.rating} className="text-accent" />
                  <blockquote className="mt-4 font-display text-lg leading-snug">"{r.comment}"</blockquote>
                  <figcaption className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{(r.product as { name: string } | null)?.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}

function SectionHeading({ section, centered }: { section: Section; centered?: boolean }) {
  return (
    <div className={centered ? "text-center" : "flex items-end justify-between gap-4"}>
      <div>
        <h2 className="font-display text-3xl md:text-4xl">{section.title}</h2>
        {section.subtitle && <p className="mt-2 text-muted-foreground">{section.subtitle}</p>}
      </div>
      {!centered && section.cta_label && (
        <Button asChild variant="link" className="px-0">
          <Link to={section.cta_link ?? "/shop"}>{section.cta_label} <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      )}
    </div>
  );
}

function ProductGrid({ products }: { products: ProductCardProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="mt-10 rounded-sm border border-dashed border-border p-16 text-center text-muted-foreground">
        No products yet. Add products in the admin dashboard.
      </div>
    );
  }
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function useProductBlock(opts: { featured?: boolean; orderBy?: "sales_count" | "created_at"; limit: number }) {
  return useQuery({
    queryKey: ["home_products", opts],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,slug,name,price,compare_at_price,product_images(url,sort_order)")
        .eq("visible", true)
        .eq("archived", false);
      if (opts.featured) q = q.eq("featured", true);
      q = q.order(opts.orderBy ?? "created_at", { ascending: false }).limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ProductCardProduct[];
    },
  });
}
