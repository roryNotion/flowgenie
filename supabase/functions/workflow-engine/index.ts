import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Queue } from 'npm:bullmq@5.1.5';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize queue
const workflowQueue = new Queue('workflow-execution', {
  connection: {
    host: Deno.env.get('REDIS_HOST'),
    port: parseInt(Deno.env.get('REDIS_PORT') || '6379'),
    password: Deno.env.get('REDIS_PASSWORD'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// Rate limiting configuration
const RATE_LIMITS = {
  default: { points: 100, duration: 60 }, // 100 requests per minute
  openai: { points: 50, duration: 60 }, // 50 requests per minute
  sendgrid: { points: 100, duration: 60 }, // 100 emails per minute
  resend: { points: 50, duration: 60 }, // 50 emails per minute
};

serve(async (req) => {
  try {
    const { method } = req;
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    switch (path) {
      case 'execute':
        if (method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }

        const { workflowId, context = {} } = await req.json();
        if (!workflowId) {
          return new Response('Workflow ID is required', { status: 400 });
        }

        // Add job to queue
        const job = await workflowQueue.add('execute-workflow', {
          workflowId,
          userId: user.id,
          context,
        });

        return new Response(JSON.stringify({ jobId: job.id }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'status':
        if (method !== 'GET') {
          return new Response('Method not allowed', { status: 405 });
        }

        const jobId = url.searchParams.get('jobId');
        if (!jobId) {
          return new Response('Job ID is required', { status: 400 });
        }

        const job = await workflowQueue.getJob(jobId);
        if (!job) {
          return new Response('Job not found', { status: 404 });
        }

        // Check if user owns this job
        const jobData = job.data;
        if (jobData.userId !== user.id) {
          return new Response('Unauthorized', { status: 401 });
        }

        const state = await job.getState();
        const result = {
          id: job.id,
          state,
          progress: job.progress,
          returnvalue: job.returnvalue,
          failedReason: job.failedReason,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
        };

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response('Not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(error.message, { status: 500 });
  }
});