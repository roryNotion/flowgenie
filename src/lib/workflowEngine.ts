import { toast } from 'sonner';
import { supabase } from './supabase';
import { WorkflowNode, NodeContext, ExecutionResult } from '../types';
import { getIntegrationById } from './database';

export class WorkflowEngine {
  private nodes: WorkflowNode[];
  private edges: any[];
  private context: NodeContext = {};
  private workflowId: string;
  private nodeLogs: any[] = [];
  private executionLogId: string | null = null;

  constructor(workflowId: string, nodes: WorkflowNode[], edges: any[]) {
    this.workflowId = workflowId;
    this.nodes = nodes;
    this.edges = edges;
  }

  async execute(initialContext: NodeContext = {}): Promise<ExecutionResult> {
    this.context = { ...initialContext };
    const startTime = new Date();

    try {
      // Create execution log entry
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: logEntry, error: logError } = await supabase
        .from('execution_logs')
        .insert({
          workflow_id: this.workflowId,
          user_id: user.user.id,
          status: 'running',
          started_at: startTime.toISOString(),
          input_context: initialContext,
        })
        .select()
        .single();

      if (logError) throw logError;
      this.executionLogId = logEntry.id;

      // Find trigger node (entry point)
      const triggerNode = this.nodes.find(node => node.data.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Workflow must have a trigger node to start execution. Please add a trigger node to your workflow.');
      }

      // Execute the workflow starting from trigger
      await this.executeNode(triggerNode.id);

      // Update execution log with success
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await supabase
        .from('execution_logs')
        .update({
          status: 'success',
          completed_at: endTime.toISOString(),
          duration,
          output_context: this.context,
          node_logs: this.nodeLogs,
        })
        .eq('id', this.executionLogId);

      // Update workflow stats
      await supabase
        .from('workflows')
        .update({
          last_executed_at: endTime.toISOString(),
          execution_count: supabase.sql`execution_count + 1`,
        })
        .eq('id', this.workflowId);

      return {
        success: true,
        context: this.context,
        startTime,
        endTime,
      };
    } catch (error) {
      // Update execution log with failure
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (this.executionLogId) {
        await supabase
          .from('execution_logs')
          .update({
            status: 'error',
            completed_at: endTime.toISOString(),
            duration,
            error: errorMessage,
            output_context: this.context,
            node_logs: this.nodeLogs,
          })
          .eq('id', this.executionLogId);
      }

      // Update workflow stats
      await supabase
        .from('workflows')
        .update({
          last_executed_at: endTime.toISOString(),
          execution_count: supabase.sql`execution_count + 1`,
          last_error: errorMessage,
        })
        .eq('id', this.workflowId);

      return {
        success: false,
        context: this.context,
        error: errorMessage,
        startTime,
        endTime,
      };
    }
  }

  private async executeNode(nodeId: string): Promise<void> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const nodeStartTime = new Date();
    let nodeSuccess = false;
    let nodeError: string | null = null;

    try {
      // Get the integration if node uses one
      let integration;
      if (node.data.integration) {
        integration = await getIntegrationById(node.data.integration);
        if (!integration) {
          throw new Error(`Integration ${node.data.integration} not found`);
        }
      }

      // Execute based on node type
      switch (node.data.type) {
        case 'trigger':
          // For trigger nodes, we just pass through the initial context
          // and add some metadata about the trigger
          this.context = {
            ...this.context,
            triggered: true,
            triggerTime: new Date().toISOString(),
          };
          break;

        case 'condition':
          const result = await this.evaluateCondition(node);
          const nextNodeId = this.findNextNode(nodeId, result);
          if (nextNodeId) {
            await this.executeNode(nextNodeId);
          }
          break;

        case 'aiblock':
          if (!integration) throw new Error('AI block requires an OpenAI integration');
          const aiResult = await this.executeAINode(node, integration);
          this.context = {
            ...this.context,
            ...aiResult,
          };
          break;

        case 'action':
          if (!integration) throw new Error('Action requires an integration');
          const actionResult = await this.executeActionNode(node, integration);
          this.context = {
            ...this.context,
            ...actionResult,
          };
          break;

        default:
          throw new Error(`Unknown node type: ${node.data.type}`);
      }

      nodeSuccess = true;

      // Find and execute next node (if not a condition node, which handles its own branching)
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
      const nodeEndTime = new Date();
      const nodeDuration = nodeEndTime.getTime() - nodeStartTime.getTime();

      this.nodeLogs.push({
        nodeId: node.id,
        nodeName: node.data.name,
        nodeType: node.data.type,
        success: nodeSuccess,
        error: nodeError,
        duration: nodeDuration,
        startTime: nodeStartTime,
        endTime: nodeEndTime,
      });
    }
  }

  private async evaluateCondition(node: WorkflowNode): Promise<boolean> {
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

  private async executeAINode(node: WorkflowNode, integration: any): Promise<any> {
    // Replace variables in the prompt
    let prompt = node.data.config.prompt;
    Object.entries(this.context).forEach(([key, value]) => {
      prompt = prompt.replace(`{{${key}}}`, String(value));
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.config.apiKey}`,
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

  private async executeActionNode(node: WorkflowNode, integration: any): Promise<any> {
    switch (node.data.config.actionType) {
      case 'email':
        // Replace variables in email content
        const subject = this.replaceVariables(node.data.config.subject);
        const body = this.replaceVariables(node.data.config.body);
        const to = this.replaceVariables(node.data.config.toEmail);

        // Send email based on integration type
        if (integration.type === 'sendgrid') {
          // SendGrid implementation
          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.config.sendgridKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: to }] }],
              from: { email: integration.config.fromEmail },
              subject,
              content: [{ type: 'text/plain', value: body }],
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send email via SendGrid');
          }
        } else if (integration.type === 'resend') {
          // Resend implementation
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.config.resendKey}`,
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
            throw new Error('Failed to send email via Resend');
          }
        }

        return { emailSent: true, to, subject };

      case 'database':
        // Replace variables in data
        const table = node.data.config.table;
        const data = JSON.parse(this.replaceVariables(node.data.config.data));

        const { error } = await supabase
          .from(table)
          .insert(data);

        if (error) throw error;

        return { databaseUpdated: true, table, data };

      default:
        throw new Error(`Unknown action type: ${node.data.config.actionType}`);
    }
  }

  private findNextNode(currentNodeId: string, conditionResult: boolean = true): string | null {
    const edge = this.edges.find(e => 
      e.source === currentNodeId && 
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