import React from 'react';
import { Handle, Position } from '@xyflow/react';

function FlattenNode() {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-80 border border-amber-200">
      <div className="text-lg font-medium text-gray-800 mb-4 bg-amber-200 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
        Flatten 层
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-amber-400 rounded-full"
      />
      
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          将多维输入展平为一维向量，通常用于连接卷积/池化层与全连接层
        </p>
        
        <div className="text-xs text-gray-500 mt-2">
          该层没有可配置的参数
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-4 h-4 bg-amber-400 rounded-full"
      />
    </div>
  );
}

export default FlattenNode; 