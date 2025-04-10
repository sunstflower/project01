import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';

const ACTIVATION_OPTIONS = [
  { value: 'relu', label: 'ReLU' },
  { value: 'sigmoid', label: 'Sigmoid' },
  { value: 'tanh', label: 'Tanh' },
  { value: 'softmax', label: 'Softmax' },
  { value: 'elu', label: 'ELU' },
  { value: 'selu', label: 'SELU' },
  { value: 'softplus', label: 'Softplus' },
  { value: 'softsign', label: 'Softsign' },
  { value: 'hard_sigmoid', label: 'Hard Sigmoid' },
  { value: 'exponential', label: 'Exponential' },
];

function ActivationNode({ data }) {
  const { activationConfigs, updateActivationConfig } = useStore();
  const configIndex = data.index || 0;
  const config = activationConfigs[configIndex] || {
    activation: 'relu',
  };

  const [activation, setActivation] = useState(config.activation);

  const handleActivationChange = (e) => {
    const value = e.target.value;
    setActivation(value);
    updateActivationConfig(configIndex, { activation: value });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-80 border border-orange-100">
      <div className="text-lg font-medium text-gray-800 mb-4 bg-orange-100 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
        Activation 层
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-orange-400 rounded-full"
      />
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">激活函数:</label>
          <select 
            value={activation}
            onChange={handleActivationChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {ACTIVATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 mb-1">
            为神经网络层添加非线性变换
          </p>
          <p className="text-sm text-gray-500">
            常用的激活函数包括 ReLU、Sigmoid、Tanh 等
          </p>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-4 h-4 bg-orange-400 rounded-full"
      />
    </div>
  );
}

export default ActivationNode; 