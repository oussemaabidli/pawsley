import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { ProductCard, type ProductCardProduct } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
type ShopSearch = {
  q?: string;
  category?: string;
  pet?: string;
  sort?: "new" | "price_asc" | "price_desc" | "best";
  min?: number;
  max?: number;
  in_stock?: boolean;
  page: number;
};

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop — Pawsley" }, { name: "description", content: "Browse the full Pawsley collection of premium pet accessories." }] }),
  validateSearch: (raw: Record<string, unknown>): ShopSearch => ({
    q: (raw.q as string) || undefined,
    category: (raw.category as string) || undefined,
    pet: (raw.pet as string) || undefined,
    sort: (raw.sort as ShopSearch["sort"]) || undefined,
    min: raw.min !== undefined && raw.min !== "" ? Number(raw.min) : undefined,
    max: raw.max !== undefined && raw.max !== "" ? Number(raw.max) : undefined,
    in_stock: raw.in_stock === true || raw.in_stock === "true" ? true : undefined,
    page: raw.page ? Number(raw.page) : 1,
  }),
  component: ShopPage,
});

const PAGE_SIZE = 20;

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [searchInput, setSearchInput] = useState(search.q ?? "");
  const debouncedSearch = useDebounce(searchInput, 300);
  const prevDebouncedRef = useRef(debouncedSearch);

  // Sync debounced value to URL without re-render loop
  useEffect(() => {
    if (prevDebouncedRef.current !== debouncedSearch) {
      prevDebouncedRef.current = debouncedSearch;
      navigate({ search: (prev: ShopSearch) => ({ ...prev, q: debouncedSearch || undefined, page: 1 }), replace: true });
    }
  }, [debouncedSearch, navigate]);

  const categories = useQuery({
    queryKey: ["categories_all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,slug,name").eq("visible", true).order("sort_order");
      return data ?? [];
    },
  });

  const products = useQuery({
    queryKey: ["shop_products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,slug,name,price,compare_at_price,pet_type,category_id,product_images(url,sort_order)", { count: "exact" })
        .eq("visible", true)
        .eq("archived", false);
      if (search.q) q = q.ilike("name", `%${search.q}%`);
      if (search.category) {
        const cat = categories.data?.find((c) => c.slug === search.category);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (search.pet) q = q.eq("pet_type", search.pet);
      if (search.min !== undefined) q = q.gte("price", search.min);
      if (search.max !== undefined) q = q.lte("price", search.max);
      if (search.in_stock) q = q.gt("stock", 0);
      switch (search.sort) {
        case "price_asc": q = q.order("price", { ascending: true }); break;
        case "price_desc": q = q.order("price", { ascending: false }); break;
        case "best": q = q.order("sales_count", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }
      const from = (search.page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { items: (data ?? []) as unknown as ProductCardProduct[], count: count ?? 0 };
    },
  });

  const setSearch = (patch: Partial<ShopSearch>) =>
    navigate({ search: (prev: ShopSearch) => ({ ...prev, page: 1, ...patch }) });

  const totalPages = Math.max(1, Math.ceil((products.data?.count ?? 0) / PAGE_SIZE));

  return (
    <SiteShell>
      <div className="container-luxe py-12">
        <div className="flex flex-col gap-2 border-b border-border/60 pb-8">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The collection</div>
          <h1 className="font-display text-4xl md:text-5xl">Shop all</h1>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Search</div>
              <Input
                placeholder="Search products"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Category</div>
              <div className="space-y-1 text-sm">
                <button className={`block w-full text-left ${!search.category ? "font-medium" : "text-muted-foreground"}`} onClick={() => setSearch({ category: undefined })}>All</button>
                {categories.data?.map((c) => (
                  <button key={c.id} className={`block w-full text-left ${search.category === c.slug ? "font-medium" : "text-muted-foreground"}`} onClick={() => setSearch({ category: c.slug })}>{c.name}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Pet</div>
              <div className="flex flex-wrap gap-1 text-sm">
                {["dog", "cat", "bird", "small_pet"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSearch({ pet: search.pet === p ? undefined : p })}
                    className={`rounded-full border px-3 py-1 capitalize ${search.pet === p ? "border-foreground bg-foreground text-background" : "border-border"}`}
                  >{p.replace("_", " ")}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Price</div>
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" defaultValue={search.min ?? ""} onChange={(e) => setSearch({ min: e.target.value ? Number(e.target.value) : undefined })} />
                <Input type="number" placeholder="Max" defaultValue={search.max ?? ""} onChange={(e) => setSearch({ max: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!search.in_stock} onChange={(e) => setSearch({ in_stock: e.target.checked || undefined })} />
              In stock only
            </label>
          </aside>
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">{products.data?.count ?? 0} products</div>
              <Select value={search.sort ?? "new"} onValueChange={(v) => setSearch({ sort: v as ShopSearch["sort"] })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="best">Best sellers</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {products.isLoading ? (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : products.data?.items.length === 0 ? (
              <div className="rounded-md border border-dashed p-16 text-center text-muted-foreground">No products match your filters.</div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {products.data?.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button variant="outline" disabled={search.page <= 1} onClick={() => navigate({ search: (prev: ShopSearch) => ({ ...prev, page: Math.max(1, prev.page - 1) }) })}>Previous</Button>
                <span className="text-sm">Page {search.page} of {totalPages}</span>
                <Button variant="outline" disabled={search.page >= totalPages} onClick={() => navigate({ search: (prev: ShopSearch) => ({ ...prev, page: prev.page + 1 }) })}>Next</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}