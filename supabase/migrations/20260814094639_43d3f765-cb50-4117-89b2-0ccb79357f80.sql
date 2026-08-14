CREATE POLICY "product images read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product images insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product images update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "product images delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');