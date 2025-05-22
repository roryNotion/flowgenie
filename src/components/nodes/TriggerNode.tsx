import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';

const TriggerNode = memo<NodeProps>((props) => {
  const defaultData = {
    type: 'trigger',
    name: 'Supabase Trigger',
    description: 'Triggers when database changes occur',
    config: {
      table: '',
      event: 'INSERT',
    },
  };

  return (
    <BaseNode 
      {...props} 
      data={{ 
        ...defaultData,
        ...props.data,
      }} 
    />
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode;