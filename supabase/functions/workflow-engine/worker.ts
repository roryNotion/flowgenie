import { Worker } from 'npm:bullmq@5.1.5';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { WorkflowEngine } from './engine.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize worker
const worker = new Worker('workflow-execution', async (job) => {
  const { workflowId, userId, context } = job.data;

  try {
    // Update job progress
    await job.updateProgress(10);

    // Fetch workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    // Verify ownership
    if (workflow.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    await job.updateProgress(20);

    // Initialize and execute workflow
    const engine = new WorkflowEngine(workflow, supabase);
    const result = await engine.execute(context);

    await job.updateProgress(100);

    return result;
  } catch (error) {
    console.error('Worker error:', error);
    throw error;
  }
}, {
  connection: {
    host: Deno.env.get('REDIS_HOST'),
    port: parseInt(Deno.env.get('REDIS_PORT') || '6379'),
    password: Deno.env.get('REDIS_PASSWORD'),
  },
  concurrency: 10,
});

// Handle worker events
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});