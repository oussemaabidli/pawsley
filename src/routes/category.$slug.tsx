import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import {
  ProductCard,
  type ProductCardProduct,
} from "@/components/product-card";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name,description,image_url")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const products = useQuery({
    enabled: !!cat.data?.id,
    queryKey: ["category_products", cat.data?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,product_images(url,sort_order)",
        )
        .eq("category_id", cat.data!.id)
        .eq("visible", true)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as ProductCardProduct[];
    },
  });

  if (cat.isLoading)
    return (
      <SiteShell>
        <div className="container-luxe py-24">Loading…</div>
      </SiteShell>
    );
  if (!cat.data)
    return (
      <SiteShell>
        <div className="container-luxe py-24 text-center">
          <p>Category not found.</p>
          <Link to="/shop" className="mt-4 underline">
            Back to shop
          </Link>
        </div>
      </SiteShell>
    );

  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <div className="border-b border-border pb-6 sm:pb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Category
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl">
            {cat.data.name}
          </h1>
          {cat.data.description && (
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
              {cat.data.description}
            </p>
          )}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {(products.data ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.data?.length === 0 && (
          <div className="rounded border border-dashed p-16 text-center text-muted-foreground">
            No products in this category yet.
          </div>
        )}
      </div>
    </SiteShell>
  );
}
