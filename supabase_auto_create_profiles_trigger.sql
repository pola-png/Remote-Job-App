-- ====================================================================
-- AUTOMATIC USER PROFILES TRIGGER SETUP (EXACT SCHEMA MATCH)
-- Run this in your Supabase Dashboard -> SQL Editor:
-- https://supabase.com/dashboard/project/tnjmwahnzosuhqpkvuwo/sql
-- ====================================================================

-- 1. Create function to automatically insert profile on every new auth.users signup
-- (Matches your actual public.profiles columns: id, username, display_name, created_at, balance, is_tasks_unlocked)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_uname text;
  final_uname text;
  counter int := 0;
BEGIN
  -- Generate a clean base username from metadata or email prefix
  base_uname := LOWER(
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'handle'), ''),
      NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
      'user'
    )
  );

  -- Remove any spaces or special characters to keep it a valid username
  base_uname := SUBSTRING(REGEXP_REPLACE(base_uname, '[^a-zA-Z0-9_]', '', 'g') FROM 1 FOR 40);
  IF base_uname = '' THEN
    base_uname := 'user';
  END IF;

  final_uname := base_uname;

  -- Ensure username uniqueness (profiles_username_key constraint)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_uname AND id <> NEW.id) LOOP
    counter := counter + 1;
    final_uname := SUBSTRING(base_uname FROM 1 FOR 35) || '_' || SUBSTRING(NEW.id::text FROM 1 FOR 4) || counter::text;
  END LOOP;

  -- Insert into public.profiles matching exact table schema
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    created_at,
    is_tasks_unlocked,
    balance
  )
  VALUES (
    NEW.id,
    final_uname,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      final_uname
    ),
    COALESCE(NEW.created_at, NOW()),
    true,
    0.00
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Create or replace the trigger on auth.users (100% non-destructive, no DROP needed)
CREATE OR REPLACE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- 3. One-time backfill: Automatically create profiles for existing
-- auth users who currently do not have a profile (bridges the gap from 248 to 441)
DO $$
DECLARE
  r RECORD;
  base_uname text;
  final_uname text;
  counter int;
BEGIN
  FOR r IN 
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  LOOP
    base_uname := LOWER(
      COALESCE(
        NULLIF(TRIM(r.raw_user_meta_data->>'username'), ''),
        NULLIF(TRIM(r.raw_user_meta_data->>'handle'), ''),
        NULLIF(TRIM(split_part(r.email, '@', 1)), ''),
        'user'
      )
    );
    base_uname := SUBSTRING(REGEXP_REPLACE(base_uname, '[^a-zA-Z0-9_]', '', 'g') FROM 1 FOR 40);
    IF base_uname = '' THEN
      base_uname := 'user';
    END IF;

    final_uname := base_uname;
    counter := 0;

    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_uname AND id <> r.id) LOOP
      counter := counter + 1;
      final_uname := SUBSTRING(base_uname FROM 1 FOR 35) || '_' || SUBSTRING(r.id::text FROM 1 FOR 4) || counter::text;
    END LOOP;

    INSERT INTO public.profiles (
      id,
      username,
      display_name,
      created_at,
      is_tasks_unlocked,
      balance
    )
    VALUES (
      r.id,
      final_uname,
      COALESCE(
        NULLIF(TRIM(r.raw_user_meta_data->>'display_name'), ''),
        NULLIF(TRIM(r.raw_user_meta_data->>'full_name'), ''),
        final_uname
      ),
      COALESCE(r.created_at, NOW()),
      true,
      0.00
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;
