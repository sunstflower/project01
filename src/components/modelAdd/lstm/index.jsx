import React, { useState } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store';

function LSTMNode({ data }) {
  const { lstmConfigs, updateLstmConfig } = useStore();
  const configIndex = data.index || 0;
  const config = lstmConfigs[configIndex] || {
    units: 128,
    activation: 'tanh',
    recurrentActivation: 'sigmoid',
    returnSequences: false,
    dropout: 0.0,
    recurrentDropout: 0.0
  };
  
  const [units, setUnits] = useState(config.units);
  const [activation, setActivation] = useState(config.activation);
  const [recurrentActivation, setRecurrentActivation] = useState(config.recurrentActivation);
  const [returnSequences, setReturnSequences] = useState(config.returnSequences);
  const [dropout, setDropout] = useState(config.dropout);
  const [recurrentDropout, setRecurrentDropout] = useState(config.recurrentDropout);
  
  const handleUnitsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setUnits(value);
    updateLstmConfig(configIndex, { ...config, units: value });
  };
  
  const handleActivationChange = (e) => {
    const value = e.target.value;
    setActivation(value);
    updateLstmConfig(configIndex, { ...config, activation: value });
  };
  
  const handleRecurrentActivationChange = (e) => {
    const value = e.target.value;
    setRecurrentActivation(value);
    updateLstmConfig(configIndex, { ...config, recurrentActivation: value });
  };
  
  const handleReturnSequencesChange = (e) => {
    const value = e.target.checked;
    setReturnSequences(value);
    updateLstmConfig(configIndex, { ...config, returnSequences: value });
  };
  
  const handleDropoutChange = (e) => {
    const value = parseFloat(e.target.value);
    setDropout(value);
    updateLstmConfig(configIndex, { ...config, dropout: value });
  };
  
  const handleRecurrentDropoutChange = (e) => {
    const value = parseFloat(e.target.value);
    setRecurrentDropout(value);
    updateLstmConfig(configIndex, { ...config, recurrentDropout: value });
  };

  return (
    <NodeContainer title="LSTM" backgroundColor="blue-50">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">单元数量:</label>
          <input 
            type="number" 
            value={units}
            onChange={handleUnitsChange}
            min="1" 
            max="1024"
            step="16"
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            LSTM层的隐藏单元数量，建议值：64-512
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">激活函数:</label>
          <select 
            value={activation}
            onChange={handleActivationChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="tanh">tanh</option>
            <option value="relu">ReLU</option>
            <option value="sigmoid">Sigmoid</option>
            <option value="softmax">Softmax</option>
            <option value="linear">Linear</option>
          </select>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">循环激活函数:</label>
          <select 
            value={recurrentActivation}
            onChange={handleRecurrentActivationChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="sigmoid">Sigmoid</option>
            <option value="tanh">Tanh</option>
            <option value="relu">ReLU</option>
            <option value="hard_sigmoid">Hard Sigmoid</option>
          </select>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="returnSequences"
              checked={returnSequences}
              onChange={handleReturnSequencesChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="returnSequences" className="ml-2 block text-sm text-gray-700">
              返回序列
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            如果为true，返回完整的输出序列。直接连接Dense层时请设为false。
          </p>
          <div className="mt-2 text-xs text-blue-600">
            {returnSequences ? 
              "输出形状将是3D，需要Flatten后再连接Dense层" : 
              "输出形状将是2D，可以直接连接Dense层"}
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dropout率:</label>
          <input 
            type="number" 
            value={dropout}
            onChange={handleDropoutChange}
            min="0" 
            max="0.9"
            step="0.1"
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            输入的dropout比例 (0-1)
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">循环Dropout率:</label>
          <input 
            type="number" 
            value={recurrentDropout}
            onChange={handleRecurrentDropoutChange}
            min="0" 
            max="0.9"
            step="0.1"
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            循环状态的dropout比例 (0-1)
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-500">
            长短期记忆网络层，适合处理序列数据和时间序列
          </p>
        </div>
      </div>
    </NodeContainer>
  );
}

export default LSTMNode; 