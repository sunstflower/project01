import React, { useState } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store';

function DropoutNode({ data }) {
  const { dropoutConfigs, updateDropoutConfig } = useStore();
  const configIndex = data.index || 0;
  const config = dropoutConfigs[configIndex] || { rate: 0.2 };
  const [rate, setRate] = useState(config.rate);

  const handleRateChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setRate(value);
      updateDropoutConfig(configIndex, { rate: value });
    }
  };

  return (
    <NodeContainer title="Dropout" backgroundColor="blue-50">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" title="丢弃率 (0-1 之间的值)">
            丢弃率:
          </label>
          <input 
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={rate}
            onChange={handleRateChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            输入范围: 0-1
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mt-2">
          在训练期间随机将输入单元设置为0的比率，有助于防止过拟合
        </div>
      </div>
    </NodeContainer>
  );
}

export default DropoutNode; 