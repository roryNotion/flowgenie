/*
  # Integration Definitions Schema

  1. New Tables
    - integration_definitions
      - Stores the schema/configuration for each integration type
      - Contains auth fields, test config, actions, and triggers
      - Used as a template when users create new integrations

  2. Security
    - Enable RLS on table
    - Add policy for authenticated users to read definitions
*/

-- Integration definitions table
CREATE TABLE integration_definitions (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE integration_definitions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading definitions
CREATE POLICY "Anyone can read integration definitions"
  ON integration_definitions
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert the integration definitions
INSERT INTO integration_definitions (id, display_name, definition) VALUES
-- OpenAI
('openai', 'OpenAI', '{
  "auth": {
    "type": "apiKey",
    "fields": [
      {
        "key": "apiKey",
        "label": "API Key",
        "type": "password",
        "required": true
      }
    ]
  },
  "testConnection": {
    "method": "GET",
    "url": "https://api.openai.com/v1/models",
    "headers": {
      "Authorization": "Bearer {{apiKey}}"
    }
  },
  "actions": [
    {
      "id": "chat_completion",
      "label": "Chat Completion",
      "description": "Generate text using GPT",
      "fields": [
        {
          "key": "model",
          "type": "string",
          "default": "gpt-3.5-turbo"
        },
        {
          "key": "messages",
          "type": "json",
          "required": true
        }
      ]
    }
  ],
  "triggers": []
}'::jsonb),

-- Supabase
('supabase', 'Supabase', '{
  "auth": {
    "type": "apiKey",
    "fields": [
      {
        "key": "url",
        "label": "Project URL",
        "type": "text",
        "required": true
      },
      {
        "key": "apiKey",
        "label": "API Key",
        "type": "password",
        "required": true
      }
    ]
  },
  "testConnection": {
    "method": "GET",
    "url": "{{url}}/rest/v1/",
    "headers": {
      "apikey": "{{apiKey}}",
      "Authorization": "Bearer {{apiKey}}"
    }
  },
  "actions": [
    {
      "id": "get_users",
      "label": "Get Users",
      "fields": [
        {
          "key": "table",
          "type": "string",
          "default": "users",
          "required": true
        }
      ]
    }
  ],
  "triggers": [
    {
      "id": "new_user_row",
      "label": "New User Row",
      "description": "Triggered when a new row is inserted in the users table"
    }
  ]
}'::jsonb),

-- SendGrid
('sendgrid', 'SendGrid', '{
  "auth": {
    "type": "apiKey",
    "fields": [
      {
        "key": "apiKey",
        "label": "API Key",
        "type": "password",
        "required": true
      }
    ]
  },
  "testConnection": {
    "method": "GET",
    "url": "https://api.sendgrid.com/v3/user/account",
    "headers": {
      "Authorization": "Bearer {{apiKey}}"
    }
  },
  "actions": [
    {
      "id": "send_email",
      "label": "Send Email",
      "fields": [
        {
          "key": "to",
          "type": "string",
          "required": true
        },
        {
          "key": "from",
          "type": "string",
          "required": true
        },
        {
          "key": "subject",
          "type": "string",
          "required": true
        },
        {
          "key": "body",
          "type": "text",
          "required": true
        }
      ]
    }
  ],
  "triggers": []
}'::jsonb),

-- Resend
('resend', 'Resend', '{
  "auth": {
    "type": "apiKey",
    "fields": [
      {
        "key": "apiKey",
        "label": "API Key",
        "type": "password",
        "required": true
      }
    ]
  },
  "testConnection": {
    "method": "GET",
    "url": "https://api.resend.com/emails",
    "headers": {
      "Authorization": "Bearer {{apiKey}}"
    }
  },
  "actions": [
    {
      "id": "send_email",
      "label": "Send Email",
      "fields": [
        {
          "key": "to",
          "type": "string",
          "required": true
        },
        {
          "key": "from",
          "type": "string",
          "required": true
        },
        {
          "key": "subject",
          "type": "string",
          "required": true
        },
        {
          "key": "html",
          "type": "text",
          "required": true
        }
      ]
    }
  ],
  "triggers": []
}'::jsonb);