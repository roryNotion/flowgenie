# Database Schema Documentation

## Tables

### users
Extends Supabase Auth users with additional profile information.

```sql
CREATE TABLE users (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### workflows
Stores workflow configurations and metadata.

```sql
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
```

### integrations
Stores integration configurations and connection details.

```sql
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
```

### integration_keys
Securely stores API keys and other sensitive integration credentials.

```sql
CREATE TABLE integration_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  encrypted_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## Relationships

- `users.id` -> `auth.users.id` (Extends Supabase Auth)
- `workflows.user_id` -> `users.id` (Cascade Delete)
- `integrations.user_id` -> `users.id` (Cascade Delete)
- `integration_keys.integration_id` -> `integrations.id` (Cascade Delete)

## Indexes

```sql
CREATE INDEX workflows_user_id_idx ON workflows(user_id);
CREATE INDEX workflows_status_idx ON workflows(status);
CREATE INDEX integrations_user_id_idx ON integrations(user_id);
CREATE INDEX integrations_type_idx ON integrations(type);
CREATE INDEX integration_keys_integration_id_idx ON integration_keys(integration_id);
```

## Row Level Security (RLS)

### users
```sql
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

### workflows
```sql
CREATE POLICY "Users can manage own workflows"
  ON workflows FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

### integrations
```sql
CREATE POLICY "Users can manage own integrations"
  ON integrations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

### integration_keys
```sql
CREATE POLICY "Users can manage own integration keys"
  ON integration_keys FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id 
      FROM integrations 
      WHERE id = integration_keys.integration_id
    )
  );
```

## Triggers

### Updated At Timestamps
```sql
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
```