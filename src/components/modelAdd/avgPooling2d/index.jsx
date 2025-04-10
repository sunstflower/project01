import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';

const POOL_SIZE_OPTIONS = [
  { value: '(2, 2)', label: '2x2' },
  { value: '(3, 3)', label: '3x3' },
  { value: '(4, 4)', label: '4x4' },
];

const PADDING_OPTIONS = [
  { value: 'valid', label: 'Valid' },
  { value: 'same', label: 'Same' },
];

function AvgPooling2DNode({ data }) {
  const { avgPooling2dConfigs, updateAvgPooling2dConfig } = useStore();
  const configIndex = data.index || 0;
  const config = avgPooling2dConfigs[configIndex] || {
    poolSize: '(2, 2)',
    strides: '(2, 2)',
    padding: 'valid',
  };

  const [poolSize, setPoolSize] = useState(config.poolSize);
  const [strides, setStrides] = useState(config.strides);
  const [padding, setPadding] = useState(config.padding);

  const handlePoolSizeChange = (e) => {
    const value = e.target.value;
    setPoolSize(value);
    updateAvgPooling2dConfig(configIndex, { ...config, poolSize: value });
  };

  const handleStridesChange = (e) => {
    const value = e.target.value;
    setStrides(value);
    updateAvgPooling2dConfig(configIndex, { ...config, strides: value });
  };

  const handlePaddingChange = (e) => {
    const value = e.target.value;
    setPadding(value);
    updateAvgPooling2dConfig(configIndex, { ...config, padding: value });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-80 border border-purple-100">
      <div className="text-lg font-medium text-gray-800 mb-4 bg-purple-100 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
        Average Pooling 2D 层
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-purple-400 rounded-full"
      />
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            池化大小:
          </label>
          <select 
            value={poolSize}
            onChange={handlePoolSizeChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {POOL_SIZE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            步长:
          </label>
          <input 
            type="text" 
            value={strides}
            onChange={handleStridesChange}
            placeholder="例如: (2, 2)"
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            填充方式:
          </label>
          <select 
            value={padding}
            onChange={handlePaddingChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {PADDING_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-500">
            计算输入的平均值，减少空间维度并提取特征
          </p>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-4 h-4 bg-purple-400 rounded-full"
      />
    </div>
  );
}

export default AvgPooling2DNode; 