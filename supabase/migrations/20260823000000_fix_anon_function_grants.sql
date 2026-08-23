-- Fix: grant EXECUTE on security-definer helper functions to the anon role.
-- The RLS policies on products, categories, homepage_sections, etc. call
-- public.is_admin() inside USING clauses.
-- Without EXECUTE permission the anon role gets 'permission denied for function is_admin'
-- surfaced as a 401 by PostgREST instead of simply evaluating to FALSE.

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon;

-- Ensure anon can SELECT from all public catalog tables
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.homepage_sections TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.site_settings TO anon;
