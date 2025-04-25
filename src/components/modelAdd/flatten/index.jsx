import React, { useEffect } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store';

function FlattenNode({ data, id }) {
  const { flattenConfigs, addFlattenConfig } = useStore();

  // 使用节点ID而非索引
  const nodeId = id;
  
  // 确保配置存在
  useEffect(() => {
    // 检查该节点ID是否已有配置
    if (!flattenConfigs[nodeId]) {
      // 创建新配置 (Flatten没有参数)
      addFlattenConfig(nodeId);
      
      console.log(`Flatten层 ${nodeId} 设置默认值`);
    }
  }, [nodeId, flattenConfigs, addFlattenConfig]);

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