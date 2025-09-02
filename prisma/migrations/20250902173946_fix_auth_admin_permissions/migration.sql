-- Fix missing supabase_auth_admin permissions for trigger functionality
-- This allows the auth service to create profiles when users sign up via OAuth

GRANT SELECT, INSERT, UPDATE ON public.profiles TO supabase_auth_admin;