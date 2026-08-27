import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export type CartRow = {
  id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stock: number;
    product_images: { url: string; sort_order: number }[];
  };
};

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    enabled: !!user,
    queryKey: ["cart", user?.id],
    queryFn: async (): Promise<CartRow[]> => {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          "id,product_id,quantity,size,color,product:products(id,slug,name,price,stock,product_images(url,sort_order))",
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CartRow[];
    },
  });

  const add = useMutation({
    mutationFn: async (input: {
      product_id: string;
      quantity?: number;
      size?: string | null;
      color?: string | null;
    }) => {
      if (!user) throw new Error("Please sign in to add to cart");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id,quantity")
        .eq("user_id", user.id)
        .eq("product_id", input.product_id)
        .eq("size", input.size ?? "")
        .eq("color", input.color ?? "")
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + (input.quantity ?? 1) })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: input.product_id,
          quantity: input.quantity ?? 1,
          size: input.size ?? null,
          color: input.color ?? null,
        });
        if (error) throw error;
      }
    },
    onMutate: async (input) => {
      // Optimistic: refetch to get latest, or just invalidate after
      await qc.cancelQueries({ queryKey: ["cart", user?.id] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: input.quantity })
        .eq("id", input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["cart", user?.id] });
      const previous = qc.getQueryData<CartRow[]>(["cart", user?.id]);
      if (previous) {
        qc.setQueryData<CartRow[]>(["cart", user?.id], (old) =>
          (old ?? []).map((item) =>
            item.id === input.id ? { ...item, quantity: input.quantity } : item,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(["cart", user?.id], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["cart", user?.id] });
      const previous = qc.getQueryData<CartRow[]>(["cart", user?.id]);
      if (previous) {
        qc.setQueryData<CartRow[]>(["cart", user?.id], (old) =>
          (old ?? []).filter((item) => item.id !== id),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(["cart", user?.id], context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = query.data ?? [];
  const subtotal = items.reduce(
    (s, i) => s + Number(i.product.price) * i.quantity,
    0,
  );
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, subtotal, count, ...query, add, update, remove };
}

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    enabled: !!user,
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(
          "id,product_id,product:products(id,slug,name,price,product_images(url,sort_order))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const toggle = useMutation({
    mutationFn: async (product_id: string) => {
      if (!user) throw new Error("Please sign in");
      const { data: existing } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product_id)
        .maybeSingle();
      if (existing) {
        await supabase.from("wishlist_items").delete().eq("id", existing.id);
        return false;
      }
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: user.id, product_id });
      if (error) throw error;
      return true;
    },
    onMutate: async (product_id) => {
      await qc.cancelQueries({ queryKey: ["wishlist", user?.id] });
      const previous = qc.getQueryData(["wishlist", user?.id]);
      // Optimistically flip the state
      qc.setQueryData(
        ["wishlist", user?.id],
        (
          old: Array<{ product_id: string; [k: string]: unknown }> | undefined,
        ) => {
          if (!old) return old;
          const exists = old.some((item) => item.product_id === product_id);
          if (exists)
            return old.filter((item) => item.product_id !== product_id);
          // For add, we add a placeholder — it'll be replaced on settle
          return [...old, { product_id, id: "optimistic", product: null }];
        },
      );
      return { previous };
    },
    onSuccess: (added) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(added ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: (_e, _vars, context) => {
      if (context?.previous)
        qc.setQueryData(["wishlist", user?.id], context.previous);
      toast.error((_e as Error).message);
    },
  });
  return { items: query.data ?? [], ...query, toggle };
}
