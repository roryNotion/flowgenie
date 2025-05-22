import { IntegrationRegistry, IntegrationTestResult } from '../types';

export const INTEGRATION_REGISTRY: IntegrationRegistry = {
  supabase: {
    label: 'Supabase',
    configSchema: {
      projectUrl: {
        type: 'string',
        label: 'Project URL',
        required: true,
      },
      tableName: {
        type: 'string',
        label: 'Table Name',
        required: false,
      },
    },
    test: async (config): Promise<IntegrationTestResult> => {
      try {
        const response = await fetch(`${config.projectUrl}/rest/v1/`, {
          headers: {
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to connect to Supabase');
        }

        return {
          success: true,
          details: {
            url: config.projectUrl,
            status: response.status,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test Supabase connection',
        };
      }
    },
  },
  
  openai: {
    label: 'OpenAI',
    configSchema: {
      model: {
        type: 'string',
        label: 'Model',
        required: true,
        default: 'gpt-3.5-turbo',
      },
    },
    test: async (config): Promise<IntegrationTestResult> => {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.openaiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to connect to OpenAI');
        }

        const data = await response.json();
        
        return {
          success: true,
          details: {
            models: data.data.length,
            defaultModel: config.model,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test OpenAI connection',
        };
      }
    },
  },
  
  sendgrid: {
    label: 'SendGrid',
    configSchema: {
      fromEmail: {
        type: 'string',
        label: 'From Email',
        required: true,
      },
      fromName: {
        type: 'string',
        label: 'From Name',
        required: false,
      },
    },
    test: async (config): Promise<IntegrationTestResult> => {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/user/credits', {
          headers: {
            'Authorization': `Bearer ${config.sendgridKey}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to connect to SendGrid');
        }

        const data = await response.json();
        
        return {
          success: true,
          details: {
            fromEmail: config.fromEmail,
            credits: data.total,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test SendGrid connection',
        };
      }
    },
  },
  
  resend: {
    label: 'Resend',
    configSchema: {
      fromEmail: {
        type: 'string',
        label: 'From Email',
        required: true,
      },
      fromName: {
        type: 'string',
        label: 'From Name',
        required: false,
      },
    },
    test: async (config): Promise<IntegrationTestResult> => {
      try {
        const response = await fetch('https://api.resend.com/v1/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: config.fromEmail,
            to: config.fromEmail,
            subject: 'Test Connection',
            text: 'This is a test email to verify your Resend integration.',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to connect to Resend');
        }

        return {
          success: true,
          details: {
            fromEmail: config.fromEmail,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test Resend connection',
        };
      }
    },
  },
};