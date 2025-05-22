import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { PlusCircle, Save, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkflowStore } from '../../store/workflowStore';
import { Button } from '../ui/Button';
import TriggerNode from '../nodes/TriggerNode';
import ConditionNode from '../nodes/ConditionNode';
import AIBlockNode from '../nodes/AIBlockNode';
import ActionNode from '../nodes/ActionNode';
import { WorkflowEngine } from '../../lib/workflowEngine';
import 'reactflow/dist/style.css';

// Define custom node types
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  aiblock: AIBlockNode,
  action: ActionNode,
};

const WorkflowCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [isExecuting, setIsExecuting] = React.useState(false);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onAddNode,
    onAddEdge,
    selectNode,
    currentWorkflow,
    saveWorkflow,
  } = useWorkflowStore();
  
  const onConnect = useCallback((params: any) => {
    onAddEdge(params);
  }, [onAddEdge]);
  
  const onNodeClick = useCallback((event: any, node: any) => {
    selectNode(node.id);
  }, [selectNode]);
  
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
  
      if (!reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
  
      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }
  
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
  
      onAddNode({
        type,
        position,
        data: { 
          type,
          name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          config: {},
        }
      });
    },
    [project, onAddNode]
  );

  const handleSaveWorkflow = async () => {
    if (!currentWorkflow?.id) {
      toast.error('No workflow selected');
      return;
    }

    try {
      await saveWorkflow(currentWorkflow.id);
      toast.success('Workflow saved successfully');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('Failed to save workflow');
    }
  };

  const handleRunWorkflow = async () => {
    if (!currentWorkflow?.id) {
      toast.error('No workflow selected');
      return;
    }
    
    try {
      setIsExecuting(true);
      const engine = new WorkflowEngine(currentWorkflow.id, nodes, edges);
      const result = await engine.execute();
      
      if (result.success) {
        toast.success('Workflow executed successfully');
      } else {
        toast.error(`Workflow execution failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Failed to execute workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Panel position="top-right" className="bg-white shadow-md rounded-md p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              leftIcon={<Save size={14} />}
              onClick={handleSaveWorkflow}
            >
              Save
            </Button>
            <Button
              variant="primary"
              leftIcon={<Play size={14} />}
              onClick={handleRunWorkflow}
              disabled={isExecuting}
            >
              {isExecuting ? 'Running...' : 'Run'}
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

const WorkflowCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
};

export default WorkflowCanvas;