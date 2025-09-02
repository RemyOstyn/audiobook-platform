-- Fix handle_new_user function to bypass RLS and use proper enum casting
-- The function needs SET search_path = '' to bypass RLS during signup
-- and proper enum casting for the UserRole type

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (NEW.id, 'user'::public."UserRole", COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;