import { RateLimiter } from 'npm:limiter@2.0.1';
import { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.7';

export class WorkflowEngine {
  private workflow: any;
  private supabase: SupabaseClient;
  private context: Record<string, any> = {};
  private executionLogId: string | null = null;
  private nodeLogs: any[] = [];
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

  async execute(initialContext: Record<string, any> = {}): Promise<any> {
    const startTime = new Date();
    this.context = { ...initialContext };

    try {
      // Create execution log
      const { data: logEntry, error: logError } = await this.supabase
        .from('execution_logs')
        .insert({
          workflow_id: this.workflow.id,
          user_id: this.workflow.user_id,
          status: 'running',
          started_at: startTime.toISOString(),
          input_context: initialContext,
        })
        .select()
        .single();

      if (logError) throw logError;
      this.executionLogId = logEntry.id;

      // Execute workflow nodes
      const nodes = this.workflow.nodes;
      const edges = this.workflow.edges;

      // Find trigger node
      const triggerNode = nodes.find((n: any) => n.type === 'trigger');
      if (!triggerNode) throw new Error('No trigger node found');

      // Execute nodes
      await this.executeNode(triggerNode.id, nodes, edges);

      // Update execution log with success
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await this.supabase
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
      await this.supabase
        .from('workflows')
        .update({
          last_executed_at: endTime.toISOString(),
          execution_count: this.supabase.sql`execution_count + 1`,
        })
        .eq('id', this.workflow.id);

      return {
        success: true,
        context: this.context,
        duration,
      };
    } catch (error) {
      // Update execution log with failure
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (this.executionLogId) {
        await this.supabase
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

      throw error;
    }
  }

  private async executeNode(nodeId: string, nodes: any[], edges: any[]): Promise<void> {
    const node = nodes.find((n: any) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const startTime = new Date();
    let success = false;
    let error: string | null = null;

    try {
      // Check rate limits if node uses an integration
      if (node.data.integration) {
        const integration = await this.getIntegration(node.data.integration);
        const limiter = this.rateLimiters.get(integration.type);
        if (limiter) {
          await limiter.removeTokens(1);
        }
      }

      // Execute node logic
      switch (node.data.type) {
        case 'trigger':
          // Trigger nodes just pass through
          success = true;
          break;

        case 'condition':
          const result = await this.evaluateCondition(node);
          const nextNodeId = this.findNextNode(nodeId, edges, result);
          if (nextNodeId) {
            await this.executeNode(nextNodeId, nodes, edges);
          }
          success = true;
          break;

        case 'action':
          await this.executeAction(node);
          success = true;
          break;

        case 'aiblock':
          await this.executeAIBlock(node);
          success = true;
          break;

        default:
          throw new Error(`Unknown node type: ${node.data.type}`);
      }

      // Find and execute next node if not a condition
      if (node.data.type !== 'condition') {
        const nextNodeId = this.findNextNode(nodeId, edges);
        if (nextNodeId) {
          await this.executeNode(nextNodeId, nodes, edges);
        }
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      // Log node execution
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.nodeLogs.push({
        nodeId,
        nodeName: node.data.name,
        nodeType: node.data.type,
        success,
        error,
        duration,
        startTime,
        endTime,
      });
    }
  }

  // Helper methods for node execution...
  private async getIntegration(integrationId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) throw error;
    return data;
  }

  private async evaluateCondition(node: any): Promise<boolean> {
    // Implementation of condition evaluation
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

  private async executeAction(node: any): Promise<void> {
    // Implementation of action execution
    // This would handle different types of actions (email, database, etc.)
    const integration = await this.getIntegration(node.data.integration);
    
    switch (node.data.config.actionType) {
      case 'email':
        // Handle email sending
        break;
      case 'database':
        // Handle database operations
        break;
      default:
        throw new Error(`Unknown action type: ${node.data.config.actionType}`);
    }
  }

  private async executeAIBlock(node: any): Promise<void> {
    // Implementation of AI block execution
    const integration = await this.getIntegration(node.data.integration);
    
    // Handle OpenAI API calls
  }

  private findNextNode(currentNodeId: string, edges: any[], conditionResult: boolean = true): string | null {
    const edge = edges.find((e: any) => 
      e.source === currentNodeId && 
      (e.sourceHandle === undefined || e.sourceHandle === (conditionResult ? 'true' : 'false'))
    );
    return edge ? edge.target : null;
  }
}