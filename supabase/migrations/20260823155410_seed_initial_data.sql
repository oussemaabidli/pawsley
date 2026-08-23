-- Seed Script for "Pawsley" Pet Supply Store
-- Run this in your Supabase Dashboard SQL Editor to populate your store with test data.

-- 1. Insert Categories
INSERT INTO public.categories (id, slug, name, description, image_url, sort_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'collars-and-leashes', 'Collars & Leashes', 'Premium leather and woven accessories for your best friend.', 'https://images.unsplash.com/photo-1605891965902-6014457e53f6?q=80&w=800&auto=format&fit=crop', 1),
  ('22222222-2222-2222-2222-222222222222', 'beds-and-furniture', 'Beds & Furniture', 'Cozy, orthopedic resting places.', 'https://images.unsplash.com/photo-1541781774459-bb2af2892514?q=80&w=800&auto=format&fit=crop', 2),
  ('33333333-3333-3333-3333-333333333333', 'toys', 'Toys & Play', 'Durable, safe, and fun toys for active pets.', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=800&auto=format&fit=crop', 3),
  ('44444444-4444-4444-4444-444444444444', 'grooming', 'Grooming & Spa', 'Everything you need to keep your pet clean and healthy.', 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800&auto=format&fit=crop', 4),
  ('55555555-5555-5555-5555-555555555555', 'treats', 'Treats & Chews', 'Delicious, healthy, and organic treats for good boys and girls.', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop', 5),
  ('66666666-6666-6666-6666-666666666666', 'apparel', 'Apparel & Wear', 'Cozy sweaters, raincoats, and stylish bandanas.', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=800&auto=format&fit=crop', 6)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Products
INSERT INTO public.products (id, category_id, slug, name, description, short_description, price, compare_at_price, stock, featured, sales_count)
VALUES 
  -- Collars
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'artisan-leather-collar', 'Artisan Leather Collar', 'Hand-stitched genuine leather collar with brass hardware. Designed for durability and timeless style.', 'Premium leather collar with brass accents.', 45.00, NULL, 50, true, 120),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'reflective-adventure-leash', 'Reflective Adventure Leash', 'Heavy-duty 6ft nylon leash with reflective stitching for safe nighttime walks.', 'Durable reflective nylon leash.', 28.50, 35.00, 100, false, 85),
  
  -- Beds
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'orthopedic-cloud-bed', 'Orthopedic Cloud Bed', 'Memory foam pet bed that relieves joint pressure. Removable, machine-washable cover.', 'Memory foam bed for ultimate comfort.', 120.00, 150.00, 20, true, 45),
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '22222222-2222-2222-2222-222222222222', 'donut-cuddler-bed', 'Donut Cuddler Bed', 'Plush, donut-shaped bed designed to reduce anxiety and provide warmth.', 'Anxiety-reducing plush cuddler.', 65.00, NULL, 80, true, 150),
  
  -- Toys
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'tough-tug-rope', 'Tough Tug Rope', 'Made from natural cotton fibers, this rope is built to withstand aggressive chewers and cleans teeth.', 'Natural cotton tug rope.', 15.00, NULL, 200, true, 300),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'squeaky-plush-fox', 'Squeaky Plush Fox', 'A soft, durable plush toy with a reinforced squeaker inside.', 'Soft plush toy with squeaker.', 12.00, NULL, 150, false, 210),
  
  -- Grooming
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', 'oatmeal-soothing-shampoo', 'Oatmeal Soothing Shampoo', 'Gentle, tearless shampoo made with natural oatmeal and aloe for sensitive skin.', 'Natural oatmeal dog shampoo.', 18.00, NULL, 120, false, 320),
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', '44444444-4444-4444-4444-444444444444', 'deshedding-brush', 'Professional Deshedding Brush', 'Ergonomic brush that reduces shedding by up to 90% without damaging the topcoat.', 'Reduces shedding by 90%.', 24.50, 30.00, 60, true, 410),
  
  -- Treats
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'organic-beef-jerky', 'Organic Beef Jerky Treats', '100% grass-fed beef jerky made without artificial preservatives.', 'Grass-fed beef dog treats.', 14.00, NULL, 300, true, 500),
  
  -- Apparel
  ('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', '66666666-6666-6666-6666-666666666666', 'knitted-winter-sweater', 'Knitted Winter Sweater', 'Warm, stylish knitted sweater for chilly walks. Available in multiple sizes.', 'Warm knitted dog sweater.', 35.00, NULL, 40, false, 60)
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Product Images
INSERT INTO public.product_images (product_id, url, sort_order)
VALUES 
  -- Leather Collar
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1605891965902-6014457e53f6?q=80&w=800&auto=format&fit=crop', 1),
  -- Adventure Leash
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=800&auto=format&fit=crop', 1),
  -- Cloud Bed
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1541781774459-bb2af2892514?q=80&w=800&auto=format&fit=crop', 1),
  -- Donut Cuddler
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop', 1),
  -- Tug Rope
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=800&auto=format&fit=crop', 1),
  -- Plush Fox
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop', 1),
  -- Shampoo
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800&auto=format&fit=crop', 1),
  -- Brush
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800&auto=format&fit=crop', 1),
  -- Treats
  ('00000000-0000-0000-0000-000000000000', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop', 1),
  -- Sweater
  ('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=800&auto=format&fit=crop', 1);

-- 4. Insert Homepage Sections
INSERT INTO public.homepage_sections (key, type, title, subtitle, cta_label, cta_link, image_url, sort_order)
VALUES 
  ('hero-1', 'hero', 'Premium Gear for Your Best Friend', 'Discover our new collection of artisan leather collars and orthopedic beds.', 'Shop Now', '/shop', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop', 1),
  ('featured-categories', 'categories', 'Shop by Category', 'Find exactly what your pet needs.', NULL, NULL, NULL, 2),
  ('promo-banner', 'banner', 'Free Shipping over $50!', 'Stock up on treats and toys without paying for shipping.', 'View Deals', '/shop', 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=1200&auto=format&fit=crop', 3),
  ('featured-products', 'products', 'Trending Now', 'Our most loved products this week.', 'View All Products', '/shop', NULL, 4)
ON CONFLICT (key) DO NOTHING;
