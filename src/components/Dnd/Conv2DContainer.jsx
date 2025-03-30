import React, { useCallback } from 'react';
import useStore from '@/store';
import DropZone from './DropZone';
import Conv2DNode from './Conv2DNode';
import MaxPooling2DNode from './MaxPooling2DNode'; // 假设你有一个类似的 MaxPooling2DNode 组件

function Conv2DContainer() {
  const { 
    nodes, 
    addNode, 
    removeNode,
    conv2dConfigs,
    maxPooling2dConfigs,
    updateConv2dConfig,
    updateMaxPooling2dConfig
  } = useStore();

  const handleAddNode = useCallback((type) => {
    addNode(type);
  }, [addNode]);

  return (
    <div>
      <DropZone onAddNode={handleAddNode} />
      {nodes.map((node, index) => (
        <div key={index} className="mb-4">
          {node.type === 'CONV2D_NODE' && (
            <Conv2DNode 
              data={{ index }} 
              config={conv2dConfigs[node.configIndex]}
              onUpdate={(newConfig) => updateConv2dConfig(node.configIndex, newConfig)}
            />
          )}
          {node.type === 'MAX_POOLING2D_NODE' && (
            <MaxPooling2DNode 
              data={{ index }} 
              config={maxPooling2dConfigs[node.configIndex]}
              onUpdate={(newConfig) => updateMaxPooling2dConfig(node.configIndex, newConfig)}
            />
          )}
          <button 
            onClick={() => removeNode(index)} 
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Remove Layer
          </button>
        </div>
      ))}
    </div>
  );
}

export default Conv2DContainer;



