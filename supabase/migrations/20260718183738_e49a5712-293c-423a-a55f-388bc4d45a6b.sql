
-- 1) Notifications: block client inserts/deletes (only service_role/backend)
CREATE POLICY "No client insert on notifications" ON public.notifications
  FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client delete on notifications" ON public.notifications
  FOR DELETE TO authenticated, anon USING (false);

-- 2) site_settings: allowlist public keys
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public can read safe site settings keys" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('brand','social','seo','footer','shipping','contact','payment_public','theme','homepage'));

-- 3) product_images: only visible/non-archived products, or admin
DROP POLICY IF EXISTS "Public can read product images" ON public.product_images;
DROP POLICY IF EXISTS "product_images public read" ON public.product_images;
DROP POLICY IF EXISTS "Anyone can read product_images" ON public.product_images;
DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
CREATE POLICY "Public read product images for visible products" ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND COALESCE(p.visible, true) = true
        AND COALESCE(p.archived, false) = false
    )
  );

-- 4) Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions
-- Trigger-only functions: revoke from everyone
REVOKE ALL ON FUNCTION public.on_review_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_product_rating(uuid) FROM PUBLIC, anon, authenticated;

-- RLS helpers: only authenticated needs execute (used inside policies)
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
