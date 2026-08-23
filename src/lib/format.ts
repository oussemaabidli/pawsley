export const formatMoney = (n: number | string | null | undefined, currency = "USD") => {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(v || 0);
};

export const formatDate = (iso: string | Date | null | undefined) => {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateTime = (iso: string | Date | null | undefined) => {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};