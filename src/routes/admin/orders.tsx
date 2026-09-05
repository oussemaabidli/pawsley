import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney } from "@/lib/format";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Package,
  User,
  MapPin,
  Truck,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

type ShippingAddress = {
  full_name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
};

type OrderItem = {
  id: string;
  product_id: string | null;
  name: string;
  image_url: string | null;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
};

type Order = {
  id: string;
  order_number: string;
  email: string;
  status: string;
  delivery_method: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  shipping_address: ShippingAddress | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
};

// ─── PDF generator ────────────────────────────────────────────────────────────
function downloadOrderPDF(order: Order) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const addr = order.shipping_address;
  const margin = 14;
  let y = margin;

  // Header bar
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(order.order_number, 210 - margin, 18, { align: "right" });
  y = 38;

  // Reset text color
  doc.setTextColor(30, 30, 30);

  // Date + status row
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${formatDate(order.created_at)}`, margin, y);
  doc.text(`Status: ${order.status.toUpperCase()}`, 210 - margin, y, { align: "right" });
  y += 8;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, 210 - margin, y);
  y += 6;

  // Customer + shipping in two columns
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER", margin, y);
  doc.text("SHIPPING ADDRESS", 115, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const customerLines = [
    addr?.full_name ?? "",
    order.email,
    addr?.phone ?? "",
  ].filter(Boolean);
  const addressLines = [
    addr?.line1 ?? "",
    addr?.line2 ?? "",
    [addr?.city, addr?.state, addr?.postal_code].filter(Boolean).join(", "),
    addr?.country ?? "",
  ].filter(Boolean);

  const maxLines = Math.max(customerLines.length, addressLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (customerLines[i]) doc.text(customerLines[i], margin, y + i * 5);
    if (addressLines[i]) doc.text(addressLines[i], 115, y + i * 5);
  }
  y += maxLines * 5 + 8;

  // Divider
  doc.line(margin, y, 210 - margin, y);
  y += 4;

  // Items table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Product", "Qty", "Unit price", "Total"]],
    body: order.order_items.map((it) => [
      it.name + (it.size ? ` (${it.size})` : "") + (it.color ? ` · ${it.color}` : ""),
      String(it.quantity),
      formatMoney(Number(it.price)),
      formatMoney(Number(it.price) * it.quantity),
    ]),
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
  });

  // Price summary — bottom right
  const afterTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  const summaryX = 130;
  let sy = afterTable;

  const rows: [string, string][] = [
    ["Subtotal", formatMoney(order.subtotal)],
    ["Shipping", order.shipping === 0 ? "Free" : formatMoney(order.shipping)],
    ["Tax", formatMoney(order.tax)],
  ];
  if (order.discount > 0) rows.push(["Discount", `−${formatMoney(order.discount)}`]);

  doc.setFontSize(9);
  rows.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, summaryX, sy);
    doc.text(val, 210 - margin, sy, { align: "right" });
    sy += 6;
  });

  // Total line
  doc.setDrawColor(180, 180, 180);
  doc.line(summaryX, sy - 2, 210 - margin, sy - 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", summaryX, sy + 4);
  doc.text(formatMoney(order.total), 210 - margin, sy + 4, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Thank you for your order!", 105, 285, { align: "center" });

  doc.save(`${order.order_number}.pdf`);
}
// ──────────────────────────────────────────────────────────────────────────────

function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "muted";
}) {
  const cls = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    muted: "bg-secondary text-muted-foreground",
  }[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {label}
    </span>
  );
}

function statusVariant(s: string): "default" | "success" | "warning" | "muted" {
  if (["delivered"].includes(s)) return "success";
  if (["pending", "accepted", "preparing", "shipped"].includes(s))
    return "warning";
  if (["cancelled", "rejected", "refunded"].includes(s)) return "muted";
  return "default";
}

function OrderDetail({
  order,
  onToggle,
  toggling,
}: {
  order: Order;
  onToggle: (id: string, next: string, items: OrderItem[]) => void;
  toggling: boolean;
}) {
  const addr = order.shipping_address;
  const isConfirmed = order.status === "accepted";

  return (
    <div className="border-b border-border bg-secondary/20">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Download PDF button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); downloadOrderPDF(order); }}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>

        {/* Status toggle — full width */}
        <div className="flex items-center justify-between rounded border border-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-medium">Order status</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isConfirmed ? "Marked as confirmed" : "Awaiting confirmation"}
            </p>
          </div>
          <button
            type="button"
            disabled={toggling}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(order.id, isConfirmed ? "pending" : "accepted", order.order_items);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              isConfirmed ? "bg-emerald-500" : "bg-muted-foreground/30"
            }`}
            aria-label="Toggle order status"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isConfirmed ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Top info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contact */}
          <section className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Contact
            </div>
            <div className="text-sm space-y-0.5">
              {addr?.full_name && (
                <p className="font-medium">{addr.full_name}</p>
              )}
              <p className="break-all">{order.email}</p>
              {addr?.phone && <p>{addr.phone}</p>}
            </div>
          </section>

          {/* Shipping address */}
          {addr && (
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Shipping address
              </div>
              <address className="not-italic text-sm space-y-0.5">
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>
                  {addr.city}
                  {addr.state ? `, ${addr.state}` : ""}
                  {addr.postal_code ? ` ${addr.postal_code}` : ""}
                </p>
                <p>{addr.country}</p>
              </address>
            </section>
          )}

          {/* Delivery */}
          <section className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Truck className="h-3.5 w-3.5" /> Delivery
            </div>
            <p className="text-sm capitalize">{order.delivery_method ?? "—"}</p>
          </section>
        </div>

        {/* Items */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Package className="h-3.5 w-3.5" /> Items
          </div>
          <ul className="divide-y divide-border rounded border border-border">
            {order.order_items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 p-3 text-sm">
                {it.image_url ? (
                  <img
                    src={it.image_url}
                    alt=""
                    className="h-10 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-8 shrink-0 rounded bg-secondary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {it.quantity}
                    {it.size ? ` · ${it.size}` : ""}
                    {it.color ? ` · ${it.color}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-medium">
                  {formatMoney(Number(it.price) * it.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Price breakdown + Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Price breakdown
            </p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>
                  {order.shipping === 0 ? "Free" : formatMoney(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{formatMoney(order.tax)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount</dt>
                  <dd>−{formatMoney(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </div>

          {order.notes && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Notes
              </div>
              <p className="text-sm rounded border border-border bg-background p-3 whitespace-pre-wrap h-full">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  onToggle,
  toggling,
}: {
  order: Order;
  onToggle: (id: string, next: string, items: OrderItem[]) => void;
  toggling: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="border-t border-border cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <td className="p-3 font-medium">{order.order_number}</td>
        <td className="p-3 max-w-[160px] truncate text-sm">{order.email}</td>
        <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">
          {formatDate(order.created_at)}
        </td>
        <td className="p-3 text-sm">{formatMoney(order.total)}</td>
        <td className="p-3 text-muted-foreground">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} className="p-0">
            <OrderDetail
              order={order}
              onToggle={onToggle}
              toggling={toggling}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function AdminOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select(
            "id,order_number,email,status,delivery_method,subtotal,discount,tax,shipping,total,shipping_address,notes,created_at,order_items(*)",
          )
          .order("created_at", { ascending: false })
          .limit(200)
      ).data ?? [],
  });

  const toggle = useMutation({
    mutationFn: async ({
      id,
      status,
      items,
    }: {
      id: string;
      status: string;
      items: OrderItem[];
    }) => {
      // 1. Update the order status
      const { error } = await supabase
        .from("orders")
        .update({
          status: status as
            | "pending"
            | "accepted"
            | "preparing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded"
            | "rejected",
        })
        .eq("id", id);
      if (error) throw error;

      // 2. Adjust product stock for items that have a product_id
      const stockItems = items.filter((it) => it.product_id);
      if (stockItems.length === 0) return;

      // Fetch current stock for all affected products
      const productIds = stockItems.map((it) => it.product_id as string);
      const { data: products, error: fetchErr } = await supabase
        .from("products")
        .select("id, stock")
        .in("id", productIds);
      if (fetchErr) throw fetchErr;

      // Update each product's stock
      await Promise.all(
        (products ?? []).map((product) => {
          const item = stockItems.find((it) => it.product_id === product.id);
          if (!item) return Promise.resolve();
          // Decrement on accept, restore on revert to pending
          const delta = status === "accepted" ? -item.quantity : item.quantity;
          const newStock = Math.max(0, (product.stock ?? 0) + delta);
          return supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", product.id);
        }),
      );
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin_orders"] });
      qc.invalidateQueries({ queryKey: ["admin_products"] });
      toast.success(
        vars.status === "accepted"
          ? "Order accepted — stock updated ✓"
          : "Order reverted to pending — stock restored",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl sm:text-3xl">Orders</h1>
        <span className="text-sm text-muted-foreground">
          {data?.length ?? 0} total
        </span>
      </div>

      <div className="mt-6 rounded border border-border">
        {/* Scrollable table header + summary rows */}
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3 hidden md:table-cell">Date</th>
                <th className="p-3">Total</th>
                <th className="p-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((o) => (
                <OrderRow
                  key={o.id}
                  order={o as unknown as Order}
                  onToggle={(id, next, items) => toggle.mutate({ id, status: next, items })}
                  toggling={toggle.isPending}
                />
              ))}
              {(data?.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
