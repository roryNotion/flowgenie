import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';

const ActionNode = memo<NodeProps>((props) => {
  return <BaseNode {...props} data={{ ...props.data, type: 'action' }} />;
});

ActionNode.displayName = 'ActionNode';

export default ActionNode;