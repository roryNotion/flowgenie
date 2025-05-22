import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Workflow, WorkflowNode, WorkflowEdge, WorkflowValidation } from '../types/workflow';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
  loading: boolean;
  error: string | null;
  isDirty: boolean;

  // Workflow Actions
  fetchWorkflows: () => Promise<void>;
  createWorkflow: (name: string, description?: string) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  setCurrentWorkflow: (id: string) => Promise<void>;
  saveWorkflow: (id: string) => Promise<void>;
  validateWorkflow: (id: string) => Promise<WorkflowValidation>;
  duplicateWorkflow: (id: string) => Promise<Workflow>;

  // Node Actions
  onAddNode: (nodeData: { type: string; position: { x: number; y: number }; data?: any }) => void;
  updateNode: (id: string, data: any) => void;
  deleteNode: (id: string) => void;
  onNodesChange: (changes: any) => void;
  selectNode: (id: string | null) => void;

  // Edge Actions
  onAddEdge: (connection: Connection) => void;
  updateEdge: (id: string, data: any) => void;
  deleteEdge: (id: string) => void;
  onEdgesChange: (changes: any) => void;

  // Execution Actions
  executeWorkflow: (id: string, input?: Record<string, any>) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  loading: false,
  error: null,
  isDirty: false,

  fetchWorkflows: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ workflows: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching workflows:', error);
      set({ error: 'Failed to fetch workflows', loading: false });
    }
  },

  createWorkflow: async (name: string, description?: string) => {
    try {
      // Create default trigger node
      const triggerNode: WorkflowNode = {
        id: `trigger-${nanoid(6)}`,
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          type: 'trigger',
          name: 'New Trigger',
          config: {},
          status: 'unconfigured',
        },
      };

      const { data, error } = await supabase
        .from('workflows')
        .insert([
          {
            name,
            description,
            nodes: [triggerNode],
            edges: [],
            status: 'draft',
            version: 1,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        workflows: [data, ...state.workflows],
        currentWorkflow: data,
        nodes: [triggerNode],
        edges: [],
        isDirty: false,
      }));

      toast.success('Workflow created successfully');
      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
      throw error;
    }
  },

  deleteWorkflow: async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
      }));

      toast.success('Workflow deleted successfully');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
      throw error;
    }
  },

  setCurrentWorkflow: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ 
        currentWorkflow: data,
        nodes: data.nodes || [],
        edges: data.edges || [],
        selectedNode: null,
        isDirty: false,
      });
    } catch (error) {
      console.error('Error setting current workflow:', error);
      toast.error('Failed to load workflow');
      throw error;
    }
  },

  saveWorkflow: async (id: string) => {
    const { nodes, edges, isDirty } = get();
    
    if (!isDirty) {
      toast.info('No changes to save');
      return;
    }

    try {
      const { error } = await supabase
        .from('workflows')
        .update({
          nodes,
          edges,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      set({ isDirty: false });
      toast.success('Workflow saved successfully');
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
      throw error;
    }
  },

  validateWorkflow: async (id: string) => {
    try {
      const { data, error } = await supabase
        .functions.invoke('validate-workflow', {
          body: { workflowId: id },
        });

      if (error) throw error;
      return data as WorkflowValidation;
    } catch (error) {
      console.error('Error validating workflow:', error);
      toast.error('Failed to validate workflow');
      throw error;
    }
  },

  duplicateWorkflow: async (id: string) => {
    try {
      const { data, error } = await supabase
        .functions.invoke('duplicate-workflow', {
          body: { workflowId: id },
        });

      if (error) throw error;

      set((state) => ({
        workflows: [data, ...state.workflows],
      }));

      toast.success('Workflow duplicated successfully');
      return data;
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      toast.error('Failed to duplicate workflow');
      throw error;
    }
  },

  onAddNode: (nodeData) => {
    const newNode: WorkflowNode = {
      id: `${nodeData.type}-${nanoid(6)}`,
      type: nodeData.type,
      position: nodeData.position,
      data: {
        type: nodeData.type,
        name: `New ${nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1)}`,
        config: nodeData.data?.config || {},
        status: 'unconfigured',
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));
  },

  updateNode: (id: string, data: any) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
      selectedNode: state.selectedNode?.id === id
        ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...data } }
        : state.selectedNode,
      isDirty: true,
    }));
  },

  deleteNode: (id: string) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
      isDirty: true,
    }));
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    }));
  },

  selectNode: (id: string | null) => {
    if (!id) {
      set({ selectedNode: null });
      return;
    }

    const node = get().nodes.find((n) => n.id === id) || null;
    set({ selectedNode: node as WorkflowNode });
  },

  onAddEdge: (connection) => {
    set((state) => ({
      edges: addEdge(connection, state.edges),
      isDirty: true,
    }));
  },

  updateEdge: (id: string, data: any) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge
      ),
      isDirty: true,
    }));
  },

  deleteEdge: (id: string) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      isDirty: true,
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
  },

  executeWorkflow: async (id: string, input: Record<string, any> = {}) => {
    try {
      const { data, error } = await supabase
        .functions.invoke('execute-workflow', {
          body: {
            workflowId: id,
            input,
          },
        });

      if (error) throw error;

      toast.success('Workflow execution started');
      return data;
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Failed to execute workflow');
      throw error;
    }
  },
}));