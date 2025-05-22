-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add key expiration and rotation fields
ALTER TABLE integration_keys
ADD COLUMN expires_at timestamptz,
ADD COLUMN rotated_at timestamptz,
ADD COLUMN rotation_count integer DEFAULT 0,
ADD COLUMN previous_key_hash text,
ADD COLUMN encryption_key uuid DEFAULT gen_random_uuid();

-- Create key access logs table
CREATE TABLE key_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_key_id uuid REFERENCES integration_keys(id) ON DELETE CASCADE,
  accessed_at timestamptz DEFAULT now(),
  accessed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type text NOT NULL,
  ip_address text,
  user_agent text
);

-- Create key usage tracking table
CREATE TABLE key_usage_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  key_id uuid REFERENCES integration_keys(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  UNIQUE (integration_id, key_id, date)
);

-- Enable RLS
ALTER TABLE key_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_usage_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own key access logs"
  ON key_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integration_keys k
      JOIN integrations i ON k.integration_id = i.id
      WHERE k.id = key_access_logs.integration_key_id
      AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own key usage stats"
  ON key_usage_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations i
      WHERE i.id = key_usage_stats.integration_id
      AND i.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX key_access_logs_key_id_idx ON key_access_logs(integration_key_id);
CREATE INDEX key_access_logs_date_idx ON key_access_logs(accessed_at);
CREATE INDEX key_usage_stats_integration_id_idx ON key_usage_stats(integration_id);
CREATE INDEX key_usage_stats_date_idx ON key_usage_stats(date);

-- Create function to encrypt key values
CREATE OR REPLACE FUNCTION encrypt_key_value(value text, encryption_key uuid)
RETURNS text AS $$
BEGIN
  RETURN encode(
    encrypt(
      value::bytea,
      encryption_key::text::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt key values
CREATE OR REPLACE FUNCTION decrypt_key_value(encrypted_value text, encryption_key uuid)
RETURNS text AS $$
BEGIN
  RETURN convert_from(
    decrypt(
      decode(encrypted_value, 'base64'),
      encryption_key::text::bytea,
      'aes'
    ),
    'utf8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log key access
CREATE OR REPLACE FUNCTION log_key_access()
RETURNS trigger AS $$
BEGIN
  INSERT INTO key_access_logs (
    integration_key_id,
    accessed_by,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    NEW.id,
    auth.uid(),
    TG_OP,
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'user-agent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for key access logging
CREATE TRIGGER log_key_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON integration_keys
  FOR EACH ROW
  EXECUTE FUNCTION log_key_access();

-- Create function to update key usage stats
CREATE OR REPLACE FUNCTION update_key_usage()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for key usage tracking
CREATE TRIGGER update_key_usage_trigger
  AFTER INSERT OR UPDATE ON integration_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_key_usage();

-- Update existing keys with encryption
DO $$
DECLARE
  key_record RECORD;
BEGIN
  FOR key_record IN SELECT id, encrypted_value FROM integration_keys LOOP
    UPDATE integration_keys
    SET 
      encryption_key = gen_random_uuid(),
      encrypted_value = encrypt_key_value(encrypted_value, encryption_key)
    WHERE id = key_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;