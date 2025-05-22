import { Node, Edge } from 'reactflow';

export type NodeType = 'trigger' | 'condition' | 'action' | 'aiblock';

export interface WorkflowNode extends Node {
  data: {
    type: NodeType;
    name: string;
    description?: string;
    integration?: string;
    config: Record<string, any>;
    status?: 'configured' | 'error' | 'unconfigured';
    error?: string;
  };
}

export interface WorkflowEdge extends Edge {
  data?: {
    condition?: string;
    label?: string;
  };
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'error';
  version: number;
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
  execution_count: number;
}

export interface ExecutionLog {
  id: string;
  workflow_id: string;
  status: 'running' | 'success' | 'error';
  started_at: string;
  completed_at?: string;
  duration?: number;
  error?: string;
  input_context: Record<string, any>;
  output_context: Record<string, any>;
  node_logs: NodeExecutionLog[];
}

export interface NodeExecutionLog {
  node_id: string;
  node_name: string;
  node_type: NodeType;
  status: 'running' | 'success' | 'error';
  started_at: string;
  completed_at?: string;
  duration?: number;
  error?: string;
  input: Record<string, any>;
  output: Record<string, any>;
}

export interface WorkflowValidation {
  isValid: boolean;
  errors: {
    nodeId: string;
    message: string;
  }[];
}