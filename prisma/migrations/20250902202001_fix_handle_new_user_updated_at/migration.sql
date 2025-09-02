-- Fix handle_new_user function to include updated_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, updated_at)
  VALUES (NEW.id, 'user', COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;