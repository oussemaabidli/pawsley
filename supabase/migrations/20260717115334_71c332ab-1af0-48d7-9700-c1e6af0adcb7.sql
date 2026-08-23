
-- public read for catalog/site images
CREATE POLICY "storage public read catalog"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images','category-images','site-assets','avatars'));

-- admin write for catalog/site images
CREATE POLICY "storage admin write catalog"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id IN ('product-images','category-images','site-assets') AND public.is_admin())
  WITH CHECK (bucket_id IN ('product-images','category-images','site-assets') AND public.is_admin());

-- user avatars: user can write into their own folder (path starts with uid/)
CREATE POLICY "storage avatars own write"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
