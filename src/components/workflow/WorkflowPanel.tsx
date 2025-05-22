import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import NodeConfigPanel from './NodeConfigPanel';
import ExecutionPanel from './ExecutionPanel';
import { useWorkflowStore } from '../../store/workflowStore';

const WorkflowPanel: React.FC = () => {
  const selectedNode = useWorkflowStore((state) => state.selectedNode);

  return (
    <div className="w-96 border-l bg-white h-full overflow-hidden">
      <Tabs.Root defaultValue="config" className="h-full flex flex-col">
        <Tabs.List className="flex border-b bg-gray-50">
          <Tabs.Trigger
            value="config"
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600"
          >
            Node Configuration
          </Tabs.Trigger>
          <Tabs.Trigger
            value="execution"
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600"
          >
            Execution Logs
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="config" className="flex-1 overflow-y-auto">
          <NodeConfigPanel />
        </Tabs.Content>

        <Tabs.Content value="execution" className="flex-1 overflow-y-auto">
          <ExecutionPanel />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default WorkflowPanel;