import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';

const POOL_SIZE_OPTIONS = [
  { value: '2,2', label: '2x2' },
  { value: '3,3', label: '3x3' },
  { value: '4,4', label: '4x4' },
];

const PADDING_OPTIONS = [
  { value: 'valid', label: 'Valid' },
  { value: 'same', label: 'Same' },
];

// 辅助函数：将数组转换为字符串
const arrayToString = (arr) => {
  if (Array.isArray(arr)) {
    return arr.join(',');
  }
  return String(arr);
};

// 辅助函数：将字符串转换为数组
const stringToArray = (str) => {
  if (typeof str === 'string') {
    return str.split(',').map(item => parseInt(item.trim(), 10));
  }
  return str;
};

function MaxPooling2DNode({ data }) {
  const { maxPooling2dConfigs, updateMaxPooling2dConfig } = useStore();
  const configIndex = data.index || 0;
  const config = maxPooling2dConfigs[configIndex] || {
    poolSize: [2, 2],
    strides: [2, 2],
    padding: 'valid',
  };

  // 使用状态来存储字符串形式的值，用于UI显示
  const [poolSizeStr, setPoolSizeStr] = useState('');
  const [stridesStr, setStridesStr] = useState('');
  const [padding, setPadding] = useState(config.padding || 'valid');

  // 初始化和同步配置数据
  useEffect(() => {
    if (config) {
      // 确保存储的是字符串形式
      setPoolSizeStr(arrayToString(config.poolSize));
      setStridesStr(arrayToString(config.strides));
      setPadding(config.padding || 'valid');
    }
  }, [config]);

  const handlePoolSizeChange = (e) => {
    const valueStr = e.target.value;
    setPoolSizeStr(valueStr);
    
    // 更新store中的配置，转换回数组形式
    const valueArray = stringToArray(valueStr);
    updateMaxPooling2dConfig(configIndex, { ...config, poolSize: valueArray });
  };

  const handleStridesChange = (e) => {
    const valueStr = e.target.value;
    setStridesStr(valueStr);
    
    // 尝试解析为数组，如果是有效格式
    try {
      const valueArray = stringToArray(valueStr);
      updateMaxPooling2dConfig(configIndex, { ...config, strides: valueArray });
    } catch (error) {
      console.error('无效的步长格式:', error);
    }
  };

  const handlePaddingChange = (e) => {
    const value = e.target.value;
    setPadding(value);
    updateMaxPooling2dConfig(configIndex, { ...config, padding: value });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-80 border border-blue-100">
      <div className="text-lg font-medium text-gray-800 mb-4 bg-blue-100 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
        Max Pooling 2D 层
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-blue-400 rounded-full"
      />
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            池化大小:
          </label>
          <select 
            value={poolSizeStr}
            onChange={handlePoolSizeChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {POOL_SIZE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            当前值: [{poolSizeStr}]
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            步长:
          </label>
          <input 
            type="text" 
            value={stridesStr}
            onChange={handleStridesChange}
            placeholder="例如: 2,2"
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            输入格式: 数字,数字 (例如: 2,2)
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            填充方式:
          </label>
          <select 
            value={padding}
            onChange={handlePaddingChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PADDING_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-blue-400 rounded-full"
      />
    </div>
  );
}

export default MaxPooling2DNode;



