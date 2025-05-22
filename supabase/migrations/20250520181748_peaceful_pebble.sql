/*
  # Initial Schema Setup

  1. New Tables
    - users
      - Managed by Supabase Auth
      - Additional profile fields
    - workflows
      - Store workflow configurations
      - Connected to users
    - integrations
      - Store integration configurations
      - Connected to users
    - integration_keys
      - Securely store API keys
      - Connected to integrations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table (extends Supabase Auth)
CREATE TABLE users (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Workflows table
CREATE TABLE workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  nodes jsonb NOT NULL DEFAULT '[]',
  edges jsonb NOT NULL DEFAULT '[]',
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_executed_at timestamptz,
  execution_count integer DEFAULT 0
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workflows"
  ON workflows
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Integrations table
CREATE TABLE integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  error text
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Integration keys table (for storing encrypted API keys)
CREATE TABLE integration_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  encrypted_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE integration_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integration keys"
  ON integration_keys
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id 
      FROM integrations 
      WHERE id = integration_keys.integration_id
    )
  );

-- Create indexes for better performance
CREATE INDEX workflows_user_id_idx ON workflows(user_id);
CREATE INDEX workflows_status_idx ON workflows(status);
CREATE INDEX integrations_user_id_idx ON integrations(user_id);
CREATE INDEX integrations_type_idx ON integrations(type);
CREATE INDEX integration_keys_integration_id_idx ON integration_keys(integration_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();