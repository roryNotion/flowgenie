import { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.7';
import { RateLimiter } from 'npm:limiter@2.0.1';

interface NodeContext {
  [key: string]: any;
}

interface NodeExecutionLog {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'running' | 'success' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  input: Record<string, any>;
  output: Record<string, any>;
}

export class WorkflowEngine {
  private workflow: any;
  private supabase: SupabaseClient;
  private context: NodeContext = {};
  private nodeLogs: NodeExecutionLog[] = [];
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor(workflow: any, supabase: SupabaseClient) {
    this.workflow = workflow;
    this.supabase = supabase;
    this.initializeRateLimiters();
  }

  private initializeRateLimiters() {
    // Initialize rate limiters for different services
    this.rateLimiters.set('openai', new RateLimiter({
      tokensPerInterval: 50,
      interval: 'minute',
    }));

    this.rateLimiters.set('sendgrid', new RateLimiter({
      tokensPerInterval: 100,
      interval: 'minute',
    }));

    this.rateLimiters.set('resend', new RateLimiter({
      tokensPerInterval: 50,
      interval: 'minute',
    }));
  }

  async execute(initialContext: NodeContext = {}) {
    this.context = { ...initialContext };

    try {
      // Find trigger node (entry point)
      const triggerNode = this.workflow.nodes.find((n: any) => n.data.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Workflow must have a trigger node');
      }

      // Execute nodes starting from trigger
      await this.executeNode(triggerNode.id);

      return {
        success: true,
        context: this.context,
        nodeLogs: this.nodeLogs,
      };
    } catch (error) {
      throw error;
    }
  }

  private async executeNode(nodeId: string): Promise<void> {
    const node = this.workflow.nodes.find((n: any) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const startTime = new Date();
    let nodeSuccess = false;
    let nodeError: string | null = null;
    let nodeOutput: Record<string, any> = {};

    try {
      // Get integration if node uses one
      let integration;
      if (node.data.integration) {
        integration = await this.getIntegrationWithKeys(node.data.integration);
        if (!integration) {
          throw new Error(`Integration ${node.data.integration} not found`);
        }

        // Check rate limits
        const limiter = this.rateLimiters.get(integration.type);
        if (limiter) {
          await limiter.removeTokens(1);
        }
      }

      // Execute based on node type
      switch (node.data.type) {
        case 'trigger':
          nodeOutput = { ...this.context };
          nodeSuccess = true;
          break;

        case 'condition':
          const result = await this.evaluateCondition(node);
          const nextNodeId = this.findNextNode(nodeId, result);
          if (nextNodeId) {
            await this.executeNode(nextNodeId);
          }
          nodeOutput = { conditionResult: result };
          nodeSuccess = true;
          break;

        case 'aiblock':
          if (!integration) throw new Error('AI block requires an OpenAI integration');
          nodeOutput = await this.executeAINode(node, integration);
          nodeSuccess = true;
          break;

        case 'action':
          if (!integration) throw new Error('Action requires an integration');
          nodeOutput = await this.executeActionNode(node, integration);
          nodeSuccess = true;
          break;

        default:
          throw new Error(`Unknown node type: ${node.data.type}`);
      }

      // Update context with node output
      this.context = { ...this.context, ...nodeOutput };

      // Find and execute next node (if not a condition)
      if (node.data.type !== 'condition') {
        const nextNodeId = this.findNextNode(nodeId);
        if (nextNodeId) {
          await this.executeNode(nextNodeId);
        }
      }
    } catch (error) {
      nodeSuccess = false;
      nodeError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      // Log node execution
      const endTime = new Date();
      this.nodeLogs.push({
        nodeId: node.id,
        nodeName: node.data.name,
        nodeType: node.data.type,
        status: nodeSuccess ? 'success' : 'error',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        error: nodeError,
        input: this.context,
        output: nodeOutput,
      });
    }
  }

  private async getIntegrationWithKeys(integrationId: string) {
    const { data, error } = await this.supabase
      .from('integrations')
      .select(`
        *,
        integration_keys (
          key_name,
          encrypted_value
        )
      `)
      .eq('id', integrationId)
      .single();

    if (error) throw error;
    return data;
  }

  private async evaluateCondition(node: any): Promise<boolean> {
    const { field, operator, value } = node.data.config;
    const fieldValue = this.context[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private async executeAINode(node: any, integration: any): Promise<Record<string, any>> {
    // Replace variables in prompt
    let prompt = node.data.config.prompt;
    Object.entries(this.context).forEach(([key, value]) => {
      prompt = prompt.replace(`{{${key}}}`, String(value));
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.integration_keys[0].encrypted_value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: node.data.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to call OpenAI API');
    }

    const data = await response.json();
    return {
      [node.data.config.outputVariable || 'aiOutput']: data.choices[0].message.content,
    };
  }

  private async executeActionNode(node: any, integration: any): Promise<Record<string, any>> {
    switch (node.data.config.actionType) {
      case 'email':
        return this.sendEmail(node, integration);
      case 'database':
        return this.updateDatabase(node, integration);
      default:
        throw new Error(`Unknown action type: ${node.data.config.actionType}`);
    }
  }

  private async sendEmail(node: any, integration: any): Promise<Record<string, any>> {
    try {
      // Get email credentials
      const emailKey = integration.integration_keys.find((k: any) => 
        k.key_name === 'apiKey' || k.key_name === 'sendgridKey' || k.key_name === 'resendKey'
      );

      if (!emailKey) {
        throw new Error('Email API key not found');
      }

      // Replace variables in email content
      const to = this.replaceVariables(node.data.config.toEmail);
      const subject = this.replaceVariables(node.data.config.subject);
      const body = this.replaceVariables(node.data.config.body);

      // Validate email parameters
      if (!to || !subject || !body) {
        throw new Error('Missing required email parameters');
      }

      if (integration.type === 'sendgrid') {
        console.log('Sending email via SendGrid:', { to, fromEmail: integration.config.fromEmail });
        
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailKey.encrypted_value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ 
              to: [{ email: to }] 
            }],
            from: { 
              email: integration.config.fromEmail,
              name: integration.config.fromName
            },
            subject,
            content: [{ 
              type: 'text/plain', 
              value: body 
            }],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`SendGrid error: ${error.message || 'Failed to send email'}`);
        }
      } else if (integration.type === 'resend') {
        console.log('Sending email via Resend:', { to, fromEmail: integration.config.fromEmail });
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailKey.encrypted_value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: integration.config.fromEmail,
            to,
            subject,
            text: body,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Resend error: ${error.message || 'Failed to send email'}`);
        }
      }

      return { 
        emailSent: true, 
        to, 
        subject,
        provider: integration.type
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateDatabase(node: any, integration: any): Promise<Record<string, any>> {
    const table = node.data.config.table;
    const data = JSON.parse(this.replaceVariables(node.data.config.data));

    const supabaseClient = createClient(
      integration.config.projectUrl,
      integration.integration_keys[0].encrypted_value
    );

    const { error } = await supabaseClient
      .from(table)
      .insert(data);

    if (error) throw error;

    return { databaseUpdated: true, table, data };
  }

  private findNextNode(nodeId: string, conditionResult: boolean = true): string | null {
    const edge = this.workflow.edges.find((e: any) => 
      e.source === nodeId && 
      (e.sourceHandle === undefined || e.sourceHandle === (conditionResult ? 'true' : 'false'))
    );
    return edge ? edge.target : null;
  }

  private replaceVariables(template: string): string {
    return template.replace(/{{(\w+)}}/g, (_, key) => 
      this.context[key] !== undefined ? String(this.context[key]) : ''
    );
  }
}