CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, profile_type, name, display_name, username, city, neighborhood, state)
  VALUES (
    NEW.id,
    'personal',
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', '_')) || '_' || substr(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    NEW.raw_user_meta_data->>'neighborhood',
    COALESCE(NEW.raw_user_meta_data->>'state', 'BA')
  );
  RETURN NEW;
END;
$function$