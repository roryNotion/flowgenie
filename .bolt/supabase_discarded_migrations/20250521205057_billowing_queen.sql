/*
  # Workflow Engine Schema
  
  1. New Tables
    - workflow_jobs: Manages workflow execution queue
    - execution_logs: Stores detailed execution history
    - rate_limits: Handles API rate limiting
    - key_access_logs: Tracks integration key usage
    - key_usage_stats: Aggregates key usage metrics
    
  2. Security
    - RLS policies for all tables
    - Access control based on user ownership
    
  3. Monitoring
    - Execution tracking
    - Usage statistics
    - Access logging
*/

-- Workflow Jobs table
CREATE TABLE IF NOT EXISTS workflow_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE workflow_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflow jobs"
  ON workflow_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS workflow_jobs_status_idx ON workflow_jobs(status);
CREATE INDEX IF NOT EXISTS workflow_jobs_scheduled_for_idx ON workflow_jobs(scheduled_for);

-- Execution Logs table
CREATE TABLE IF NOT EXISTS execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration integer,
  error text,
  input_context jsonb DEFAULT '{}',
  output_context jsonb DEFAULT '{}',
  node_logs jsonb DEFAULT '[]'
);

ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own execution logs"
  ON execution_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS execution_logs_workflow_id_idx ON execution_logs(workflow_id);
CREATE INDEX IF NOT EXISTS execution_logs_user_id_idx ON execution_logs(user_id);
CREATE INDEX IF NOT EXISTS execution_logs_started_at_idx ON execution_logs(started_at);

-- Rate Limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  service text NOT NULL,
  points integer NOT NULL,
  interval interval NOT NULL,
  current_usage integer DEFAULT 0,
  reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage rate limits for own integrations"
  ON rate_limits
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id 
      FROM integrations 
      WHERE id = rate_limits.integration_id
    )
  );

CREATE INDEX IF NOT EXISTS rate_limits_integration_service_idx ON rate_limits(integration_id, service);

-- Key Access Logs table
CREATE TABLE IF NOT EXISTS key_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key_id uuid REFERENCES integration_keys(id) ON DELETE CASCADE,
  accessed_at timestamptz DEFAULT now(),
  accessed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type text NOT NULL,
  ip_address text,
  user_agent text
);

ALTER TABLE key_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own key access logs"
  ON key_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM integration_keys k
      JOIN integrations i ON k.integration_id = i.id
      WHERE k.id = key_access_logs.integration_key_id
      AND i.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS key_access_logs_key_id_idx ON key_access_logs(integration_key_id);
CREATE INDEX IF NOT EXISTS key_access_logs_date_idx ON key_access_logs(accessed_at);

-- Key Usage Stats table
CREATE TABLE IF NOT EXISTS key_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  key_id uuid REFERENCES integration_keys(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  UNIQUE(integration_id, key_id, date)
);

ALTER TABLE key_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own key usage stats"
  ON key_usage_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM integrations i
      WHERE i.id = key_usage_stats.integration_id
      AND i.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS key_usage_stats_integration_id_idx ON key_usage_stats(integration_id);
CREATE INDEX IF NOT EXISTS key_usage_stats_date_idx ON key_usage_stats(date);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_workflow_jobs_updated_at ON workflow_jobs;
CREATE TRIGGER update_workflow_jobs_updated_at
  BEFORE UPDATE ON workflow_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for logging key access
CREATE OR REPLACE FUNCTION log_key_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO key_access_logs (
    integration_key_id,
    access_type,
    accessed_by
  ) VALUES (
    NEW.id,
    TG_OP,
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_key_access_trigger ON integration_keys;
CREATE TRIGGER log_key_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON integration_keys
  FOR EACH ROW
  EXECUTE FUNCTION log_key_access();

-- Create trigger for updating key usage
CREATE OR REPLACE FUNCTION update_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO key_usage_stats (
    integration_id,
    key_id,
    date,
    usage_count,
    last_used_at
  ) VALUES (
    NEW.integration_id,
    NEW.id,
    CURRENT_DATE,
    1,
    now()
  )
  ON CONFLICT (integration_id, key_id, date)
  DO UPDATE SET
    usage_count = key_usage_stats.usage_count + 1,
    last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_key_usage_trigger ON integration_keys;
CREATE TRIGGER update_key_usage_trigger
  AFTER INSERT OR UPDATE ON integration_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_key_usage();