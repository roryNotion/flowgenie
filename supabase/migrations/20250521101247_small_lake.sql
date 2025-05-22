/*
  # Add Workflow Queue Tables

  1. New Tables
    - workflow_jobs
      - Store queued workflow executions
      - Track job status and progress
    - workflow_job_logs
      - Detailed execution logs
      - Node-level execution details
    - rate_limits
      - Track API usage and rate limits
      - Per-integration limits

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Workflow Jobs Table
CREATE TABLE workflow_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  priority integer DEFAULT 0,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  scheduled_for timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  context jsonb DEFAULT '{}',
  result jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rate Limits Table
CREATE TABLE rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  service text NOT NULL,
  points integer NOT NULL,
  interval interval NOT NULL,
  current_usage integer DEFAULT 0,
  reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workflow_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own workflow jobs"
  ON workflow_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage rate limits for own integrations"
  ON rate_limits
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id 
      FROM integrations 
      WHERE id = integration_id
    )
  );

-- Create indexes
CREATE INDEX workflow_jobs_status_idx ON workflow_jobs(status);
CREATE INDEX workflow_jobs_scheduled_for_idx ON workflow_jobs(scheduled_for);
CREATE INDEX rate_limits_integration_service_idx ON rate_limits(integration_id, service);

-- Create updated_at triggers
CREATE TRIGGER update_workflow_jobs_updated_at
  BEFORE UPDATE ON workflow_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default rate limits
INSERT INTO rate_limits (service, points, interval) VALUES
  ('openai', 50, '1 minute'),
  ('sendgrid', 100, '1 minute'),
  ('resend', 50, '1 minute'),
  ('supabase', 1000, '1 minute');