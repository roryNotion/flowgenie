import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, GitBranch, Brain, Send, ChevronRight } from 'lucide-react';
import { NodeComponentProps } from '../../types';
import { getNodeColor } from '../../lib/utils';

const BaseNode = memo<NodeComponentProps>(({ data, isConnectable, selected }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'trigger':
        return <Zap size={18} />;
      case 'condition':
        return <GitBranch size={18} />;
      case 'aiblock':
        return <Brain size={18} />;
      case 'action':
        return <Send size={18} />;
      default:
        return <ChevronRight size={18} />;
    }
  };

  const nodeColor = getNodeColor(data.type);
  
  return (
    <div 
      className={`relative bg-white rounded-md shadow-md border-2 transition-all w-60 ${
        selected ? 'border-primary-400 shadow-lg' : 'border-gray-200'
      }`}
    >
      {/* Node Header */}
      <div 
        className="flex items-center p-2 rounded-t-md gap-2"
        style={{ backgroundColor: nodeColor, color: 'white' }}
      >
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 font-medium truncate text-sm">
          {data.name || `New ${data.type}`}
        </div>
      </div>
      
      {/* Node Content */}
      <div className="p-3 text-xs text-gray-600">
        {data.description ? (
          <p className="truncate">{data.description}</p>
        ) : (
          <p className="text-gray-400 italic">No description</p>
        )}
        
        {data.integration && (
          <div className="mt-1 flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="truncate">Using: {data.integration}</span>
          </div>
        )}
      </div>
      
      {/* Input Handle */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="w-3 h-3 rounded-full border-2 border-white bg-gray-400"
        />
      )}
      
      {/* Output Handle */}
      {data.type !== 'action' && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="w-3 h-3 rounded-full border-2 border-white bg-gray-400"
        />
      )}
      
      {/* For Condition nodes, add True/False handles */}
      {data.type === 'condition' && (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-3 h-3 right-10 top-0 -translate-y-1/2 rounded-full border-2 border-white bg-success-500"
          />
          <div className="absolute text-[10px] text-success-600 font-medium right-10 top-0 -translate-y-6">
            True
          </div>
          
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-3 h-3 right-10 bottom-0 translate-y-1/2 rounded-full border-2 border-white bg-error-500"
          />
          <div className="absolute text-[10px] text-error-600 font-medium right-10 bottom-0 translate-y-6">
            False
          </div>
        </>
      )}
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;