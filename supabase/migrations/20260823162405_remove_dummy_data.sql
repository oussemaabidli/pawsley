-- Clean up any leftover dummy/test data that might have been added 
-- while developing the platform (e.g. "Test Product A").

-- 1. Remove test products
DELETE FROM public.products 
WHERE name ILIKE '%test%' 
   OR name ILIKE '%dummy%'
   OR description ILIKE '%test%';

-- 2. Remove test categories
DELETE FROM public.categories 
WHERE name ILIKE '%test%' 
   OR name ILIKE '%dummy%';

-- 3. Remove test coupons
DELETE FROM public.coupons 
WHERE code ILIKE '%test%' 
   OR code ILIKE '%dummy%';

-- (Note: Due to our ON DELETE CASCADE policies, any product_images 
-- associated with these deleted test products will automatically be removed).
