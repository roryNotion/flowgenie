import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { WorkflowEngine } from './engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: { 
          headers: { Authorization: authHeader } 
        },
        auth: {
          persistSession: false,
        }
      }
    );

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { workflowId, context = {} } = await req.json();
    if (!workflowId) {
      throw new Error('Workflow ID is required');
    }

    // Get workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    // Verify ownership
    if (workflow.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Create execution log
    const startTime = new Date();
    const { data: log, error: logError } = await supabase
      .from('execution_logs')
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        status: 'running',
        started_at: startTime.toISOString(),
        input_context: context,
      })
      .select()
      .single();

    if (logError) {
      throw new Error('Failed to create execution log');
    }

    // Initialize and execute workflow
    const engine = new WorkflowEngine(workflow, supabase);
    const result = await engine.execute(context);

    // Update execution log with success
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    await supabase
      .from('execution_logs')
      .update({
        status: 'success',
        completed_at: endTime.toISOString(),
        duration,
        output_context: result.context,
        node_logs: result.nodeLogs,
      })
      .eq('id', log.id);

    // Update workflow stats
    await supabase
      .from('workflows')
      .update({
        last_executed_at: endTime.toISOString(),
        execution_count: workflow.execution_count + 1,
      })
      .eq('id', workflowId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          executionId: log.id,
          duration,
          result: result.context,
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);

    // Update execution log with error if possible
    try {
      const { workflowId } = await req.json();
      if (workflowId) {
        await supabase
          .from('execution_logs')
          .update({
            status: 'error',
            completed_at: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          })
          .eq('workflow_id', workflowId)
          .eq('status', 'running');
      }
    } catch (e) {
      // Ignore errors when updating the log
      console.error('Failed to update execution log:', e);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: error instanceof Error && error.message === 'Unauthorized' ? 403 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});