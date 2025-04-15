import React from 'react';
import NodeContainer from '../NodeContainer';

function FlattenNode() {
  return (
    <NodeContainer title="Flatten" backgroundColor="amber-50">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          将多维输入展平为一维向量，通常用于连接卷积/池化层与全连接层
        </p>
        
        <div className="text-xs text-gray-500 mt-2">
          该层没有可配置的参数
        </div>
      </div>
    </NodeContainer>
  );
}

export default FlattenNode; 