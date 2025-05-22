import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useWorkflowStore } from '../../store/workflowStore';

const ExecutionPanel: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const { currentWorkflow } = useWorkflowStore();
  
  useEffect(() => {
    if (currentWorkflow?.id) {
      fetchExecutionLogs();
    }
  }, [currentWorkflow?.id]);
  
  const fetchExecutionLogs = async () => {
    if (!currentWorkflow?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('execution_logs')
        .select('*')
        .eq('workflow_id', currentWorkflow.id)
        .order('started_at', { ascending: false });
        
      if (error) throw error;
      setExecutionLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch execution logs:', error);
      toast.error('Failed to fetch execution logs');
    }
  };
  
  const handleStartExecution = async () => {
    if (!currentWorkflow?.id) return;
    
    try {
      setIsExecuting(true);

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // Call the Supabase Edge Function with proper headers
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-workflow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: currentWorkflow.id,
          context: {
            timestamp: new Date().toISOString(),
            trigger: 'manual'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute workflow');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Execution failed');
      }

      toast.success('Workflow executed successfully');
      await fetchExecutionLogs();
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute workflow');
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleClearLogs = async () => {
    if (!currentWorkflow?.id) return;
    
    try {
      await supabase
        .from('execution_logs')
        .delete()
        .eq('workflow_id', currentWorkflow.id);
        
      setExecutionLogs([]);
      toast.success('Logs cleared successfully');
    } catch (error) {
      console.error('Failed to clear logs:', error);
      toast.error('Failed to clear logs');
    }
  };
  
  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Clock size={18} className="mr-2" />
            Execution Logs
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleClearLogs}
              disabled={isExecuting}
            >
              Clear
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play size={14} />}
              onClick={handleStartExecution}
              disabled={isExecuting}
            >
              {isExecuting ? 'Running...' : 'Run Workflow'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-0">
        {executionLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No execution logs yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {executionLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="text-success-500" size={16} />
                    ) : (
                      <AlertCircle className="text-error-500" size={16} />
                    )}
                    <span className="font-medium ml-2">Workflow Execution</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      log.status === 'success'
                        ? 'bg-success-100 text-success-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(log.started_at)}
                  </div>
                </div>
                
                {log.error && (
                  <div className="mb-2 p-2 bg-error-50 text-error-700 rounded-md text-xs">
                    {log.error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <h4 className="text-xs font-semibold mb-1 text-gray-500">Input</h4>
                    <pre className="text-xs p-2 bg-gray-50 rounded-md overflow-x-auto">
                      {JSON.stringify(log.input_context, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold mb-1 text-gray-500">Output</h4>
                    <pre className="text-xs p-2 bg-gray-50 rounded-md overflow-x-auto">
                      {JSON.stringify(log.output_context, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExecutionPanel;