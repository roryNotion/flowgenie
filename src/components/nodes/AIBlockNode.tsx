import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';

const AIBlockNode = memo<NodeProps>((props) => {
  return <BaseNode {...props} data={{ ...props.data, type: 'aiblock' }} />;
});

AIBlockNode.displayName = 'AIBlockNode';

export default AIBlockNode;