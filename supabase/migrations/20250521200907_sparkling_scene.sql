/*
  # Fix workflow RLS policies

  1. Changes
    - Drop existing RLS policy for workflows table
    - Create new RLS policies with explicit INSERT, SELECT, UPDATE, and DELETE permissions
    - Add check constraint to ensure user_id is set on insert

  2. Security
    - Enable RLS on workflows table
    - Add policies for each operation type
    - Ensure user_id matches authenticated user
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage own workflows" ON workflows;

-- Create separate policies for each operation
CREATE POLICY "Users can create workflows"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON workflows FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON workflows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger to ensure user_id is set
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS ensure_user_id ON workflows;
CREATE TRIGGER ensure_user_id
  BEFORE INSERT ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();