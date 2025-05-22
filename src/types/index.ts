import { ReactNode } from 'react';
import { Node, Edge } from 'reactflow';

// Node Types
export type NodeType = 'trigger' | 'condition' | 'aiblock' | 'action';

// Integration Types
export type IntegrationType = 'supabase' | 'openai' | 'sendgrid' | 'resend';

export interface Integration {
  id: string;
  userId: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  status?: 'connected' | 'error' | 'pending';
  lastUsed?: Date;
  lastTested?: Date;
  error?: string;
}

export interface IntegrationKey {
  id: string;
  integrationId: string;
  keyName: string;
  encryptedValue: string;
}

export interface IntegrationTestResult {
  success: boolean;
  error?: string;
  details?: Record<string, any>;
}

// Workflow Types
export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'error';
  lastRun?: Date;
  lastError?: string;
  triggerCount: number;
  version: number;
}

// Context and Execution Types
export interface NodeContext {
  [key: string]: any;
}

export interface ExecutionResult {
  success: boolean;
  context: NodeContext;
  error?: string;
  logs?: string[];
  startTime: Date;
  endTime: Date;
}

export interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  inputContext: NodeContext;
  outputContext: NodeContext;
  success: boolean;
  error?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

// Node Configuration Types
export interface NodeConfig {
  name: string;
  description?: string;
  integration?: string;
  config: Record<string, any>;
}

export interface WorkflowNode extends Node {
  data: {
    type: NodeType;
    name: string;
    description?: string;
    integration?: string;
    config: Record<string, any>;
    status?: 'configured' | 'error' | 'unconfigured';
    error?: string;
    required?: string[];
  };
}

export interface WorkflowEdge extends Edge {
  data?: {
    condition?: string;
    label?: string;
  };
}

// Component Props Types
export interface NodeComponentProps {
  data: {
    type: NodeType;
    name: string;
    description?: string;
    integration?: string;
    config: Record<string, any>;
    selected?: boolean;
    status?: 'configured' | 'error' | 'unconfigured';
    error?: string;
  };
  isConnectable: boolean;
  selected: boolean;
}

export interface SidebarProps {
  children: ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TabProps {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export interface NodeFormProps {
  node: WorkflowNode | null;
  onUpdate: (updated: Partial<WorkflowNode>) => void;
  onClose: () => void;
}

export interface NodeFormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'json' | 'integrationSelect';
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
  help?: string;
}

export interface NodeDefaults {
  [key: string]: {
    name: string;
    description: string;
    fields: NodeFormField[];
    defaultConfig: Record<string, any>;
  };
}

export interface IntegrationRegistry {
  [key: string]: {
    label: string;
    configSchema: Record<string, {
      type: string;
      label: string;
      required?: boolean;
      default?: any;
    }>;
    test: (config: Record<string, any>) => Promise<IntegrationTestResult>;
  };
}

export interface WorkflowValidation {
  isValid: boolean;
  errors: {
    nodeId: string;
    message: string;
  }[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  error?: string;
  logs: ExecutionLog[];
  context: NodeContext;
}