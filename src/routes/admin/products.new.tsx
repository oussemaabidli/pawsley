import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/admin/products/new")({ component: NewProduct });

function NewProduct() {
  return (
    <div className="p-8">
      <Link to="/admin/products" className="text-sm text-muted-foreground">← Products</Link>
      <h1 className="mt-2 font-display text-3xl">New product</h1>
      <div className="mt-6"><ProductForm /></div>
    </div>
  );
}