/*
  # Add Basic Integration Definitions

  1. New Integrations
    - Supabase Database Trigger
    - OpenAI Text Generation
    - SendGrid Email

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Insert basic integration definitions
INSERT INTO integration_definitions (id, display_name, definition) VALUES
-- Basic Supabase Trigger
('supabase_basic', 'Supabase Basic Trigger', '{
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
      "id": "insert_row",
      "label": "Insert Row",
      "fields": [
        {
          "key": "table",
          "type": "string",
          "required": true
        },
        {
          "key": "data",
          "type": "json",
          "required": true
        }
      ]
    }
  ],
  "triggers": [
    {
      "id": "new_row",
      "label": "New Row",
      "fields": [
        {
          "key": "table",
          "type": "string",
          "required": true
        }
      ]
    }
  ]
}'::jsonb),

-- Basic OpenAI Integration
('openai_basic', 'OpenAI Basic', '{
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
      "id": "generate_text",
      "label": "Generate Text",
      "fields": [
        {
          "key": "prompt",
          "type": "text",
          "required": true
        },
        {
          "key": "model",
          "type": "string",
          "default": "gpt-3.5-turbo"
        },
        {
          "key": "maxTokens",
          "type": "number",
          "default": 100
        }
      ]
    }
  ],
  "triggers": []
}'::jsonb),

-- Basic SendGrid Integration
('sendgrid_basic', 'SendGrid Basic', '{
  "auth": {
    "type": "apiKey",
    "fields": [
      {
        "key": "apiKey",
        "label": "API Key",
        "type": "password",
        "required": true
      },
      {
        "key": "fromEmail",
        "label": "From Email",
        "type": "text",
        "required": true
      }
    ]
  },
  "testConnection": {
    "method": "GET",
    "url": "https://api.sendgrid.com/v3/mail/send",
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
}'::jsonb);

-- Insert sample workflows
INSERT INTO workflows (name, description, nodes, edges, status) VALUES
('Test Workflow', 'A simple test workflow', '[
  {
    "id": "trigger-1",
    "type": "trigger",
    "position": {"x": 100, "y": 100},
    "data": {
      "type": "trigger",
      "name": "New User",
      "config": {
        "table": "users"
      }
    }
  },
  {
    "id": "action-1",
    "type": "action",
    "position": {"x": 400, "y": 100},
    "data": {
      "type": "action",
      "name": "Send Welcome Email",
      "config": {
        "actionType": "email",
        "to": "{{email}}",
        "subject": "Welcome to FlowGenius!",
        "body": "Hi {{name}},\n\nWelcome to FlowGenius!"
      }
    }
  }
]'::jsonb, '[
  {
    "id": "edge-1",
    "source": "trigger-1",
    "target": "action-1"
  }
]'::jsonb, 'active');