-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the student profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure the table with RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (this handles the auto-registration)
-- but they can only insert if the name doesn't exist.
-- Actually, we don't need direct table access because we will use a SECURITY DEFINER function.

-- Create the authentication function
CREATE OR REPLACE FUNCTION public.authenticate_student(p_name text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_hash text;
BEGIN
  -- Check if the user exists
  SELECT id, password_hash INTO v_user_id, v_hash
  FROM public.student_profiles
  WHERE name = p_name;

  IF v_user_id IS NULL THEN
    -- User does not exist, so register them (auto-signup)
    INSERT INTO public.student_profiles (name, password_hash)
    VALUES (p_name, crypt(p_password, gen_salt('bf')));
    
    RETURN true;
  ELSE
    -- User exists, verify the password
    IF v_hash = crypt(p_password, v_hash) THEN
      RETURN true;
    ELSE
      RETURN false;
    END IF;
  END IF;
END;
$$;
