import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";
import { X } from "lucide-react";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/, "");

type ProductData = {
  name: string;
  slug: string;
  price: string;
  compare_at_price: string;
  stock: string;
  sku: string;
  description: string;
  short_description: string;
  category_id: string;
  pet_type: string;
  sizes: string;
  colors: string;
  visible: boolean;
  featured: boolean;
  archived: boolean;
  seo_title: string;
  seo_description: string;
};

const empty: ProductData = {
  name: "",
  slug: "",
  price: "",
  compare_at_price: "",
  stock: "0",
  sku: "",
  description: "",
  short_description: "",
  category_id: "",
  pet_type: "",
  sizes: "",
  colors: "",
  visible: true,
  featured: false,
  archived: false,
  seo_title: "",
  seo_description: "",
};

interface ProductFormProps {
  /** If provided, loads an existing product for editing */
  id?: string;
}

export function ProductForm({ id }: ProductFormProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductData>(empty);
  const [images, setImages] = useState<{ url: string; sort_order: number }[]>(
    [],
  );
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ["admin_categories_select"],
    queryFn: async () =>
      (await supabase.from("categories").select("id,name").order("name"))
        .data ?? [],
  });

  // If editing, load existing product
  const { data: existing } = useQuery({
    enabled: !!id,
    queryKey: ["admin_product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(id,url,sort_order)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? "",
        slug: existing.slug ?? "",
        price: String(existing.price ?? ""),
        compare_at_price:
          existing.compare_at_price != null
            ? String(existing.compare_at_price)
            : "",
        stock: String(existing.stock ?? 0),
        sku: existing.sku ?? "",
        description: existing.description ?? "",
        short_description: existing.short_description ?? "",
        category_id: existing.category_id ?? "",
        pet_type: existing.pet_type ?? "",
        sizes: (existing.sizes ?? []).join(", "),
        colors: (existing.colors ?? []).join(", "),
        visible: existing.visible ?? true,
        featured: existing.featured ?? false,
        archived: existing.archived ?? false,
        seo_title: existing.seo_title ?? "",
        seo_description: existing.seo_description ?? "",
      });
      const imgs = [...(existing.product_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      setImages(imgs.map((i) => ({ url: i.url, sort_order: i.sort_order })));
    }
  }, [existing]);

  const set = <K extends keyof ProductData>(key: K, value: ProductData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Save / create
  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Product name is required");
      if (!form.price || isNaN(Number(form.price)))
        throw new Error("Valid price is required");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        price: Number(form.price),
        compare_at_price: form.compare_at_price
          ? Number(form.compare_at_price)
          : null,
        stock: Number(form.stock) || 0,
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        short_description: form.short_description.trim() || null,
        category_id: form.category_id || null,
        pet_type: form.pet_type || null,
        sizes: form.sizes
          ? form.sizes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        colors: form.colors
          ? form.colors
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        visible: form.visible,
        featured: form.featured,
        archived: form.archived,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
      };

      let productId = id;

      if (id) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        // Sync images: delete all and re-insert in order
        await supabase.from("product_images").delete().eq("product_id", id);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Re-insert images with updated sort order
      if (images.length > 0 && productId) {
        const imageRows = images.map((img, i) => ({
          product_id: productId!,
          url: img.url,
          sort_order: i,
        }));
        const { error } = await supabase
          .from("product_images")
          .insert(imageRows);
        if (error) throw error;
      }

      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ["admin_products"] });
      qc.invalidateQueries({ queryKey: ["admin_product", id] });
      toast.success(id ? "Product saved" : "Product created");
      if (!id)
        navigate({ to: "/admin/products/$id", params: { id: productId! } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Add image via ImageUpload value change (URL)
  const handleImageUrl = (url: string) => {
    if (!url) return;
    setImages((prev) => [...prev, { url, sort_order: prev.length }]);
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const field = "space-y-1";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* ── Left column: main fields ── */}
      <div className="space-y-6">
        {/* Basic */}
        <section className="rounded border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-lg">Basic information</h2>
          <div className="space-y-4">
            <div className={field}>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!id) set("slug", slugify(e.target.value));
                }}
              />
            </div>
            <div className={field}>
              <Label>Slug (URL)</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
              />
            </div>
            <div className={field}>
              <Label>Short description</Label>
              <Input
                value={form.short_description}
                onChange={(e) => set("short_description", e.target.value)}
              />
            </div>
            <div className={field}>
              <Label>Description</Label>
              <Textarea
                rows={6}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="rounded border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-lg">Pricing & inventory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={field}>
              <Label>Price *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className={field}>
              <Label>Compare-at price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.compare_at_price}
                onChange={(e) => set("compare_at_price", e.target.value)}
              />
            </div>
            <div className={field}>
              <Label>Stock</Label>
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
            <div className={field}>
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Variants */}
        <section className="rounded border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-lg">Variants</h2>
          <div className="space-y-4">
            <div className={field}>
              <Label>Sizes (comma-separated, e.g. S, M, L)</Label>
              <Input
                value={form.sizes}
                onChange={(e) => set("sizes", e.target.value)}
                placeholder="S, M, L, XL"
              />
            </div>
            <div className={field}>
              <Label>Colors (comma-separated)</Label>
              <Input
                value={form.colors}
                onChange={(e) => set("colors", e.target.value)}
                placeholder="Black, White, Brown"
              />
            </div>
          </div>
        </section>

        {/* SEO */}
        <section className="rounded border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-lg">SEO</h2>
          <div className="space-y-4">
            <div className={field}>
              <Label>SEO title</Label>
              <Input
                value={form.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
              />
            </div>
            <div className={field}>
              <Label>SEO description</Label>
              <Textarea
                rows={3}
                value={form.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Right column: images + meta ── */}
      <div className="space-y-6">
        {/* Images */}
        <section className="rounded border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-display text-lg">Images</h2>
          <div className="grid grid-cols-2 gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded bg-secondary"
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <ImageUpload
              bucket="product-images"
              folder="products"
              value=""
              onChange={handleImageUrl}
              aspect="aspect-video"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Add more images. First image is the main one.
            </p>
          </div>
        </section>

        {/* Organisation */}
        <section className="rounded border border-border bg-card p-4 sm:p-6 space-y-4">
          <h2 className="font-display text-lg">Organisation</h2>
          <div className={field}>
            <Label>Category</Label>
            <Select
              value={form.category_id || "__none__"}
              onValueChange={(v) =>
                set("category_id", v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={field}>
            <Label>Pet type</Label>
            <Select
              value={form.pet_type || "__any__"}
              onValueChange={(v) => set("pet_type", v === "__any__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any__">Any</SelectItem>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="bird">Bird</SelectItem>
                <SelectItem value="fish">Fish</SelectItem>
                <SelectItem value="small_pet">Small pet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 pt-2">
            {(
              [
                { key: "visible", label: "Visible in store" },
                { key: "featured", label: "Featured" },
                { key: "archived", label: "Archived" },
              ] as { key: keyof ProductData; label: string }[]
            ).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch
                  checked={form[key] as boolean}
                  onCheckedChange={(v) => set(key, v)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <Button
          className="w-full"
          onClick={() => save.mutate()}
          disabled={save.isPending}
        >
          {save.isPending ? "Saving…" : id ? "Save changes" : "Create product"}
        </Button>
      </div>
    </div>
  );
}
