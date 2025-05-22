import { create } from 'zustand';
import { NodeContext, ExecutionLog, WorkflowNode, WorkflowEdge } from '../types';

interface ExecutionState {
  isExecuting: boolean;
  executionLogs: ExecutionLog[];
  currentNodeId: string | null;
  globalContext: NodeContext;
  testMode: boolean;
  
  // Execution Actions
  startExecution: (initialContext?: NodeContext) => Promise<void>;
  stopExecution: () => void;
  setTestMode: (enabled: boolean) => void;
  clearLogs: () => void;
  
  // Logging Actions
  addExecutionLog: (log: Omit<ExecutionLog, 'duration'>) => void;
  
  // Context Actions
  updateGlobalContext: (context: NodeContext) => void;
  clearContext: () => void;
  
  // Test Actions
  executeNode: (nodeId: string, inputContext?: NodeContext) => Promise<NodeContext>;
}

// Sample execution logs for development
const sampleLogs: ExecutionLog[] = [
  {
    nodeId: 'trigger-1',
    nodeName: 'New Supabase Row',
    nodeType: 'trigger',
    inputContext: {},
    outputContext: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      bio: 'Software developer with 5 years of experience',
      created_at: '2023-10-15T14:30:00Z'
    },
    success: true,
    startTime: new Date('2023-10-15T14:30:01Z'),
    endTime: new Date('2023-10-15T14:30:02Z'),
    duration: 1000,
  },
  {
    nodeId: 'aiblock-1',
    nodeName: 'Summarize Bio',
    nodeType: 'aiblock',
    inputContext: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      bio: 'Software developer with 5 years of experience',
      created_at: '2023-10-15T14:30:00Z'
    },
    outputContext: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      bio: 'Software developer with 5 years of experience',
      created_at: '2023-10-15T14:30:00Z',
      bio_summary: 'Experienced software developer'
    },
    success: true,
    startTime: new Date('2023-10-15T14:30:02Z'),
    endTime: new Date('2023-10-15T14:30:04Z'),
    duration: 2000,
  },
];

// This would be part of the execution engine in a real app
const executeNodeMock = async (
  node: WorkflowNode, 
  inputContext: NodeContext
): Promise<{ success: boolean; context: NodeContext; error?: string }> => {
  // In a real app, this would use the appropriate handler for each node type
  switch (node.data.type) {
    case 'trigger':
      return {
        success: true,
        context: {
          ...inputContext,
          triggerData: {
            id: '123',
            email: 'user@example.com',
            name: 'John Doe',
          }
        }
      };
      
    case 'condition': 
      const conditionField = node.data.config.field || '';
      const conditionValue = node.data.config.value || '';
      const conditionOperator = node.data.config.operator || 'equals';
      const fieldValue = inputContext[conditionField];
      
      let conditionMet = false;
      
      switch (conditionOperator) {
        case 'equals':
          conditionMet = fieldValue === conditionValue;
          break;
        case 'notEquals':
          conditionMet = fieldValue !== conditionValue;
          break;
        case 'contains':
          conditionMet = String(fieldValue).includes(conditionValue);
          break;
        case 'greaterThan':
          conditionMet = Number(fieldValue) > Number(conditionValue);
          break;
        case 'lessThan':
          conditionMet = Number(fieldValue) < Number(conditionValue);
          break;
      }
      
      return {
        success: true,
        context: {
          ...inputContext,
          conditionMet,
        }
      };
      
    case 'aiblock':
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        context: {
          ...inputContext,
          aiResult: `AI processed: ${node.data.config.prompt || 'No prompt provided'}`
        }
      };
      
    case 'action':
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        context: {
          ...inputContext,
          actionResult: `Action executed: ${node.data.name}`
        }
      };
      
    default:
      return {
        success: false,
        context: inputContext,
        error: `Unknown node type: ${node.data.type}`
      };
  }
};

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  isExecuting: false,
  executionLogs: sampleLogs,
  currentNodeId: null,
  globalContext: {},
  testMode: false,
  
  // Execution Actions
  startExecution: async (initialContext = {}) => {
    set({ 
      isExecuting: true,
      executionLogs: [],
      globalContext: initialContext,
      currentNodeId: null
    });
    
    // In a real app, this would be a proper execution engine that traverses
    // the workflow graph and executes each node in the correct order
    
    // For demonstration, we'll add a setTimeout to simulate execution
    setTimeout(() => {
      set({ isExecuting: false });
    }, 3000);
  },
  
  stopExecution: () => {
    set({ isExecuting: false, currentNodeId: null });
  },
  
  setTestMode: (enabled) => {
    set({ testMode: enabled });
  },
  
  clearLogs: () => {
    set({ executionLogs: [] });
  },
  
  // Logging Actions
  addExecutionLog: (log) => {
    const duration = log.endTime.getTime() - log.startTime.getTime();
    
    set((state) => ({
      executionLogs: [...state.executionLogs, { ...log, duration }],
    }));
  },
  
  // Context Actions
  updateGlobalContext: (context) => {
    set((state) => ({
      globalContext: { ...state.globalContext, ...context },
    }));
  },
  
  clearContext: () => {
    set({ globalContext: {} });
  },
  
  // Test Actions - this is a simplified version for the MVP
  executeNode: async (nodeId, inputContext = {}) => {
    set({ 
      currentNodeId: nodeId,
      isExecuting: true 
    });
    
    try {
      // In a real app, we'd fetch the node from our API or database
      // For now, we'll use a mock implementation
      const mockNode: WorkflowNode = {
        id: nodeId,
        type: 'testNode',
        position: { x: 0, y: 0 },
        data: {
          type: 'aiblock', // Just a placeholder
          name: 'Test Node',
          config: {
            prompt: 'Analyze the user data'
          }
        }
      };
      
      const context = inputContext || get().globalContext;
      
      // Record start time
      const startTime = new Date();
      
      // Execute the node (this would use the real execution engine in a production app)
      const result = await executeNodeMock(mockNode, context);
      
      // Record end time
      const endTime = new Date();
      
      // Add execution log
      get().addExecutionLog({
        nodeId,
        nodeName: mockNode.data.name,
        nodeType: mockNode.data.type,
        inputContext: context,
        outputContext: result.context,
        success: result.success,
        error: result.error,
        startTime,
        endTime,
      });
      
      // Update global context with the result
      get().updateGlobalContext(result.context);
      
      set({ isExecuting: false, currentNodeId: null });
      
      return result.context;
    } catch (error) {
      set({ isExecuting: false, currentNodeId: null });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Add error log
      get().addExecutionLog({
        nodeId,
        nodeName: 'Unknown Node',
        nodeType: 'unknown',
        inputContext: inputContext || get().globalContext,
        outputContext: {},
        success: false,
        error: errorMessage,
        startTime: new Date(),
        endTime: new Date(),
      });
      
      throw error;
    }
  },
}));