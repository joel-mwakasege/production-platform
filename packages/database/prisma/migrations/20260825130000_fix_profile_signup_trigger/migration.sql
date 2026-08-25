-- Keep Supabase Auth signups compatible with the required profile timestamp.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, "updatedAt")
  VALUES (NEW.id, CURRENT_TIMESTAMP);

  RETURN NEW;
END;
$$;