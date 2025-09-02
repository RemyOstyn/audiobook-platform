-- Grant USAGE permission on public schema to anon and authenticated roles
-- This is required for API access to work with RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions to authenticated users for profiles table
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Grant SELECT permission to anon for public profile viewing (optional)
GRANT SELECT ON public.profiles TO anon;