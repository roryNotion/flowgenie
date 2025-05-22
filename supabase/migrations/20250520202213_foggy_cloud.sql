/*
  # Fix Workflows RLS Policy

  1. Changes
    - Update the RLS policy for workflows table to explicitly handle INSERT operations
    - Add WITH CHECK clause to verify user_id matches authenticated user during inserts
    
  2. Security
    - Maintains row-level security
    - Ensures users can only create workflows with their own user_id
    - Preserves existing access controls for other operations
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage own workflows" ON workflows;

-- Create updated policy with WITH CHECK clause
CREATE POLICY "Users can manage own workflows"
ON workflows FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);