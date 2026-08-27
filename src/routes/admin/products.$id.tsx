import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  return (
    <div className="p-4 sm:p-8">
      <Link to="/admin/products" className="text-sm text-muted-foreground">
        ← Products
      </Link>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl">Edit product</h1>
      <div className="mt-6">
        <ProductForm id={id} />
      </div>
    </div>
  );
}
