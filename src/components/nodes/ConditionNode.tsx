import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';

const ConditionNode = memo<NodeProps>((props) => {
  return <BaseNode {...props} data={{ ...props.data, type: 'condition' }} />;
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;