/*
  # Add Execution Logs Table

  1. New Tables
    - execution_logs
      - Store workflow execution history
      - Track success/failure
      - Store input/output context
      - Connected to workflows

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE execution_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration integer, -- in milliseconds
  error text,
  input_context jsonb DEFAULT '{}',
  output_context jsonb DEFAULT '{}',
  node_logs jsonb DEFAULT '[]'
);

-- Enable RLS
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own logs
CREATE POLICY "Users can manage own execution logs"
  ON execution_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX execution_logs_workflow_id_idx ON execution_logs(workflow_id);
CREATE INDEX execution_logs_user_id_idx ON execution_logs(user_id);
CREATE INDEX execution_logs_started_at_idx ON execution_logs(started_at);