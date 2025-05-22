import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface ExecutionLog {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration: number | null;
  error: string | null;
  input_context: any;
  output_context: any;
  node_logs: any[];
  workflow: {
    name: string;
  };
}

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [timeRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const { data, error } = await supabase
        .from('execution_logs')
        .select(`
          *,
          workflow:workflows(name)
        `)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const filteredLogs = logs.filter(log => 
    log.workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-error-50 text-error-700 p-4 rounded-md">
          Error loading logs: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Execution Logs</h1>
          <p className="text-gray-500 mt-1">
            View and analyze your workflow execution history
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Time range:</span>
            <select 
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md shadow-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>
      
      <Card className="divide-y">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No execution logs found
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div 
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => toggleLogExpansion(log.id)}
              >
                <div className="flex items-center space-x-3">
                  {log.status === 'success' ? (
                    <CheckCircle className="text-success-500" size={16} />
                  ) : (
                    <AlertCircle className="text-error-500" size={16} />
                  )}
                  <span className="font-medium">{log.workflow.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    log.status === 'success' 
                      ? 'bg-success-100 text-success-800'
                      : 'bg-error-100 text-error-800'
                  }`}>
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {formatDate(log.started_at)}
                  </div>
                  {expandedLog === log.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>
              
              {expandedLog === log.id && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Input Context</h4>
                      <pre className="text-xs p-3 bg-gray-50 rounded-md overflow-x-auto">
                        {JSON.stringify(log.input_context, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Output Context</h4>
                      <pre className="text-xs p-3 bg-gray-50 rounded-md overflow-x-auto">
                        {JSON.stringify(log.output_context, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  {log.error && (
                    <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
                      {log.error}
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Node Execution</h4>
                    <div className="space-y-2">
                      {log.node_logs.map((nodeLog: any, index: number) => (
                        <div 
                          key={index}
                          className="p-3 bg-gray-50 rounded-md text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{nodeLog.nodeName}</span>
                            <span className="text-gray-500">{nodeLog.duration}ms</span>
                          </div>
                          {nodeLog.error && (
                            <div className="text-error-600 text-xs mt-1">
                              {nodeLog.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export default LogsPage;