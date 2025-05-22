/*
  # Add user creation trigger

  1. Changes
    - Add function to handle new user creation
    - Add trigger to automatically create user record when auth user is created
  
  2. Purpose
    - Ensures users table is populated when new users sign up
    - Fixes foreign key constraint violation in workflows table
    - Maintains data consistency between auth.users and public.users
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;