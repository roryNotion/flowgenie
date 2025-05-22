/*
  # Add user creation trigger

  1. Changes
    - Create trigger to automatically create user records in public.users table
    when new users are created in auth.users
    
  2. Security
    - No changes to existing security policies
    - Maintains existing RLS settings
*/

-- Create trigger to handle new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Backfill existing users
INSERT INTO public.users (id, created_at, updated_at)
SELECT 
  id,
  created_at,
  created_at as updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;