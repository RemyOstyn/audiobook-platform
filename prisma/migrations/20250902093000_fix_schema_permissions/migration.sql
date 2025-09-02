-- Grant USAGE permission on public schema to anon and authenticated roles
-- This is required for API access to work with RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions to authenticated users for all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audiobooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processing_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_library TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_usage TO authenticated;

-- Grant SELECT permission to anon for public viewing (where appropriate)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.audiobooks TO anon;