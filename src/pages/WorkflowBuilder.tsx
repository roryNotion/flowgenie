import React from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import WorkflowCanvas from '../components/workflow/WorkflowCanvas';
import NodePanel from '../components/workflow/NodePanel';
import WorkflowPanel from '../components/workflow/WorkflowPanel';

const WorkflowBuilder: React.FC = () => {
  return (
    <div className="flex h-full">
      {/* Left Sidebar - Node Panel */}
      <div className="w-64 border-r bg-white h-full overflow-hidden">
        <NodePanel />
      </div>
      
      {/* Main Workflow Canvas */}
      <div className="flex-1 h-full relative">
        <WorkflowCanvas />
      </div>
      
      {/* Right Panel - Node Configuration and Execution Logs */}
      <WorkflowPanel />
    </div>
  );
};

export default WorkflowBuilder;