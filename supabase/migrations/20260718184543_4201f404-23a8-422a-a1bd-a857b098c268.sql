
-- Track whether stock was already deducted for an order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;

-- Stock decrement on payment
CREATE OR REPLACE FUNCTION public.on_order_payment_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_status = 'paid'
     AND (OLD.payment_status IS DISTINCT FROM 'paid')
     AND NEW.stock_deducted = false THEN
    UPDATE public.products p
      SET stock = GREATEST(p.stock - oi.quantity, 0)
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    NEW.stock_deducted := true;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.on_order_payment_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_order_payment_change ON public.orders;
CREATE TRIGGER trg_order_payment_change
  BEFORE UPDATE OF payment_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.on_order_payment_change();

-- Admin notification on new order
CREATE OR REPLACE FUNCTION public.on_new_order_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (audience, type, title, body, link)
    VALUES ('admin', 'order.created',
            'New order ' || NEW.order_number,
            NEW.email || ' — total ' || NEW.total::text,
            '/admin/orders');
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.on_new_order_notify() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_new_order_notify ON public.orders;
CREATE TRIGGER trg_new_order_notify
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.on_new_order_notify();

-- Verified purchase reviews
CREATE OR REPLACE FUNCTION public.enforce_verified_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NEW.user_id IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'You can only submit reviews as yourself';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id = NEW.product_id
      AND o.user_id = NEW.user_id
      AND o.status = 'delivered'
  ) THEN
    RAISE EXCEPTION 'You can only review products from a delivered order';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_verified_review() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_verified_review ON public.reviews;
CREATE TRIGGER trg_enforce_verified_review
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_review();

-- Storage RLS: public read + admin write on image buckets
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin write product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read category-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin write category-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin write site-assets" ON storage.objects;

CREATE POLICY "Public read product-images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Admin write product-images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Public read category-images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'category-images');
CREATE POLICY "Admin write category-images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'category-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'category-images' AND public.is_admin());

CREATE POLICY "Public read site-assets" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'site-assets');
CREATE POLICY "Admin write site-assets" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'site-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

-- Admin can insert/update/delete banners, categories, coupons, products, product_images, homepage_sections, gallery, site_settings
-- (Verify existing policies allow admin management — ensure blanket admin ALL policies exist)
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage banners" ON public.banners;
CREATE POLICY "Admin manage banners" ON public.banners FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage product_images" ON public.product_images;
CREATE POLICY "Admin manage product_images" ON public.product_images FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admin manage homepage_sections" ON public.homepage_sections FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage site_settings" ON public.site_settings;
CREATE POLICY "Admin manage site_settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage gallery" ON public.gallery;
CREATE POLICY "Admin manage gallery" ON public.gallery FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
